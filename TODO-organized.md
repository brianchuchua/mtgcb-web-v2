# TODO

I've found over time that maintaining my action items for code in external tools is overkill and burdensome.

Best to keep them in the codebase, especially since I'm a team of one.

## Roadmap

- [ ] v1.0 Release
- [ ] Data Cleanup
- [ ] Patrons vote on the next feature candidates and I make a selection

## 🔄 In Progress

### Currently Working On

- Test mobile, fix issues (feels almost done)
- Test tablet, fix issues (haven't started -- try 1024x768, nav open vs not, determine target res for an iPad)

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

### Scaling

- Scale API and Web to two dynos

### Core Features

- Audit old app functionality
- costs to complete buttons should also be on the set page

### Data Improvements

- Audit isDraftable field for sets

### Sonarcube

- Need to detect and remove dead code from my goal refactorings using sonarcube -- it's becoming a bit of a vibe coding issue

### UX

- Audit table field orders and their corresponding visibility filters

### Testing

- Repeat perf tests for both types of major goals, worried about some maybe doing in-memory work check the cheap normal cards goal

### Patron Features / Patreon Integration

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

## 📦 Post-Release

### Communication

- Ping johnny on Discord once card locations are released. :)
- Announce on social media and discord
- Announce to patrons
- Start up the podcast again

### Project: Data Cleanup

#### Subset Splitting

- Needs to be done as before. Audit current and any missing from the established pattern.

#### MTG CB Collector Number

- Clean up MTG CB collector number -- it's really just a card release date order / wubrg / alphabetical (for tokens) tiebreaker in many contexts. Its intent is to help sorting in a binder where a collector number is not available or unhelpful, especially for subset groups, like sorting every FNM promo that ever existed in order of release date. Also add this number to the FAQ.

#### Old Images Update

- Scryfall has a field to track if card images are good. I know I have some early images from their initial scans where I haven't updated them since. Add a field to track this myself and clean them all up.

#### Prices

- Address as many cards missing a tcgplayerId as possible

#### Token Set Icons

- Tokens have set codes that start with a T and thus don't get the correct set icon from keyrune.

### Feature Enhancements

#### Card Format Legality

- Would be nice to warn users if cards aren't tournament legal, even though this is a collecting site and not a deckbuilding site.
- Would also be nice to just show format legality while I'm at it -- and do allow filtering by it. I will have to stay on top of changes as they happen however, so mtgcb-jobs will need to be on top of this, detecting changes in scryfall data updating the database along with alerting me.

#### Card Images for multifaced cards

- Handle double-sided, sideways, and flip cards

#### Card Image Size

- Assess if I should reduce the image size. It doesn't matter much on my end in terms of cost, more thinking about user bandwidth. I personally love big high res images.

#### Custom Collection Goals

- Make it easier to exclude tokens (isToken card field perhaps?)

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

- Create staging environments for both API and Web
- Audit database schema for unused fields
- Audit API for unused endpoints
- Switch from Google reCAPTCHA to Cloudflare Turnstile
- Find deprecated uses of PaperProps and Grid
- Remove deprecated collection summary api call, since it's folded into browse sets now, remove from postman and update postman too
- Remove deprecated collection cards api call as well, since it's folded into browse cards now, remove from postman and update postman too

#### Code Style

- Refactor vibe-coded files to my clean code style (SetItemRenderer.tsx and browse/page.tsx are fair examples)
- All quantity selectors should be using the same component, QuantitySelector.tsx

#### Open Sourcing

- Open source the repo and put github links in the footer

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

#### Chores

- Clean up old Cloudflare settings (unused subdomains, etc)

#### Image File Format

- I think my Scryfall images are PNGs but have the JPG extension? Super old tech debt from early alpha days.

### Performance Optimizations

### Data Improvements

- After release, adding all remaining missing cards and fixing data issues, including:
- Adding Art Series cards
- Need to add cardFaces data and come up with a plan to render the backside of cards

## 🎯 Future Features

### Major Features

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

- Weather effects? Custom themes? Confetti customization?
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

## MTG CB Tech Stack

### mtgcb-api-v3

- Needs better test coverage
- Update to Drizzle v1.0 once they're ready. Should fix 70% of their bugs. (Such an awesome team of folks!)

### mtgcb-jobs

- mtgcb-jobs should alert me as to new scryfall cards
- remove claude settings file from repo, rm --cached and add to gitignore

### mtgcb-importer

- mtgcb-importer should be able to audit bad or missing card data
- remove claude settings file from repo, rm --cached and add to gitignore

## 📝 Reference

### Architectural Decisions

### Known Limitations

### External Dependencies
