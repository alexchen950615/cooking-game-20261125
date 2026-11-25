// The Golden Ladle — input: keyboard (WASD / arrows to walk, E or Space to
// interact, R to restart, M to mute) and mouse (click the floor to walk there,
// click a station to walk over and use it).

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    click: null,          // {x, y} in game coordinates, consumed by main.js
    interactPressed: false,
    restartPressed: false,
    mutePressed: false,
    startPressed: false,
  };

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  };

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const dir = KEYMAP[event.code];
    if (dir) { input.keys.add(dir); event.preventDefault(); }
    if (event.code === 'KeyE' || event.code === 'Space') { input.interactPressed = true; event.preventDefault(); }
    if (event.code === 'KeyR') input.restartPressed = true;
    if (event.code === 'KeyM') input.mutePressed = true;
    if (event.code === 'Enter') input.startPressed = true;
  });
  window.addEventListener('keyup', (event) => {
    const dir = KEYMAP[event.code];
    if (dir) input.keys.delete(dir);
  });
  window.addEventListener('blur', () => input.keys.clear());

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 800 / rect.height;
    input.click = { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
  });

  return input;
}
