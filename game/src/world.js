// The Golden Ladle — world: the kitchen state and every rule of the shift.
// The chef walks the floor, picks ingredients from crates, chops them on the
// board, grills patties, builds dishes on a plate at the assembly counter and
// serves them at the window before each order's patience runs out.

import {
  STATIONS, INGREDIENTS, RECIPES, CHOP_SECONDS, GRILL_SECONDS, BURN_SECONDS,
  MAX_ORDERS, SHIFT_SECONDS, CHEF_SPEED, INTERACT_RANGE, spawnInterval,
  rushNow, preparedName,
} from './config.js';
import { playSound } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createWorld(seed = 20261125) {
  const world = {
    seed,
    rng: mulberry32(seed),
    screen: SCREEN_TITLE,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    money: 0,
    served: 0,
    failed: 0,
    combo: 0,
    comboTimer: 0,
    best: 0,
    rushAnnounced: false,
    spawnTimer: 6,
    orders: [],
    nextOrderId: 1,
    chef: { x: 640, y: 620, dir: 1, walk: 0, carrying: null, plate: null },
    board: null,   // { item, progress } chopping in progress
    grill: [],     // [{ item, progress, state: 'cooking'|'done'|'burnt' }]
    platesReady: 3,
    assembly: null, // plate on the assembly counter: { items: [] }
    floaters: [],  // floating "+$12" texts
    particles: [], // steam / sparkle bits
    message: '',
    messageTimer: 0,
    target: null,  // click-to-move destination {x, y}
    pendingStation: null,
    stats: { chopped: 0, grilled: 0, served: 0 },
  };
  return world;
}

export function stationById(world, id) {
  return STATIONS.find((s) => s.id === id);
}

function stationCentre(s) { return { x: s.x + s.w / 2, y: s.y + s.h / 2 }; }

export function nearestStation(world, range = INTERACT_RANGE) {
  let best = null;
  let bestDist = range;
  for (const s of STATIONS) {
    const c = stationCentre(s);
    const d = Math.hypot(world.chef.x - c.x, world.chef.y - c.y);
    if (d < bestDist) { bestDist = d; best = s; }
  }
  return best;
}

export function stationAtPoint(x, y) {
  return STATIONS.find((s) => x >= s.x - 6 && x <= s.x + s.w + 6 && y >= s.y - 6 && y <= s.y + s.h + 6) || null;
}

function spawnOrder(world) {
  const recipe = RECIPES[Math.floor(world.rng() * RECIPES.length)];
  // Later in the shift, harder dishes show up more often.
  const hard = world.elapsed > 90 && world.rng() < 0.45
    ? RECIPES[RECIPES.length - 1] : recipe;
  world.orders.push({
    id: world.nextOrderId++,
    recipe: hard,
    patience: hard.patience,
    maxPatience: hard.patience,
    born: world.elapsed,
  });
  playSound('order');
}

function addFloater(world, x, y, text, colour) {
  world.floaters.push({ x, y, text, colour, life: 1.4 });
}

function say(world, text) {
  world.message = text;
  world.messageTimer = 2.2;
}

// --- the chef's hands -------------------------------------------------------

function chefHand(world) { return world.chef.carrying; }

function takeFromCrate(world, station) {
  const chef = world.chef;
  if (chef.carrying || chef.plate) { say(world, 'Hands full! Serve or bin it first.'); playSound('error'); return; }
  chef.carrying = station.item;
  playSound('pickup');
}

function useBoard(world) {
  const chef = world.chef;
  const item = chef.carrying;
  if (world.board) {
    // Pick a finished chopped item back up.
    if (world.board.progress >= CHOP_SECONDS && !chef.carrying && !chef.plate) {
      chef.carrying = preparedName(world.board.item);
      world.board = null;
      playSound('pickup');
    } else if (world.board.progress < CHOP_SECONDS) {
      say(world, 'Still chopping…');
    }
    return;
  }
  if (!item) { say(world, 'Bring something to chop: tomato, lettuce or onion.'); return; }
  if (INGREDIENTS[item].prep !== 'chop') { say(world, `${INGREDIENTS[item].name} does not need chopping.`); playSound('error'); return; }
  world.board = { item, progress: 0 };
  chef.carrying = null;
  playSound('chop');
}

function useGrill(world) {
  const chef = world.chef;
  const item = chef.carrying;
  // Pick up a finished patty first.
  const done = world.grill.find((g) => g.state === 'done');
  if (done && !chef.carrying && !chef.plate) {
    chef.carrying = 'cookedPatty';
    world.grill = world.grill.filter((g) => g !== done);
    world.stats.grilled++;
    playSound('pickup');
    return;
  }
  const burnt = world.grill.find((g) => g.state === 'burnt');
  if (burnt) { say(world, 'That patty burned! Bin it from the grill.'); playSound('error'); return; }
  if (!item) { say(world, 'Bring a raw patty to grill.'); return; }
  if (item !== 'patty') { say(world, 'Only patties go on the grill.'); playSound('error'); return; }
  if (world.grill.length >= 2) { say(world, 'The grill is full (2 patties).'); playSound('error'); return; }
  world.grill.push({ item, progress: 0, state: 'cooking' });
  chef.carrying = null;
  playSound('sizzle');
}

