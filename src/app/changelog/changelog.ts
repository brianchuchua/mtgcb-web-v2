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
      date: '2025-09-27',
      version: '0.134.0',
      changes: ['Reserved List cards can now be included or excluded in goals and searches'],
    },
    {
      date: '2025-09-27',
      version: '0.133.3',
      changes: ['Fixed cards from previous set briefly appearing when navigating between collection sets'],
    },
    {
      date: '2025-09-27',
      version: '0.133.2',
      changes: ['Fixed Jump to Set navigation to respect current collection context'],
    },
    {
      date: '2025-09-27',
      version: '0.133.1',
      changes: ['Fixed styling and visual appearance of Jump to Set dropdown menu'],
    },
    {
      date: '2025-09-27',
      version: '0.133.0',
      changes: ['Added "Jump to Set" quick navigation in header for fast access to any set'],
    },
    {
      date: '2025-09-25',
      version: '0.132.4',
      changes: ['Hide duplicate printings option is now hidden when a collection goal is selected'],
    },
    {
      date: '2025-09-25',
      version: '0.132.3',
      changes: ['Fixed missing TCGPlayer foil warnings for large collection goal purchases'],
    },
    {
      date: '2025-09-25',
      version: '0.132.2',
      changes: [
        'Added reminders to uncheck the foil option on TCGPlayer when bulk buying normal cards for collection goals',
      ],
    },
    {
      date: '2025-09-25',
      version: '0.132.1',
      changes: ['Fixed how some goals count progress toward completion for better accuracy'],
    },
    {
      date: '2025-09-25',
      version: '0.132.0',
      changes: ['Added purchase buttons to individual set pages for easy buying of missing cards or complete sets'],
    },
    {
      date: '2025-09-25',
      version: '0.131.1',
      changes: ['Fixed spacing above bottom pagination on mobile browse and collection pages'],
    },
    {
      date: '2025-09-25',
      version: '0.131.0',
      changes: [
        'Improved purchase experience for large collection goals with faster loading and better progress tracking',
      ],
    },
    {
      date: '2025-09-25',
      version: '0.130.3',
      changes: ['Updated set purchase button text for better clarity'],
    },
    {
      date: '2025-09-25',
      version: '0.130.2',
      changes: [
        'Improved pagination layout on Goals and Locations pages - bottom pagination now only shows on mobile',
        'Adjusted spacing between content and pagination controls for better visual hierarchy',
      ],
    },
    {
      date: '2025-09-25',
      version: '0.130.1',
      changes: ['Fixed spacing between sets grid and pagination controls for better visual consistency'],
    },
    {
      date: '2025-09-25',
      version: '0.130.0',
      changes: [
        'Added pagination controls at the bottom of browse and collection pages for easier navigation',
        'Fixed spacing between sets list and bottom pagination on collection pages',
      ],
    },
    {
      date: '2025-09-24',
      version: '0.129.7',
      changes: [
        'Improved Iconic Impact game text input to disable autocorrect for better typing experience',
        'Added note that Iconic Impact game works best with a physical keyboard',
      ],
    },
    {
      date: '2025-09-24',
      version: '0.129.6',
      changes: ['Fixed Goals menu item to show as active when on create or edit goal pages'],
    },
    {
      date: '2025-09-24',
      version: '0.129.5',
      changes: [
        'Fixed Iconic Impact game speed to run consistently on all devices regardless of screen refresh rate -- if only we still had turbo buttons on our PCs',
      ],
    },
    {
      date: '2025-09-24',
      version: '0.129.4',
      changes: ['Improved layout on tablet devices for better usability'],
    },
    {
      date: '2025-09-24',
      version: '0.129.3',
      changes: ['Fixed set name column width in card tables for better readability on mobile devices'],
    },
    {
      date: '2025-09-24',
      version: '0.129.2',
      changes: ['Fixed table view to hide "Add card to location" button for cards with no quantity'],
    },
    {
      date: '2025-09-24',
      version: '0.129.1',
      changes: ['Fixed display of colorless Phyrexian mana symbols in card tables'],
    },
    {
      date: '2025-09-24',
      version: '0.129.0',
      changes: ['Added inline save indicators to quantity selectors showing progress and completion'],
    },
    {
      date: '2025-09-24',
      version: '0.128.1',
      changes: ['Fixed card selector flickering when adding specific cards to goals'],
    },
    {
      date: '2025-09-23',
      version: '0.128.0',
      changes: [
        'Improved grid view for shared collections by showing disabled quantity selectors instead of plain text',
      ],
    },
    {
      date: '2025-09-23',
      version: '0.127.0',
      changes: ['Improved location features by hiding "Add card to location" button when no locations exist'],
    },
    {
      date: '2025-09-23',
      version: '0.126.2',
      changes: ['Fixed quantity selector border alignment in collection table view'],
    },
    {
      date: '2025-09-23',
      version: '0.126.1',
      changes: ['Fixed breadcrumb navigation consistency across collection pages'],
    },
    {
      date: '2025-09-23',
      version: '0.126.0',
      changes: ['Added "Parent" link on subset pages to quickly navigate to parent set'],
    },
    {
      date: '2025-09-22',
      version: '0.125.4',
      changes: ['Fixed tooltip positioning for edited dates on Goals and Locations pages'],
    },
    {
      date: '2025-09-22',
      version: '0.125.3',
      changes: ['Fixed layout shift when viewing collection sets as "Part of collection" text loads'],
    },
    {
      date: '2025-09-22',
      version: '0.125.2',
      changes: ['Fixed pagination "Showing X-X of X cards" text wrapping to two lines on wider screens'],
    },
    {
      date: '2025-09-22',
      version: '0.125.1',
      changes: ['Fixed social media preview images to handle long card names and usernames properly'],
    },
    {
      date: '2025-09-22',
      version: '0.125.0',
      changes: [
        'Added context menu to card prices with options to view card page or buy on TCGPlayer',
        'Made info icon on fallback prices clickable to show explanation popover',
        'Removed hover tooltips from card prices for cleaner interaction',
      ],
    },
    {
      date: '2025-09-22',
      version: '0.124.5',
      changes: [
        'Fixed Other Printings table to show foil prices for foil-only cards',
        'Improved price display in Other Printings to show best available price when preferred type is unavailable',
      ],
    },
    {
      date: '2025-09-21',
      version: '0.124.4',
      changes: [
        'Fixed welcome message flicker for new users on homepage',
        'Improved database performance for some queries by 30x-170x.',
      ],
    },
    {
      date: '2025-09-21',
      version: '0.124.3',
      changes: ['Fixed error flash when deleting locations and goals from their edit pages'],
    },
    {
      date: '2025-09-20',
      version: '0.124.2',
      changes: ['Miscellaneous typo fixes and interface tidying'],
    },
    {
      date: '2025-09-20',
      version: '0.124.1',
      changes: ['Fixed Iconic Impact Skip Set button animation to properly show failure effects'],
    },
    {
      date: '2025-09-20',
      version: '0.124.0',
      changes: ['Added wave-based checkpoint system and in-game HUD to Iconic Impact game'],
    },
    {
      date: '2025-09-19',
      version: '0.123.1',
      changes: ['Fixed Iconic Impact bad mode win display showing incorrect set count'],
    },
    {
      date: '2025-09-19',
      version: '0.123.0',
      changes: ['Added statistics tracking, game modes, and skip button to Iconic Impact game'],
    },
    {
      date: '2025-09-19',
      version: '0.122.1',
      changes: ['Fixed Iconic Impact hint system for small set names and improved progressive reveal logic'],
    },
    {
      date: '2025-09-19',
      version: '0.122.0',
      changes: ['Improved Iconic Impact game performance and fixed display issues'],
    },
    {
      date: '2025-09-18',
      version: '0.121.0',
      changes: ['Added Iconic Impact game - a typing game to learn Magic: The Gathering set icons'],
    },
    {
      date: '2025-09-18',
      version: '0.120.1',
      changes: ['Fixed autocorrect and spellcheck behavior on search fields and authentication forms'],
    },
    {
      date: '2025-09-18',
      version: '0.120.0',
      changes: ['Added reset search link to "Set not found" message in browse and collection pages'],
    },
    {
      date: '2025-09-18',
      version: '0.119.1',
      changes: ['Fixed home page infinite loading spinner when database is unavailable'],
    },
    {
      date: '2025-09-18',
      version: '0.119.0',
      changes: ['Added customizable style settings for progress bars and set icons in account page'],
    },
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
      changes: [
        'Added support for nested locations',
        'Added changelog page to track version history -- older history can be seen in GitHub.',
      ],
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
