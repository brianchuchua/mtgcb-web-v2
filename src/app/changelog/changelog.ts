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
      date: '2025-09-15',
      version: '0.118.3',
      changes: ['Improved home page loading skeleton to prevent layout shift'],
    },
    {
      date: '2025-09-15',
      version: '0.118.2',
      changes: ['Made header title link to home page'],
    },
    {
      date: '2025-09-15',
      version: '0.118.1',
      changes: ['Improved homepage formatting'],
    },
    {
      date: '2025-09-14',
      version: '0.118.0',
      changes: [
        'Added Resources section to sidenav with News, FAQ, Contact, Binder Templates, Draft Helper, and Draft Cubes pages',
      ],
    },
    {
      date: '2025-09-13',
      version: '0.117.5',
      changes: ['Fixed search form visibility and selectors on shared collection pages'],
    },
    {
      date: '2025-09-13',
      version: '0.117.4',
      changes: ['Fixed search form not showing on shared collection pages'],
    },
    {
      date: '2025-09-13',
      version: '0.117.3',
      changes: ['Fixed several bugs with goals for collecting all printings of specific cards'],
    },
    {
      date: '2025-09-13',
      version: '0.117.2',
      changes: ['Changed default "Cards per row (desktop only)" setting to auto for responsive layout'],
    },
    {
      date: '2025-09-13',
      version: '0.117.1',
      changes: ['Fixed goal striping background to display consistently across all table cells including card names'],
    },
    {
      date: '2025-09-13',
      version: '0.117.0',
      changes: [
        'Improved goal contribution tooltips with click-to-open info icons, scrollable content, and better mobile support',
      ],
    },
    {
      date: '2025-09-13',
      version: '0.116.1',
      changes: [
        'Fixed collection table view card links to navigate to collection-specific card pages instead of browse pages',
      ],
    },
    {
      date: '2025-09-12',
      version: '0.116.0',
      changes: [
        'Added snazzy new home page dashboard upon login with statistics and charts',
        'Redirect users to their personalized dashboard after login or registration',
      ],
    },
    {
      date: '2025-09-11',
      version: '0.115.2',
      changes: ['Optimized goals page to load incrementally, reducing server load and improving performance'],
    },
    {
      date: '2025-09-10',
      version: '0.115.1',
      changes: ['Fixed performance issue causing page slowdowns when browsing collections'],
    },
    {
      date: '2025-09-10',
      version: '0.115.0',
      changes: ['Added a loading indicator and auto-retries for goal compilation status'],
    },
    {
      date: '2025-09-04',
      version: '0.114.0',
      changes: [
        'Improved goal loading experience with compilation status modal that explains the optimization process',
      ],
    },
    {
      date: '2025-09-03',
      version: '0.113.7',
      changes: [
        'Improved rendering of costs to complete for goals',
        'Improved goal calculation performance during load tests by another 4x',
      ],
    },
    {
      date: '2025-09-02',
      version: '0.113.6',
      changes: ['Hide "Show bad data" toggle when viewing goal-filtered collections'],
    },
    {
      date: '2025-09-02',
      version: '0.113.5',
      changes: ['Fixed collection sorting bug where quantity-based sort options would revert to release date'],
    },
    {
      date: '2025-09-01',
      version: '0.113.4',
      changes: ['Improved footer layout and prevented layout shift during page load'],
    },
    {
      date: '2025-09-01',
      version: '0.113.3',
      changes: ['Improved notifications to be less spammy when updating card quantities'],
    },
    {
      date: '2025-09-01',
      version: '0.113.2',
      changes: ['Improved card table column ordering for better viewing experience'],
    },
    {
      date: '2025-08-23',
      version: '0.113.1',
      changes: ['Improved goal calculation performance by 10x.'],
    },
    {
      date: '2025-08-18',
      version: '0.113.0',
      changes: ['Added confetti celebration animation when completing 100% of a set collection'],
    },
    {
      date: '2025-08-17',
      version: '0.112.0',
      changes: ['Added OpenGraph social preview images for collection pages'],
    },
    {
      date: '2025-08-17',
      version: '0.111.0',
      changes: [
        'Added progress bar style toggle for set collections (radial vs linear)',
        'Linear progress bars now display below set icons with cleaner layout',
        'Changed default progress bar style to linear for better visual hierarchy',
      ],
    },
    {
      date: '2025-08-17',
      version: '0.110.0',
      changes: [
        'Added expandable "Complete This Set" section for purchase options in set grid views',
        'Added settings to control default expansion state (collapsed/expanded)',
      ],
    },
    {
      date: '2025-08-14',
      version: '0.109.0',
      changes: ['Completed new price updater system', 'Added price update timestamp display on card detail pages'],
    },
    {
      date: '2025-08-13',
      version: '0.108.5',
      changes: ['Improved set tables on mobile'],
    },
    {
      date: '2025-08-13',
      version: '0.108.4',
      changes: ['Fixed alternating row colors in virtualized tables'],
    },
    {
      date: '2025-08-13',
      version: '0.108.3',
      changes: ['Improved home page layout on mobile devices'],
    },
    {
      date: '2025-08-13',
      version: '0.108.2',
      changes: ['Fixed search summary not displaying quantity stat filters'],
    },
    {
      date: '2025-08-13',
      version: '0.108.1',
      changes: ['Fixed flashing when updating card quantities on set collection pages'],
    },
    {
      date: '2025-08-13',
      version: '0.108.0',
      changes: [
        'Added search descriptions showing active filters below pagination in browse and collection pages',
        'Moved reset search button to the top of the search form for better visibility',
      ],
    },
    {
      date: '2025-08-13',
      version: '0.107.4',
      changes: ['Removed autofocus that was disruptive on mobile'],
    },
    {
      date: '2025-08-13',
      version: '0.107.3',
      changes: ['Fixed issue with sorting sets by release date'],
    },
    {
      date: '2025-08-13',
      version: '0.107.2',
      changes: ['Fixed stat filters not syncing visually when using quantity quick selectors'],
    },
    {
      date: '2025-08-13',
      version: '0.107.1',
      changes: ['Fixed Reset Search button not clearing stat filters visually in the search form'],
    },
    {
      date: '2025-08-13',
      version: '0.107.0',
      changes: [
        "Made card locations visible when viewing other users' collections in both table and grid views",
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
