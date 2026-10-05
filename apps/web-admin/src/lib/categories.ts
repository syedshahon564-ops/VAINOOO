import { INITIAL_CATEGORIES, INITIAL_SETTINGS, CMSData, MatchItem, CategoryItem } from './cms-store';

export type { MatchItem, CategoryItem, CMSData };

export interface CategoryInfo {
  slug: string;
  id: number;
  name: string;
  section: string;
  matchesFound?: number;
  bannerImage: string;
  avatarImage: string;
  description: string;
  sampleMatches?: any[];
  customRules?: string;
}

export const CATEGORIES_DATA: Record<string, CategoryInfo> = {
  'special-match': {
    ...INITIAL_CATEGORIES['special-match'],
    matchesFound: 0,
    sampleMatches: [],
  },
  'classic-match': {
    ...INITIAL_CATEGORIES['classic-match'],
    matchesFound: 0,
    sampleMatches: [],
  },
  'clash-squad': {
    ...INITIAL_CATEGORIES['clash-squad'],
    matchesFound: 0,
    sampleMatches: [],
  },
  'lone-wolf': {
    ...INITIAL_CATEGORIES['lone-wolf'],
    matchesFound: 0,
    sampleMatches: [],
  },
  'lost-to-win': {
    ...INITIAL_CATEGORIES['lost-to-win'],
    matchesFound: 0,
    sampleMatches: [],
  },
  'cs-only-headshot': {
    ...INITIAL_CATEGORIES['cs-only-headshot'],
    matchesFound: 0,
    sampleMatches: [],
  },
};
