import { APP_CONFIG } from "./config.js";

let identity = { profileId: "guest", role: "public" };
const memory = new Map();

export function setStateIdentity(profileId, role) {
  identity = { profileId: profileId || "guest", role: role || "unknown" };
}

function storageKey(key) {
  return `${APP_CONFIG.statePrefix}:${identity.profileId}:${identity.role}:${key}`;
}

export function getState(key, fallback = null) {
  if (memory.has(key)) return memory.get(key);
  try {
    const value = localStorage.getItem(storageKey(key));
    const parsed = value === null ? fallback : JSON.parse(value);
    memory.set(key, parsed);
    return parsed;
  } catch {
    return fallback;
  }
}

export function setState(key, value) {
  memory.set(key, value);
  localStorage.setItem(storageKey(key), JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("mushavo:state", { detail: { key, value, identity } }));
  return value;
}

export function removeState(key) {
  memory.delete(key);
  localStorage.removeItem(storageKey(key));
}

export function preserveScroll(view) {
  setState(`scroll:${view}`, Math.max(0, window.scrollY));
}

export function restoreScroll(view) {
  requestAnimationFrame(() => window.scrollTo({ top: getState(`scroll:${view}`, 0), behavior: "instant" }));
}
