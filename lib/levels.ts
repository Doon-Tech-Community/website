import type { Rarity } from "./types";

export interface LevelAttendeeInput {
  createdAt: string;
  bio: string;
  role_title: string;
  company: string;
  location: string;
  avatar_file_id: string;
  linkedin_url: string;
  github_url: string;
  website_url: string;
  preferred_stack: string;
  favorite_topic: string;
  tag_ids: string[];
}

export interface LevelBreakdown {
  profile: number;
  badges: number;
  tenure: number;
}

export interface LevelScore {
  level: number;
  xp: number;
  breakdown: LevelBreakdown;
}

const BADGE_XP: Record<Rarity, number> = {
  common: 25,
  rare: 75,
  epic: 180,
  legendary: 400
};

const LEVEL_THRESHOLDS = [
  0,
  50,
  125,
  225,
  375,
  575,
  850,
  1200,
  1650,
  2200,
  2900,
  3700,
  4700,
  6000,
  7600,
  9600,
  12000,
  15000,
  18500,
  22500
];

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function fullMonthsSince(isoDate: string, now = new Date()): number {
  const start = new Date(isoDate);
  if (Number.isNaN(start.getTime()) || start > now) return 0;

  let months =
    (now.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - start.getUTCMonth());
  if (now.getUTCDate() < start.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

export function profileCompletenessXp(attendee: LevelAttendeeInput): number {
  let xp = 0;
  if (hasText(attendee.avatar_file_id)) xp += 10;
  if (hasText(attendee.role_title)) xp += 10;
  if (hasText(attendee.company)) xp += 10;
  if (hasText(attendee.location)) xp += 10;
  if (attendee.bio.trim().replace(/\s+/g, " ").length >= 40) xp += 10;
  if (
    hasText(attendee.linkedin_url) ||
    hasText(attendee.github_url) ||
    hasText(attendee.website_url)
  ) {
    xp += 10;
  }
  xp += attendee.tag_ids.length >= 2 ? 10 : attendee.tag_ids.length === 1 ? 5 : 0;
  if (hasText(attendee.preferred_stack) || hasText(attendee.favorite_topic)) xp += 10;
  return Math.min(80, xp);
}

export function badgeXp(rarities: Rarity[]): number {
  return rarities.reduce((sum, rarity) => sum + BADGE_XP[rarity], 0);
}

export function tenureXp(createdAt: string, now = new Date()): number {
  return Math.min(60, fullMonthsSince(createdAt, now) * 5);
}

export function calculateLevelScore(
  attendee: LevelAttendeeInput,
  badgeRarities: Rarity[],
  now = new Date()
): LevelScore {
  const breakdown = {
    profile: profileCompletenessXp(attendee),
    badges: badgeXp(badgeRarities),
    tenure: tenureXp(attendee.createdAt, now)
  };
  const xp = breakdown.profile + breakdown.badges + breakdown.tenure;
  return {
    level: levelFromXp(xp),
    xp,
    breakdown
  };
}
