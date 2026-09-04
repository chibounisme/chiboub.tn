import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { drawPlanet } from '../src/components/space/planet';
import { recordingContext } from './canvas';

it('preserves the approved grain, craters, and orbit across repeated renders', () => {
  const recorder = recordingContext();
  drawPlanet(recorder.context);
  const signature = () =>
    createHash('sha256')
      .update(JSON.stringify(recorder.pixels()))
      .digest('hex');
  const approved =
    'fe645d27ea05fa1e45d0cb0c48f5db9a6c9585cf092c65986c340156a6af5080';
  expect(signature()).toBe(approved);
  drawPlanet(recorder.context);
  expect(signature()).toBe(approved);
});
