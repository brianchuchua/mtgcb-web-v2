# TODO

I've found over time that maintaining my action items for code in external tools is overkill and burdensome.

Best to keep them in the codebase, especially since I'm a team of one.

## Roadmap

- [ ] Prepare last items for v1.0 Release
- [ ] v1.0 Release
- [ ] Data Cleanup Project (and weekly tech debt days)
- [ ] I get feedback from the MTG CB community and Patrons vote on the next feature candidates and I make a selection

## 🔄 In Progress

### Currently Looking At or Working On or Just Noticed

-- once the testing framework is solid, let's refactor and unify the goal code under /cards/search, /sets/search, and /goals

- goal setid format doesn't render in the front-end unless it's in the or array, have claude compare these
- goals with inclusions and exclusions may not work, for setIds
- include format name in export - maybe username too
- look into possible cors issue -- looks like a timeout/perf issue, need to check my importers and exporters carefully
  -- perf test this flexible finish stuff once done, repeat load tests in general for goals, including a flexible printing goal as a new case, do this on tuesday before working on anything else

### Blocked/Waiting

## 🚨 Critical / Blocking Issues

- Need another sql.raw audit, there's a document of the last one
- Important: Audit input field lengths for all API calls and make front-end enforce them too

### Migration

- Need a message for migration downtime in v2 as well -- and a plan to put this app into maintenance mode
- Test migration end-to-end one more time
- Add a migration verification script to mtgcb-importer that checks user counts and collection counts match between old and new databases, accounting for those removed due to a 0 quantity count or for cards or users that no longer exist, locally of course

### mtgcb-importer

- importer needs to be ready for v3 -- still want a spreadsheet, edit, import workflow, token workflow, subset handling, it's close to some of this, ideally one-button click to push to prod what's in local -- or generate the sql for me to inspect and execute, test this with some missing cards and sets

### mtgcb-jobs

- Enable jobs on restart and make them resilient to heroku dyno restarts - database table to track progress of jobs?

### Performance Issues

## 📋 Pre-Release Required

### Testing

- Top-down testing of every page and feature
- Audit all export fields to ensure they actually get exported, like multiverseId in Archidekt

### Scaling

- Scale API and Web to two dynos (mostly for rolling restarts)

### Sonarqube

- Integrate Sonarqube and fix all critical issues

### Patron Features / Patreon Integration

- A page thanking patrons for their support, listing them (anonymous by default), and showing the benefits they get. Maybe a link to a Discord channel for patrons.
- A supporter badge of some sort would be great.
- Detecting if someone is a patron and linking their accounts.
- I think they should get a confetti button. On-demand confetti. I kinda want one.

#### The Reserved List

- Immortal/Reserved List tier patrons will get the ability to customize a card to represent their collection in a hall of fame.
- Other Patrons will be listed in a Hall of Fame just as usernames -- private by default, controlled with a setting
- Mention Patreon on the home page and wherever else is appropriate
- Mention that patrons get to vote on future features
- Make patrons page, perhaps renamed to support the site, which lists why, and then lists supporters at different tiers, consider privacy

### Podcast

- At least link to the old ones, I'll probably start it back up after release

## 🚀 Release Checklist

### Migration Steps

### Infrastructure

### Monitoring & Analytics

### Communication

- Ping johnny on Discord once card locations are released. :)
- Announce on social media and discord
- Announce to patrons

## 📦 Post-Release

### Bug Reports

- Discord: When switching to viewing 400 cards at once, it crashed their Firefox browser.
- Discord: Share links didn't work until they were recreated, possible sync issue.

### Communication

- Start up the podcast again
- YouTube channel? Draft streaming as a way to encourage collectors to transition to limited players?

### Project: Data Cleanup

- After release, adding all remaining missing cards and fixing data issues, including:
- Adding Art Series cards
- Need to add cardFaces data and come up with a plan to render the backside of cards
- Sorting of collectorNumberNumeric when the original collector number is like "A25-223"
- canBeFoil and canBeNonFoil data cleanup and interaction with etched foils, see Mountain (674) from Secret Lair and compare to tcgplayer data -- see also Culling the Weak and rainbow foils
- Ae/apostrophe fixes, etc

#### Subset Splitting

- Needs to be done as before. Audit current and any missing from the established pattern (basically audit subset groups that have cards in them directly and sets that should be subsets)

#### MTG CB Collector Number

- Clean up MTG CB collector number -- it's really just a card release date order / wubrg / alphabetical (for tokens) tiebreaker in many contexts. Its intent is to help sorting in a binder where a collector number is not available or unhelpful, especially for subset groups, like sorting every FNM promo that ever existed in order of release date. Also add this number to the FAQ. Make collector number canonically what was printed (or not printed) on the card if I can. Scryfall may muddy this data.

#### Old Images Update

- Scryfall has a field to track if card images are good. I know I have some early images from their initial scans where I haven't updated them since. Add a field to track this myself and clean them all up.

#### Prices

- Address as many cards missing a tcgplayerId as possible

#### Token Set Icons

- Tokens have set codes that start with a T and thus don't get the correct set icon from keyrune.

