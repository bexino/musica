import React, {useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {marked} from 'marked';
import '@fontsource-variable/google-sans-flex';
import audioUrl from '../attachments/music.mp3';
import srt from '../attachments/lyrics.srt?raw';
import intro from '../attachments/intro.md?raw';
import {parseSrt} from './subtitles.mjs';
import './style.css';
import AlbumBackground from './components/AlbumBackground.jsx';
import {useAlbumArtwork} from './useAlbumArtwork.js';

const files=import.meta.glob('../attachments/vocabulary.json',{eager:true,import:'default'});
const vocabulary=files['../attachments/vocabulary.json']||[];
const lyrics=parseSrt(srt);
const markdown=marked.parse(intro);
function LyricList({activeIndex,compat}) {
  const viewport=useRef(null), nodes=useRef([]);
  useEffect(()=>{
    const container=viewport.current, item=nodes.current[Math.max(0,activeIndex)];
    if(!container||!item)return;
    const target=Math.max(0,item.offsetTop-container.offsetTop-container.clientHeight*.27);
    if(compat||window.matchMedia('(prefers-reduced-motion: reduce)').matches){container.scrollTop=target;return}
    const from=container.scrollTop, delta=target-from, start=performance.now(), duration=1100;
    let frame;
    const animate=now=>{const t=Math.min(1,(now-start)/duration);const easing=1-Math.pow(1-t,4)+Math.sin(Math.PI*t)*0.05*(1-t);container.scrollTop=from+delta*easing;if(t<1)frame=requestAnimationFrame(animate)};
    frame=requestAnimationFrame(animate);return ()=>cancelAnimationFrame(frame);
  },[activeIndex,compat]);
  return <div className="lyrics-viewport" ref={viewport} aria-label="同步歌词"><div className="lyrics-list">{lyrics.map((item,index)=>{const distance=index-(activeIndex<0?0:activeIndex);return <div ref={node=>nodes.current[index]=node} key={`${item.start}-${item.end}`} style={{'--blur-distance':Math.min(3,Math.abs(distance)),'--row-delay':`${Math.min(4,Math.abs(distance))*45}ms`}} className={`lyric-row ${index===activeIndex?'active':''} ${index<activeIndex?'past':''}`}><div className="lyric-english">{item.english}</div><div className="lyric-chinese">{item.chinese}</div></div>})}</div></div>
}
function Vocabulary({words,compat}){
  const [visible,setVisible]=useState(words),[exiting,setExiting]=useState(false);
  const visibleKey=visible.map(w=>w.term).join('|'), nextKey=words.map(w=>w.term).join('|');
  useEffect(()=>{
    if(visibleKey===nextKey){setExiting(false);return}
    if(!visibleKey||compat||window.matchMedia('(prefers-reduced-motion: reduce)').matches){setVisible(words);setExiting(false);return}
    setExiting(true);const timer=setTimeout(()=>{setVisible(words);setExiting(false)},380);return ()=>clearTimeout(timer);
  },[nextKey,visibleKey,compat]);
  return <aside className="vocabulary" aria-label="词汇注释">{visible.map(w=><div className="word-shell" key={w.term}><div className={`material-card ${exiting?'word-exit':'word-enter'}`}><div className="word"><div className="word-heading"><strong>{w.term}</strong>{w.partOfSpeech&&<span className="word-type">{w.partOfSpeech}</span>}</div><span>{w.meaning}</span>{w.otherMeaning&&<span className="word-extra">{w.otherMeaning.replace(/^也可指：/,'')}</span>}</div></div></div>)}</aside>
}

function BackgroundNote({compat}) {
  const [state,setState]=useState('show');
  useEffect(()=>{const t=setTimeout(()=>setState('exit'),25000);return()=>clearTimeout(t)},[]);
  useEffect(()=>{if(state!=='exit')return;const t=setTimeout(()=>setState('hidden'),compat?0:380);return()=>clearTimeout(t)},[state,compat]);
  if(state==='hidden')return null;
  return <aside className="background-note" aria-label="歌曲背景说明" onClick={event=>event.stopPropagation()}><div className={`material-card ${state==='exit'?'word-exit':'word-enter'}`}><div className="background-note-content" tabIndex={0}><strong>Feather - Sabrina Carpenter</strong><span>《Feather》传递的是一种自由洒脱、自信独立、轻盈通透的人生态度。它鼓励人们摆脱不必要的精神负担与情绪内耗，不再过分在意外界的评价，也不必为了迎合他人的期待而委屈自己。真正的成熟不是背负更多，而是学会放下；真正的强大也不一定意味着隐忍和沉重，而是能够以轻松、幽默、从容的姿态面对生活中的不如意。与其执着于无法改变的过去，不如把注意力重新放回自己身上，保持清醒与自尊，珍惜当下的快乐，主动掌握生活的节奏。人生不必时刻用力，懂得取舍、拒绝消耗、自在地做自己，也是一种强大。</span></div></div></aside>
}
function useScene(phase,compat){
  const [shown,setShown]=useState(phase),[leaving,setLeaving]=useState(false);
  useEffect(()=>{if(phase===shown){setLeaving(false);return}if(compat||window.matchMedia('(prefers-reduced-motion: reduce)').matches){setShown(phase);setLeaving(false);return}setLeaving(true);const t=setTimeout(()=>{setShown(phase);setLeaving(false)},380);return()=>clearTimeout(t)},[phase,shown,compat]);
  return {shown,leaving};
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
  return <div className="fullscreen-control"><button type="button" className="fullscreen-button" onClick={toggleFullscreen} aria-pressed={fullscreen}>{fullscreen?'退出全屏':'全屏'}</button>{error&&<span role="alert">无法切换全屏</span>}</div>;
}
function App(){const artwork=useAlbumArtwork();const audio=useRef(null),clicks=useRef({side:null,count:0,timer:null});const [phase,setPhase]=useState('start'),[time,setTime]=useState(0),[duration,setDuration]=useState(0),[error,setError]=useState(''),[compat,setCompat]=useState(false),[paused,setPaused]=useState(false);const activeIndex=useMemo(()=>lyrics.findIndex(x=>x.start<=time&&time<x.end),[time]);const line=lyrics[activeIndex];const words=useMemo(()=>line?vocabulary.filter(v=>line.english.toLowerCase().includes(v.match.toLowerCase())).slice(0,2):[],[line]);async function start(){if(!lyrics.length){setError('没有找到可显示的歌词，请检查歌词文件。');return}try{await audio.current.play();setPhase('playing');setError('')}catch{setError('无法播放音频，请检查音频文件或系统声音设置。')}}async function toggle(){if(audio.current.paused){try{await audio.current.play();setPaused(false)}catch{setError('音频无法继续播放。')}}else{audio.current.pause();setPaused(true)}}useEffect(()=>()=>clearTimeout(clicks.current.timer),[]);
function handleScreenClick(event){
  if(event.target.closest('button'))return;
  const side=event.clientX<window.innerWidth/2?'left':'right';const state=clicks.current;
  if(state.side!==side){clearTimeout(state.timer);state.count=0}
  state.side=side;state.count++;clearTimeout(state.timer);
  if(state.count===3){state.count=0;state.side=null;if(side==='left'){window.location.reload()}else{audio.current.pause();setPaused(false);setPhase('end')}return}
  state.timer=setTimeout(()=>{if(state.count===1&&phase==='playing')toggle();state.count=0;state.side=null},400);
}
const scene=useScene(phase,compat);
return <div className={'app '+(compat?'compat':'')} style={artwork.colors} onClick={handleScreenClick}>
  <AlbumBackground album={artwork.image} compat={compat} playing={!paused&&phase!=='end'}/>
  <audio ref={audio} src={audioUrl} preload="auto" onLoadedMetadata={e=>setDuration(e.currentTarget.duration)} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onEnded={()=>{setPhase('end');setPaused(false)}} onError={()=>setError('音频加载失败，请检查音频文件。')}/>
  {scene.shown==='start'&&!scene.leaving&&<button className="mode" onClick={()=>setCompat(!compat)}>{compat?'标准动效':'兼容模式'}</button>}
  <div key={scene.shown} className={`scene ${scene.leaving?'scene-exit':'scene-enter'}`}>
    {scene.shown==='start'?<main className="intro">
      <div className="intro-content" dangerouslySetInnerHTML={{__html:markdown}}/>
      <div className="start-surface"><button type="button" className="start" onClick={start}><span className="play-icon">▶</span><span>开始</span></button></div>
      {error&&<p className="error" role="alert">{error}</p>}
    </main>:scene.shown==='playing'?<main className="performance">
      <BackgroundNote compat={compat}/>
      <LyricList activeIndex={activeIndex} compat={compat}/>
      <Vocabulary words={words} compat={compat}/>
      {error&&<p className="error" role="alert">{error}</p>}
    </main>:<main className="ending"><h1>Thanks For Listening</h1><p>感谢垂听</p></main>}
  </div>
  <footer className="player-footer" aria-label="播放控制">
    {scene.shown==='playing'&&<>
      {paused&&<span className="paused-indicator" role="status">已暂停</span>}
      <div className="progress" aria-hidden="true"><div style={{width:`${duration?Math.min(100,time/duration*100):0}%`}}/></div>
      <span className="time">{format(time)} / {format(duration)}</span>
    </>}
    <FullscreenButton/>
  </footer>
</div>}

function format(n){if(!Number.isFinite(n))return '0:00';return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`}
createRoot(document.getElementById('root')).render(<App/>);


