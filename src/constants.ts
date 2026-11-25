import type { CategoryDef } from './types';

export const CATEGORIES: CategoryDef[] = [
  { label: 'Tools', key: 'tools', icon: 'Wrench' },
  { label: 'Vehicles', key: 'vehicles', icon: 'CarFront' },
  { label: 'Paint Jobs', key: 'paint-jobs', icon: 'Paintbrush' },
  { label: 'Weapons', key: 'weapons', icon: 'Bomb' },
  { label: 'Scripts', key: 'scripts', icon: 'FileCode2' },
  { label: 'Player', key: 'player', icon: 'CircleUserRound' },
  { label: 'Maps', key: 'maps', icon: 'MapPin' },
  { label: 'Misc', key: 'misc', icon: 'Leaf' },
  { label: 'Other', key: 'other', icon: 'MoreHorizontal' },
];

export const SUBCATEGORIES: CategoryDef[] = [...CATEGORIES];

export const SPECIAL_CATEGORIES: CategoryDef[] = [
  { label: 'Leaks', key: 'leaks', icon: 'Flag' },
  { label: 'FiveM', key: 'fivem', icon: 'Zap' },
  { label: 'Communities', key: 'communities', icon: 'UsersRound' },
];

export const ALL_CATEGORY_KEYS = [...CATEGORIES.map((c) => c.key), ...SPECIAL_CATEGORIES.map((c) => c.key)];

export const DISCORD_INVITE_URL = 'https://discord.gg/7At78MbTbz';
export const OWNER_EMAIL = 'grandfivemodsghost@gmail.com';
export const MAX_FILE_GB = 50;
export const MAX_AVATAR_KB = 750;

export const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
  'Spain', 'Italy', 'Portugal', 'Netherlands', 'Brazil', 'Mexico', 'Argentina',
  'Japan', 'China', 'South Korea', 'India', 'Russia', 'Poland', 'Sweden',
  'Norway', 'Denmark', 'Finland', 'Ireland', 'New Zealand', 'South Africa',
  'Other',
];

export const SOCIAL_FIELDS = [
  { key: 'website', label: 'Personal Website' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'twitter', label: 'Twitter' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'twitch', label: 'Twitch' },
  { key: 'steam', label: 'Steam' },
  { key: 'socialclub', label: 'Social Club' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'github', label: 'GitHub' },
  { key: 'paypal', label: 'PayPal' },
  { key: 'cashapp', label: 'Cash App' },
  { key: 'skype', label: 'Skype' },
  { key: 'discord', label: 'Discord' },
];

export const FOOTER_LINKS = [
  { label: 'Contact', key: 'contact' },
  { label: 'Privacy Policy', key: 'privacy' },
  { label: 'Terms of Service', key: 'terms' },
  { label: 'DMCA', key: 'dmca' },
  { label: 'Leaderboard', key: 'leaderboard' },
];
