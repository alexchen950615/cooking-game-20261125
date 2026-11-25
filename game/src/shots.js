// The Golden Ladle — screenshots: each named scene stages the real world
// (real orders, real stations, real plates) and returns the screen to draw,
// so a screenshot is exactly what a short game looks like at that moment.

import { RECIPES, SHIFT_SECONDS } from './config.js';
import { createWorld, startShift, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './world.js';

function makeOrder(world, recipeIndex, patience) {
  const recipe = RECIPES[recipeIndex];
  world.orders.push({
    id: world.nextOrderId++,
    recipe,
    patience,
    maxPatience: recipe.patience,
    born: world.elapsed,
  });
}

function dish(world, items) {
  world.assembly = { items: [...items] };
}

// Start scene: the title card over a kitchen that already has orders waiting.
function stageStart() {
  const world = createWorld(7);
  startShift(world);
  world.screen = SCREEN_TITLE;
  world.elapsed = 0;
  world.timeLeft = SHIFT_SECONDS;
  return { world, screen: SCREEN_TITLE };
}

// Play scene: mid-shift, a dish half-built on the assembly counter, a patty
// on the grill, a chopped tomato ready on the board, chef carrying tomatoes.
function stagePlay() {
  const world = createWorld(7);
  startShift(world);
  world.elapsed = 52;
  world.timeLeft = SHIFT_SECONDS - 52;
  world.money = 23;
  world.served = 2;
  world.orders = [];
  world.nextOrderId = 1;
  makeOrder(world, 0, 40); // Sunny Stack
  makeOrder(world, 1, 48); // Garden Stack
  makeOrder(world, 3, 30); // Green Crunch
  dish(world, ['bun', 'cookedPatty', 'cheese']);
  world.grill = [
    { item: 'patty', progress: 3.1, state: 'cooking' },
    { item: 'patty', progress: 5.2, state: 'done' },
  ];
  world.board = { item: 'tomato', progress: 2.2 };
  world.chef.x = 480; world.chef.y = 640;
  world.chef.carrying = 'choppedTomato';
  world.platesReady = 2;
  return { world, screen: SCREEN_PLAY };
}

// Rush scene: the last minute, four orders, one about to expire, and a plate
// that matches an order already in the chef's hands at the serving window.
function stageRush() {
  const world = createWorld(11);
  startShift(world);
  world.elapsed = 128;
  world.timeLeft = SHIFT_SECONDS - 128;
  world.money = 61;
  world.served = 6;
  world.combo = 2;
  world.comboTimer = 12;
  world.orders = [];
  world.nextOrderId = 1;
  makeOrder(world, 1, 12); // Garden Stack, nearly out of time
  makeOrder(world, 4, 38); // Double Trouble
  makeOrder(world, 2, 44); // Golden Melt
  makeOrder(world, 0, 52); // Sunny Stack
  world.grill = [{ item: 'patty', progress: 5.0, state: 'done' }];
  world.board = { item: 'lettuce', progress: 1.4 };
  world.chef.x = 1050; world.chef.y = 700;
  world.chef.plate = { items: ['bun', 'cookedPatty', 'choppedLettuce', 'choppedTomato', 'bun'] };
  world.platesReady = 1;
  world.message = 'DINNER RUSH! Orders are coming fast!';
  world.messageTimer = 2.0;
  return { world, screen: SCREEN_PLAY };
}

// End scene: the shift is over, with a tidy score to show for it.
function stageEnd() {
  const world = createWorld(7);
  startShift(world);
  world.screen = SCREEN_OVER;
  world.elapsed = SHIFT_SECONDS;
  world.timeLeft = 0;
  world.money = 87;
  world.served = 8;
  world.failed = 1;
  world.best = 87;
  world.orders = [];
  return { world, screen: SCREEN_OVER };
}

export function stageShot(name) {
  if (name === 'play') return stagePlay();
  if (name === 'rush') return stageRush();
  if (name === 'end') return stageEnd();
  return stageStart();
}
