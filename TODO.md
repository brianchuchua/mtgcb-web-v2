# TODOs

I've found over time that maintaining my action items for code in external tools is overkill and burdensome.

Best to keep them in the codebase, especially since I'm a team of one.

## Current Action Items

- instead of sql.raw, should be doing https://orm.drizzle.team/docs/sql -- it's still a raw query, just safe <--
- UX or bug: FNM Promos set, when a card is both a member of a subsetgroup and has a parent set that is the same set, it's listed on the bottom and also within the set, think about this more. Could just be a data issue.
- I absolutely hate mergeSearchConditions in the API. This needs a major refactor.
- Preload stuff on pagination hover?
- mass entry, add collector number
- roadmap page (maybe just on the changelog page)
- mention binders on home page
- faq page
- consider adding prefetching back to pagination, collection goal queries can be slow for big goals
- make sure the jwt cookie name doesn't clash with the older beta

## Remaining Major Feature Work Before 1.0

### Card Page

- For browse and collection contexts
- Show other printings

### Patron Support Page

- A page thanking patrons for their support, listing them, and showing the benefits they get. Maybe a link to a Discord channel for patrons.
- Detecting if someone is a patron and linking their accounts.

### Home Page

- Should brag about new features and explain the launch (need a news page I think)
- Should show most valuable card, statistics, etc. I think. Although need stats somewhere else too, maybe in every header of every collection page.

### Terms and Conditions

- footer
- info icon next to collection value, estimate, tcgplayer data, etc.
- Need to research and implement. I really don't want to make my users have to check an agree box, but need to understand the legal requirement. Biggest concern is bad TCGPlayer data gives an inaccurate collection value and then they make financial decisions based on that. I think a disclaimer is enough, but need to research.
  - Did some good research. Don't need a checkbox, just a link near register, sign up, and in footers, and my legal text is good enough already, although I can add more disclaimers about tcgplayer prices and bugs.
  - contact link in the footer
  - social media links

### Migration Path

### FAQ Page

### Testing

- Mobile
- Tablet

## Other Action Items Before Launch

### Organizational

- Prioritize, organize, and cull TODOs in this document

### Importer

- Error messages aren't great. Try Moxfield. "3285 Card Chrome Mox Could not find card "Chrome Mox"" -- should say the set that was attempted too.
- Audit all export fields to ensure they actually get exported, like multiverseId in Archidekt

### UX

- Consistent header, body, and breadcrumb styles
- Consistent error and info message styles
- Clearly label collection values as estimates

### Uncategorized

- verify the individual value of sets, when added up, add up to the collection value -- Chris request on Discord
- card notes field for card page
- support better rendering of which variants of cards exist in searches when limiting one copy per card name, maybe
- Audit default values of card fields, set fields, and everything else on the page, for grid and table views. Some may have changed since a refactor.
- numberOfCardsInMagic in API coming back isn't always right, see http://local.mtgcb.com:3000/collections/1337/surprise-slivers?goalId=16&includeSets=1056
- Setting to change going mythic to plain green progress bars
- Remove deprecated collection summary api call, since it's folded into browse sets now, remove from postman and update postman too
- Remove deprecated collection cards api call as well, since it's folded into browse cards now, remove from postman and update postman too
- audit all api calls, how they're used, and their payloads, then revise and document, some locations ones and collections ones may be unused
- Support searching by collector number and collector number ranges
- Handle canBeNonFoil and canBeFoil after verifying my importer is good with this data -- in collection pages and edit cards page
- Missing data detector and clean-up for every card and set field in the database (pureName for example)
- Probably a bug: When using hide duplicate printings, we should definitely show the card the user owns, not just whatever one corresponds to the sort order
- Showing 2501-3000 of 92769 cards goes to two lines on desktop
- Performance pass, some API calls have gotten a little worse I think
- Performance benchmark scripts and documentation
- Card page: Other Printings should just be the standard pagination with those cards filtered, collection aware, maybe goal aware
- Shopping lists -- reports based on collection goals
- TCGPlayer supports adding a collector number after the set code -- needed for things like secret lair that have duplicate names
- Allow selection of default collection goal
- Data import clean-up / new mtgcb-importer section for new app (including bad data detector)
- Home page (landing page or statistics dashboard depending on login state, perhaps most valuable card can live here)
- New price updater
- In-code TODO audit
- Feature parity audit (permalink)
- Most valuable card collected, maybe in the set header
- Handle double-sided, sideways, and flip cards
- New price updater that updates directly in the new database, separate from the old legacy updater
- Audit input field lengths for all API calls
- Statistics -- think a pie chart icon that you click and it switches to viewing stats, including most valuable card -- on both the main page and in set pages
- Brainstorm patron cosmetic perks

## UX Action Items

- bottom pagination, return to top of page
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
- mission statement, like "let's build our collection together" or something -- the point of the site is to make it easy to complete a collection, as easy as a button press
  - enhancement -- when a person goes to buy the cards, have the site offer to record the cards right there
