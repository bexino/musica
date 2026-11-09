import React, {useEffect, useState} from 'react';
import {BackgroundRender, MeshGradientRenderer} from '@applemusic-like-lyrics/react';
import coverUrl from '../../attachments/cover.jpg';
import './AlbumBackground.css';

class BackgroundBoundary extends React.Component {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function AlbumBackground({compat, playing, album}) {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => setReducedMotion(preference.matches);
    const onVisibility = () => setVisible(!document.hidden);
    preference.addEventListener('change', onMotion);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      preference.removeEventListener('change', onMotion);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <div className="album-background" aria-hidden="true">
    <img className="album-background-fallback" src={coverUrl} alt="" />
    {!compat && !reducedMotion && album && <BackgroundBoundary>
      <BackgroundRender
        album={album}
        renderer={MeshGradientRenderer}
        playing={playing && visible}
        fps={30}
        flowSpeed={0.65}
        renderScale={0.5}
        className="album-background-motion"
        style={{display: 'block'}}
      />
    </BackgroundBoundary>}
    <div className="album-background-shade" />
  </div>;
}
