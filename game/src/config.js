// The Golden Ladle — configuration: the kitchen, the menu and the rules.
// Everything tunable lives here so the rest of the game reads like a recipe book.

export const VIEW = { width: 1280, height: 800 };
export const SHIFT_SECONDS = 180;
export const CHEF_SPEED = 290;
export const INTERACT_RANGE = 125;

// Stations are rectangles on the kitchen floor. `kind` tells world.js what
// an interaction does there; `label` is what the player reads on the counter.
export const STATIONS = [
  { id: 'bun', kind: 'crate', item: 'bun', label: 'Buns', x: 60, y: 150, w: 110, h: 74 },
  { id: 'patty', kind: 'crate', item: 'patty', label: 'Patties', x: 190, y: 150, w: 110, h: 74 },
  { id: 'tomato', kind: 'crate', item: 'tomato', label: 'Tomatoes', x: 320, y: 150, w: 110, h: 74 },
  { id: 'lettuce', kind: 'crate', item: 'lettuce', label: 'Lettuce', x: 450, y: 150, w: 110, h: 74 },
  { id: 'cheese', kind: 'crate', item: 'cheese', label: 'Cheese', x: 580, y: 150, w: 110, h: 74 },
  { id: 'onion', kind: 'crate', item: 'onion', label: 'Onions', x: 710, y: 150, w: 110, h: 74 },
  { id: 'board', kind: 'board', label: 'Chopping Board', x: 60, y: 330, w: 170, h: 90 },
  { id: 'grill', kind: 'grill', label: 'Grill', x: 300, y: 330, w: 220, h: 90 },
  { id: 'plates', kind: 'plates', label: 'Clean Plates', x: 60, y: 520, w: 150, h: 90 },
  { id: 'assembly', kind: 'assembly', label: 'Assembly Counter', x: 300, y: 520, w: 330, h: 96 },
  { id: 'window', kind: 'window', label: 'Serving Window', x: 900, y: 520, w: 320, h: 96 },
  { id: 'bin', kind: 'bin', label: 'Compost Bin', x: 700, y: 520, w: 150, h: 90 },
];

// Ingredient catalogue: colour, whether it needs chopping or grilling, and the
// little drawing hint render.js uses (shape + extra colour).
export const INGREDIENTS = {
  bun: { name: 'Bun', colour: '#e8b06a', dark: '#c98d45', prep: 'none', icon: 'dome' },
  patty: { name: 'Patty', colour: '#8a5a33', dark: '#6b4224', prep: 'grill', icon: 'patty' },
  tomato: { name: 'Tomato', colour: '#e5484d', dark: '#b03034', prep: 'chop', icon: 'round' },
  lettuce: { name: 'Lettuce', colour: '#5fbf4a', dark: '#3e8f31', prep: 'chop', icon: 'leaf' },
  cheese: { name: 'Cheese', colour: '#ffc93c', dark: '#e8a91c', prep: 'none', icon: 'wedge' },
  onion: { name: 'Onion', colour: '#c9a7e8', dark: '#9a76c4', prep: 'chop', icon: 'rings' },
};

// A prepared ingredient is the same food after its station work is done.
export function preparedName(item) {
  if (item === 'patty') return 'cookedPatty';
  if (item === 'tomato') return 'choppedTomato';
  if (item === 'lettuce') return 'choppedLettuce';
  if (item === 'onion') return 'choppedOnion';
  return item;
}
export const PREPARED_LABEL = {
  bun: 'Bun', cookedPatty: 'Grilled Patty', choppedTomato: 'Chopped Tomato',
  choppedLettuce: 'Chopped Lettuce', cheese: 'Cheese', choppedOnion: 'Chopped Onion',
};
export const PREPARED_COLOUR = {
  bun: '#e8b06a', cookedPatty: '#6b4224', choppedTomato: '#e5484d',
  choppedLettuce: '#5fbf4a', cheese: '#ffc93c', choppedOnion: '#c9a7e8',
};

// The menu: each dish is a name, the prepared items it needs (in serving order),
// its base price and how long a customer will wait for it.
export const RECIPES = [
  { name: 'Sunny Stack', needs: ['bun', 'cookedPatty', 'cheese', 'bun'], price: 9, patience: 55 },
  { name: 'Garden Stack', needs: ['bun', 'cookedPatty', 'choppedLettuce', 'choppedTomato', 'bun'], price: 12, patience: 65 },
  { name: 'Golden Melt', needs: ['bun', 'cookedPatty', 'cheese', 'choppedOnion', 'bun'], price: 11, patience: 60 },
  { name: 'Green Crunch', needs: ['bun', 'choppedLettuce', 'choppedTomato', 'cheese', 'bun'], price: 10, patience: 55 },
  { name: 'Double Trouble', needs: ['bun', 'cookedPatty', 'cookedPatty', 'cheese', 'bun'], price: 15, patience: 70 },
];

export const CHOP_SECONDS = 2.2;
export const GRILL_SECONDS = 4.5;
export const BURN_SECONDS = 9; // a patty left on the grill past this is ruined
export const MAX_ORDERS = 4;
export const COMBO_WINDOW = 20; // seconds in which a second on-time serve keeps the combo

// Order spawn pacing: calm at the start, a dinner rush in the last minute.
export function spawnInterval(elapsed) {
  if (elapsed < 45) return 14;
  if (elapsed < 110) return 11;
  return 8;
}
export function rushNow(elapsed) { return elapsed >= 110; }
