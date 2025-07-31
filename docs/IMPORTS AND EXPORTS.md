# Import / Export Formats

## Backlog

- Moxfield

## Import/Export Research

### TCGPlayer app

- Status: ✅Done

### Moxfield

- Status: ✅Done
- Despite them not accepting Scryfall ID or TCGPlayer ID, I was able to import 20,000 cards in about a minute with an accuracy rate of about 98%. Most failures were due to differences in the edition code or how cards are grouped in different sets.

### Archidekt

- Status: ✅Done

### MTGGoldfish

- Status: ✅Done
- Have to pay to import and their import formats may be limited, unless I check out their supported ones.
- Due to the paywall, haven't tested importing to their site, but if the format is the same it should work. On their end, they depressingly are missing many Scryfall IDs, so from their page to mine won't be as accurate as I would like.

### Deckbox.org

- Status: ✅Done
- They support exporting scryfall id and tcgplayer id, but do not use them for importing.
- Out of 44000 cards, 43500 are recognized and it splits successes from failures into two files.
- But trying the actual import just spins. Not sure if it's going to fail after a few minutes.
- I force-closed and refreshed, then saw my cards.
- Need to tell the user when exporting in deckbox format to use the "Deckbox CSV" section under Add Cards.
- Their site times out with 44000 cards after 1 minute, the spinner forever spinning.
- But they all made it.

### ManaBox

- Status: ✅Done

### MTG Studio (Desktop)

- Status: ❌Cannot support
- Like most other sites, I can't support this because it doesn't use unique identifiers like TCGPlayer ID or Scryfall ID. It uses set code and card name, but with such naming convention differencs that over 60% of the cards would need manual fixes -- and I would need to keep up with new cards on their end forever.

### Dragon Shield Card Manager

- Status: ❌Intentionally skipped
- No one has asked for this.

### Delver Lens (Android)

- Status: ⏳Pending
- Need to borrow my wife's phone to test this. 😅
- Reassuring to see that even their video tutorials say "yo naming conventions are different, so you may need to fix some cards manually." I'm putting way too much pressure on myself.

### EchoMTG

- Status: ❌Intentionally skipped
- No one has asked for this.

### TopDecked MTG

- Status: ❌Intentionally skipped
- No one has asked for this.

### Urza Gatherer

- Status: ❌Cannot support
- Their export format is a proprietary .ugs file that is not a standard CSV and does not use any known card identifiers. It is intended for internal use only. Users can for some reason import the ManaBox CSV format, though, so I left that hint.

### Collectr

- Status: ❌Intentionally skipped
- They don't support importing into the app and exporting is locked behind a paywall. If I get more requests, I can revisit this.

### MTGPrice.com

- Status: ❌Intentionally skipped
- Seems behind a paywall, but its advertisements also seem a bit old.

### OzGuild

- Status: ❌Intentionally skipped
- Became Card Castle in 2018. No one has asked for this.

### Helvault (iOS)

- Status: ✅Done
- Small userbase, but adding support for their non-legacy app out of respect for my past users.

### Delver MTG

- Status: ✅Done
- A patron request. The older version of the app is called Delver Lens, but the new version is just called Delver MTG. No need to support the older one.
