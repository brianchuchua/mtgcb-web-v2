# TODOs

## Real Current Action Items

- Remove "Showing" from "Showing 1-24 of blah cards" at 1024x768 or smaller -- actually the entire rendering sucks at this resolution, fix it

- considering: "Complete this set" buttons don't make sense with goals -- like complete this subgoal maybe? buy missing cards in other contexts? rename and consider.
- Need these equivalent buttons on the set pages too.
- major data issue: audit show subsets and subset data, probably need to check parentSetId that aren't assigned yet -- i think there's subset technical debt with the data

- big: need to audit buy missing cards for goal buttons, macro scale and set scale -- can't just click it for a goal with 30000 cards. can't do the prefetching for like an hour and then pop up the modal, need to be smarter and break it into chunks ahead of time. buy missing cards for this goal -- should just not have this button if it's a large number of cards, see basic land goals
  -- related ux: goal header inside of a set page needs ux work -- buy button is awkward near progress bar

## UX Action Items

- Audit subsets with collection goals -- data and appearance.
