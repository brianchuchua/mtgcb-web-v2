'use client';

import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Divider, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState } from 'react';

const QuestionText = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1.1rem',
}));

const AnswerContent = styled(Box)(({ theme }) => ({
  '& p': {
    margin: 0,
    marginBottom: theme.spacing(2),
    lineHeight: 1.7,
    '&:last-child': {
      marginBottom: 0,
    },
  },
  '& ul': {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
    paddingLeft: theme.spacing(3),
    '& li': {
      marginBottom: theme.spacing(0.5),
      lineHeight: 1.6,
    },
  },
  '& strong': {
    fontWeight: 600,
    color: theme.palette.primary.main,
  },
  '& em': {
    fontStyle: 'italic',
  },
}));

export default function DraftCubesPage() {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Draft Cubes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          A great way to draft great sets for free after initial investment
        </Typography>
      </Box>

      <Accordion
        expanded={expanded === 'what-is'}
        onChange={handleChange('what-is')}
        elevation={0}
        sx={{
          marginBottom: 2,
          overflow: 'hidden',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '0 0 16px 0',
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            px: 3,
            py: 2,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <QuestionText>What is a Draft Cube?</QuestionText>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 3, py: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <AnswerContent>
            <p>
              A Draft Cube is a sleeved collection of cards (4x of every Common/Uncommon, 1x of every Rare/Mythic) from
              a set that allows you to create simulated booster packs in order to play <em>free</em> Limited (Booster
              Draft/Sealed) games of those formats long after they've gone out of print!
            </p>
            <p>
              Miss Innistrad drafts, but don't want to shell out a fortune for a sealed booster box? Build a Draft Cube
              and you can effectively draft Innistrad for free, forever!
            </p>
          </AnswerContent>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === 'how-different'}
        onChange={handleChange('how-different')}
        elevation={0}
        sx={{
          marginBottom: 2,
          overflow: 'hidden',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '0 0 16px 0',
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            px: 3,
            py: 2,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <QuestionText>How is that different from a regular cube?</QuestionText>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 3, py: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <AnswerContent>
            <p>
              Regular cubes tend to be singleton formats, with cards from a variety of sets, designed to highlight the
              most famous and powerful cards in Magic.
            </p>
            <p>
              Draft Cubes seek to simulate actual draft formats (Innistrad, Return to Ravnica, etc) by building
              randomized booster packs with cards from those sets.
            </p>
          </AnswerContent>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === 'why-build'}
        onChange={handleChange('why-build')}
        elevation={0}
        sx={{
          marginBottom: 2,
          overflow: 'hidden',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '0 0 16px 0',
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            px: 3,
            py: 2,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <QuestionText>Why build a Draft Cube?</QuestionText>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 3, py: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <AnswerContent>
            <p>
              It allows you to <em>use</em> your collection, and is a great motivator for future collecting. My personal
              collection goal is to collect a Draft Cube of every set in Magic, ever!
            </p>
            <p>
              My wife and I host "Tours of Magic" for our friends sometimes, where we have a Draft Cube ready to
              introduce them to older draft formats they never had a chance to play. It's a great way to share the
              experience of Magic's rich past and history, especially for players that are hesitant to spend money on
              Magic cards, but love the game. It's why I added a "Buy draft cube" option to MTG CB.
            </p>
          </AnswerContent>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === 'how-much'}
        onChange={handleChange('how-much')}
        elevation={0}
        sx={{
          marginBottom: 2,
          overflow: 'hidden',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '0 0 16px 0',
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            px: 3,
            py: 2,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <QuestionText>How much does it cost?</QuestionText>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 3, py: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <AnswerContent>
            <p>
              It depends on the set (for recent sets, it ranges from $60 to $180), although you can always proxy any
              super-expensive cards and just buy the less expensive ones, depending on your collection goals.
            </p>
            <p>
              If you have a MTG Collection Builder account and you're logged in, you can complete a Draft Cube straight
              from your collection page. It'll take into account any cards you currently own, from that specific set
              only.
            </p>
          </AnswerContent>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === 'how-build'}
        onChange={handleChange('how-build')}
        elevation={0}
        sx={{
          marginBottom: 2,
          overflow: 'hidden',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '0 0 16px 0',
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            px: 3,
            py: 2,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <QuestionText>How do I build a Draft Cube?</QuestionText>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 3, py: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <AnswerContent>
            <p>
              First, buy or trade your way into having 4x of every Common, 4x of every Uncommon, and 1x of each Rare and
              Mythic Rare. Feel free to proxy expensive cards, if desired.
            </p>
            <p>
              Next, you'll want to sleeve up all the cards you'll be using in the cube, making sure to keep separate
              piles for each rarity.
            </p>
            <p>
              (Depending on the number of players playing, how much variability you want to see, and ultimately how many
              cards you feel like sleeving, you can choose to sleeve only 3x of every Common, and/or 2x of every
              Uncommon instead. Set aside any cards you don't sleeve; they won't be used in the cube.)
            </p>
            <p>
              <strong>My recommendation:</strong>
            </p>
            <ul>
              <li>Sleeve 4x of every Common.</li>
              <li>Sleeve 2x of every Uncommon.</li>
              <li>Sleeve 1x of every Rare and Mythic.</li>
            </ul>
            <p>
              I've found that this combination reduces the chances of seeing 4x of a particular Uncommon and none of
              another in a draft, and conserves sleeves. It's nice to have 4x Uncommons on hand, however, for larger
              groups. You may need to adjust the numbers depending on the format, set and number of players, to ensure
              that you have enough cards to build the necessary number of booster packs. Each booster pack will require
              10 random Commons, 3 random Uncommons, and 1 random Rare or Mythic Rare. Feel free to experiment!
            </p>
            <p>
              Once you have each card sleeved, and in its own rarity pile, randomize all of the cards within their
              rarity.
            </p>
            <p>
              Then store them in your preferred cube storage box, keeping each rarity separate from the other. (Don't
              forget to have plenty of basic lands! Preferably pre-sleeved.)
            </p>
          </AnswerContent>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === 'how-use'}
        onChange={handleChange('how-use')}
        elevation={0}
        sx={{
          marginBottom: 2,
          overflow: 'hidden',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '0 0 16px 0',
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            px: 3,
            py: 2,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <QuestionText>How do I use a Draft Cube?</QuestionText>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 3, py: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <AnswerContent>
            <p>
              When you're ready to play, count the number of players, and the number of booster packs you'll need per
              player (3 for Booster Draft, 6 for Sealed). Multiply those numbers, and that's how many booster packs
              you'll need. So if you have 8 players drafting, you'll need 8x3 = 24 packs.
            </p>
            <p>
              Then, after ensuring that each rarity group in your Draft Cube is adequately randomized, build each
              booster pack pile using:
            </p>
            <ul>
              <li>10 random Commons</li>
              <li>3 random Uncommons</li>
              <li>1 random Rare or Mythic Rare</li>
            </ul>
            <p>
              (Note: The above is true for sets that had standard booster packs. Some older sets had booster packs with
              fewer cards. Do your research and match accordingly!)
            </p>
            <p>
              One out of 8 packs should have a Mythic Rare instead of a Rare. You can determine this by rolling a d8 for
              each pack, or just make sure that 1/8th of them have a Mythic Rare instead of a Rare. In the case of 24
              packs, 3 should have a Mythic Rare instead of a Rare.
            </p>
            <p>
              And you're all set! Have your players pick out each booster pack pile, ensuring they do not accidentally
              mix them up (optionally, you can use a ribbon or small storage boxes to "seal" each pack), and use them to
              play Booster Drafts or Sealed as desired.
            </p>
            <p>
              When you're done playing, have the players separate out their cards by rarity, and re-shuffle them back
              into the appropriate rarity sections of your Draft Cube.
            </p>
          </AnswerContent>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === 'faq-multiple-sets'}
        onChange={handleChange('faq-multiple-sets')}
        elevation={0}
        sx={{
          marginBottom: 2,
          overflow: 'hidden',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '0 0 16px 0',
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            px: 3,
            py: 2,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <QuestionText>What if I want to draft a format with multiple sets, like Dragons of Tarkir?</QuestionText>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 3, py: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <AnswerContent>
            <p>
              Build a Draft Cube for each set in the format, and create booster packs out of each Draft Cube as
              appropriate. (In the case of Dragons of Tarkir Booster Draft, you'd need 2x Dragons of Tarkir boosters,
              and 1x Fate Reforged booster.)
            </p>
          </AnswerContent>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === 'faq-special-cases'}
        onChange={handleChange('faq-special-cases')}
        elevation={0}
        sx={{
          marginBottom: 2,
          overflow: 'hidden',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '0 0 16px 0',
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            px: 3,
            py: 2,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <QuestionText>
            How do you handle special cases, like double-sided cards being public information in Innistrad drafts and
            being guaranteed in every pack?
          </QuestionText>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 3, py: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <AnswerContent>
            <p>
              Like Magic Online, I ignore them and don't sweat it. You still get the great gaming experience and
              simulate the draft format "close enough". You're always welcome to have those cards start off unsleeved,
              however, and guarantee one in each pack. However much work you feel like putting into it!
            </p>
          </AnswerContent>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
