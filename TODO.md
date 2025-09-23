# TODOs

I've found over time that maintaining my action items for code in external tools is overkill and burdensome.

Best to keep them in the codebase, especially since I'm a team of one.

Currently, I am either knocking out items in this list or moving them to TODO-organized.md, which will eventually replace this file.

## Real Current Action Items

- i think price update jobs frequently don't finish, need to check logs -- i see, dyno restart, i need these things to auto-start on bootup, account for this, ensuring only one job of a type runs at a time, etc
- I want a test suite of every goal type and filtering option that Claude runs through or mayne just a custom node script runs against test env or local creates and deletes goals
- importer needs to be ready for v3 -- still want a spreadsheet, edit, import workflow, token workflow, subset handling, it's close to some of this, ideally one-button click to push to prod what's in local
- considering: "Complete this set" buttons don't make sense with goals -- like complete this subgoal maybe? buy missing cards in other contexts? rename and consider.
- Need these equivalent buttons on the set pages too.
- Buy on TCGPlayer should be near the top above the fold on mobile
- Scroll to top mobile after adding card looks blank
- audit the goal url preview for centering and check performance, still works after refactor?
- test card url preview with long card and set names
- subset data clean-up has to be the next phase of mtg cb, data fixes, 100% parity and accuracy with English cards and adding art series cards, image quality fixes, collector number fixes, Ae/apostrophe fixes, whitespace trimming, etc, release date/set sorting issues, etc
- release date sort?
- image quality audit, need to use scryfall's system of labeling bad images, etc.
- maybe clearly label cards that aren't legal for play?
- major data issue: audit show subsets and subset data, probably need to check parentSetId that aren't assigned yet -- i think there's subset technical debt with the data
- repeat perf tests for both types of major goals, worried about some maybe doing in-memory work check the cheap normal cards goal <-- <-- do the home stuff below too
- add a note in the locations section saying not to use it for everything, like individual set binders, busywork
- make patrons page, perhaps renamed to support the site, which lists why, and then lists supporters at different tiers, consider privacy

