import { useState } from 'react';

const REACTIONS_KEY  = 'spottls_reactions_v1';
const USER_VOTES_KEY = 'spottls_user_reactions_v1';

export const REACTION_EMOJIS = ['🔥', '❤️', '😍', '🆕'];

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function useReactions() {
  const [reactions,  setReactions]  = useState(() => load(REACTIONS_KEY));
  const [userVotes,  setUserVotes]  = useState(() => load(USER_VOTES_KEY));

  const react = (spotId, emoji) => {
    const id = String(spotId);

    setReactions((prev) => {
      const spot    = { ...(prev[id] || {}) };
      const current = userVotes[id];

      if (current === emoji) {
        // Toggle off — retire le vote
        spot[emoji] = Math.max(0, (spot[emoji] || 0) - 1);
        if (!spot[emoji]) delete spot[emoji];
      } else {
        // Change de vote ou nouveau vote
        if (current) {
          spot[current] = Math.max(0, (spot[current] || 0) - 1);
          if (!spot[current]) delete spot[current];
        }
        spot[emoji] = (spot[emoji] || 0) + 1;
      }

      const next = { ...prev, [id]: spot };
      save(REACTIONS_KEY, next);
      return next;
    });

    setUserVotes((prev) => {
      const next = { ...prev };
      if (next[id] === emoji) {
        delete next[id];
      } else {
        next[id] = emoji;
      }
      save(USER_VOTES_KEY, next);
      return next;
    });
  };

  const getReactions = (spotId) => reactions[String(spotId)] || {};
  const getUserVote  = (spotId) => userVotes[String(spotId)]  || null;

  return { react, getReactions, getUserVote };
}
