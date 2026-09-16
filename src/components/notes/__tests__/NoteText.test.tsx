import { render, screen } from '@testing-library/react';
import React from 'react';
import { NoteText } from '../NoteText';
import { mockNextNavigation, resetAllMocks } from '@/__tests__/utils/mockHelpers';
import { useAuth } from '@/hooks/useAuth';
import { setShareModeConfig } from '@/utils/collectionUrls';

jest.mock('@/hooks/useAuth');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const signedInAs = (userId: number | null) => {
  mockedUseAuth.mockReturnValue({
    user: userId === null ? null : ({ userId } as any),
    isAuthenticated: userId !== null,
    isLoading: false,
    logout: jest.fn(),
    updateUser: jest.fn(),
  } as any);
};

describe('NoteText', () => {
  beforeEach(() => {
    signedInAs(null);
    mockNextNavigation({ pathname: '/browse/sets/the-list' });
  });

  afterEach(() => {
    resetAllMocks();
    setShareModeConfig(false, null);
  });

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

  describe('collection-aware links', () => {
    it('points a signed-in reader at their own collection while browsing', () => {
      signedInAs(42);
      render(
        <NoteText text="[Sol Ring](/browse/cards/sol-ring/71320) is in [Mystery Booster](/browse/sets/mystery-booster)." />,
      );
      expect(screen.getByRole('link', { name: 'Sol Ring' })).toHaveAttribute(
        'href',
        '/collections/42/cards/sol-ring/71320',
      );
      expect(screen.getByRole('link', { name: 'Mystery Booster' })).toHaveAttribute(
        'href',
        '/collections/42/mystery-booster',
      );
    });

    it('leaves the links on browse for a signed-out reader', () => {
      render(<NoteText text="[Sol Ring](/browse/cards/sol-ring/71320)" />);
      expect(screen.getByRole('link', { name: 'Sol Ring' })).toHaveAttribute('href', '/browse/cards/sol-ring/71320');
    });

    it('stays in the collection being viewed on a collection page', () => {
      signedInAs(42);
      mockNextNavigation({ pathname: '/collections/9/the-list' });
      render(<NoteText text="[Sol Ring](/browse/cards/sol-ring/71320)" />);
      expect(screen.getByRole('link', { name: 'Sol Ring' })).toHaveAttribute(
        'href',
        '/collections/9/cards/sol-ring/71320',
      );
    });

    it('stays inside the share token on a shared page', () => {
      signedInAs(42);
      sessionStorage.setItem('mtgcb_share_user', JSON.stringify('9'));
      setShareModeConfig(true, 'abc123');
      mockNextNavigation({ pathname: '/shared/abc123/the-list' });
      render(<NoteText text="[Mystery Booster](/browse/sets/mystery-booster)" />);
      expect(screen.getByRole('link', { name: 'Mystery Booster' })).toHaveAttribute(
        'href',
        '/shared/abc123/mystery-booster',
      );
    });

    it('still leaves external links untouched when signed in', () => {
      signedInAs(42);
      render(<NoteText text="[Scryfall](https://scryfall.com/sets/plst)" />);
      expect(screen.getByRole('link', { name: 'Scryfall' })).toHaveAttribute('href', 'https://scryfall.com/sets/plst');
    });
  });
});
