# TODOs

## Now

### Can't Reproduce, Keeping An Eye On

- iPad mini, 1024 x 768, pagination controls are too wide if sidenav is open, maybe needs to be responsive to that
- vertical mode, also borked -- goes too wide, general issues with both, will look at next

### Next

- Bug: cardsPage url param is not being respected
- Refactor all components to be top-down readable.
- Refactor browse page file to be very lean, just do orchestration and then render the components
- Annoying: On mobile, the hover over card name is doing the whole row, not just the card name
- Minor Bug: Page count is not being respected if it starts in the url (do this bug later, refactor and merge first after verifying functionality)
- Page title flashing when toggling between cards and sets
- Make sure cardsPageSize can't be exploited
- perfect browse sets table and search filter options
- browse sets page and searches (merge to main after clean-up when finished)
- pageSize should be a localStorage item, not in the url
- paginating too far in the future in the url bug may be back
- Subset stuff in search filters
- set page with subsets handled
- Patron request: Add card number to card name, perhaps as a setting
- Clean up code base to be more my style -- some of the vibe coding results aren't as readable as my style
- API Concern: compare "archenemy" set types to NOT "archenemy" set types -- there's an unaccounted for difference in the results length
- Nuke placeholder error state and improve

## Later

- Set names (in table and grid view) should link to the set page
- 1024x768 testing of table view and gridview and menus with sidenav open (or determine target resolution)
- Browse view should explain itself, showing all cards in Magic might confuse some users, they may expect to see a blank search page to start
- Clean up MTG CB collector number
- Make a cool stats page
- S3 image storage is costing a lot of money, look into alternatives like Cloudflare R2, Vercel Blob Storage, Cloudflare Images, Digital Ocean Spaces, etc.
- BUG: Sorting by collector number isn't working great for Secret Lair. Sorting by releaseDate is also god awful since it's an aggregate set. Need to tiebreak with card release date.
- Move these TODOs to a TODO.md file :) Maybe once the project is near completion.
- Handle sideways cards and flip cards
- Collection valuation, fall back to available prices using the same logic
- Use the new TCGPlayer domain (see below)
- On hover contextual stuff, like increasing quantity or removing a card, or visiting the card page, or buying on tcgplayer
- Audit all indexes
- While searching, group by unique username, linking to a card name page that lists all printings -- and say "Printed in 13 sets" instead of the set name for those cards, or just the set name if a single printing. Need to group by the original, unadorned card name. This would show the newest printing first.
- Clean up a bunch of AI-assisted code to fit more my style (functional programming with pure functions, minimal comments, self-describing, small files, top-down hierarchy, easy to read)
- Table view with proper header-row sorting server-side
- Grok browser history and URL query parameters during search
- Clean up this README -- make a separate TODO file?
- Continue writing front-end tests -- paused them to focus on feature work since the app is so simple to validate manually
- Evaluate if e2e tests should mock less and test the full stack in the test environment -- or perhaps both in different tests ("page level" unit tests vs "full stack" tests)
- Sentry integration
- Performance testing
- Switch from Google reCAPTCHA to Cloudflare Turnstile
- TODO hunting
- Legal disclaimer
- Privacy Mode (private by default)
- Consider adding a generic price column that defaults to non-foil X, where X is the user's preferred price type
- Verify that every search tool trims whitespace
- Consider alternate-mobile-filter.png as a design idea
- Cards should not show an option to add a version of themselves that doesn't exist (foil/non-foil).
- Custom import and export formats
- OpenGraph meta tags for social previews
- An Exclude Bulk feature for a collection's value
- A statistics page for a user's collection
- A "money draft" tool to help users during a draft
- Support searching by collector number and collector number ranges
- Compare Vercel to Heroku for hosting
- Data issue: Release date for some sets cause sorting issues if they're exactly the same. Need to nudge some by 1 second.
- Sorting by release date for cards by using their set's release date isn't great for aggregate sets like Prerelease Cards.
- Reduce image file size.
- Remove Artist table, prefer to bake it into cards for now
- Collection statistics
- Before open sourcing, full automation suite and readability refactor -- make it work, make it fast, make it clean
- Bad data detector
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
- For tables, consider slanted-header-table-example.png design. See Rotated CSS section below.
- Ensure text size scaling is good
- Offer a Classic Skin vs the current Modern Skin
- Ensure the add/remove buttons are very large and easy to press on tablets and mobile
- Subsetgroups are confusing to users. Probably just hide this.
- Allow user to tap a card row to add that card to their collection in table view
- Some users would like result numbers listed, to help binder placement
- Some users express that when selecting a number input, they want the entire number highlighted so it's easy to replace
- Make a button on mobile to open filters side menu
- Need to search by flavorName too
- Evaluate if custom image sizes cause performance issues that can be avoided

## New TCGPlayer Affiliate Links

Hey all! We have some exciting news: we've completed setting up a custom tracking domain within Impact. Why is this important? Certain ad blockers have been flagging TCGplayer links since we migrated the program to Impact. The new tracking domain avoids that! Your current links will still continue to work as they have, but we highly recommend updating to the new link format as soon as possible to take advantage of the new capabilities. If you generated a link from one of our ads in Impact previously, it would look like this example:

https://tcgplayer.pfx.io/c/5252996/1830156/21018

To update to our custom domain, you'll need to change the domain to partner.tcgplayer.com while everything after the domain remains the same. For example, the link above would become:

https://partner.tcgplayer.com/c/5252996/1830156/21018

As for vanity links generated by Impact's link generation tool that look like so https://tcgplayer.pxf.io/N993eP, you'll need to create new links entirely as simply swapping the domain to the custom one will cause the link to no longer work. As I mentioned though, the old format links will continue to track sales if you're not able to make the changes immediately. Please let us know if you have any questions at all in the ⁠affiliate-questions channel.

## Rotated CSS

From polehammer.net, their approach to rotating CSS:

```css
table {
  border-collapse: collapse;
  --table-border-width: 1px;
}
th.rotated-text {
  white-space: nowrap;
  position: relative;
  cursor: pointer;
}
th.rotated-text > div {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: left;
  transform: translate(calc(100% - var(--table-border-width) / 2), var(--table-border-width)) rotate(315deg);
  transform-origin: 0% calc(100% - var(--table-border-width));
}
th.rotated-text > div > span {
  position: absolute;
  bottom: 0;
  left: 0;
}
td {
  text-align: right;
}
```

### Coding Style

1. Functional programming approach with pure functions in TypeScript
2. React components as constants with arrow functions rather than function declarations
3. Main component/highest level logic at the top, with smaller subunits below
4. Interfaces and types placed after the components that use them
5. No unnecessary comments - prefer self-documenting code instead
6. Descriptive variable names that clearly convey intent
7. Named boolean expressions as constants to make conditionals more readable
8. Minimal use of memoization when using React compiler (Next.js)
9. Defensive programming (e.g., null/undefined checks in utility functions)
10. Clean, organized code with logical groupings of related functionality
11. Code reading like well-written prose.