- Knocking out all small action items in this file that are needed for release
- (or moving them to organized future todos if they're not needed for release)

-pie chart color distribution color pie i want this, multicolor pie "your color pie"

- ux: consider a change to header styles for collection headers similar to the home page
- ux: info icon not aligned well next to prices, behaves differently than the info icon for goals, probably needs negative margin
- ux: one printing of each unique card / every printing of each unique card is confusing when the quantity is more than one (goals page)

- big: need to audit buy missing cards for goal buttons, macro scale and set scale -- can't just click it for a goal with 30000 cards. can't do the prefetching for like an hour and then pop up the modal, need to be smarter and break it into chunks ahead of time. buy missing cards for this goal -- should just not have this button if it's a large number of cards, see basic land goals
  -- related ux: goal header inside of a set page needs ux work -- buy button is awkward near progress bar
- considering: when viewing sets with a collection goal on, should add a note that the total cards are those actually collected in the set, maybe
  Mention somewhere that the cheapest available printing is shown for collection goals

  cost to complete for goal doesn't really line up with the card that is rendered -- and sending the most expensive card to tcgplayer to buy can hurt the user. <-- See https://mtgcb-web-v2.mtgcollectionbuilder.com/collections/1337?cardsSortBy=market&oneResultPerCardName=true&goalId=1&showGoals=incomplete&contentType=cards, should perhaps always show the cheapest
  Maybe (Need 1 or regular) should say "of any printing" contextually

maybe instead of a pop-up when cards are updated, status updating in the labe ⚠ Cross origin request detected from local.mtgcb.com to /\_next/\* resource. In a future major version of Next.js, you will need to explicitly configure "allowedDevOrigins" in next.config to allow this.
Read more: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins

## Recent Actions

mtgcb-jobs app is done and tested locally, don't want to swamp tcgplayer, so won't deploy or run it until after go-live so i don't have the legacy and new updater going at the same time

## Current Action Items (kinda disorganized now)

Mostly ready:

Now:

## Remaining Major Feature Work Before 1.0

### MTG CB Data Importer

- Needs to work for MTG CB v3 flawlessly

### Patron Support Page 🔁

- A page thanking patrons for their support, listing them, and showing the benefits they get. Maybe a link to a Discord channel for patrons.
- A supporter badge of some sort would be great.
- Detecting if someone is a patron and linking their accounts.

### Patron Perks 🔁

- Definitely want that card customizer for their listing in the Reserved List.
- Weather effects? Custom themes?
- What other additional cosmetics?
- Direct contact on Discord and voting on features
- roadmap page showing patrons voted on stuff
- Based on a funny conversation we had, extreme progress bar styles, see Discord

### Home Page (Partially complete)

- Some of the below has been done, but will be revisited as I complete other connected sections.
- Need to mention Patreon and voting on future features

### Migration Path 🔁

- need to clean up out of date schemas and generate the final database locally
- need to make sure createdAt is ported over from legacy field

### Performance 🔁

- Index audit and API measurement

## Other Action Items Before Launch

### Organizational

- Prioritize, organize, and cull TODOs in this document
- More social media presence and clean-up
- Podcast?

### Importers and Exporters

- Audit all export fields to ensure they actually get exported, like multiverseId in Archidekt

### UX

- Consistent header, body, and breadcrumb styles
- Consistent error and info message styles
- Clearly label collection values as estimates
- Home page looks bad on tablet -- tablet may want to hide the sidenav by default maybe

### Before Open-Sourcing

- remove dangerous claude code permissions from my repos since i wouldn't want other devs to be surprised by claude code having full bash powers

### Uncategorized

- info icon next to collection value, estimate, tcgplayer data, etc. showing when prices last updated, number of cards missing price data
- Audit default values of card fields, set fields, and everything else on the page, for grid and table views. Some may have changed since a refactor.
- numberOfCardsInMagic in API coming back isn't always right, see http://local.mtgcb.com:3000/collections/1337/surprise-slivers?goalId=16&includeSets=1056
- Setting to change going mythic to plain green progress bars
- Remove deprecated collection summary api call, since it's folded into browse sets now, remove from postman and update postman too
- Remove deprecated collection cards api call as well, since it's folded into browse cards now, remove from postman and update postman too
- audit all api calls, how they're used, and their payloads, then revise and document, some locations ones and collections ones may be unused
- Support searching by collector number and collector number ranges
- Handle canBeNonFoil and canBeFoil after verifying my importer is good with this data -- in collection pages and edit cards page
- Missing data detector and clean-up for every card and set field in the database (pureName for example)
- Showing 2501-3000 of 92769 cards goes to two lines on desktop
- Performance pass, some API calls have gotten a little worse I think
- Performance benchmark scripts and documentation
- Shopping lists -- reports based on collection goals
- TCGPlayer supports adding a collector number after the set code -- needed for things like secret lair that have duplicate names 🔁
- Allow selection of default collection goal
- Data import clean-up / new mtgcb-importer section for new app (including bad data detector)
- Home page (landing page or statistics dashboard depending on login state, perhaps most valuable card can live here)
- Feature parity audit (permalink)
- Most valuable card collected, maybe in the set header
- Audit input field lengths for all API calls
- Statistics -- think a pie chart icon that you click and it switches to viewing stats, including most valuable card -- on both the main page and in set pages 🔁
- Brainstorm patron cosmetic perks

## UX Action Items

- weird flicker with specific cards to include or exclude in goal forms
- Audit subsets with collection goals -- data and appearance.
- Goals should have a computation loading state, especially in the header
- Link to collection needs to be consistent. Underlined or not, which parts, etc.
- Improve height of skeleton loader for collectionheader
- Header and breadcrumb and form and alignment consistency
- Position of created date when hovering edited date on goals page is weird
- Audit style of info messages and errors
- Set icons for token subsets
- Hide duplicate printings -- should show in the card view how many printings are hidden, and maybe a link to show them
- Hide duplicate printings has an interesting interaction with tokens -- an Elemental token can be a x/x or a 1/1 or what-have-you, but the current logic is to remove duplicates based on a pure card name. This doesn't work for tokens.
- Evaluate default sort order on a set page, especially subset groups
- Render "Subset" instead of Set and Subset Group instead of Set where relevant.
- Consider an easier-to-use card quantity filter, add stat filter works, but users may be used to the easier one (I did this in the legacy new page)
- Consider moving price type selection to the browsesearchform
- The pop-up messages are too sticky, feels like mouse movement is involved
- Header consistency
- Make set symbols change color on set table and set page too
- Add link from child set to parent set
- Add title tags to all set and card links
- Audit API failure rendering in every page
- Confirm functionality of back and forward browser buttons
- On hover contextual stuff, like increasing quantity or removing a card, or visiting the card page, or buying on tcgplayer
- See if I can prevent the entire card grid from reloading when the price type is changed
- Add skeleton loader for collection header to prevent vertical shift when loading (audit set header too)
- Audit table field orders and their corresponding visibility filters
- OpenGraph meta tags for social previews
- Consider alternate-mobile-filter.png as a design idea (search bar at the top, Filters button that opens a menu with filters)
- 1 cards instead of 1 card
- enhancement -- when a person goes to buy the cards, have the site offer to record the cards right there
- what good are breadcrumbs actually doing on the browse page? like home > browse, the home page is useless
- See if still happening: On mobile, the hover over card name is doing the whole row, not just the card name
- Alternating table row colors, I feel like the bright ones are too bright
- UX - Make the tab indexes only go to the quantity fields
- Maybe: Improve rendering of reg and foil quantity when not logged in grid view
- UX - Why do the pop-ups not dismiss if the screen isn't active?
- Consider breadcrumbs for collection pages, maybe just the subpages since the main collection page is the root
- Improve card quantity update messages
- Open Search Options -- should probably scroll to the search options section
- Breadcrumbs in collection set view
- search needs to clear when entering a set page
- Remove "Showing" from "Showing 1-24 of blah cards" at 1024x768 or smaller
- (A subset of link) in the header for subsets -- or actually do breadcrumbs
- Make default number of cards per page a multiple of 5 and 4.
- Header consistency on pages, make a shared component for text headers -- centered vs not, Goals vs Add/Remove Cards for example.
- Money value consistency -- success and warning colors
- A cool stats page, icon can be a graph, most valuable card can move there -- can make an expandable region in a set view too. How much of each color selected, etc. Check what MTG Arena and other tools do. Some easy wins. Most common creature type, most valuable card, etc. 🔁
- When any prices are missing, add an info icon explaining it's an underestimate
- Improve loading experience for mouse over images, spinner shows too much, maybe better to show nothing until the image is loaded
- When multiple copies of a card exists, but they only want to see one per card name, make it clear that there are options -- API can return all of them, or enough of their data for the front-end to do something smart, I've seen access while debugging other issues
- Add a note to Cost to complete that it's based on the cheapest printing of a card, which may differ from the one being shown.
- Inconsistent h1 styles (set page, goal vs non-goal context)
- error state of quantity selectors not affecting button properly in goal editing or creation form
- improve loading states, http://local.mtgcb.com:3000/collections/1337?goalId=14&oneResultPerCardName=true&contentType=cards and switch to "all except alpha" goal -- the transition is jarring
- improve rendering of quantities of another person's collection, maybe just hide left/right buttons and disable, still need to show bad data indicators
- detect old card images, track when they were updated and their quality, scryfall has a value for this too

## Bugs

- Moderate: Draft cube calculation when track subsets with sets in on is wrong, shows a money value, but the correct answer is still "you have all the cards", see khans of tarkir -- it's incorrectly counting non main set cards as missing just in terms of the value
- See if still present: Page count is not being respected if it starts in the url (do this bug later, refactor and merge first after verifying functionality)
- Matching cards by their pure name for collection goals doesn't work well with tokens, because they have the same name but are physically distinct in terms of type lines and power and toughness and color identity

## Tech Debt

### Uncategorized

- CardBrowseClient is a mess and is using deprecated Grid
- Find deprecated uses of PaperProps and Grid
- Every file needs to follow the code style I established in SetItemRenderer.tsx and browse/page.tsx 🔁
- Minor: prefetch leads to page 2 being loaded when a user invalidates the collection tag, it's a prefetch subscription issue in RTK Query, dev team is aware, no current fix, just bad workarounds, page one still loads on visit, so it's fine
- Consider removing skeleton loaders from set gallery and experiment with masonry instead of virtuoso
- I think my Scryfall images are PNGs but have the JPG extension? Super old tech debt from early alpha days.
- Audit consistency of naming of fields returned by API for totalCount and values.
- Need a full postman library of my API calls, these should live with api docs
- Need a fallback if both canBeFoil and canBeNonFoil are false, treat them both as true probably
- CI/CD pipeline
- Rate limiting for API calls

### Collector number sorting

The collectorNumberNumeric field is parsing these special format collector
numbers by removing the prefix and keeping just the numeric part:

- "2025-10" → 202510 (concatenated)
- "A25-223" → 25223 (removed 'A', concatenated)
- "J22-803" → 22803 (removed 'J', concatenated)

This creates an incorrect sort order because:

1. "2025-10" becomes 202510 which is much larger than the others
2. The letter prefixes are stripped, losing important information

The sorting IS working correctly based on the numeric values stored, but the parsing logic that creates
collectorNumberNumeric doesn't handle these hyphenated collector numbers properly. It's treating "2025-10" as a
single number 202510 instead of understanding it's a set prefix and number.

This isn't really a sorting bug - it's working as designed. The issue is how hyphenated collector numbers are
converted to numeric values. These special List (PLIST) cards have collector numbers that reference their original
set and number, and the current parsing concatenates them into a single number which doesn't sort meaningfully.

## Future Features

- Art Series cards 🔁
- Deck Completion / Deck Building (I started on this and this feature can go very deep)
- Foreign Cards (although English support must include all cards never printed in English, etc.)
- Sealed product support
- Button to report missing card data, notify user if link to scryfall or tcgplayer is missing
- Financial history tracking, collection value history, etc.
- Card comments and rating by format
- Patron request: Scryfall syntax support for searches
- A dedicated statistics section with even more statistics 🔁
- Card scanning -- I have a rough prototype
- Collection value tracking over time (this can be super deep, increase of individual values over time vs increase of adding cards to collection, tracking purchase prices and profits, etc.)
- Card ratings and comments
- Fluff: A set icon game where set icons fall toward the bottom of the screen and you have to shoot them by typing the set name, give hints as they get closer to the bottom

## Roadmap

- Release: v1.0 to production
- Data Fixes: Add all missing cards (art series too) and clean up existing data and subsets and set codes
- Have Patrons vote on the next one

## Future Enhancements to Existing Features

### Price Updater

- Auto-fix missing tcgplayerIds from scryfall data
- Properly report the 404s for the cancelled cards like Crusade

### Search

- Saving searches

### Locations

- Allowing backups, import and export of locations

### Collection Goals

- Sharing and duplicating collection goals
- "Save this search as a collection goal"

### Performance

- Perhaps don't include location data in searches when the user has no locations, may need a preflight check for this

### Data Improvements

- The Great Double-Sided Token Mess™
- Auditing for and preventing duplicate releasedAt dates in sets
- canBeFoil and canBeNonFoil data cleanup and interaction with etched foils, see Mountain (674) from Secret Lair and compare to tcgplayer data -- see also Culling the Weak and rainbow foils
- Subset data automation and clean-up (basically audit subset groups that have cards in them directly and sets that should be subsets)

### Testing

- End-to-end tests for every user action in the test environment

### Deployment

- update NEXT_PUBLIC_LOCAL_API_BASE_URL to the production URL

### Post Production

- Decomission v2 apps and database
- Decomission v1 apps and database

## Maybes

- Showing number of cards in excess of a goal
- Showing goal criteria in the collection header
- Allowing editing of card locations in edit cards page
- Mass updating of card locations

## Things To Check On

- UX: Verify that every search tool trims whitespace
- API: Any chance I run out of ids for collection entries?
- RTK Query: Compare configuration in legacy app to the new one, especially in terms of caching and invalidation
- fastify multipart for uploads

## Production Checklist

- evaluate cost to complete cache and price updating
- grok SSL Certificates on the Heroku side vs Dreamhost vs Cloudflare
- Ping johnny on Discord once card locations are released. :)
- Grok database backups in new system
- Integration with Sonarcloud (open source the repo, make development easy for new devs)
- Integration with Google Analytics (right before production launch, using the same account as the legacy site) 🔁
- Need a temporary downtime page for the home page (database maintenance, etc.)
- Load testing - look into npx autocannon
- Performance testing / index audit 🔁
- Automated database backups - see https://devcenter.heroku.com/articles/heroku-postgres-backups
- Dogfooding and UX testing
- UX - Must test rendering of input fields on native devices
- Verify parameter edge cases, minimums and maximums
- Audit field length limits
- Adequate feature testing
- Data cleanup for tcgplayer names and codes and tcgplayer ids
- audit USE_OPTIMIZED_GOAL_PROGRESS