function takePlate(world) {
  const chef = world.chef;
  if (chef.plate || chef.carrying) { say(world, 'Hands full!'); playSound('error'); return; }
  if (world.platesReady <= 0) { say(world, 'No clean plates — serve a dish to free one.'); playSound('error'); return; }
  world.platesReady--;
  chef.plate = { items: [] };
  playSound('pickup');
}

function useAssembly(world) {
  const chef = world.chef;
  if (!world.assembly && chef.plate) {
    world.assembly = chef.plate;
    chef.plate = null;
    playSound('place');
    return;
  }
  if (world.assembly && !chef.plate && !chef.carrying) {
    chef.plate = world.assembly;
    world.assembly = null;
    playSound('pickup');
    return;
  }
  if (world.assembly && chef.carrying) {
    const item = chef.carrying;
    world.assembly.items.push(item);
    chef.carrying = null;
    playSound('place');
    return;
  }
  if (!world.assembly && chef.carrying) {
    say(world, 'Take a clean plate first, then build the dish on it.');
    playSound('error');
    return;
  }
  if (!world.assembly && !chef.carrying && !chef.plate) say(world, 'Take a plate, then stack ingredients here.');
}

function matchingOrder(world, plateItems) {
  return world.orders.find((o) => {
    if (o.recipe.needs.length !== plateItems.length) return false;
    const a = [...o.recipe.needs].sort();
    const b = [...plateItems].sort();
    return a.every((v, i) => v === b[i]);
  }) || null;
}

function useWindow(world) {
  const chef = world.chef;
  if (!chef.plate) { say(world, 'Bring a finished plate to the window.'); return; }
  const order = matchingOrder(world, chef.plate.items);
  if (!order) {
    say(world, 'No order matches this plate — check the order board!');
    playSound('error');
    return;
  }
  const tip = Math.round(order.recipe.price * 0.4 * (order.patience / order.maxPatience));
  const comboBonus = world.combo > 0 ? world.combo : 0;
  const earned = order.recipe.price + tip + comboBonus;
  world.money += earned;
  world.served++;
  world.stats.served++;
  world.combo++;
  world.comboTimer = 20;
  world.orders = world.orders.filter((o) => o !== order);
  world.platesReady++;
  addFloater(world, 1060, 500, `+$${earned} ${order.recipe.name}!`, '#ffd34d');
  if (world.combo >= 2) addFloater(world, 1060, 530, `Combo x${world.combo}!`, '#ff9d5c');
  chef.plate = null;
  playSound('coin');
  playSound('ding');
}

function useBin(world) {
  const chef = world.chef;
  if (chef.carrying) { chef.carrying = null; playSound('place'); say(world, 'Composted.'); return; }
  if (chef.plate) { chef.plate = null; world.platesReady++; playSound('place'); say(world, 'Plate cleared.'); return; }
  const burnt = world.grill.find((g) => g.state === 'burnt');
  if (burnt) { world.grill = world.grill.filter((g) => g !== burnt); playSound('place'); say(world, 'Burnt patty composted.'); return; }
  say(world, 'Nothing to throw away.');
}

export function interact(world) {
  if (world.screen !== SCREEN_PLAY) return;
  const station = nearestStation(world);
  if (!station) { say(world, 'Walk up to a counter to use it.'); return; }
  switch (station.kind) {
    case 'crate': takeFromCrate(world, station); break;
    case 'board': useBoard(world); break;
    case 'grill': useGrill(world); break;
    case 'plates': takePlate(world); break;
    case 'assembly': useAssembly(world); break;
    case 'window': useWindow(world); break;
    case 'bin': useBin(world); break;
    default: break;
  }
}

// --- the tick ---------------------------------------------------------------

export function startShift(world) {
  world.screen = SCREEN_PLAY;
  world.elapsed = 0;
  world.timeLeft = SHIFT_SECONDS;
  world.money = 0;
  world.served = 0;
  world.failed = 0;
  world.combo = 0;
  world.comboTimer = 0;
  world.rushAnnounced = false;
  world.spawnTimer = 5;
  world.orders = [];
  world.chef.x = 640; world.chef.y = 620;
  world.chef.carrying = null; world.chef.plate = null;
  world.board = null; world.grill = []; world.assembly = null;
  world.platesReady = 3;
  world.floaters = []; world.particles = [];
  spawnOrder(world);
  spawnOrder(world);
}

