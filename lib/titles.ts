/**
 * Deterministic "builder title" generator.
 *
 * The same name + role always produces the same title, so a card someone
 * regenerates tomorrow still matches the one they posted today. The `salt`
 * argument is what the reroll button increments.
 */

const ADJECTIVES = [
  "Midnight",
  "Caffeinated",
  "Relentless",
  "Sunlit",
  "Offline",
  "Deadline-Proof",
  "Zero-Downtime",
  "Salt-Crusted",
  "Monsoon",
  "Low-Latency",
  "Overclocked",
  "Pre-Dawn",
  "Undefeated",
  "Sand-in-the-Keyboard",
  "Tab-Hoarding",
  "Beachfront",
  "Unblocked",
  "Perpetual",
  "Feral",
  "Sunburnt",
];

const NOUNS = [
  "Shipper",
  "Merge Wizard",
  "Demo Slayer",
  "Latency Whisperer",
  "Commit Machine",
  "Edge-Case Hunter",
  "Pixel Surgeon",
  "Infra Gremlin",
  "Prompt Alchemist",
  "Refactor Monk",
  "Prototype Goblin",
  "Uptime Guardian",
  "Schema Sculptor",
  "Deploy Daredevil",
  "Cache Invalidator",
  "Rubber-Duck Listener",
  "Changelog Poet",
  "Bug Exorcist",
  "Ship-It Evangelist",
  "Terminal Dweller",
];

/** FNV-1a. Small, fast, and stable across runtimes — good enough for picking words. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function builderTitle(name: string, role: string, salt = 0): string {
  const seed = hash(`${name.trim().toLowerCase()}|${role.trim().toLowerCase()}|${salt}`);
  const adjective = ADJECTIVES[seed % ADJECTIVES.length];
  // Shift before the second lookup so adjective and noun don't move in lockstep.
  const noun = NOUNS[Math.floor(seed / ADJECTIVES.length) % NOUNS.length];
  return `${adjective} ${noun}`;
}

/**
 * A badge number in 001–247 — 247 being both the cohort size and a nod to
 * 2:47 PM Studio, who run the residency.
 */
export function builderNumber(name: string, role: string, salt = 0): string {
  const seed = hash(`no|${name.trim().toLowerCase()}|${role.trim().toLowerCase()}|${salt}`);
  return String((seed % 247) + 1).padStart(3, "0");
}
