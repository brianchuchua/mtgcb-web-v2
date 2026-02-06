interface Release {
  date: string;
  version: string;
  changes: string[];
  type?: 'feature' | 'data';
}

interface ChangelogData {
  releases: Release[];
}

const changelogData: ChangelogData = {
  releases: [
    {
      date: '2026-02-05',
      version: '1.15.1',
      changes: ['Fixed set prices not updating when changing the price type on a goal'],
    },
    {
      date: '2026-02-01',
      version: '1.15.0',
      changes: ['Added option to display 1 or 2 cards per row on mobile in grid view settings'],
      type: 'feature',
    },
    {
      date: '2026-01-27',
      version: '1.14.5',
      changes: ['Added Promo Pack: Modern Horizons 3'],
      type: 'data',
    },
    {
      date: '2026-01-27',
      version: '1.14.4',
      changes: ['Updated Promo Pack: Lorwyn Eclipsed'],
      type: 'data',
    },
    {
      date: '2026-01-27',
      version: '1.14.3',
      changes: ['Updated Secret Lair'],
      type: 'data',
    },
    {
      date: '2026-01-21',
      version: '1.14.2',
      changes: [
        'Fixed goals with "Count cards from all sets" enabled incorrectly including cards that were explicitly excluded',
      ],
    },
    {
      date: '2026-01-21',
      version: '1.14.1',
      changes: ['Fixed collection goal calculations when using specific sets and specific cards in the same goal'],
    },
    {
      date: '2026-01-21',
      version: '1.14.0',
      changes: ['Mass Update button now available when viewing a set with a collection goal selected'],
      type: 'feature',
    },
    {
      date: '2026-01-17',
      version: '1.13.24',
      changes: ['Updated Special Guests'],
      type: 'data',
    },
    {
      date: '2026-01-14',
      version: '1.13.23',
      changes: ['Added Lorwyn Eclipsed and related sets'],
      type: 'data',
    },
    {
      date: '2026-01-08',
      version: '1.13.22',
      changes: ['Added missing convention promos'],
      type: 'data',
    },
    {
      date: '2026-01-08',
      version: '1.13.21',
      changes: ['Added Commander 2011 Launch Party promos'],
      type: 'data',
    },
    {
      date: '2026-01-08',
      version: '1.13.20',
      changes: ['Added missing WPN Promos'],
      type: 'data',
    },
    {
      date: '2026-01-08',
      version: '1.13.19',
      changes: ['Added Spider-Man Art Series'],
      type: 'data',
    },
    {
      date: '2026-01-08',
      version: '1.13.18',
      changes: ['Added missing oversized promos to Release Event Promos, Gateway Promos, and WPN Promos'],
      type: 'data',
    },
    {
      date: '2026-01-01',
      version: '1.13.17',
      changes: ['Added missing Unhinged alternate foils'],
      type: 'data',
    },
    {
      date: '2026-01-01',
      version: '1.13.16',
      changes: ['Added missing Oversized cards to Magic Player Rewards'],
      type: 'data',
    },
    {
      date: '2025-12-31',
      version: '1.13.15',
      changes: [
        "Added Theros Hero's Path and Born of the Gods Hero's Path sets",
        'Added missing cards to Battle the Horde, Defeat a God, Face the Hydra, and Open the Helvault sets',
      ],
      type: 'data',
    },
    {
      date: '2025-12-31',
      version: '1.13.14',
      changes: ['Added Tales of Middle-earth Scene Box'],
      type: 'data',
    },
    {
      date: '2025-12-31',
      version: '1.13.13',
      changes: ['Added missing pagination option'],
    },
    {
      date: '2025-12-30',
      version: '1.13.12',
      changes: ['Fixed bug with goals that only included specific cards in them'],
    },
    {
      date: '2025-12-30',
      version: '1.13.11',
      changes: ['Fixed bug with results pagination in some corner cases'],
    },
    {
      date: '2025-12-29',
      version: '1.13.10',
      changes: ['Added missing MicroProse promo to Media Inserts set'],
      type: 'data',
    },
    {
      date: '2025-12-23',
      version: '1.13.9',
      changes: ['Added Oversized 90s Promos and Oversized League Prizes sets', 'Added missing oversized dungeon cards'],
      type: 'data',
    },
    {
      date: '2025-12-23',
      version: '1.13.8',
      changes: ['Added Vanguard set'],
      type: 'data',
    },
    {
      date: '2025-12-23',
      version: '1.13.7',
      changes: ['Added missing Archenemy scheme cards'],
      type: 'data',
    },
    {
      date: '2025-12-23',
      version: '1.13.6',
      changes: ['Added missing oversized commander cards'],
      type: 'data',
    },
    {
      date: '2025-12-23',
      version: '1.13.5',
      changes: ['Added missing thick stock display commanders'],
      type: 'data',
    },
    {
      date: '2025-12-23',
      version: '1.13.4',
      changes: ['Added missing planes for Planechase and Planechase 2012 Edition', 'Added Secret Lair Showcase Planes'],
      type: 'data',
    },
    {
      date: '2025-12-18',
      version: '1.13.3',
      changes: ['Added Avatar Art Series cards'],
      type: 'data',
    },
    {
      date: '2025-12-18',
      version: '1.13.2',
      changes: ['Fixed Price column showing foil prices when Foil column is visible'],
    },
    {
      date: '2025-12-18',
      version: '1.13.1',
      changes: ['Added "How do I create goals?" tutorial to the FAQ page'],
    },
    {
      date: '2025-12-17',
      version: '1.13.0',
      changes: [
        'Added "Hide collection value from others" privacy setting in Account page',
        'When enabled, hides collection value, set values, cost to complete, Value and Cost to Complete table columns, and "Buy missing cards" buttons from public viewers and share link users',
      ],
    },
    {
      date: '2025-12-17',
      version: '1.12.0',
      changes: ['Added separate Foil Price column to card table view with TCGPlayer link support'],
    },
    {
      date: '2025-12-17',
      version: '1.11.0',
      changes: ['Added Roadmap page to track development progress'],
    },
    {
      date: '2025-12-17',
      version: '1.10.0',
      changes: ['Added ability for quantity selectors to multiselect'],
    },
    {
      date: '2025-12-14',
      version: '1.9.13',
      changes: ['Updated Secret Lair Showdown'],
      type: 'data',
    },
    {
      date: '2025-12-14',
      version: '1.9.12',
      changes: ['Updated Media Inserts'],
      type: 'data',
    },
    {
      date: '2025-12-14',
      version: '1.9.11',
      changes: ['Updated Happy Holidays cards'],
      type: 'data',
    },
    {
      date: '2025-12-14',
      version: '1.9.10',
      changes: ['Updated Secret Lair Drop Series'],
      type: 'data',
    },
    {
      date: '2025-12-14',
      version: '1.9.9',
      changes: ['Added Avatar prerelease promos'],
      type: 'data',
    },
    {
      date: '2025-12-14',
      version: '1.9.8',
      changes: ['Added missing Substitute Cards'],
      type: 'data',
    },
    {
      date: '2025-12-13',
      version: '1.9.7',
      changes: ['Added 133 missing Front Face cards', 'Made Front Face card names consistent'],
      type: 'data',
    },
    {
      date: '2025-12-08',
      version: '1.9.6',
      changes: ['Added Chocobo Track Foils to Final Fantasy Variants'],
      type: 'data',
    },
    {
      date: '2025-11-20',
      version: '1.9.5',
      changes: ['Added Art Series cards'],
      type: 'data',
    },
    {
      date: '2025-11-19',
      version: '1.9.4',
      changes: [
        'Added Secret Lair: An Encyclopedia of Magic and its variants',
        'Updated Secret Lair Drop Series',
        'Updated Final Fantasy Commander Variants',
      ],
      type: 'data',
    },
    {
      date: '2025-11-18',
      version: '1.9.3',
      changes: ['Fixed goal descriptions not clearing when user removes all text'],
    },
    {
      date: '2025-11-13',
      version: '1.9.2',
      changes: [
        'Updated over 90,000 cards with latest Scryfall data including oracle text changes',
        'Updated MTG CB Collector Numbers for aggregate sets',
        'Fixed collector number sorting to use proper numerical order instead of alphabetical',
      ],
    },
    {
      date: '2025-11-11',
      version: '1.9.1',
      changes: ['Added Avatar: The Last Airbender and all related subsets'],
      type: 'data',
    },
    {
      date: '2025-11-05',
      version: '1.9.0',
      changes: [
        'Added draft cube variant setting to choose between Standard (4/4/1/1) and Two-Uncommon (4/2/1/1) configurations. You can now select your preferred draft cube style in Account Settings, which affects cost calculations and TCGPlayer purchase recommendations.',
      ],
    },
    {
      date: '2025-11-04',
      version: '1.8.5',
      changes: [
        'Made login, password reset, and account recovery case-insensitive for usernames and emails. (Legacy accounts whose users intentionally relied on case sensitivity for differentiation still work as expected with appropriate casing. There are only 9 of you, but your accounts matter too!)',
      ],
    },
    {
      date: '2025-11-04',
      version: '1.8.4',
      changes: ['Improved performance of searching by card name by 9x'],
    },
    {
      date: '2025-11-03',
      version: '1.8.3',
      changes: ['Fixed cost to complete showing $0.00 in table view when viewing goals'],
    },
    {
      date: '2025-11-01',
      version: '1.8.2',
      changes: [
        'Fixed card images and names to support right-click and open in new tabs',
        'Fixed Jump to Set menu options to support right-click and modifier keys',
        'Fixed card price menu to navigate to collection pages when in collection context',
      ],
    },
    {
      date: '2025-11-01',
      version: '1.8.1',
      changes: ['Improved reliability of updating card quantities on slower connections'],
    },
    {
      date: '2025-10-31',
      version: '1.8.0',
      changes: ['Added Collection History page showing your last 100 collection updates'],
    },
    {
      date: '2025-10-30',
      version: '1.7.1',
      changes: ["Added Marvel's Spider-Man Prerelease Promos", 'Updated Secret Lair Drop Series'],
      type: 'data',
    },
    {
      date: '2025-10-29',
      version: '1.7.0',
      changes: ['Added ability to assign cards to locations directly from the Add or Remove Cards page'],
    },
    {
      date: '2025-10-29',
      version: '1.6.2',
      changes: ['Added ability to override foil restrictions when assigning cards to locations'],
    },
    {
      date: '2025-10-29',
      version: '1.6.1',
      changes: ['Fixed performance issue when updating card locations in bulk in set mode'],
    },
    {
      date: '2025-10-29',
      version: '1.6.0',
      changes: ['Added location value display showing the total value of cards stored at each location'],
    },
    {
      date: '2025-10-28',
      version: '1.5.1',
      changes: [
        'Fixed an issue where cards sorted by release date in goals would sometimes appear in unexpected positions',
      ],
    },
    {
      date: '2025-10-28',
      version: '1.5.0',
      changes: ['Added optional labeled navigation arrows for set pages in Classic Settings'],
    },
    {
      date: '2025-10-28',
      version: '1.4.2',
      changes: ['Improved accuracy of Buy missing cards purchase recommendations'],
    },
    {
      date: '2025-10-24',
      version: '1.4.1',
      changes: ['Added quick ownership filter to easily show only owned cards or missing cards in your collection'],
    },
    {
      date: '2025-10-24',
      version: '1.4.0',
      changes: [
        'Added table export feature - copy table data to clipboard or download as CSV from any card or set table',
      ],
    },
    {
      date: '2025-10-23',
      version: '1.3.4',
      changes: [
        'Added ability to override disabled quantity fields on Add or Remove Cards page - click disabled fields to enable editing when card data is incorrect',
        'Improved Add or Remove Cards page to automatically default to foil quantity when card is foil-only',
      ],
    },
    {
      date: '2025-10-21',
      version: '1.3.3',
      changes: [
        'Added quick sort controls to pagination area - sort options were previously only at the bottom of the sidebar, now also available in the center of the page for easier access',
      ],
    },
    {
      date: '2025-10-21',
      version: '1.3.2',
      changes: [
        'Fixed collection-specific search filters appearing when browsing without a collection context',
        'Fixed search description text incorrectly showing goal and location information outside of collection pages',
        'Fixed sort dropdown showing invalid values when switching from collection to browse pages',
        'Fixed an inconsistency with remembering which view (Cards/Sets) was last used in collection vs. browse contexts',
      ],
    },
    {
      date: '2025-10-21',
      version: '1.3.1',
      changes: ['Fixed search filters persisting between different user accounts when logging in or out'],
    },
    {
      date: '2025-10-20',
      version: '1.3.0',
      changes: [
        'Added Classic Settings section with Red/Green Table Rows option - table rows now color based on card quantity (red for none, bright green for 1-3, dark green for 4+)',
        'Improved card preview in tables to only appear when hovering over card names, not entire cells',
        'Card preview now appears below text and intelligently positions above when near bottom of screen',
        'Fixed Custom CSV card imports that would fail in certain cases',
      ],
    },
    {
      date: '2025-10-20',
      version: '1.2.2',
      changes: ['Fixed settings menus to scroll properly on small screens instead of extending beyond the viewport'],
    },
    {
      date: '2025-10-20',
      version: '1.2.1',
      changes: [
        'Changed Quick Search and Jump to Set to clear old filters and provide clean search results -- this just feels better for the quick action buttons at the top of the page. If you like the sticky behavior, just browse sets normally and your form will still remember the current search until you reset it.',
      ],
    },
    {
      date: '2025-10-20',
      version: '1.2.0',
      changes: [
        'Added optional quick access icon in header for Add or Remove Cards page (disabled by default, enable in Account Settings)',
      ],
    },
    {
      date: '2025-10-20',
      version: '1.1.1',
      changes: ['Fixed a rare race condition when managing your collection in table view on slower connections'],
    },
    {
      date: '2025-10-19',
      version: '1.1.0',
      changes: ['Added Quick Search button in header for fast card name searches from anywhere in the app'],
    },
    {
      date: '2025-10-18',
      version: '1.0.4',
      changes: ['Improved empty search results display with helpful message and reset button'],
    },
    {
      date: '2025-10-18',
      version: '1.0.3',
      changes: [
        'Fixed preferences to persist across browser sessions - your Cards/Sets view toggle, sort options, hide duplicate printings, and subset display settings now remember your choices even after closing the browser',
        'Search filters (name, colors, types, sets, etc.) continue to persist until you close the browser tab, allowing you to refresh the page or browse sets without losing your search',
        'Reset Search button now clears search filters while preserving your preferred view settings',
        'Moved Add or Remove Cards to the main navigation menu for easier access',
      ],
    },
    {
      date: '2025-10-15',
      version: '1.0.2',
      changes: ['Fixed Jump to Set menu not working correctly when used from the Add or Remove Cards page'],
    },
    {
      date: '2025-10-15',
      version: '1.0.1',
      changes: [
        'Improved Add or Remove Cards page by moving form controls above the card image for easier access',
        'Added helpful notes to login and password recovery forms clarifying that usernames, emails, and passwords are case-sensitive',
        'Improved Jump to Set menu to prioritize main sets over variant and subset releases in search results',
      ],
    },
    {
      date: '2025-10-15',
      version: '1.0.0',
      changes: [
        'Officially released the new MTG CB! 🎉',
        'Special thanks to my Patrons for helping with testing and feedback during the beta.',
      ],
    },
    {
      date: '2025-10-14',
      version: '0.147.6',
      changes: [
        "Added info icons to Quick Win cards on home page explaining that results only show sets you've started collecting",
        'Fixed home statistics to refresh automatically when collection is updated',
      ],
    },
    {
      date: '2025-10-14',
      version: '0.147.5',
      changes: ['Improved accuracy of goal cost to complete calculations in some corner cases'],
    },
    {
      date: '2025-10-13',
      version: '0.147.4',
      changes: ['Fixed stale goal information briefly appearing when navigating between different collection goals'],
    },
    {
      date: '2025-10-13',
      version: '0.147.3',
      changes: ['Fixed loading issue on goals page on first load'],
    },
    {
      date: '2025-10-09',
      version: '0.147.2',
      changes: [
        'Simplified import results display to show only total, successful, and failed row counts',
        'Fixed home page statistics to refresh automatically after importing collections',
      ],
    },
    {
      date: '2025-10-08',
      version: '0.147.1',
      changes: [
        'Added button to proceed with real import after completing a dry run preview',
        'Fixed import errors that could occur with certain file formats',
      ],
    },
    {
      date: '2025-10-07',
      version: '0.147.0',
      changes: [
        'Added ability to override finish restrictions when card data is incorrect - click disabled foil/non-foil quantity fields to enable editing if you have cards in that finish',
      ],
    },
    {
      date: '2025-10-07',
      version: '0.146.1',
      changes: [
        'Improved dropdown styling consistency across autocomplete components',
        'Improved mobile layout for account settings page with better spacing',
        'Improved mobile layout for Patreon section buttons',
        'Updated Join Patreon button to use Patreon brand colors',
      ],
    },
    {
      date: '2025-10-07',
      version: '0.146.0',
      changes: [
        'Added card layout filter to browse page and goals - search by layout types like split, transform, adventure, and more',
        'Added visual checkmark to included filter options for better clarity',
      ],
    },
    {
      date: '2025-10-07',
      version: '0.145.0',
      changes: [
        'Current and past Mythic Rare Patreon supporters can now create custom cards with any Magic card art and color frame to represent themselves on the Patrons page',
      ],
    },
    {
      date: '2025-10-06',
      version: '0.144.0',
      changes: [
        'Added Patreon integration - link your Patreon account in account settings',
        'Added new Patrons page showing supporter tiers and public supporters list',
        'Supporters can choose to display their name publicly on the Patrons page',
      ],
    },
    {
      date: '2025-10-05',
      version: '0.143.3',
      changes: [
        'Goals now cache for 60 seconds in the main goals page (you can always hard-refresh to force a reload)',
      ],
    },
    {
      date: '2025-10-05',
      version: '0.143.2',
      changes: ['Added character limits to all form inputs to prevent exceeding API limits'],
    },
    {
      date: '2025-10-05',
      version: '0.143.1',
      changes: ['Fixed table view scroll performance when viewing collections with goals selected'],
    },
    {
      date: '2025-10-05',
      version: '0.143.0',
      changes: [
        'Added mass update feature to collection search pages for bulk quantity changes by rarity -- was previously only in the set page',
        'Moved mass edit buttons for quantities and locations to a new sub-menu',
      ],
    },
    {
      date: '2025-10-05',
      version: '0.142.1',
      changes: ['Fixed info icons to use click instead of hover for better mobile support'],
    },
    {
      date: '2025-10-05',
      version: '0.142.0',
      changes: [
        'Added instant goal loading with smart caching - goals now load immediately from cache while refreshing in background, prioritizing uncached goals first',
      ],
    },
    {
      date: '2025-10-02',
      version: '0.141.1',
      changes: ['Fixed import page state not clearing when switching between formats or uploading different files'],
    },
    {
      date: '2025-10-02',
      version: '0.141.0',
      changes: ['Added guidance for foil column values in custom CSV import'],
    },
    {
      date: '2025-10-02',
      version: '0.140.0',
      changes: ['Added chunked import with progress bar to prevent timeouts on large collections'],
    },
    {
      date: '2025-10-02',
      version: '0.139.2',
      changes: ['Fixed foil-only prices not being clickable like other prices'],
    },
    {
      date: '2025-10-01',
      version: '0.139.1',
      changes: ['Fixed goal contributions popup to only show relevant finish types in table view'],
    },
    {
      date: '2025-10-01',
      version: '0.139.0',
      changes: ['Added option to count cards from all sets when using a goal for collecting cards from specific sets'],
    },
    {
      date: '2025-09-30',
      version: '0.138.0',
      changes: [
        'Fixed dates displaying incorrectly for users in different timezones',
        'Added automatic whitespace trimming to all form text inputs',
      ],
    },
    {
      date: '2025-09-30',
      version: '0.137.0',
      changes: ['Added closest normal set to statistics on home page'],
    },
    {
      date: '2025-09-29',
      version: '0.136.0',
      changes: [
        'Added flexible finishes option for goals that need both regular and foil cards',
        'Improved purchase flow for goals by fixing chunking logic and showing card counts',
      ],
    },
    {
      date: '2025-09-29',
      version: '0.135.1',
      changes: ['Fixed goal purchase button to correctly show cards when only foils are needed'],
    },
    {
      date: '2025-09-28',
      version: '0.135.0',
      changes: ['Added ability to mass edit card locations from search results'],
    },
    {
      date: '2025-09-27',
      version: '0.134.1',
      changes: [
        'Improved spacing between mana symbols on card detail pages for better readability',
        'Extended home page backgrounds to full viewport width for better visual impact',
        'Added Reserved List indicator with info tooltip on card detail pages',
      ],
    },
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
