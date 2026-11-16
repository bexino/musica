import React, {useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {marked} from 'marked';
import anime from 'animejs/lib/anime.es.js';
import {LiquidGlass} from 'simple-liquid-glass';
import '@fontsource-variable/google-sans-flex';
import audioUrl from '../attachments/music.mp3';
import coverUrl from '../attachments/cover.jpg';
import srt from '../attachments/lyrics.srt?raw';
import intro from '../attachments/intro.md?raw';
import {parseSrt} from './subtitles.mjs';
import './style.css';
import playIcon from './icons/play_arrow.svg';
import refreshIcon from './icons/refresh.svg';
import stopIcon from './icons/stop.svg';
import fullscreenIcon from './icons/fullscreen.svg';
import fullscreenExitIcon from './icons/fullscreen_exit.svg';
import AlbumBackground from './components/AlbumBackground.jsx';

const lyrics=parseSrt(srt);
const markdown=marked.parse(intro);
function LyricList({activeIndex}) {
  const viewport=useRef(null), nodes=useRef([]);
  useEffect(()=>{
    const container=viewport.current, item=nodes.current[Math.max(0,activeIndex)];
    if(!container||!item)return;
    const target=Math.max(0,item.offsetTop-container.offsetTop-container.clientHeight*.27);
    const updateArc=()=>{const radius=Math.max(1800,container.clientHeight*2.5), anchor=container.offsetTop+container.scrollTop+container.clientHeight*.27; nodes.current.forEach(node=>{if(!node)return;const y=node.offsetTop-anchor, angle=Math.asin(Math.max(-0.95,Math.min(0.95,y/radius)));const x=radius*(1-Math.cos(angle));anime.set(node.querySelector('.lyric-rotation'), {translateX:x, rotate:angle*180/Math.PI})})};
    updateArc(); container.addEventListener('scroll',updateArc);
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){container.scrollTop=target;updateArc();return ()=>container.removeEventListener('scroll',updateArc)}
    const from=container.scrollTop, delta=target-from, start=performance.now(), duration=1100;
    let frame;
    const animate=now=>{const t=Math.min(1,(now-start)/duration);const easing=1-Math.pow(1-t,4)+Math.sin(Math.PI*t)*0.05*(1-t);container.scrollTop=from+delta*easing;if(t<1)frame=requestAnimationFrame(animate)};
    frame=requestAnimationFrame(animate);return ()=>{cancelAnimationFrame(frame);container.removeEventListener('scroll',updateArc)};
  },[activeIndex]);
  return <div className="lyrics-viewport" ref={viewport} aria-label="同步歌词"><div className="lyrics-list">{lyrics.map((item,index)=>{const distance=index-(activeIndex<0?0:activeIndex);return <div ref={node=>nodes.current[index]=node} key={`${item.start}-${item.end}`} style={{'--blur-distance':Math.min(3,Math.abs(distance)),'--row-delay':`${Math.min(4,Math.abs(distance))*45}ms`}} className={`lyric-row ${index===activeIndex?'active':''} ${index<activeIndex?'past':''}`}><div className="lyric-rotation"><div className="lyric-english">{item.english}</div><div className="lyric-chinese">{item.chinese}</div></div></div>})}</div></div>
}
function AlbumPanel() {
  return <div className="album-panel"><div className="album-cover-wrap"><img className="album-cover" src={coverUrl} alt="Feather 专辑封面"/></div></div>;
}
function useScene(phase){
  const [shown,setShown]=useState(phase),[leaving,setLeaving]=useState(false);
  useEffect(()=>{if(phase===shown){setLeaving(false);return}if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setShown(phase);setLeaving(false);return}setLeaving(true);const t=setTimeout(()=>{setShown(phase);setLeaving(false)},380);return()=>clearTimeout(t)},[phase,shown]);
  return {shown,leaving};
}
function GlassButton({glass=true,className='',children,...props}) {
  return <button type="button" className={`glass-button ${className}`} {...props}>{glass&&<LiquidGlass className="button-glass" renderer="svg" refraction="lens" radius={32} reveal="immediate" blur={1} frost={0.04} glassColor="rgba(255,255,255,0.08)" borderColor="rgba(255,255,255,0.3)" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}/>}<span className="button-content">{children}</span></button>;
}
function FullscreenButton() {
  const [fullscreen,setFullscreen]=useState(Boolean(document.fullscreenElement));
  const [error,setError]=useState(false);
  useEffect(()=>{
    const sync=()=>setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange',sync);
    return ()=>document.removeEventListener('fullscreenchange',sync);
  },[]);
  async function toggleFullscreen(){
    try {
      if(document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setError(false);
    } catch { setError(true); }
  }
  return <div className="fullscreen-control"><GlassButton glass={false} className="fullscreen-button" onClick={toggleFullscreen} aria-pressed={fullscreen} aria-label={fullscreen?'退出全屏':'全屏'} title={fullscreen?'退出全屏':'全屏'}><img src={fullscreen?fullscreenExitIcon:fullscreenIcon} alt=""/></GlassButton>{error&&<span role="alert">无法切换全屏</span>}</div>;
}
function App(){const audio=useRef(null),clicks=useRef({side:null,count:0,timer:null});const [phase,setPhase]=useState('start'),[time,setTime]=useState(0),[duration,setDuration]=useState(0),[error,setError]=useState(''),[paused,setPaused]=useState(false);const activeIndex=useMemo(()=>lyrics.findIndex(x=>x.start<=time&&time<x.end),[time]);async function start(){if(!lyrics.length){setError('没有找到可显示的歌词，请检查歌词文件。');return}try{await audio.current.play();setPhase('playing');setError('')}catch{setError('无法播放音频，请检查音频文件或系统声音设置。')}}async function toggle(){if(audio.current.paused){try{await audio.current.play();setPaused(false)}catch{setError('音频无法继续播放。')}}else{audio.current.pause();setPaused(true)}}useEffect(()=>()=>clearTimeout(clicks.current.timer),[]);
function handleScreenClick(event){
  if(event.target.closest('button'))return;
  const side=event.clientX<window.innerWidth/2?'left':'right';const state=clicks.current;
  if(state.side!==side){clearTimeout(state.timer);state.count=0}
  state.side=side;state.count++;clearTimeout(state.timer);
  if(state.count===3){state.count=0;state.side=null;if(side==='left'){window.location.reload()}else{audio.current.pause();setPaused(false);setPhase('end')}return}
  state.timer=setTimeout(()=>{if(state.count===1&&phase==='playing')toggle();state.count=0;state.side=null},400);
}
const scene=useScene(phase);
return <div className="app" onClick={handleScreenClick}>
  <AlbumBackground playing={!paused&&phase!=='end'}/>
  <audio ref={audio} src={audioUrl} preload="auto" onLoadedMetadata={e=>setDuration(e.currentTarget.duration)} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onEnded={()=>{setPhase('end');setPaused(false)}} onError={()=>setError('音频加载失败，请检查音频文件。')}/>
  <div key={scene.shown} className={`scene ${scene.leaving?'scene-exit':'scene-enter'}`}>
    {scene.shown==='start'?<main className="intro">
      <div className="intro-content" dangerouslySetInnerHTML={{__html:markdown}}/>
      <div className="start-surface"><GlassButton className="start" onClick={start} aria-label="开始播放" title="开始播放"><img src={playIcon} alt=""/></GlassButton></div>
      {error&&<p className="error" role="alert">{error}</p>}
    </main>:scene.shown==='playing'?<main className="performance">
      <LyricList activeIndex={activeIndex}/>
      <AlbumPanel/>
      {error&&<p className="error" role="alert">{error}</p>}
    </main>:<main className="ending"><h1>Thanks For Listening</h1><p>感谢垂听</p></main>}
  </div>
  {scene.shown!=='start'&&<footer className="player-footer" aria-label="播放控制">
    <div className="footer-actions">
      {<LiquidGlass className="footer-glass" renderer="svg" refraction="lens" radius={22} reveal="immediate" blur={1} frost={0.04} glassColor="rgba(255,255,255,0.08)" borderColor="rgba(255,255,255,0.3)" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}/>}
      <GlassButton glass={false} onClick={()=>window.location.reload()} aria-label="刷新" title="刷新"><img src={refreshIcon} alt=""/></GlassButton>
      {scene.shown==='playing'&&<GlassButton glass={false} onClick={()=>{audio.current.pause();setPaused(false);setPhase('end')}} aria-label="结束播放" title="结束播放"><img src={stopIcon} alt=""/></GlassButton>}
      <FullscreenButton/>
    </div>
    {scene.shown==='playing'&&<>
      <span className="time">{format(time)} / {format(duration)}</span>
      {paused&&<span className="paused-indicator" role="status">已暂停</span>}
      <div className="progress" aria-hidden="true"><div style={{width:`${duration?Math.min(100,time/duration*100):0}%`}}/></div>
    </>}
  </footer>}
</div>}

function format(n){if(!Number.isFinite(n))return '0:00';return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`}
createRoot(document.getElementById('root')).render(<App/>);


