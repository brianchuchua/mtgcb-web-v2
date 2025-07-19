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

- Users need to change the Default share format to CSV in the app settings.
- They'll want to have all the CSV fields enabled in the CSV output settings.
- The app by default names the file a .txt even though the data is in CSV format.
- It's buggy and doesn't actually work for importing back into the app.
- Import: Done
- Export: Not Supported

### Moxfield

- No unique field unfortunately, but Archidekt lets me do scryfallId, so since Moxfield lets you import Archidekt, I may be able to cross-reference the two to create a mapping.
- How do they support so many import formats? Do they really? I'll need to cross-test these.
- Maybe all these sites fail importing when there are naming differences and categorization differences?

### Archidekt

- This one should be good, they export scryfallId.
- They set a good example on how to handle import formats.
- I should have a generic handler that can receive a hierarchy of fields and do its best to map them one step at a time.
- TODO TOMORROW: I'll probably try uploading all of magic to Archidekt and see how it does. Then try to export it back and cross-reference with Moxfield. If it works, I'll then make mappings. Although I should just implement Archidekt fully end-to-end, making sure that fallback logic is in place.
- I need a utility to generate sample files with every card in magic. duplicate scryfall ids will have to handle special foils.
- first test of 1 of each card from a set was great, just failed the ones without scryfall ids.
- a quick test with every card, 91 + 396 don't import. Some have scryfall ids which is surprising. But out of 92946 cards, that's not bad. 99.5% success rate.
- Having every card in magic breaks Archidekt. It won't let you export. I'll need to experimentally find the correct chunk size to export from there and then aggregate all the data to help me make moxfield mappings. I should be able to use AI to generate .csvs and then create the table mappings from there. Card name mappings and set name mappings per import/export source and card id and set id. If 1 match found, go for it. If multiple, skip and label the ambiguous ones.

csv generator for this test:

```sql
SELECT
       2                                            AS "Quantity",
       c."scryfallId"                               AS "Scryfall ID",
       CASE
           WHEN lower(c.name) LIKE '%foil%' THEN 'Foil'
           ELSE 'Normal'
       END                                          AS "Variant",
       c.name                                       AS "Card Name",
       s.name                                       AS "Set Name",
       s.code                                       AS "Set Code"
FROM   public."Card" AS c
JOIN   public."Set"  AS s ON s.id = c."setId"
WHERE  c."setId" IS NOT NULL
ORDER  BY c."setId",
          c."collectorNumberNumeric" NULLS LAST,
          c.id;
```