## Nice to Have

- A "money draft" tool to help users during a draft
- A YouTube channel for the site, including transitioning collectors to limited players -- it's the best way to collect.
- Consulting with a UX designer -- while Material UI looks nice, IhavenoideawhatIamdoing
- Mana symbol confetti

## Data Decisions

- Tokens count as part of a set if they're promotional in nature

# TODOs from the README.md file

## Now

### Next

## Later

- Reduce image file size.
- update rarityNumeric to have special be 6 instead of 1 in production `update "Card" set "rarityNumeric" = 6 where "rarityNumeric" = 1;`
- Clean up BrowseSearchForm into smaller components
- Add ability to save searches (even independently of collection goals, a saved searches section)
- Allow sorting by set names alphabetically in card view
- Table exporting to CSV
- Subset data may need to be cleaned up.

## Known Bugs

- Minor: When logging out of a page that requires authentication, redirectTo is set to the page you were on during logout.
- Minor: Mana doesn't render properly in table view for Kozilek, Compleated

## UX Thoughts

- Ensure the add/remove buttons are very large and easy to press on tablets and mobile
- Subsetgroups are confusing to users. Probably just hide this.
- Allow user to tap a card row to add that card to their collection in table view
- Some users would like result numbers listed, to help binder placement
- Some users express that when selecting a number input, they want the entire number highlighted so it's easy to replace
- Make a button on mobile to open filters side menu
- Need to search by flavorName too
- Evaluate if custom image sizes cause performance issues that can be avoided

## Patron Requests

- Basic deck completion -- paste in a deck list and get a report/buy button for missing cards.
