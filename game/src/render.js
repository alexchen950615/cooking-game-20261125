// The Golden Ladle — render: every pixel of the kitchen is drawn on one
// canvas with plain shapes, so the game needs no image files at all.
// Layout: order board across the top, ingredient crates and the serving
// window along the top wall, chopping board and grill mid-kitchen, plates and
// the assembly counter at the bottom.

import { VIEW, STATIONS, INGREDIENTS, PREPARED_LABEL, PREPARED_COLOUR, CHOP_SECONDS, GRILL_SECONDS, BURN_SECONDS, SHIFT_SECONDS } from './config.js';
import { SCREEN_TITLE, SCREEN_OVER } from './world.js';

const C = {
  wall: '#7a4a2b', wallDark: '#5f3820', floor: '#e9d0a9', floorDark: '#d3ab7c',
  counter: '#8b5a2b', counterTop: '#c98d5f', counterEdge: '#6b4224',
  board: '#f3e2c7', grill: '#3a3a40', plate: '#ffffff', ink: '#3a2418',
  paper: '#fff8e7', gold: '#ffd34d', red: '#e5484d', green: '#4caf50',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, colour, align = 'left', weight = 'bold') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

// --- food art ----------------------------------------------------------------

export function drawIngredient(ctx, kind, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'bun' || kind === 'cookedPatty' || kind === 'patty') {
    const col = kind === 'bun' ? '#e8b06a' : kind === 'patty' ? '#8a5a33' : '#6b4224';
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(0, r * 0.18, r * 0.85, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    if (kind === 'bun') {
      ctx.fillStyle = '#fff3d6';
      for (const [sx, sy] of [[-0.4, -0.2], [0.1, -0.32], [0.45, -0.1]]) {
        ctx.beginPath(); ctx.ellipse(sx * r, sy * r, r * 0.1, r * 0.07, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (kind === 'tomato' || kind === 'choppedTomato') {
    ctx.fillStyle = '#e5484d';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3e8f31';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.75, r * 0.35, r * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    if (kind === 'choppedTomato') {
      ctx.strokeStyle = '#f2a0a0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (kind === 'lettuce' || kind === 'choppedLettuce') {
    ctx.fillStyle = '#5fbf4a';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.55, r * 0.4, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#8be28b';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'cheese') {
    ctx.fillStyle = '#ffc93c';
    ctx.beginPath(); ctx.moveTo(-r, r * 0.6); ctx.lineTo(r, r * 0.6); ctx.lineTo(0, -r * 0.8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8a91c';
    for (const [hx, hy] of [[-0.3, 0.25], [0.25, 0.3], [0, -0.2]]) {
      ctx.beginPath(); ctx.arc(hx * r, hy * r, r * 0.13, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'onion' || kind === 'choppedOnion') {
    ctx.fillStyle = '#c9a7e8';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#9a76c4'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, r, items) {
  ctx.fillStyle = C.plate;
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d8d2c4'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, r * 0.78, r * 0.32, 0, 0, Math.PI * 2); ctx.stroke();
  // Stack the dish from the bottom up: each layer sits a little higher.
  items.forEach((item, i) => {
    drawIngredient(ctx, item, x, y - 4 - i * 7, Math.max(9, r - 10 - i * 2));
  });
}

// --- the kitchen --------------------------------------------------------------

function drawFloor(ctx) {
  ctx.fillStyle = C.wall;
  ctx.fillRect(0, 0, VIEW.width, 96);
  ctx.fillStyle = C.wallDark;
  ctx.fillRect(0, 88, VIEW.width, 8);
  // Menu sign on the wall.
  ctx.fillStyle = '#2f1d12';
  roundRect(ctx, 430, 14, 420, 64, 10); ctx.fill();
  ctx.fillStyle = '#ffd34d';
  ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ THE GOLDEN LADLE ★', 640, 42);
  ctx.fillStyle = '#f3e2c7';
  ctx.font = '13px "Trebuchet MS", sans-serif';
  ctx.fillText('cozy kitchen · fresh stacks · served with love', 640, 64);
  // Chequered floor.
  const tile = 64;
  for (let ty = 96; ty < VIEW.height; ty += tile) {
    for (let tx = 0; tx < VIEW.width; tx += tile) {
      ctx.fillStyle = ((tx / tile + ty / tile) % 2 === 0) ? C.floor : C.floorDark;
      ctx.fillRect(tx, ty, tile, tile);
    }
  }
}

function drawStation(ctx, world, station, now) {
  const { x, y, w, h } = station;
  ctx.save();
  // Counter body and top.
  ctx.fillStyle = C.counter;
  roundRect(ctx, x, y + 10, w, h - 4, 8); ctx.fill();
  ctx.fillStyle = C.counterTop;
  roundRect(ctx, x - 4, y, w + 8, 18, 8); ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(station.label.toUpperCase(), x + w / 2, y + h + 16);

  if (station.kind === 'crate') {
    const ing = INGREDIENTS[station.item];
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    roundRect(ctx, x + 10, y + 26, w - 20, h - 36, 6); ctx.fill();
    drawIngredient(ctx, station.item, x + w / 2, y + 44, 22);
    text(ctx, ing.name, x + w / 2, y + h - 8, 11, '#f3e2c7', 'center');
  } else if (station.kind === 'board') {
    ctx.fillStyle = C.board;
    roundRect(ctx, x + 12, y + 26, w - 24, h - 38, 6); ctx.fill();
    ctx.strokeStyle = '#d8c49a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 30, y + 44); ctx.lineTo(x + w - 30, y + 44); ctx.stroke();
    if (world.board) {
      drawIngredient(ctx, world.board.item, x + w / 2, y + 48, 20);
      const p = Math.min(1, world.board.progress / CHOP_SECONDS);
      ctx.fillStyle = '#e8e0d0';
      roundRect(ctx, x + 20, y + h - 18, w - 40, 7, 3); ctx.fill();
      ctx.fillStyle = p >= 1 ? C.green : C.gold;
      roundRect(ctx, x + 20, y + h - 18, (w - 40) * p, 7, 3); ctx.fill();
      if (p >= 1) text(ctx, 'CHOPPED ✓', x + w / 2, y - 10, 12, C.green, 'center');
    } else {
      text(ctx, 'chop here', x + w / 2, y + 52, 12, '#a98f68', 'center');
    }
  } else if (station.kind === 'grill') {
    ctx.fillStyle = C.grill;
    roundRect(ctx, x + 10, y + 24, w - 20, h - 34, 8); ctx.fill();
    ctx.strokeStyle = '#55555e'; ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(x + 10 + (i * (w - 20)) / 5, y + 28); ctx.lineTo(x + 10 + (i * (w - 20)) / 5, y + h - 14); ctx.stroke();
    }
    world.grill.forEach((g, i) => {
      const gx = x + 50 + i * 110, gy = y + 52;
      const flame = g.state === 'cooking' ? 0.6 + 0.4 * Math.sin(now / 90 + i * 2) : 0;
      if (flame > 0) {
        ctx.fillStyle = `rgba(255,${140 + Math.floor(60 * flame)},40,${0.5 * flame})`;
        ctx.beginPath(); ctx.ellipse(gx, gy + 8, 26, 10 + 8 * flame, 0, 0, Math.PI * 2); ctx.fill();
      }
      drawIngredient(ctx, g.state === 'burnt' ? 'patty' : 'cookedPatty', gx, gy, 24);
      if (g.state === 'burnt') { text(ctx, '✕ BURNT', gx, gy - 32, 11, '#ff6b6b', 'center'); }
      else {
        const p = Math.min(1, g.progress / GRILL_SECONDS);
        ctx.fillStyle = '#55555e';
        roundRect(ctx, gx - 24, gy + 26, 48, 6, 3); ctx.fill();
        ctx.fillStyle = g.state === 'done' ? C.green : '#ff9d5c';
        roundRect(ctx, gx - 24, gy + 26, 48 * p, 6, 3); ctx.fill();
        if (g.state === 'done') text(ctx, 'READY ✓', gx, y - 10, 12, C.green, 'center');
      }
    });
    if (world.grill.length === 0) text(ctx, 'grill patties here', x + w / 2, y + 52, 12, '#9a9aa2', 'center');
  } else if (station.kind === 'plates') {
    for (let i = 0; i < 3; i++) {
      const px = x + 34 + i * 40;
      ctx.fillStyle = i < world.platesReady ? C.plate : '#c9c2b2';
      ctx.beginPath(); ctx.ellipse(px, y + 48, 17, 8, 0, 0, Math.PI * 2); ctx.fill();
    }
    text(ctx, `${world.platesReady} clean`, x + w / 2, y + h - 8, 11, '#f3e2c7', 'center');
  } else if (station.kind === 'assembly') {
    if (world.assembly) {
      drawPlate(ctx, x + w / 2, y + 52, 46, world.assembly.items);
      if (world.assembly.items.length === 0) text(ctx, 'empty plate — add food', x + w / 2, y + h - 8, 11, '#f3e2c7', 'center');
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.setLineDash([6, 5]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x + w / 2, y + 52, 46, 20, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'build your dish here', x + w / 2, y + 56, 12, '#f3e2c7', 'center');
    }
  } else if (station.kind === 'window') {
    ctx.fillStyle = '#2f1d12';
    roundRect(ctx, x + 8, y + 22, w - 16, h - 30, 6); ctx.fill();
    ctx.fillStyle = '#ffd34d';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('— SERVE HERE —', x + w / 2, y + 46);
    ctx.fillStyle = '#f3e2c7';
    ctx.font = '12px "Trebuchet MS", sans-serif';
    ctx.fillText('bring a plate that matches an order', x + w / 2, y + 66);
    ctx.fillStyle = '#e5484d';
    ctx.beginPath(); ctx.arc(x + w - 26, y + 30, 7, 0, Math.PI * 2); ctx.fill();
  } else if (station.kind === 'bin') {
    ctx.fillStyle = '#4a7c43';
    roundRect(ctx, x + 30, y + 26, w - 60, h - 36, 6); ctx.fill();
    ctx.fillStyle = '#356030';
    roundRect(ctx, x + 24, y + 20, w - 48, 12, 6); ctx.fill();
    text(ctx, 'toss it', x + w / 2, y + h - 8, 11, '#f3e2c7', 'center');
  }
  ctx.restore();
}

function drawChef(ctx, world, now) {
  const chef = world.chef;
  const bob = Math.sin(chef.walk) * 2;
  const x = chef.x, y = chef.y + bob * 0.4;
  ctx.save();
  ctx.translate(x, y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 26, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body: white chef coat.
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -17, -8, 34, 34, 12); ctx.fill();
  ctx.fillStyle = '#e5484d';
  ctx.fillRect(-17, 8, 34, 4);
  // Head and tall chef hat.
  ctx.fillStyle = '#ffcf9e';
  ctx.beginPath(); ctx.arc(0, -16, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(0, -28, 15, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-13, -30, 26, 8);
  // Eyes look in the walking direction.
  ctx.fillStyle = '#3a2418';
  ctx.beginPath(); ctx.arc(chef.dir * 3 - 4, -17, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(chef.dir * 3 + 4, -17, 1.8, 0, Math.PI * 2); ctx.fill();
  // What the chef is carrying, held up high.
  if (chef.carrying) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(0, -44, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
    drawIngredient(ctx, chef.carrying, 0, -46, 16);
    text(ctx, PREPARED_LABEL[chef.carrying] || chef.carrying, 0, -62, 11, C.ink, 'center');
  } else if (chef.plate) {
    drawPlate(ctx, 0, -46, 26, chef.plate.items);
  }
  ctx.restore();
}

// --- the order board -----------------------------------------------------------

function drawOrders(ctx, world) {
  const boardX = 880, boardY = 100, boardW = 380, boardH = 34;
  ctx.fillStyle = '#2f1d12';
  roundRect(ctx, boardX - 10, boardY - 8, boardW + 20, 46, 10); ctx.fill();
  text(ctx, 'ORDER BOARD', boardX + 8, boardY + 16, 15, C.gold, 'left');
  text(ctx, `served ${world.served} · lost ${world.failed}`, boardX + boardW - 8, boardY + 16, 12, '#f3e2c7', 'right');
  if (world.orders.length === 0) {
    ctx.fillStyle = C.paper;
    roundRect(ctx, boardX, boardY + 44, boardW, 54, 8); ctx.fill();
    text(ctx, 'No orders yet — the lunch crowd is coming…', boardX + 16, boardY + 78, 13, '#8a7a68', 'left', 'normal');
    return;
  }
  world.orders.forEach((order, i) => {
    const y = boardY + 44 + i * 78;
    const urgent = order.patience < 15;
    ctx.fillStyle = urgent && Math.floor(Date.now() / 400) % 2 === 0 ? '#ffe1e1' : C.paper;
    roundRect(ctx, boardX, y, boardW, 70, 8); ctx.fill();
    ctx.strokeStyle = urgent ? C.red : '#d8c49a';
    ctx.lineWidth = 2;
    roundRect(ctx, boardX, y, boardW, 70, 8); ctx.stroke();
    text(ctx, `#${order.id} ${order.recipe.name}`, boardX + 12, y + 22, 14, C.ink, 'left');
    text(ctx, `$${order.recipe.price}`, boardX + boardW - 12, y + 22, 14, '#b07a1e', 'right');
    // Recipe icons in serving order.
    order.recipe.needs.forEach((item, j) => {
      drawIngredient(ctx, item, boardX + 26 + j * 34, y + 48, 13);
    });
    // Patience bar.
    const p = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = '#e8e0d0';
    roundRect(ctx, boardX + 12, y + 60, boardW - 24, 5, 2); ctx.fill();
    ctx.fillStyle = p > 0.5 ? C.green : p > 0.25 ? C.gold : C.red;
    roundRect(ctx, boardX + 12, y + 60, (boardW - 24) * p, 5, 2); ctx.fill();
  });
}

function drawHud(ctx, world) {
  // Top-left: money, combo, shift clock.
  ctx.fillStyle = '#2f1d12';
  roundRect(ctx, 12, 100, 300, 46, 10); ctx.fill();
  text(ctx, `💰 $${world.money}`, 26, 130, 20, C.gold, 'left');
  if (world.combo >= 2) text(ctx, `🔥 combo x${world.combo}`, 150, 130, 15, '#ff9d5c', 'left');
  const mins = Math.floor(world.timeLeft / 60);
  const secs = Math.floor(world.timeLeft % 60);
  const clock = `${mins}:${String(secs).padStart(2, '0')}`;
  ctx.fillStyle = world.timeLeft < 30 ? C.red : '#2f1d12';
  roundRect(ctx, 330, 100, 130, 46, 10); ctx.fill();
  text(ctx, `⏱ ${clock}`, 344, 130, 20, '#ffffff', 'left');
  if (world.elapsed >= 110 && world.screen === 'play') {
    text(ctx, 'DINNER RUSH!', 480, 130, 18, C.red, 'left');
  }
  // Hint line at the bottom.
  ctx.fillStyle = 'rgba(47,29,18,0.85)';
  roundRect(ctx, 12, 764, 700, 26, 8); ctx.fill();
  text(ctx, 'WASD / arrows walk · E or click to use a counter · R restart · M mute', 24, 782, 13, '#f3e2c7', 'left', 'normal');
  // A plate that matches an order glows: nudge the player toward the window.
  if (world.screen === 'play' && world.chef.plate && world.chef.plate.items.length > 0) {
    const match = world.orders.some((o) => {
      if (o.recipe.needs.length !== world.chef.plate.items.length) return false;
      const a = [...o.recipe.needs].sort(), b = [...world.chef.plate.items].sort();
      return a.every((v, i) => v === b[i]);
    });
    if (match) {
      const msg = '✓ This plate matches an order — to the window!';
      ctx.fillStyle = 'rgba(47,29,18,0.9)';
      const w = ctx.measureText(msg).width + 28;
      roundRect(ctx, 724, 764, w, 26, 8); ctx.fill();
      text(ctx, msg, 738, 782, 14, '#8be28b', 'left');
    }
  }
  // Toast message.
  if (world.messageTimer > 0) {
    ctx.fillStyle = 'rgba(47,29,18,0.9)';
    const w = ctx.measureText(world.message).width + 28;
    roundRect(ctx, 640 - w / 2, 700, w, 32, 8); ctx.fill();
    text(ctx, world.message, 640, 722, 14, '#ffffff', 'center', 'normal');
  }
  // Floating score popups.
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.min(1, f.life);
    text(ctx, f.text, f.x, f.y, 18, f.colour, 'center');
    ctx.globalAlpha = 1;
  }
  // Steam particles.
  for (const p of world.particles) {
    ctx.fillStyle = p.colour;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
  }
  // Highlight the nearest usable station.
  if (world.screen === 'play') {
    const near = STATIONS.find((s) => {
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      return Math.hypot(world.chef.x - cx, world.chef.y - cy) < 125;
    });
    if (near) {
      ctx.strokeStyle = 'rgba(255,211,77,0.9)';
      ctx.lineWidth = 3;
      roundRect(ctx, near.x - 6, near.y - 6, near.w + 12, near.h + 12, 10); ctx.stroke();
      ctx.fillStyle = 'rgba(47,29,18,0.92)';
      roundRect(ctx, near.x + near.w / 2 - 34, near.y - 30, 68, 22, 8); ctx.fill();
      text(ctx, 'press E', near.x + near.w / 2, near.y - 14, 12, C.gold, 'center');
    }
  }
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(43,29,22,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = C.paper;
  roundRect(ctx, 290, 170, 700, 420, 18); ctx.fill();
  ctx.strokeStyle = C.gold; ctx.lineWidth = 4;
  roundRect(ctx, 290, 170, 700, 420, 18); ctx.stroke();
  text(ctx, '★ THE GOLDEN LADLE ★', 640, 250, 44, '#b07a1e', 'center');
  text(ctx, 'a cozy little cooking game', 640, 288, 18, '#8a7a68', 'center', 'normal');
  text(ctx, 'The lunch crowd is hungry. Chop it, grill it,', 640, 340, 17, C.ink, 'center', 'normal');
  text(ctx, 'stack it on a plate — and serve it before the', 640, 366, 17, C.ink, 'center', 'normal');
  text(ctx, 'order timer runs out. 3 minutes a shift!', 640, 392, 17, C.ink, 'center', 'normal');
  text(ctx, 'WASD / arrows to walk · E or click to use counters', 640, 440, 15, '#8a7a68', 'center', 'normal');
  text(ctx, 'Chop tomato · lettuce · onion  —  Grill patties  —  Build on a plate  —  Serve at the window', 640, 468, 13, '#8a7a68', 'center', 'normal');
  ctx.fillStyle = '#e5484d';
  roundRect(ctx, 490, 500, 300, 56, 12); ctx.fill();
  text(ctx, '▶  START YOUR SHIFT', 640, 536, 20, '#ffffff', 'center');
  text(ctx, 'click or press Enter', 640, 578, 13, '#8a7a68', 'center', 'normal');
}

function drawOver(ctx, world) {
  ctx.fillStyle = 'rgba(43,29,22,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = C.paper;
  roundRect(ctx, 340, 190, 600, 400, 18); ctx.fill();
  ctx.strokeStyle = C.gold; ctx.lineWidth = 4;
  roundRect(ctx, 340, 190, 600, 400, 18); ctx.stroke();
  text(ctx, 'SHIFT OVER!', 640, 270, 40, '#b07a1e', 'center');
  text(ctx, `You earned $${world.money} · served ${world.served} dishes · lost ${world.failed}`, 640, 320, 17, C.ink, 'center', 'normal');
  const verdict = world.money >= 80 ? '🏆 Head Chef material!' : world.money >= 45 ? '👍 A solid shift!' : '🌱 Keep practising, chef!';
  text(ctx, verdict, 640, 360, 19, '#3e8f31', 'center');
  text(ctx, `Best shift so far: $${Math.max(world.best, world.money)}`, 640, 400, 15, '#8a7a68', 'center', 'normal');
  ctx.fillStyle = '#e5484d';
  roundRect(ctx, 490, 440, 300, 56, 12); ctx.fill();
  text(ctx, '↻  COOK AGAIN  (R)', 640, 476, 20, '#ffffff', 'center');
}

export function render(ctx, world, now) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx);
  for (const station of STATIONS) drawStation(ctx, world, station, now);
  drawChef(ctx, world, now);
  drawOrders(ctx, world);
  drawHud(ctx, world);
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  if (world.screen === SCREEN_OVER) drawOver(ctx, world);
}