- what good are breadcrumbs actually doing on the browse page? like home > browse, the home page is useless
- See if still happening: On mobile, the hover over card name is doing the whole row, not just the card name
- Confetti when hitting 100% collection progress, see legacy implementation
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
- Quantity selectors -- going from custom filter to normal doesn't reset the states as you'd expect
- A cool stats page, icon can be a graph, most valuable card can move there -- can make an expandable region in a set view too. How much of each color selected, etc. Check what MTG Arena and other tools do. Some easy wins. Most common creature type, most valuable card, etc.
- When any prices are missing, add an info icon explaining it's an underestimate
- Improve loading experience for mouse over images, spinner shows too much, maybe better to show nothing until the image is loaded
- When multiple copies of a card exists, but they only want to see one per card name, make it clear that there are options -- API can return all of them, or enough of their data for the front-end to do something smart, I've seen access while debugging other issues
- Add a note to Cost to complete that it's based on the cheapest printing of a card, which may differ from the one being shown.
- Inconsistent h1 styles (set page, goal vs non-goal context)
- error state of quantity selectors not affecting button properly in goal editing or creation form
- improve loading states, http://local.mtgcb.com:3000/collections/1337?goalId=14&oneResultPerCardName=true&contentType=cards and switch to "all except alpha" goal -- the transition is jarring
- improve rendering of quantities of another person's collection, maybe just hide left/right buttons and disable, still need to show bad data indicators

## Bugs

- Severe (Possibly fixed, keeping an eye on): Sometimes not seeing rendering of grid or table in a specific set, reproducible in Brave - http://local.mtgcb.com:3000/collections/100116/edge-of-eternities-commander-tokens, paginations and the buttons render, just not the virtualization content, maybe the logic to defer rendering is broken
- Moderate: Draft cube calculation when track subsets with sets in on is wrong, shows a money value, but the correct answer is still "you have all the cards", see khans of tarkir -- it's incorrectly counting non main set cards as missing just in terms of the value
- Moderate+ Bug: Collector number sort is broken in collector table view, probably not using the numeric version of collector number
- Bug: Release date desc in sets view is applying to cards view when switching
- Bug: seeing a query for /search/sets with release desc and then asc when loading set collection page
- Bug: Reset Search doesn't clear the stat filters graphically.
- Make sure 99% doesn't round to 100% in progress bars and collection progress (see Duel Decks: Anthology and Gatecrash)
- See if still present: Page count is not being respected if it starts in the url (do this bug later, refactor and merge first after verifying functionality)
- See if still present: paginating too far in the future in the url bug may be back
- Matching cards by their pure name for collection goals doesn't work well with tokens, because they have the same name but are physically distinct in terms of type lines and power and toughness and color identity

## Tech Debt

- Switch from Google reCAPTCHA to Cloudflare Turnstile
- All quantity selectors should be using the same component, QuantitySelector.tsx
- End-to-end tests for every user action
- CardBrowseClient is a mess and is using deprecated Grid
- Find deprecated uses of PaperProps and Grid
- Every file needs to follow the code style I established in SetItemRenderer.tsx and browse/page.tsx
- Minor: prefetch leads to page 2 being loaded when a user invalidates the collection tag, it's a prefetch subscription issue in RTK Query, dev team is aware, no current fix, just bad workarounds, page one still loads on visit, so it's fine
- Consider removing skeleton loaders from set gallery and experiment with masonry instead of virtuoso
- I think my Scryfall images are PNGs but have the JPG extension? Super old tech debt from early alpha days.
- Audit consistency of naming of fields returned by API for totalCount and values.
- Need a full postman library of my API calls, these should live with api docs
- Need a fallback if both canBeFoil and canBeNonFoil are false, treat them both as true probably

## Future Features

- Art Series cards
- Deck Completion
- Foreign Cards
- Sealed product support
- Button to report missing card data, notify user if link to scryfall or tcgplayer is missing
- Financial history tracking, collection value history, etc.
- Card comments and rating
- Patron request: Scryfall syntax support for searches

## Future Enhancements to Existing Features

### Locations

- Allowing backups, import and export of locations

### Collection Goals

- Sharing and duplicating collection goals

### Performance

- Perhaps don't include location data in searches when the user has no locations, may need a preflight check for this

### Data Improvements

- The Great Double-Sided Token Mess™
- Auditing for and preventing duplicate releasedAt dates in sets
- canBeFoil and canBeNonFoil data cleanup and interaction with etched foils, see Mountain (674) from Secret Lair and compare to tcgplayer data -- see also Culling the Weak and rainbow foils
- Subset data automation and clean-up (basically audit subset groups that have cards in them directly and sets that should be subsets)

### Testing

- End-to-end tests for every user action in the test environment

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

