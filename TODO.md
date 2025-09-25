# TODO

I've found over time that maintaining my action items for code in external tools is overkill and burdensome.

Best to keep them in the codebase, especially since I'm a team of one.

## Roadmap

- [ ] v1.0 Release
- [ ] Data Cleanup
- [ ] Patrons vote on the next feature candidates and I make a selection

## 🔄 In Progress

### Currently Looking At or Working On

- considering: "Complete this set" buttons don't make sense with goals -- like complete this subgoal maybe? buy missing cards in other contexts? rename and consider.
- Add buttons for completing sets on the actual set pages.
- major data issue: audit show subsets and subset data, probably need to check parentSetId that aren't assigned yet -- i think there's subset technical debt with the data
- big: need to audit buy missing cards for goal buttons, macro scale and set scale -- can't just click it for a goal with 30000 cards. can't do the prefetching for like an hour and then pop up the modal, need to be smarter and break it into chunks ahead of time. buy missing cards for this goal -- should just not have this button if it's a large number of cards, see basic land goals
  -- related ux: goal header inside of a set page needs ux work -- buy button is awkward near progress bar
- Audit subsets with collection goals -- data and appearance.

### Blocked/Waiting

## 🚨 Critical / Blocking Issues

- Need another sql.raw audit
- Must backup DDLs of all databases before release, Drizzle introspect is a secondary backup -- probably store in the API repo in a reference folder
- Important: Audit input field lengths for all API calls and make front-end enforce them too

### Migration

- Need a message for migration downtime in v2 as well
- Test migration end-to-end one more time
- Add a migration verification script to mtgcb-importer that checks user counts and collection counts match between old and new databases, accounting for those removed due to a 0 quantity count or for cards or users that no longer exist
- Switch to Git Flow for the v1.0 release

### mtgcb-importer

- importer needs to be ready for v3 -- still want a spreadsheet, edit, import workflow, token workflow, subset handling, it's close to some of this, ideally one-button click to push to prod what's in local -- or generate the sql for me to inspect and execute

### Bugs

- ESLint: Failed to load config "eslint-plugin-react-compiler" to extend from
- Hide duplicate printings doesn't do anything with goals -- maybe just hide it from the front-end.

### mtgcb-jobs

- Enable jobs on restart and make them resilient to heroku dyno restarts - database table to track progress of jobs?

### Data Issues

### Performance Issues

- Look into re-rendering when editing quantities in table view -- seems like a lot of re-renders, test on mobile

## 📋 Pre-Release Required

### Testing

- Repeat perf tests for both types of major goals, worried about some maybe doing in-memory work check the cheap normal cards goal
- Top-down testing of every page and feature
- Audit all export fields to ensure they actually get exported, like multiverseId in Archidekt

### Scaling

- Scale API and Web to two dynos

### Core Features

- Audit old app functionality
- costs to complete buttons should also be on the set page
- UX: Verify that every search tool trims whitespace

### Data Improvements

- Audit isDraftable field for sets

### Sonarcube

- Need to detect and remove dead code from my goal refactorings using sonarcube -- it's becoming a bit of a vibe coding issue

### UX

- Audit table field orders and their corresponding visibility filters

### Patron Features / Patreon Integration

- A page thanking patrons for their support, listing them, and showing the benefits they get. Maybe a link to a Discord channel for patrons.
- A supporter badge of some sort would be great.
- Detecting if someone is a patron and linking their accounts.

#### The Reserved List

- Immortal/Reserved List tier patrons will get the ability to customize a card to represent their collection in a hall of fame.
- Other Patrons will be listed in a Hall of Fame just as usernames -- private by default, controlled with a setting
- Mention Patreon on the home page and wherever else is appropriate
- Mention that patrons get to vote on future features
- Make patrons page, perhaps renamed to support the site, which lists why, and then lists supporters at different tiers, consider privacy

### UX/Design

- Consider bottom pagination controls that scroll to top when clicked

### Testing & Quality

- Test Heroku pipeline for using a backup to restore service.

### Analytics

- Google Analytics integration

### Documentation

- In-code TODO audit

### Data Cleanup

## 🚀 Release Checklist

### Migration Steps

### Infrastructure

### Monitoring & Analytics

### Communication

- Ping johnny on Discord once card locations are released. :)
- Announce on social media and discord
- Announce to patrons

## 📦 Post-Release

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

