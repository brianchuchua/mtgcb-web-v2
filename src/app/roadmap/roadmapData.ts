export type RoadmapStatus = 'completed' | 'in-progress' | 'upcoming';

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  icon?: string;
}

export const roadmapItems: RoadmapItem[] = [
  {
    id: 'v1-launch',
    title: 'MTG CB v1.0 Launch',
    description:
      'Official release of MTG Collection Builder with new features, including custom collection goals and card locations.',
    status: 'completed',
  },
  {
    id: 'data-cleanup',
    title: 'Data Clean-Up Project',
    description:
      'Adding every missing English card to the database, including tokens, emblems, art cards, and other oddities, while creating and reorganizing subsets.',
    status: 'in-progress',
  },
  {
    id: 'community-vote',
    title: 'Community Vote',
    description:
      'MTG CB will reach out on social media to gather ideas for the next major feature. Current suggestions include support for foreign (non-English) cards and deckbuilding tools.',
    status: 'upcoming',
  },
  {
    id: 'patreon-vote',
    title: 'Patreon Vote',
    description:
      'Patrons of MTG CB will vote on the top community suggestions. The final winner will be chosen based on community interest, technical feasibility, impact and timing.',
    status: 'upcoming',
  },
  {
    id: 'next-feature',
    title: 'Next Major Feature',
    description: 'The winning feature from the community vote will be developed and released. Stay tuned!',
    status: 'upcoming',
  },
];
