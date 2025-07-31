# Import / Export Format Priority Backlog

| Rank   | Platform / Format              | Quick Rationale                                                        |
| ------ | ------------------------------ | ---------------------------------------------------------------------- |
| **1**  | **TCGplayer**                  | Largest marketplace; mobile app & seller portal both export CSV.       |
| **2**  | **Moxfield**                   | Comparable traffic to Archidekt; popular EDH crowd; three FB mentions. |
| **3**  | **Archidekt**                  | Fast-growing deck+collection site; multiple direct user mentions.      |
| **4**  | **MTGGoldfish – “Super Brew”** | High-traffic site; collection upload powers its brew tool.             |
| **5**  | **Deckbox.org**                | Legacy trader staple; four e-mail requests.                            |
| **6**  | **ManaBox (Android/iOS)**      | 500 K+ installs; four user mentions.                                   |
| **7**  | **MTG Studio (desktop)**       | Dedicated collection editor; four e-mail votes.                        |
| **8**  | **Dragon Shield Card Manager** | 100 K+ installs; trusted price tracker.                                |
| **9**  | **Delver Lens (Android)**      | Patron request; exports multiple CSV dialects.                         |
| **10** | **EchoMTG**                    | Web + iOS analytics tool; shows up in popularity research.             |
| **11** | **TopDecked MTG**              | 100 K installs; binder CSV export for competitive players.             |
| **12** | **Urza Gatherer**              | Windows/mobile collection app; one FB mention.                         |
| **13** | **Collectr**                   | Rising multi-TCG app; single user mention.                             |
| **14** | **MTG Familiar**               | Legacy Android app; niche but persistent.                              |
| **15** | **Card Castle**                | AU-centric; supports CSV export.                                       |
| **16** | **Helvault (iOS)**             | Scanner with mail-CSV feature; shrinking user base.                    |
| **17** | **Card Binder (iOS)**          | Very small install pool; CSV mail-out.                                 |

Formats mentioned to me by email:
~~MTG Studio: 4~~
~~Deckbox: 4~~
~~TCGplayer: 2~~
~~Archidekt: 2~~
~~ManaBox: 2~~
~~Gatherer: 2 (must be urza gatherer)~~

Patron requests: Delver Lens

Facebook requests:
~~Urza gatherer~~
Moxfield
moxfield ~~and archidekt and manabox~~
~~Collectr~~ and MTGGoldfish's "Super Brew"
Moxfield, ~~Archidekt, Manabox,~~ ~~Collectr~~ and MTGGoldfish's "Super Brew"

Legacy site support:
Import: ~~MTG Studio, Deckbox,~~ ~~MTGPrice.com,~~ ~~OzGuild~~, Helvault, ~~TCGPlayer App,~~ ManaBox
Export: ~~Deckbox, MTG CB, MTG Studio,~~ ~~MTGPrice.com~~

## Import/Export Research

- TODO: May need to let user specify price preference, or use the site one.
- TODO: Top-down testing of each method and auditing of default and sample fields.
- TODO: Just like I label unsupported formats, I should label formats that are not accurate due to no unique identifier. It's not my fault! maybe good and bad levels of support labels. I put so much pressure on myself to get it right, but I can't control the data from other sites. Explain in an info note why the support is not perfect.

### TCGPlayer app

- Status: ✅Done

### Moxfield

- Status: 🏈Punted
- No unique field unfortunately, but Archidekt lets me do scryfallId, so since Moxfield lets you import Archidekt, I may be able to cross-reference the two to create a mapping.
- How do they support so many import formats? Do they really? I'll need to cross-test these.
- Maybe all these sites fail importing when there are naming differences and categorization differences?

### Archidekt

- Status: ✅Done

### MTGGoldfish

- Status: 🏈Punted
- Have to pay to import and their import formats may be limited, unless I check out their supported ones.

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

TODO: Must mention that I can't guarantee accuracy for every import format -- it'd be a full time job. Some are 95% matches, some are 99% matches. Best effort. Many other tools do this too.
TODO: Must grok Culling the Weak handling in all import formats for Secret Lair and the TCGPlayer equivalents

### MTGPrice.com

- Status: ❌Intentionally skipped
- Seems behind a paywall, but its advertisements also seem a bit old.

### OzGuild

- Status: ❌Intentionally skipped
- Became Card Castle in 2018. No one has asked for this.

### Helvault (iOS)

- Status: ✅Done
- Small userbase, but adding support for their non-legacy app out of respect for my past users.
