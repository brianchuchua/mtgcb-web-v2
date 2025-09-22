# TODO

I've found over time that maintaining my action items for code in external tools is overkill and burdensome.

Best to keep them in the codebase, especially since I'm a team of one.

## Roadmap

- [ ] v1.0 Release
- [ ] Data Cleanup
- [ ] Patrons vote on the next feature

## 🔄 In Progress

### Currently Working On

- Test mobile, fix issues (feels almost done)
- Test tablet, fix issues (haven't started -- try 1024x768, nav open vs not, determine target res for an iPad)

### Blocked/Waiting

## 🚨 Critical / Blocking Issues

- Need another sql.raw audit
- Must backup DDLs of all databases before release, Drizzle introspect is a secondary backup -- probably store in the API repo in a reference folder

### Migration

- Need a message for migration downtime in v2 as well
- Test migration end-to-end one more time
- Switch to Git Flow for the v1.0 release

### Bugs

- ESLint: Failed to load config "eslint-plugin-react-compiler" to extend from
- Hide duplicate printings doesn't do anything with goals -- maybe just hide it from the front-end.

### Data Issues

### Performance Issues

## 📋 Pre-Release Required

### Core Features

- Audit old app functionality
- costs to complete buttons should also be on the set page

### Data Improvements

- Audit isDraftable field for sets

### Sonarcube

- Need to detect and remove dead code from my goal refactorings using sonarcube -- it's becoming a bit of a vibe coding issue

### Patron Features

#### The Reserved List

- Immortal/Reserved List tier patrons will get the ability to customize a card to represent their collection in a hall of fame.
- Other Patrons will be listed in a Hall of Fame just as usernames -- private by default, controlled with a setting

### UX/Design

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

### Data Cleanup

#### MTG CB Collector Number

- Clean up MTG CB collector number -- it's really just a card release date order / wubrg / alphabetical (for tokens) tiebreaker in many contexts. Its intent is to help sorting in a binder where a collector number is not available or unhelpful, especially for subset groups, like sorting every FNM promo that ever existed in order of release date. Also add this number to the FAQ.

#### Images

- Scryfall has a field to track if card images are good. I know I have some early images from their initial scans where I haven't updated them since. Add a field to track this myself and clean them all up.

### Feature Enhancements

#### Card Images for multifaced cards

- Handle double-sided, sideways, and flip cards

#### Custom Collection Goals

- Make it easier to exclude tokens (isToken card field perhaps?)

### Stats Page

- A dedicated collection stats page and enhancements for set-specific stat pages

### TCGPlayer Integration

- Mass entry for tcgplayer, add collector number at the end of card names, new feature they have to disambiguate Secret Lair cards
- Integrate with new TCGPlayer vendor URLs, see "TCGPlayer New URLs" document in Notion

### UX/Design

- Maybe a better 100% completion progress bar animation? I'm only 90% happy with it.

### Technical Debt

- Audit database schema for unused fields
- Switch from Google reCAPTCHA to Cloudflare Turnstile

#### Code Style

- Refactor vibe-coded files to my style
- All quantity selectors should be using the same component, QuantitySelector.tsx

#### Open Sourcing

- Open source the repo and put github links in the footer

#### Caching

- Statistics calculations, while now using the follower database, should be run by mtgcb-jobs, not the api, and their results should be stored in a statistics table, not in-memory in an application, at least not until cached.
- Should seriously consider a Redis caching layer

#### Observability

- Sentry sourcemaps for mtgcb-api-v3
- Upgrading to Business Plan in Sentry to get custom dashboards

#### Performance

- Audit API response times and database response times (visible in Sentry)
- Audit Lighthouse performance
- Consider GIN indexes for additional fields

#### Chores

- Clean up old Cloudflare settings (unused subdomains, etc)

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

#### Missing Price Report

- Would be nice to report how many of a user's cards are missing price data

#### Patron Requests

- Highlight recently updated card in some way, perhaps the input box or the price

#### SEO, Page Titles, and Social Sharing

- Title/opengraph seo stuff pass for every page, can be kinda a pain in Next.js, research best practices

#### System Messages

- Would be nice to have a system for site-wide messages, like "Scheduled Maintenance on DATE from TIME to TIME" or "New Feature: XYZ"

## MTG CB Tech Stack

### mtgcb-api-v3

- Needs better test coverage
- Update to Drizzle v1.0 once they're ready. Should fix 70% of their bugs. (Such an awesome team of folks!)

### mtgcb-jobs

- mtgcb-jobs should be resilient to heroku dyno restarts -- database table to track progress of jobs?
- mtgcb-jobs should alert me as to new scryfall cards

### mtgcb-importer

- mtgcb-importer should be able to audit bad or missing card data

## 📝 Reference

### Architectural Decisions

### Known Limitations

### External Dependencies
