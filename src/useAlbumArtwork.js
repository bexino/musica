import {useEffect, useState} from 'react';
import coverUrl from '../attachments/cover.jpg';
import {cardThemeFromPixels} from './album-theme.mjs';

export function useAlbumArtwork() {
  const [artwork, setArtwork] = useState({image: null, colors: {}});
  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      let colors = {};
      try {
        const sample = document.createElement('canvas');
        sample.width = sample.height = 64;
        const context = sample.getContext('2d', {willReadFrequently: true});
        context.drawImage(image, 0, 0, 64, 64);
        colors = cardThemeFromPixels(context.getImageData(0, 0, 64, 64).data);
      } catch { /* Keep readable neutral surfaces when artwork cannot be sampled. */ }
      setArtwork({image, colors});
    };
    image.src = coverUrl;
    return () => { image.onload = null; };
  }, []);
  return artwork;
}
