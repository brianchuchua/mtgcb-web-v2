'use client';

import { Box, Link } from '@mui/material';
import NextLink from 'next/link';
import React from 'react';

interface NoteTextProps {
  text: string;
}

/**
 * Renders a site-authored note. Notes are plain text with two affordances the authors need:
 * blank-line paragraphs and Markdown-style links `[label](/browse/sets/the-list)`.
 * Only site-relative paths and https URLs become links; anything else renders as its label.
 * Nothing is parsed as HTML, so a note can never inject markup.
 */
export const NoteText: React.FC<NoteTextProps> = ({ text }) => {
  const paragraphs = text.split(/\n\s*\n/).filter((paragraph) => paragraph.trim() !== '');

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <Box key={index} component="span" sx={{ display: 'block', mt: index > 0 ? 1 : 0 }}>
          {renderInline(paragraph)}
        </Box>
      ))}
    </>
  );
};

const LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;

const isSafeHref = (href: string) => href.startsWith('/') || href.startsWith('https://');

function renderInline(paragraph: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  LINK_PATTERN.lastIndex = 0;
  while ((match = LINK_PATTERN.exec(paragraph)) !== null) {
    const [whole, label, href] = match;
    if (match.index > lastIndex) {
      nodes.push(paragraph.slice(lastIndex, match.index));
    }
    nodes.push(
      isSafeHref(href) ? (
        <Link
          key={`${match.index}-${href}`}
          component={NextLink}
          href={href}
          sx={{ color: 'inherit', textDecorationColor: 'currentColor', '&:hover': { color: 'primary.main' } }}
        >
          {label}
        </Link>
      ) : (
        label
      ),
    );
    lastIndex = match.index + whole.length;
  }
  if (lastIndex < paragraph.length) {
    nodes.push(paragraph.slice(lastIndex));
  }

  return nodes.map((node, index) =>
    typeof node === 'string' ? <React.Fragment key={`t-${index}`}>{node}</React.Fragment> : node,
  );
}