- Ping johnny on Discord once card locations are released. :)
- Integration with Sonarcloud (open source the repo, make development easy for new devs)
- Integration with Sentry
- Integration with Google Analytics
- Load testing
- Performance testing / index audit
- Add an index for set slug probably
- SQL injection audit
- Security audit -- confirm I cannot edit a JWT to change the userId
- Automated database backups
- Dogfooding and UX testing
- UX - Must test rendering of input fields on native devices
- Verify parameter edge cases, minimums and maximums
- Audit field length limits
- Adequate feature testing
- Terms and conditions, research
- Data cleanup for tcgplayer names and codes and tcgplayer ids
- Test clipboard functionality in staging/production with HTTPS (Share Collection feature)

## Nice to Have

- A "money draft" tool to help users during a draft
- A YouTube channel for the site, including transitioning collectors to limited players -- it's the best way to collect.
- Consulting with a UX designer -- while Material UI looks nice, IhavenoideawhatIamdoing

## Data Decisions

- Tokens count as part of a set if they're promotional in nature

# TODOs from the README.md file

## Now

### Next

- Continue moving these notes to TODO.md during downtime

- Patron request: Add card number to card name, perhaps as a setting
- Clean up code base to be more my style -- some of the vibe coding results aren't as readable as my style
- API Concern: compare "archenemy" set types to NOT "archenemy" set types -- there's an unaccounted for difference in the results length
- Nuke placeholder error state and improve
- Test API and database outages
- Plan for system wide messages
- Audit back and forward button
- Confetti when hitting 100%, see legacy implementation
- FNM Promos are a interesting corner case -- it's a subset group, but also has a child set, General FNM Promos. Need to test everything.
- Patron request: Highlight recently updated card in some way, perhaps the input box or the price
- Home page, call to action to register or login
- Iterate on the complete collection animation for the circular progress bar
- Smarter knowledge if cards can be foil -- check status of scryfall data for this

## Later

- Sonarcube integration
- 1024x768 testing of table view and gridview and menus with sidenav open (or determine target resolution)
- Browse view should explain itself, showing all cards in Magic might confuse some users, they may expect to see a blank search page to start
- Clean up MTG CB collector number
- Make a cool stats page
- S3 image storage is costing a lot of money, look into alternatives like Cloudflare R2, Vercel Blob Storage, Cloudflare Images, Digital Ocean Spaces, etc.
- BUG: Sorting by collector number isn't working great for Secret Lair. Sorting by releaseDate is also god awful since it's an aggregate set. Need to tiebreak with card release date.
- Move these TODOs to a TODO.md file :) Maybe once the project is near completion.
- Use the new TCGPlayer domain (see below)
- An Exclude Bulk feature for a collection's value
- Compare Vercel to Heroku for hosting
- Data issue: Release date for some sets cause sorting issues if they're exactly the same. Need to nudge some by 1 second.
- Sorting by release date for cards by using their set's release date isn't great for aggregate sets like Prerelease Cards.
- Reduce image file size.
- Remove Artist table, prefer to bake it into cards for now
- Before open sourcing, full automation suite and readability refactor -- make it work, make it fast, make it clean
- Before going open source: Clean up all the vibe coding and make it more my style, refactor and reduce file sizes, break up more
- update rarityNumeric to have special be 6 instead of 1 in production `update "Card" set "rarityNumeric" = 6 where "rarityNumeric" = 1;`
- Clean up BrowseSearchForm into smaller components
- Add ability to save searches (even independently of collection goals, a saved searches section)
- Allow sorting by set names alphabetically in card view
- Table exporting to CSV
- Subset data may need to be cleaned up.

## Known Bugs

- Moderate (UX): The search form has prefilling and styling issues.
- Moderate: Logout isn't redirecting the user -- probably want them back to the login page.
- Minor: When logging out of a page that requires authentication, redirectTo is set to the page you were on during logout.
- Minor: Mana doesn't render properly in table view for Kozilek, Compleated

## UX Thoughts

- Let's make UX changes as we port components over.
- Need a main landing page that doesn't suck. It needs a large call-to-action to register and show off the features of the site.
- Offer a Classic Skin vs the current Modern Skin
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

## New TCGPlayer Affiliate Links

Hey all! We have some exciting news: we've completed setting up a custom tracking domain within Impact. Why is this important? Certain ad blockers have been flagging TCGplayer links since we migrated the program to Impact. The new tracking domain avoids that! Your current links will still continue to work as they have, but we highly recommend updating to the new link format as soon as possible to take advantage of the new capabilities. If you generated a link from one of our ads in Impact previously, it would look like this example:

https://tcgplayer.pfx.io/c/5252996/1830156/21018

To update to our custom domain, you'll need to change the domain to partner.tcgplayer.com while everything after the domain remains the same. For example, the link above would become:

https://partner.tcgplayer.com/c/5252996/1830156/21018

As for vanity links generated by Impact's link generation tool that look like so https://tcgplayer.pxf.io/N993eP, you'll need to create new links entirely as simply swapping the domain to the custom one will cause the link to no longer work. As I mentioned though, the old format links will continue to track sales if you're not able to make the changes immediately. Please let us know if you have any questions at all in the ⁠affiliate-questions channel.
