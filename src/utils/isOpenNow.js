export const DAYS_LABELS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export const hasHours = (spot) => {
  if (!spot?.hours) return false;
  return Object.keys(spot.hours).length > 0;
};

export function toMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m = 0] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function isOpenNow(spot, now = new Date()) {
  if (!spot?.hours) return false;

  const dayName = DAYS_LABELS[now.getDay()];
  const todayHours = spot.hours[dayName];
  if (!todayHours) return false;

  const cur      = now.getHours() * 60 + now.getMinutes();
  const openMin  = toMinutes(todayHours.open);
  const closeMin = toMinutes(todayHours.close);

  if (closeMin < openMin) return cur >= openMin || cur < closeMin;
  return cur >= openMin && cur < closeMin;
}

export function getNextOpening(spot, now = new Date()) {
  if (isOpenNow(spot, now)) return null;
  if (!spot?.hours) return null;

  const todayName  = DAYS_LABELS[now.getDay()];
  const todayHours = spot.hours[todayName];
  if (todayHours) {
    const cur     = now.getHours() * 60 + now.getMinutes();
    const openMin = toMinutes(todayHours.open);
    if (openMin > cur) return { day: "aujourd'hui", time: todayHours.open };
  }

  for (let i = 1; i <= 7; i++) {
    const next    = new Date(now);
    next.setDate(now.getDate() + i);
    const dayName = DAYS_LABELS[next.getDay()];
    const hours   = spot.hours[dayName];
    if (!hours) continue;
    return { day: i === 1 ? 'demain' : dayName, time: hours.open };
  }

  return null;
}
