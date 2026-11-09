import test from 'node:test';
import assert from 'node:assert/strict';
import {argbFromHex, Contrast, Hct} from '@material/material-color-utilities';
import {cardThemeFromPixels} from '../src/album-theme.mjs';

test('album colors change the Material containers while keeping readable text', () => {
  const warm = cardThemeFromPixels([210, 75, 50, 255, 190, 70, 40, 255]);
  const cool = cardThemeFromPixels([40, 70, 220, 255, 35, 60, 205, 255]);
  assert.notEqual(warm['--card-primary'], cool['--card-primary']);
  for (const theme of [warm, cool]) {
    for (const role of ['primary', 'secondary']) {
      const background = Hct.fromInt(argbFromHex(theme[`--card-${role}`]));
      const foreground = Hct.fromInt(argbFromHex(theme[`--on-card-${role}`]));
      assert.ok(Contrast.ratioOfTones(background.tone, foreground.tone) >= 4.5);
    }
  }
});

test('neutral artwork stays neutral and missing pixels leave the CSS fallback', () => {
  const theme = cardThemeFromPixels([128, 128, 128, 255]);
  assert.ok(Hct.fromInt(argbFromHex(theme['--card-secondary'])).chroma < 20);
  assert.deepEqual(cardThemeFromPixels([]), {});
  assert.deepEqual(cardThemeFromPixels([255, 0, 0, 0]), {});
});
