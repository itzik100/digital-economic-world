// Prices match frontend market.js RESOURCES basePrice
const resources = [
  { name: 'wood',     nameHe: 'עץ',      icon: '🪵', basePrice: 8,  maxStack: 200 },
  { name: 'stone',    nameHe: 'אבן',     icon: '🪨', basePrice: 12, maxStack: 200 },
  { name: 'iron',     nameHe: 'ברזל',    icon: '⚙️', basePrice: 25, maxStack: 100 },
  { name: 'water',    nameHe: 'מים',     icon: '💧', basePrice: 5,  maxStack: 500 },
  { name: 'wheat',    nameHe: 'חיטה',    icon: '🌾', basePrice: 10, maxStack: 300 },
  { name: 'corn',     nameHe: 'תירס',    icon: '🌽', basePrice: 14, maxStack: 300 },
  { name: 'tomato',   nameHe: 'עגבנייה', icon: '🍅', basePrice: 16, maxStack: 200 },
  { name: 'concrete', nameHe: 'בטון',    icon: '🧱', basePrice: 30, maxStack: 100 },
];

const robots = [
  { name: 'FarmBot-1', nameHe: 'רובוט חקלאי', type: 'farm', model: 'farmbot_v1', description: 'מטפל בחלקת חקלאות אוטומטית', rentalPrice: 30 },
  { name: 'MineBot-1', nameHe: 'רובוט כרייה', type: 'mining', model: 'minebot_v1', description: 'כורה אבן וברזל אוטומטית', rentalPrice: 50 },
  { name: 'ConcreteBot-1', nameHe: 'מדפסת בטון', type: 'construction', model: 'concretebot_v1', description: 'בונה בתים ומבנים', rentalPrice: 80 },
  { name: 'DroneBot-1', nameHe: 'רחפן שינוע', type: 'transport', model: 'drone_v1', description: 'מעביר חומרים בין אזורים', rentalPrice: 25 },
];

const quests = [
  { name: 'First Steps', nameHe: 'צעדים ראשונים', description: 'אסוף 10 עצים', type: 'starter', reward: 50, xpReward: 20, requirements: { wood: 10 } },
  { name: 'Stone Age', nameHe: 'עידן האבן', description: 'אסוף 5 אבנים', type: 'starter', reward: 30, xpReward: 15, requirements: { stone: 5 } },
  { name: 'First Trade', nameHe: 'עסקה ראשונה', description: 'מכור משאב אחד בשוק', type: 'starter', reward: 80, xpReward: 30, requirements: { sell: 1 } },
];

module.exports = { resources, robots, quests };