### Feature Enhancements

#### Artist Enhancements

- Link artist name in table view to search for that artist

#### Card Format Legality

- Would be nice to warn users if cards aren't tournament legal, even though this is a collecting site and not a deckbuilding site.
- Would also be nice to just show format legality while I'm at it -- and do allow filtering by it. I will have to stay on top of changes as they happen however, so mtgcb-jobs will need to be on top of this, detecting changes in scryfall data updating the database along with alerting me. Probably a daily check-in and diff.

#### Card Images for multifaced cards

- Handle double-sided, sideways, and flip cards

#### Card Image Size

- Assess if I should reduce the image size. It doesn't matter much on my end in terms of cost, more thinking about user bandwidth. I personally love big high res images.

#### Card Location Mass Updates

- Need to add selection/deselection ability -- probably to the main mass updater too.
- Need to add to set pages.
- need to maybe make a tools menu and mass update and locations are both in it
- May need to combine mass update location and mass update quantity into one panel with two tabs

#### Custom Collection Goals

- Make it easier to exclude tokens (isToken card field perhaps?)
- Sharing and duplicating collection goals
- "Save this search as a collection goal"
- Showing number of cards in excess of a goal
- Showing goal criteria in the collection header, maybe in an i icon
- Patron request: "Would it be possible to use locations as collection filters for goals? For example I could have a goal for MH3, but point to my MH3 binder location, that way my 4x SLD Kaalia of the Vast, in that binder, could be counted for my MH3 goal while potentially not being counted for some other goal."

#### Default Collection Goals

- Allow selection of default collection goal

#### Better Token Handling with duplicate printings

- Hide duplicate printings has an interesting interaction with tokens -- an Elemental token can be a x/x or a 1/1 or what-have-you, but the current logic is to remove duplicates based on a pure card name. This doesn't work for tokens.
- This impacts collection goals too.

#### The Great Double-Sided Token Mess™

- Scryfall treats double-sided tokens as two separate cards, one for each side. This is a problem for collectors, who just want to see one entry for the dual token in their collection. It's a disconnect with how TCGPlayer handles them too.
- I'll probably create corrected entries and deprecate the old ones. This is a recent problem since WotC started making all new tokens double-sided.
- Huh, can probably use Claude for Chrome to automate spreadsheeting this stuff.

#### Adding cards to collection at buy time

- When a person is buying cards, have the site offer to record the cards right there

#### Scryfall Syntax Support for Searches

- Patron request: Scryfall syntax support for searches

#### Card Locations

- Mass updating of card locations -- this goes against my advice of using locations sparingly, though.

### Home Page Customization

- Choosing which charts show up on the home page.

### Stats Page

- A dedicated collection stats page and enhancements for set-specific stat pages, a little pie chart icon in the set view probably will expand a region to show stats for that set.
- "Your color pie" -- pie chart of colors in your collection
- Most collected creature type, etc. I have ideas in Notion.
- Easy to implement, but caching and performance will be the biggest factors.

### TCGPlayer Integration

- Mass entry for tcgplayer, add collector number at the end of card names, new feature they have to disambiguate Secret Lair cards
- Integrate with new TCGPlayer vendor URLs, see "TCGPlayer New URLs" document in Notion

### UX/Design

- The padding with bottom pagination isn't consistent on grid vs table views on mobile. Needs restructuring. It's fine.
- Maybe a better 100% completion progress bar animation? I'm only 90% happy with it.

#### UX Consistency Pass

- Money value consistency -- success and warning colors
- Consistent header, body, and breadcrumb styles
- Consistent error and info message styles
- Link to collection needs to be consistent. Underlined or not, which parts, etc.
- Form and alignment consistency
- Audit for scenarios where the app may render "1 cards" or "1 sets".

### Tech Debt

- Goal code is very fragmented, would be nice to refactor it into a more coherent whole
- Create staging environments for both API and Web -- if needed. (Local dev is pretty comfortable now and lines up with prod.)
- Audit database schema for unused fields
- Audit API for unused endpoints
- Document API endpoints with examples -- at least to help Claude out
- Switch from Google reCAPTCHA to Cloudflare Turnstile
- Find deprecated uses of PaperProps and Grid
- Remove deprecated collection summary api call, since it's folded into browse sets now, remove from postman and update postman too
- Remove deprecated collection cards api call as well, since it's folded into browse cards now, remove from postman and update postman too
- Audit consistency of naming of fields returned by API, like for totalCount and values.
- Need a full postman library of my API calls, these should live with api docs
- CI/CD pipeline
- Rate limiting for API calls
- Look into fastify multipart for uploads -- am I missing anything by not using it?
- Audit USE_OPTIMIZED_GOAL_PROGRESS and other now-unused .env variables
- ESLint: Failed to load config "eslint-plugin-react-compiler" to extend from during build

#### Code Style

- Refactor vibe-coded files to my clean code style (SetItemRenderer.tsx and browse/page.tsx are fair examples)
- - Be sure to have a full test suite of goals and their results before and after refactoring, multiple types with multiple sort options
- All quantity selectors should be using the same component, QuantitySelector.tsx
- In-code TODO audit

