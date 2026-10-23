import { render, screen } from '@testing-library/react';
import { formatManaCost, formatSymbolText } from '@/utils/manaFormatter';

describe('formatManaCost', () => {
  it.each([null, undefined, ''])('renders nothing for %p', (input) => {
    expect(formatManaCost(input)).toBeNull();
  });

  it('renders each symbol as a labelled icon inside a mana-cost span', () => {
    const { container } = render(<>{formatManaCost('{2}{W}{U}')}</>);

    const wrapper = container.querySelector('span.mana-cost');
    expect(wrapper).not.toBeNull();

    const icons = screen.getAllByRole('img');
    expect(icons.map((icon) => icon.getAttribute('aria-label'))).toEqual([
      '2 Generic Mana',
      'White Mana',
      'Blue Mana',
    ]);
    expect(icons[1]).toHaveClass('ms', 'ms-w', 'ms-cost');
    expect(icons[1]).toHaveAttribute('title', '{W}');
    expect(icons[1]).toHaveStyle({ margin: '0 0.125rem' });
  });
});

describe('formatSymbolText', () => {
  it.each([null, undefined, ''])('renders nothing for %p', (input) => {
    expect(formatSymbolText(input)).toBeNull();
  });

  it('keeps rules text around inline symbols', () => {
    const { container } = render(<p>{formatSymbolText('{T}: Add {G}.')}</p>);

    expect(container.textContent).toBe(': Add .');
    const icons = screen.getAllByRole('img');
    expect(icons.map((icon) => icon.getAttribute('aria-label'))).toEqual(['Tap', 'Green Mana']);
    expect(icons[0]).toHaveClass('ms-tap');
    expect(icons[0]).toHaveStyle({ fontSize: '0.9em' });
  });

  it('uses cost spacing when asked', () => {
    render(<p>{formatSymbolText('{R}', 'cost')}</p>);

    expect(screen.getByRole('img')).toHaveStyle({ margin: '0 0.125rem' });
  });

  it('leaves unknown symbols as text', () => {
    const { container } = render(<p>{formatSymbolText('Pay {FOO}.')}</p>);

    expect(container.textContent).toBe('Pay {FOO}.');
    expect(screen.queryByRole('img')).toBeNull();
  });
});
