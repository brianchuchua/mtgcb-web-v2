# TODOs

I've found over time that maintaining my action items for code in external tools is overkill and burdensome.

Best to keep them in the codebase for now, especially since I'm a team of one.

## Remaining Major Feature Work Before 1.0

- Imports and exports
- Privacy mode
- Cards page
- Subset data automation and clean-up
- Data import clean-up / new mtgcb-importer section for new app (including bad data detector)
- Home page (landing page or statistics dashboard)
- New price updater
- Tokens
- Legal disclaimer
- In-code TODO audit
- Feature parity audit
- Audit routes that require authentication

### Current Action Items

- The main collection set page header should respect a include subsets in set setting like the main page
- Handle serious virtualize stuttering bug
- Do the easier quantity selectors
- When idle: Migrate TODOs from README.md to this file

## Other Action Items

- Setting to change going mythic to plain green progress bars
- Remove deprecated collection summary api call, since it's folded into browse sets now, remove from postman and update postman too
- Remove deprecated collection cards api call as well, since it's folded into browse cards now, remove from postman and update postman too
- canBeFoil = audit my database and implement this in the collection views
- Support searching by collector number and collector number ranges
- Handle canBeNonFoil and canBeFoil after verifying my importer is good with this data -- in collection pages and edit cards page

## UX Action Items

- Consider an easier-to-use card quantity filter, add stat filter works, but users may be used to the easier one (I did this in the legacy new page)
- Consider moving price type selection to the browsesearchform
- The pop-up messages are too sticky, feels like mouse movement is involved
- Header consistency
- Make set symbols change color on set table and set page too
- Add link from child set to parent set
- Add titles to all pages
- Add title tags to all set and card links
- Audit API failure rendering in every page
- Confirm functionality of back and forward browser buttons
- Handle sideways cards and flip cards
- On hover contextual stuff, like increasing quantity or removing a card, or visiting the card page, or buying on tcgplayer
- It would be nice if pagination didn't change when changing track subsets with main set or price type
- See if I can prevent the entire card grid from reloading when the price type is changed
- Add skeleton loader for collection header to prevent vertical shift when loading (audit set header too)
- Audit table field orders and their corresponding visibility filters
- OpenGraph meta tags for social previews
- Consider alternate-mobile-filter.png as a design idea (search bar at the top, Filters button that opens a menu with filters)
- 1 cards instead of 1 card
- includeSets in URL while on the sets page is a little weird
- See if still happening: On mobile, the hover over card name is doing the whole row, not just the card name
- Confetti when hitting 100% collection progress, see legacy implementation
- Alternating table row colors, I feel like the bright ones are too bright
- Allow user to show/hide card quantities in table view
- UX - Make the tab indexes only go to the quantity fields
- Maybe: Improve rendering of reg and foil quantity when not logged in grid view
- UX - Why do the pop-ups not dismiss if the screen isn't active?
- Consider breadcrumbs for collection pages, maybe just the subpages since the main collection page is the root
- Improve card quantity update messages
- Open Search Options -- should probably scroll to the search options section
- Shrink card text when scaling down cards via slider
- Breadcrumbs in collection set view
- search needs to clear when entering a set page
- Remove "Showing" from "Showing 1-24 of blah cards" at 1024x768 or smaller
- (A subset of link) in the header for subsets -- or actually do breadcrumbs
- Make default number of cards per page a multiple of 5 and 4.
- Header consistency on pages, make a shared component for text headers

## Bugs

- Severe: Scrolling far down during the virtualization of the set grid view by clicking halfway through scrollbar while viewing 500 sets, jumping up and down in a loop -- maybe need to render further down or something?
- Moderate: Draft cube calculation when track subsets with sets in on is wrong, shows a money value, but the correct answer is still "you have all the cards", see khans of tarkir -- it's incorrectly counting non main set cards as missing just in terms of the value
- Moderate+ Bug: Collector number sort is broken in collector table view, probably not using the numeric version of collector number
- Bug: Release date desc in sets view is applying to cards view when switching
- Bug: seeing a query for /search/sets with release desc and then asc when loading set collection page
- Bug: Reset Search doesn't clear the stat filters graphically.
- Make sure 99% doesn't round to 100% in progress bars and collection progress (see Duel Decks: Anthology and Gatecrash)
- See if still present: Page count is not being respected if it starts in the url (do this bug later, refactor and merge first after verifying functionality)
- See if still present: paginating too far in the future in the url bug may be back

## Tech Debt

- Type issues in src\api\collections\collectionsApi.ts
- Switching from desktop to mobile view unmounts a lot of the app, which resets pages like the edit cards page
- End-to-end tests for every user action
- CardBrowseClient is a mess and is using deprecated Grid
- Find deprecated uses of PaperProps and Grid
- Tech debt in API: const allMatchingSets = await findSetsByQuery(fastify, whereClause, orderClause, 10000, 0, select); <-- will break if more than 10000 sets
- Switch from Google reCAPTCHA to Cloudflare Turnstile
- Every file needs to follow the code style I established in SetItemRenderer.tsx and browse/page.tsx
- Minor: prefetch leads to page 2 being loaded when a user invalidates the collection tag, it's a prefetch subscription issue in RTK Query, dev team is aware, no current fix, just bad workarounds, page one still loads on visit, so it's fine
- fetch API being used in SetSelector

## Future Feature Work

- Foreign Cards
- Card Locations
- Custom Collection Goals
  - This can be essentially saved searches. Trickiest part is handling card duplicate settings.
- Deck Completion

## Patron Requests

- Search with scryfall syntax

## Things To Check On

- UX: Verify that every search tool trims whitespace
- API: Any chance I run out of ids for collection entries?
- RTK Query: Compare configuration in legacy app to the new one, especially in terms of caching and invalidation

## Production Checklist

- Integration with Sonarcloud (open source the repo)
- Integration with Sentry
- Integration with Google Analytics
- Load testing
- Performance testing / index audit
- SQL injection audit
- Security audit -- confirm I cannot edit a JWT to change the userId
- Automated database backups
- Dogfooding and UX testing
- UX - Must test rendering of input fields on native devices
- Verify parameter edge cases, minimums and maximums

## Nice to Have

- A "money draft" tool to help users during a draft