### Sonarcube

- Need to detect and remove dead code from my goal refactorings using sonarcube -- it's becoming a bit of a vibe coding issue

#### Open Sourcing

- Open source the repo and put github links in the footer
- Make development easy with docker images for database spin-up, etc.

#### Caching

- Statistics calculations, while now using the follower database, should be run by mtgcb-jobs, not the api, and their results should be stored in a statistics table, not in-memory in an application, at least not until cached.
- Should seriously consider a Redis caching layer
- Should probably cache the API call needed for Iconic Impact

#### Observability

- Sentry sourcemaps for mtgcb-api-v3
- Upgrading to Business Plan in Sentry to get custom dashboards

#### Performance

- Audit API response times and database response times (visible in Sentry)
- Audit Lighthouse performance, with an eye on layout shift
- Consider GIN indexes for additional fields
- More load testing, standardize a specific account with specific goals
- More index audits, organized analysis per API call / DB query
- Consider moving more read operations to the follower database

#### Testing

- I want a test suite of every goal type and filtering option that Claude runs through or maybe just a custom node script runs against test env or local creates and deletes goals
- End-to-end front-end tests for every user action in the test environment

#### Chores

- Clean up old Cloudflare settings (unused subdomains, etc)

#### Image File Format

- I think my Scryfall images are PNGs but have the JPG extension? Super old tech debt from early alpha days.

### Performance Optimizations

## 🎯 Future Features

### Major Features

#### Deck Building / Completion

- Almost added a slim version of this before release, but basic deck completion didn't feel like enough, and there's a tie-in to format legality too. This feature should probably be bigger that I originally thought. Keep in mind cards that have non-standard backs, like collector's edition, but may be still legal in commander, and bans too, how to update this.

#### Saved Searches

- Ability to save searches. It's like a collection goal but without computation.

#### Foreign Card Support

- Massive data volume, interface implications, and a new external price source

#### Sealed Product Tracking

- For folks that collect unopened boxes and packs and decks
- Related: When adding a sealed product to a collection, can add it in an "opened" state and automatically add all the cards inside to the collection

#### Set Blocks

- Group sets into blocks for browsing and collection goals
- Intelligent selection of whether to include tokens and promos or not

#### Financial History Tracking

- Track collection value over time, including purchases and sales
- Track individual card price history over time
- Track profits from sales
- Track purchase prices for cards
- Increase of individual values over time vs increase of adding cards to collection

#### Card Comments and Ratings

- Allow users to comment on cards and rate them by format

### Automated Trade Binder

- Cards in excess of specific quantities (4x) or in excess of collection goals could be automatically added to a trade binder

### Nice-to-Have Enhancements

#### 17Lands Integration

- Integrate 17Lands draft data into the site

#### Binders

- Need to recreate all binders that had "Preserve Photoshop Editing" enabled in the PDF. Since I provide the PSDs already, this just makes them unnecessarily large.
- System for generating arbitrary binder label sizes and customizing set icon orientation

#### Card Notes

- Cards could really use a notes field, like "This promo was given out at this obscure event that is only mentioned in a deleted WotC page before their redesign"

#### Card Scanning

- I built a super rough prototype of this.

#### Importers and Exporters

- Allowing import/export of locations and goals

#### Missing Price Report

- Would be nice to report how many of a user's cards are missing price data
- And to perhaps show an info icon next to collection and set values saying which cards are not contributing to the total due to missing price data

#### Patron Features

- Weather effects? Custom themes? Confetti customization with mana symbols?
- What other additional cosmetics?
- Based on a funny conversation we had, extreme progress bar styles
- Must only be cosmetic -- never want to paywall features

#### SEO, Page Titles, and Social Sharing

- Title/opengraph seo stuff pass for every page, can be kinda a pain in Next.js, research best practices

#### Shopping Lists

- Shopping lists based on collection goals and missing cards

#### System Messages

- Would be nice to have a system for site-wide messages, like "Scheduled Maintenance on DATE from TIME to TIME" or "New Feature: XYZ"

### Other Ideas

- Consider alternate-mobile-filter.png as a design idea for mobile (search bar at the top, Filters button that opens a menu with filters -- need to vibe check current implementation first)
- A money draft page that helps you quickly know the money cards for a draft, including bonus sheet content.

## MTG CB Tech Stack

### mtgcb-api-v3

- Needs better test coverage
- Update to Drizzle v1.0 once they're ready. Should fix 70% of their bugs. (Such an awesome team of folks!)

### mtgcb-jobs

- mtgcb-jobs should alert me as to new scryfall cards
- Grok what to do about card prices of cancelled cards like Crusade
- Auto-fix missing tcgplayerIds from scryfall data
- remove claude settings file from repo, rm --cached and add to gitignore

### mtgcb-importer

- mtgcb-importer should be able to audit bad or missing card data
- remove claude settings file from repo, rm --cached and add to gitignore

## 📝 Reference

### Architectural Decisions

- Staying on standard-0 postgres in Heroku for now, upgrading to standard-2 made no performance difference.

### Known Limitations

### External Dependencies
