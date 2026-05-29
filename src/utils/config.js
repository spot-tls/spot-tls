// ── Couleurs par quartier ────────────────────────────────────
export const QUARTIER_COLORS = {
  'Capitole':       '#EC4899',
  'Saint-Cyprien':  '#A78BFA',
  'Carmes':         '#06B6D4',
  'Centre-ville':   '#F59E0B',
  'Wilson':         '#4ade80',
  'Arnaud-Bernard': '#FB7185',
  'Saint-Georges':  '#22D3EE',
  'Saint-Aubin':    '#F472B6',
  'Compans':        '#34D399',
  'Minimes':        '#FBBF24',
};

// ── Pin / category styling ───────────────────────────────────
export const CATEGORY_CONFIG = {
  'Bar / cocktails':     { color: '#A78BFA', gradient: 'linear-gradient(135deg,#A78BFA,#8B5CF6)', emoji: '🍸' },
  'Bar à cocktails':     { color: '#A78BFA', gradient: 'linear-gradient(135deg,#A78BFA,#8B5CF6)', emoji: '🍸' },
  'Club / Soirée':       { color: '#EC4899', gradient: 'linear-gradient(135deg,#EC4899,#DB2777)', emoji: '🎉' },
  'Boîte / club':        { color: '#EC4899', gradient: 'linear-gradient(135deg,#EC4899,#DB2777)', emoji: '🎉' },
  'Underground':         { color: '#7C3AED', gradient: 'linear-gradient(135deg,#7C3AED,#4C1D95)', emoji: '🎛️' },
  'Brunch / café':       { color: '#06B6D4', gradient: 'linear-gradient(135deg,#06B6D4,#0891B2)', emoji: '☕' },
  'Restaurant':          { color: '#FFB347', gradient: 'linear-gradient(135deg,#FFB347,#EA580C)', emoji: '🍽️' },
  'Escape game':         { color: '#4ade80', gradient: 'linear-gradient(135deg,#4ade80,#16A34A)', emoji: '🔐' },
  'Bowling / karting':   { color: '#22D3EE', gradient: 'linear-gradient(135deg,#22D3EE,#06B6D4)', emoji: '🎳' },
  'Bar à vin':           { color: '#F472B6', gradient: 'linear-gradient(135deg,#F472B6,#BE185D)', emoji: '🍷' },
  'Bar à jeux / Gaming': { color: '#34D399', gradient: 'linear-gradient(135deg,#34D399,#059669)', emoji: '🎮' },
  'Concerts / lives':    { color: '#FB7185', gradient: 'linear-gradient(135deg,#FB7185,#E11D48)', emoji: '🎤' },
  'Expo / spectacle':    { color: '#FBBF24', gradient: 'linear-gradient(135deg,#FBBF24,#D97706)', emoji: '🎭' },
  'Karaoké':             { color: '#F59E0B', gradient: 'linear-gradient(135deg,#F59E0B,#B45309)', emoji: '🎙️' },
  'Pub':                 { color: '#FCD34D', gradient: 'linear-gradient(135deg,#FCD34D,#CA8A04)', emoji: '🍺' },
};

export const getCatConfig = (cat) =>
  CATEGORY_CONFIG[cat] ?? { color: '#EC4899', gradient: 'linear-gradient(135deg,#EC4899,#A78BFA)', emoji: '📍' };

export const CLOSED_PIN_COLOR = '#6B5B7F';

// ── Mood filters ──────────────────────────────────────────────────────
export const MOODS = [
  { key: 'chill',       label: 'Chill',         emoji: '🌿', keywords: ['cosy', 'calme', 'tranquille', 'lounge'] },
  { key: 'branche',     label: 'Branché',       emoji: '⚡', keywords: ['branché', 'hype', 'tendance', 'dj'] },
  { key: 'chic',        label: 'Chic',          emoji: '💎', keywords: ['chic', 'élégant', 'rooftop', 'luxe'] },
  { key: 'underground', label: 'Underground',   emoji: '🎛️', keywords: ['underground', 'alternatif', 'techno', 'rave'] },
  { key: 'aprem',       label: 'Aprem',         emoji: '☀️', keywords: ['brunch', 'café', 'terrasse', 'extérieur', 'déjeuner', 'afterwork'] },
  { key: 'bout',        label: "Jusqu'au bout", emoji: '🔥', categories: ['Club / Soirée', 'Underground', 'Boîte / club'] },
];

export function matchMood(spot, moodKey) {
  if (!moodKey) return true;
  const mood = MOODS.find((m) => m.key === moodKey);
  if (!mood) return true;
  if (mood.categories) return mood.categories.includes(spot.category);
  const tags = (spot.vibe_tags || []).map((t) => t.toLowerCase());
  return mood.keywords.some((kw) => t