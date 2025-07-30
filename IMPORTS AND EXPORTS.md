# Import / Export Format Priority Backlog

| Rank   | Platform / Format              | Quick Rationale                                                        |
| ------ | ------------------------------ | ---------------------------------------------------------------------- |
| **1**  | **TCGplayer**                  | Largest marketplace; mobile app & seller portal both export CSV.       |
| **2**  | **Moxfield**                   | Comparable traffic to Archidekt; popular EDH crowd; three FB mentions. |
| **3**  | **Archidekt**                  | Fast-growing deck+collection site; multiple direct user mentions.      |
| **4**  | **MTGGoldfish – “Super Brew”** | High-traffic site; collection upload powers its brew tool.             |
| **5**  | **Deckbox.org**                | Legacy trader staple; four e-mail requests.                            |
| **6**  | **ManaBox (Android)**          | 500 K+ installs; four user mentions.                                   |
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
MTG Studio: 4
Deckbox: 4
TCGplayer: 2
Archidekt: 2
ManaBox: 2
Gatherer: 2

Patron requests: Delver Lens

Facebook requests:
Urza gatherer
Moxfield
moxfield and archidekt and manabox
Collectr and MTGGoldfish's "Super Brew"
Moxfield, Archidekt, Manabox, Collectr and MTGGoldfish's "Super Brew"

Legacy site support:
Import: MTG Studio, Deckbox, MTGPrice.com, OzGuild, Helvault, TCGPlayer App, ManaBox
Export: Deckbox, MTG CB, MTG Studio, MTGPrice.com

## Import/Export Research

- TODO: Need to add a notes field explaining any special steps.
- TODO: May need to let user specify price preference, or use the site one.
- TODO: Top-down testing of each method and auditing of default and sample fields.
- TODO: I should have a generic handler that can receive a hierarchy of fields and do its best to map them one step at a time.
- TODO: Just like I label unsupported formats, I should label formats that are not accurate due to no unique identifier. It's not my fault! maybe good and bad levels of support labels. I put so much pressure on myself to get it right, but I can't control the data from other sites. Explain in an info note why the support is not perfect.
- TODO: I should force the user to include set name and card name and set code to help them with errors.

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

TODO: Must unify the logic for identifying cards across all import formats.
