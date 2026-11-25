// The Golden Ladle — main: the game loop, the screens, and the wiring between
// input, world and render. With ?shot=start|play|rush|end in the URL it draws
// one frozen scene instead of playing, so screenshots are reproducible.

import { VIEW } from './config.js';
import { createWorld, startShift, update, interact, stationAtPoint, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './world.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { ensureAudio, toggleMute, playSound } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const input = createInput(canvas);

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW.width * dpr;
  canvas.height = VIEW.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
let world;
let frozen = false;

if (shotName) {
  const staged = stageShot(shotName);
  world = staged.world;
  frozen = true;
} else {
  world = createWorld();
  startShift(world);
  world.screen = SCREEN_TITLE;
}

fitCanvas();
window.addEventListener('resize', fitCanvas);

function announce() {
  if (!statusEl) return;
  statusEl.textContent = world.screen === SCREEN_PLAY
    ? `Shift: $${world.money}, served ${world.served}, ${Math.ceil(world.timeLeft)} seconds left, ${world.orders.length} orders waiting.`
    : world.screen === SCREEN_OVER
      ? `Shift over. You earned $${world.money} and served ${world.served} dishes.`
      : 'The Golden Ladle. Press Enter or click to start your shift.';
}

function handleClick() {
  if (!input.click) return;
  const { x, y } = input.click;
  input.click = null;
  ensureAudio();
  if (world.screen === SCREEN_TITLE) { startShift(world); playSound('ding'); return; }
  if (world.screen === SCREEN_OVER) { startShift(world); return; }
  const station = stationAtPoint(x, y);
  if (station) {
    // Walk to the station, then use it on arrival.
    world.target = { x: station.x + station.w / 2, y: station.y + station.h + 30 };
    if (station.y < 300) world.target.y = station.y + station.h + 30;
    world.pendingStation = station;
  } else {
    world.target = { x, y };
    world.pendingStation = null;
  }
}

function handleKeys() {
  if (input.startPressed) {
    input.startPressed = false;
    ensureAudio();
    if (world.screen === SCREEN_TITLE || world.screen === SCREEN_OVER) startShift(world);
  }
  if (input.restartPressed) {
    input.restartPressed = false;
    if (world.screen !== SCREEN_TITLE) startShift(world);
  }
  if (input.mutePressed) {
    input.mutePressed = false;
    toggleMute();
  }
  if (input.interactPressed) {
    input.interactPressed = false;
    ensureAudio();
    if (world.screen === SCREEN_PLAY) {
      world.target = null;
      world.pendingStation = null;
      interact(world);
    }
  }
}

let last = performance.now();
let announceTimer = 0;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  handleClick();
  handleKeys();
  if (!frozen) update(world, input, dt);
  render(ctx, world, now);
  announceTimer += dt;
  if (announceTimer > 1) { announceTimer = 0; announce(); }
  if (frozen) { window.__shotReady = true; return; }
  requestAnimationFrame(frame);
}

announce();
render(ctx, world, performance.now());
requestAnimationFrame(frame);
