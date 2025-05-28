# TODOs

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

- Consult with an UX designer
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

## Patron Requests

- Basic deck completion -- paste in a deck list and get a report/buy button for missing cards.

## New TCGPlayer Affiliate Links

Hey all! We have some exciting news: we've completed setting up a custom tracking domain within Impact. Why is this important? Certain ad blockers have been flagging TCGplayer links since we migrated the program to Impact. The new tracking domain avoids that! Your current links will still continue to work as they have, but we highly recommend updating to the new link format as soon as possible to take advantage of the new capabilities. If you generated a link from one of our ads in Impact previously, it would look like this example:

https://tcgplayer.pfx.io/c/5252996/1830156/21018

To update to our custom domain, you'll need to change the domain to partner.tcgplayer.com while everything after the domain remains the same. For example, the link above would become:

https://partner.tcgplayer.com/c/5252996/1830156/21018

As for vanity links generated by Impact's link generation tool that look like so https://tcgplayer.pxf.io/N993eP, you'll need to create new links entirely as simply swapping the domain to the custom one will cause the link to no longer work. As I mentioned though, the old format links will continue to track sales if you're not able to make the changes immediately. Please let us know if you have any questions at all in the ⁠affiliate-questions channel.

## Dev Philosophy

- Make it work
- Make it fast
- Make it clean (better to refactor after functionality is complete)
- Make it pretty
- Make it fun

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
