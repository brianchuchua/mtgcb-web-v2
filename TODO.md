# TODOs

I've found over time that maintaining my action items for code in external tools is overkill and burdensome.

Best to keep them in the codebase, especially since I'm a team of one.

Currently, I am either knocking out items in this list or moving them to TODO-organized.md, which will eventually replace this file.

## Real Current Action Items

- Remove "Showing" from "Showing 1-24 of blah cards" at 1024x768 or smaller -- actually the entire rendering sucks at this resolution, fix it

- considering: "Complete this set" buttons don't make sense with goals -- like complete this subgoal maybe? buy missing cards in other contexts? rename and consider.
- Need these equivalent buttons on the set pages too.
- subset data clean-up has to be the next phase of mtg cb, data fixes, 100% parity and accuracy with English cards and adding art series cards, image quality fixes, collector number fixes, Ae/apostrophe fixes, whitespace trimming, etc, release date/set sorting issues, etc
- major data issue: audit show subsets and subset data, probably need to check parentSetId that aren't assigned yet -- i think there's subset technical debt with the data

- big: need to audit buy missing cards for goal buttons, macro scale and set scale -- can't just click it for a goal with 30000 cards. can't do the prefetching for like an hour and then pop up the modal, need to be smarter and break it into chunks ahead of time. buy missing cards for this goal -- should just not have this button if it's a large number of cards, see basic land goals
  -- related ux: goal header inside of a set page needs ux work -- buy button is awkward near progress bar

## Remaining Major Feature Work Before 1.0

### Patron Support Page 🔁

- A page thanking patrons for their support, listing them, and showing the benefits they get. Maybe a link to a Discord channel for patrons.
- A supporter badge of some sort would be great.
- Detecting if someone is a patron and linking their accounts.

### Migration Path 🔁

- need to make sure createdAt is ported over from legacy field

## Other Action Items Before Launch

### Importers and Exporters

- Audit all export fields to ensure they actually get exported, like multiverseId in Archidekt

### Uncategorized

- Audit default values of card fields, set fields, and everything else on the page, for grid and table views. Some may have changed since a refactor.
- Handle canBeNonFoil and canBeFoil after verifying my importer is good with this data -- in collection pages and edit cards page

## UX Action Items

- set column in table needs to be wider on mobile
- Audit subsets with collection goals -- data and appearance.
- Improve card quantity update messages
- search needs to clear when entering a set page
- When multiple copies of a card exists, but they only want to see one per card name, make it clear that there are options -- API can return all of them, or enough of their data for the front-end to do something smart, I've seen access while debugging other issues

## Tech Debt

### Uncategorized

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
- Collection value tracking over time (this can be super deep, increase of individual values over time vs increase of adding cards to collection, tracking purchase prices and profits, etc.)
- Card ratings and comments
- Fluff: A set icon game where set icons fall toward the bottom of the screen and you have to shoot them by typing the set name, give hints as they get closer to the bottom

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
- Evaluate if custom image sizes cause performance issues that can be avoided

## Patron Requests

- Basic deck completion -- paste in a deck list and get a report/buy button for missing cards.
