import {useEffect, useState} from 'react';
import coverUrl from '../attachments/cover.jpg';

export function useAlbumArtwork() {
  const [artwork, setArtwork] = useState({image: null});
  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      setArtwork({image});
    };
    image.src = coverUrl;
    return () => { image.onload = null; };
  }, []);
  return artwork;
}