function updateOrders(world, dt) {
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0 && world.orders.length < MAX_ORDERS) {
    spawnOrder(world);
    world.spawnTimer = spawnInterval(world.elapsed);
  }
  for (const order of [...world.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) {
      world.orders = world.orders.filter((o) => o !== order);
      world.failed++;
      world.combo = 0;
      addFloater(world, 640, 120, `Order lost: ${order.recipe.name}`, '#ff6b6b');
      playSound('error');
    }
  }
  if (rushNow(world.elapsed) && !world.rushAnnounced) {
    world.rushAnnounced = true;
    say(world, 'DINNER RUSH! Orders are coming fast!');
    playSound('rush');
  }
}

function updateStations(world, dt) {
  if (world.board && world.board.progress < CHOP_SECONDS) {
    world.board.progress += dt;
    if (Math.random() < dt * 6) playSound('chop');
    if (world.board.progress >= CHOP_SECONDS) {
      world.stats.chopped++;
      addFloater(world, 145, 320, 'Chopped!', '#8be28b');
    }
  }
  for (const patty of world.grill) {
    patty.progress += dt;
    if (patty.state === 'cooking' && patty.progress >= GRILL_SECONDS) {
      patty.state = 'done';
      addFloater(world, 410, 320, 'Patty ready!', '#ffd34d');
      playSound('ding');
    } else if (patty.state === 'done' && patty.progress >= BURN_SECONDS) {
      patty.state = 'burnt';
      addFloater(world, 410, 320, 'Burnt!', '#ff6b6b');
      playSound('burn');
    }
  }
}

function moveChef(world, input, dt) {
  const chef = world.chef;
  let dx = 0, dy = 0;
  if (input.keys.has('left')) dx -= 1;
  if (input.keys.has('right')) dx += 1;
  if (input.keys.has('up')) dy -= 1;
  if (input.keys.has('down')) dy += 1;
  if (dx !== 0 || dy !== 0) {
    world.target = null;
    world.pendingStation = null;
  } else if (world.target) {
    const tx = world.target.x - chef.x;
    const ty = world.target.y - chef.y;
    const dist = Math.hypot(tx, ty);
    if (dist < 6) {
      world.target = null;
      if (world.pendingStation) {
        const station = world.pendingStation;
        world.pendingStation = null;
        interact(world);
      }
    } else {
      dx = tx / dist; dy = ty / dist;
    }
  }
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    const step = CHEF_SPEED * dt;
    let nx = chef.x + (dx / len) * step;
    let ny = chef.y + (dy / len) * step;
    // Keep the chef on the floor and out of the counters.
    nx = Math.max(28, Math.min(1252, nx));
    ny = Math.max(268, Math.min(772, ny));
    let blocked = false;
    for (const s of STATIONS) {
      if (nx > s.x - 16 && nx < s.x + s.w + 16 && ny > s.y - 14 && ny < s.y + s.h + 14) { blocked = true; break; }
    }
    if (!blocked) {
      chef.x = nx; chef.y = ny;
      chef.dir = dx < 0 ? -1 : dx > 0 ? 1 : chef.dir;
      chef.walk += dt * 10;
    }
  }
}

function spawnSteam(world, dt) {
  if (world.grill.some((g) => g.state === 'cooking' || g.state === 'done') && Math.random() < dt * 8) {
    const g = world.grill[0];
    world.particles.push({
      x: 330 + Math.random() * 160, y: 335, vy: -26 - Math.random() * 14,
      life: 0.9, size: 5 + Math.random() * 6, colour: 'rgba(255,255,255,0.55)',
    });
  }
  for (const p of [...world.particles]) {
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) world.particles = world.particles.filter((q) => q !== p);
  }
  for (const f of [...world.floaters]) {
    f.y -= 28 * dt;
    f.life -= dt;
    if (f.life <= 0) world.floaters = world.floaters.filter((q) => q !== f);
  }
  if (world.messageTimer > 0) world.messageTimer -= dt;
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }
}

export function update(world, input, dt) {
  if (world.screen !== SCREEN_PLAY) return;
  dt = Math.min(dt, 0.05);
  world.elapsed += dt;
  world.timeLeft = Math.max(0, SHIFT_SECONDS - world.elapsed);
  if (world.timeLeft <= 0) {
    world.screen = SCREEN_OVER;
    if (world.money > world.best) world.best = world.money;
    playSound('ding');
    return;
  }
  moveChef(world, input, dt);
  updateStations(world, dt);
  updateOrders(world, dt);
  spawnSteam(world, dt);
}

export function plateMatches(world) {
  if (!world.chef.plate && !world.assembly) return false;
  const items = world.chef.plate ? world.chef.plate.items : world.assembly.items;
  return matchingOrder(world, items) !== null;
}
