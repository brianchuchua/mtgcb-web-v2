'use client';

import { Box, Typography, Divider, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import faqData from './faqData';

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
}));

export default function FAQPage() {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Frequently Asked Questions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find answers to common questions about MTG Collection Builder
        </Typography>
      </Box>

      {faqData.faqs.map((faq, index) => (
        <Accordion
          key={index}
          expanded={expanded === `panel${index}`}
          onChange={handleChange(`panel${index}`)}
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
            aria-controls={`panel${index}bh-content`}
            id={`panel${index}bh-header`}
            sx={{ 
              px: 3,
              py: 2,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <QuestionText>{faq.question}</QuestionText>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, py: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <AnswerContent dangerouslySetInnerHTML={{ __html: faq.answer }} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}