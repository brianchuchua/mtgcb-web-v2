interface Release {
  date: string;
  version: string;
  changes: string[];
}

interface ChangelogData {
  releases: Release[];
}

const changelogData: ChangelogData = {
  releases: [
    {
      date: '2025-08-09',
      version: '0.102.1',
      changes: [
        'Fixed card visibility issue in aggregate sets like Secret Lair Drop Series where cards would be invisible despite data being loaded',
        'Improved navigation transitions to prevent showing stale cards when switching between sets',
      ],
    },
    {
      date: '2025-08-08',
      version: '0.102.0',
      changes: [
        'Added home page with platform statistics, feature showcase, and collection highlights',
      ],
    },
    {
      date: '2025-08-07',
      version: '0.101.0',
      changes: [
        'Added private share links feature - generate secure links to share private collections',
        'Enhanced privacy controls with visual access summary showing who can view collections',
        'Implemented share link manager with expiration options (1 day to permanent)',
        'Added invalid/expired share link detection with clear error messaging',
        'Updated share modal with dual options: make public or generate private share link',
        'Share links persist for browser session and properly handle UTC timestamps',
      ],
    },
    {
      date: '2025-08-06',
      version: '0.100.0',
      changes: [
        'Added contextual autofocus to Card Name and Set Name fields in browse search form',
      ],
    },
    {
      date: '2025-08-06',
      version: '0.99.0',
      changes: [
        'Added price settings section to Account page allowing users to configure how prices are displayed throughout the application',
        'Created separate Privacy section with auto-save toggle for collection visibility',
        'Reorganized Account page sections for better logical flow: Profile, Password, Privacy, Price Settings',
      ],
    },
    {
      date: '2025-08-06',
      version: '0.98.1',
      changes: ['Added delete account functionality with confirmation dialog and proper cleanup'],
    },
    {
      date: '2025-08-06',
      version: '0.98.0',
      changes: ['Added individual card detail pages accessible by clicking on any card'],
    },
    {
      date: '2025-08-06',
      version: '0.97.1',
      changes: ['Search Options in sidenav now automatically expand when navigating to Browse or Collection pages'],
    },
    {
      date: '2025-08-05',
      version: '0.97.0',
      changes: [
        'Added dedicated card detail pages for both browse and collection contexts',
        'Implemented context-aware navigation - cards clicked in collections stay in collection context',
        'Created compact "Other Printings" table with single-letter rarity codes and inline foil prices',
        'Added collection management features to card pages including quantity editing and location tracking',
        'Integrated goal progress indicators showing cards needed for collection goals',
        'Fixed nested anchor tag hydration error in card links',
        'Extracted reusable card components for better code maintainability',
      ],
    },
    {
      date: '2025-08-05',
      version: '0.96.0',
      changes: [
        'Added collection sharing feature with privacy controls, copy-to-clipboard functionality, and option to share current view with filters',
        'Improved mobile button layout with buttons below pagination',
        'Reduced button spacing for better visual consistency',
        'Fixed modal dialog styling consistency across the app',
      ],
    },
    {
      date: '2025-08-02',
      version: '0.90.0',
      changes: ['Added support for nested locations'],
    },
  ],
};

export const getLatestRelease = (): { date: string; version: string } | null => {
  if (changelogData.releases.length === 0) {
    return null;
  }
  const latest = changelogData.releases[0];
  return {
    date: latest.date,
    version: latest.version,
  };
};

export default changelogData;
