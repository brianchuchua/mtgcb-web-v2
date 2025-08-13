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
      date: '2025-08-13',
      version: '0.107.1',
      changes: ['Fixed Reset Search button not clearing stat filters visually in the search form'],
    },
    {
      date: '2025-08-13',
      version: '0.107.0',
      changes: [
        'Made card locations visible when viewing other users\' collections in both table and grid views',
        'Changed price tooltips to appear above prices instead of below for better visibility',
      ],
    },
    {
      date: '2025-08-12',
      version: '0.106.0',
      changes: ['Added smart prefetching for next page of results to improve pagination performance'],
    },
    {
      date: '2025-08-12',
      version: '0.105.2',
      changes: [
        "Improved collection goals summary calculation performance (when viewing one or more goal's summaries) by 73%",
      ],
    },
    {
      date: '2025-08-12',
      version: '0.105.1',
      changes: ['Improved collection goal performance (when viewing a list of cards) by 83%'],
    },
    {
      date: '2025-08-11',
      version: '0.105.0',
      changes: [
        'Added delete button to Goals and Locations edit pages for easier deletion without returning to list view',
      ],
    },
    {
      date: '2025-08-11',
      version: '0.104.4',
      changes: [
        'Added "Back to Top" button when viewing sets in collection pages for easier navigation',
        'Improved spacing between content and navigation buttons for better visual clarity',
      ],
    },
    {
      date: '2025-08-11',
      version: '0.104.3',
      changes: ['Fixed table column alignment issue where prices appeared under the wrong header when browsing cards'],
    },
    {
      date: '2025-08-11',
      version: '0.104.2',
      changes: ['Made Beta Test Environment banner dismissable for the current session'],
    },
    {
      date: '2025-08-10',
      version: '0.104.1',
      changes: ['Fixed Share button to only show for logged-in users viewing their own collection'],
    },
    {
      date: '2025-08-10',
      version: '0.104.0',
      changes: [
        'Added private collection sharing with shortened, anonymous URLs that hide user IDs',
        'Fixed all collection navigation links to maintain privacy when viewing shared collections',
        'Improved shared collection banner visibility and detection for token-based URLs',
      ],
    },
    {
      date: '2025-08-10',
      version: '0.103.0',
      changes: [
        'Added site-wide footer with copyright, terms and privacy, and contact information',
        'Created Terms and Privacy page with user-friendly TL;DR section and full legal text',
        'Added terms agreement notices to login and signup forms',
        'Implemented spam-resistant email contact link in footer',
      ],
    },
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
      changes: ['Added home page with platform statistics, feature showcase, and collection highlights'],
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
      changes: ['Added contextual autofocus to Card Name and Set Name fields in browse search form'],
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