- Clean up MTG CB collector number -- it's really just a card release date order / wubrg / alphabetical (for tokens) tiebreaker in many contexts. Its intent is to help sorting in a binder where a collector number is not available or unhelpful, especially for subset groups, like sorting every FNM promo that ever existed in order of release date. Also add this number to the FAQ.

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
- Would also be nice to just show format legality while I'm at it -- and do allow filtering by it. I will have to stay on top of changes as they happen however, so mtgcb-jobs will need to be on top of this, detecting changes in scryfall data updating the database along with alerting me.

#### Card Images for multifaced cards

- Handle double-sided, sideways, and flip cards

#### Card Image Size

- Assess if I should reduce the image size. It doesn't matter much on my end in terms of cost, more thinking about user bandwidth. I personally love big high res images.

#### Custom Collection Goals

- Make it easier to exclude tokens (isToken card field perhaps?)
- Sharing and duplicating collection goals
- "Save this search as a collection goal"
- Showing number of cards in excess of a goal
- Showing goal criteria in the collection header, maybe in an i icon

#### Default Collection Goals

- Allow selection of default collection goal

#### Better Token Handling with duplicate printings

- Hide duplicate printings has an interesting interaction with tokens -- an Elemental token can be a x/x or a 1/1 or what-have-you, but the current logic is to remove duplicates based on a pure card name. This doesn't work for tokens.
- This impacts collection goals too.

#### The Great Double-Sided Token Mess™

- Scryfall treats double-sided tokens as two separate cards, one for each side. This is a problem for collectors, who just want to see one entry for the dual token in their collection. It's a disconnect with how TCGPlayer handles them too.
- I'll probably create corrected entries and deprecate the old ones. This is a recent problem since WotC started making all new tokens double-sided.

#### Adding cards to collection at buy time

- When a person is buying cards, have the site offer to record the cards right there

#### Scryfall Syntax Support for Searches

- Patron request: Scryfall syntax support for searches

#### Card Locations

- Mass updating of card locations -- this goes against my advice of using locations sparingly, though.

### Stats Page

- A dedicated collection stats page and enhancements for set-specific stat pages, a little pie chart icon in the set view probably will expand a region to show stats for that set.
- "Your color pie" -- pie chart of colors in your collection
- Most collected creature type, etc. I have ideas in Notion.
- Easy to implement, but caching and performance will be the biggest factors.

### TCGPlayer Integration

- Mass entry for tcgplayer, add collector number at the end of card names, new feature they have to disambiguate Secret Lair cards
- Integrate with new TCGPlayer vendor URLs, see "TCGPlayer New URLs" document in Notion

### UX/Design

- Maybe a better 100% completion progress bar animation? I'm only 90% happy with it.

#### UX Consistency Pass

- Money value consistency -- success and warning colors
- Consistent header, body, and breadcrumb styles
- Consistent error and info message styles
- Link to collection needs to be consistent. Underlined or not, which parts, etc.
- Form and alignment consistency
- Audit for scenarios where the app may render "1 cards" or "1 sets".

### Tech Debt

- Create staging environments for both API and Web -- if needed. (Local dev is pretty comfortable now and lines up with prod.)
- Audit database schema for unused fields
- Audit API for unused endpoints
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

#### Code Style

- Refactor vibe-coded files to my clean code style (SetItemRenderer.tsx and browse/page.tsx are fair examples)
- All quantity selectors should be using the same component, QuantitySelector.tsx

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
- More load testing
- More index audits, organized analysis per API call / DB query

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

- Almost added a slim version of this before release, but basic deck completion didn't feel like enough, and there's a tie-in to format legality too. This feature should probably be bigger that I originally thought.

#### Saved Searches

- Ability to save searches. It's like a collection goal but without computation.

#### Foreign Card Support

- Massive data volume, interface implications, and a new external price source

#### Sealed Product Tracking

- For folks that collect unopened boxes and packs and decks
- Related: When adding a sealed product to a collection, can add it in an "opened" state and automatically add all the cards inside to the collection

#### Financial History Tracking

- Track collection value over time, including purchases and sales
- Track individual card price history over time
- Track profits from sales
- Track purchase prices for cards
- Increase of individual values over time vs increase of adding cards to collection

#### Card Comments and Ratings

- Allow users to comment on cards and rate them by format

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

### Known Limitations

### External Dependencies
