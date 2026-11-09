import {argbFromRgb, hexFromArgb, QuantizerCelebi, Score, themeFromSourceColor} from '@material/material-color-utilities';

export function cardThemeFromPixels(data) {
  const pixels = [];
  let red = 0, green = 0, blue = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] !== 255) continue;
    pixels.push(argbFromRgb(data[i], data[i + 1], data[i + 2]));
    red += data[i]; green += data[i + 1]; blue += data[i + 2];
  }
  if (!pixels.length) return {};
  const fallback = argbFromRgb(Math.round(red / pixels.length), Math.round(green / pixels.length), Math.round(blue / pixels.length));
  const [source] = Score.score(QuantizerCelebi.quantize(pixels, 32), {desired: 1, fallbackColorARGB: fallback});
  const scheme = themeFromSourceColor(source).schemes.dark;
  const glass = (color, opacity) => {
    const hex = hexFromArgb(color);
    const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
    return `rgba(${channels.join(', ')}, ${opacity})`;
  };
  return {
    '--card-primary': hexFromArgb(scheme.primaryContainer),
    '--on-card-primary': hexFromArgb(scheme.onPrimaryContainer),
    '--card-secondary': hexFromArgb(scheme.secondaryContainer),
    '--on-card-secondary': hexFromArgb(scheme.onSecondaryContainer),
    '--card-primary-glass': glass(scheme.primaryContainer, 0.52),
    '--card-secondary-glass': glass(scheme.secondaryContainer, 0.48),
  };
}
