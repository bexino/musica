import React from 'react';
import coverUrl from '../../attachments/cover.jpg';
import './AlbumBackground.css';

export default function AlbumBackground({playing}) {
  return <div className="album-background" aria-hidden="true">
    <img className="album-background-fallback" src={coverUrl} alt="" />
    {<div className={`album-background-motion ${playing ? '' : 'paused'}`}><img src={coverUrl} alt="" /></div>}
    <div className="album-background-shade" />
  </div>;
}
