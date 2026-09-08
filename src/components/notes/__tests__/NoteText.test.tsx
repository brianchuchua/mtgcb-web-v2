import { render, screen } from '@testing-library/react';
import React from 'react';
import { NoteText } from '../NoteText';

describe('NoteText', () => {
  it('renders site-relative and https links as anchors', () => {
    render(<NoteText text="See [The List](/browse/sets/the-list) and [Scryfall](https://scryfall.com/sets/plst)." />);
    expect(screen.getByRole('link', { name: 'The List' })).toHaveAttribute('href', '/browse/sets/the-list');
    expect(screen.getByRole('link', { name: 'Scryfall' })).toHaveAttribute('href', 'https://scryfall.com/sets/plst');
  });

  it('renders an unsafe link as its label only', () => {
    render(<NoteText text="Do not [click](javascript:alert(1)) this." />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText(/click/)).toBeInTheDocument();
  });

  it('never interprets markup in the note', () => {
    const { container } = render(<NoteText text="<b>bold</b> stays literal" />);
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toContain('<b>bold</b> stays literal');
  });

  it('renders blank-line paragraphs as separate blocks', () => {
    const text = ['First paragraph.', '', 'Second paragraph.'].join('\n');
    const { container } = render(<NoteText text={text} />);
    const blocks = container.querySelectorAll('span');
    expect(blocks).toHaveLength(2);
    expect(blocks[0].textContent).toBe('First paragraph.');
    expect(blocks[1].textContent).toBe('Second paragraph.');
  });
});
