# TODOs

## Now

- Mobile and desktop view card size issues while scrolling
- Have same default order of cards as legacy site
- Fix alignment of breadcrumbs and image gallery to match, along with other elements
- Fix mobile view for cardgallery and pagination controls
- Clean up a bunch of AI-assisted code to fit more my style (functional programming with pure functions, minimal comments, self-describing, small files)
- "No cards found" when refreshing the Browse page, briefly
- Mobile/desktop data persistence in Browse page view
- Start porting over mtgcb-web to this project, using the latest React best practices
- Maybe the React windowing shouldn't unload items when they leave the viewport, only load them.
- Don't forget to store some settings in local storage but also have them in the url for sharing
- Collection should better show that it's a dropdown and feel less awkward
- Clean up BrowseSearchForm into smaller components
- Grok URL source of truth pattern vs Redux state
- Use the new TCGPlayer domain (see below)
- Consider if the viewport loading/unloading of react components is too aggressive or if it should just load and never unload
- Sort order implementation, stable
- Clear all filters button
- Adrix and Nev, Twincasters image size issue on mobile
- Perf issues when rendering 8000 cards on the page -- the viewport stuff isn't working maybe? (Manually edit URL to do this)

## Later

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

## Known Bugs

- Moderate (UX): The search form has prefilling and styling issues.
- Moderate: Logout isn't redirecting the user -- probably want them back to the login page.
- Minor (UX): I hate how the collection submenu behaves. Add a carat?
- Minor: When logging out of a page that requires authentication, redirectTo is set to the page you were on during logout.
- Minor: The background color of the sidenav is different on mobile.

## UX Thoughts

- How to best handle filters and searching on mobile? How do other tools do it?
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
  transform: translate(calc(100% - var(--table-border-width) / 2), var(--table-border-width))
    rotate(315deg);
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
