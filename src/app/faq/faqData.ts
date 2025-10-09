interface FAQItem {
  question: string;
  answer: string;
  category?: 'pricing' | 'data' | 'general' | 'technical';
}

interface FAQData {
  faqs: FAQItem[];
}

const faqData: FAQData = {
  faqs: [
    {
      question: 'Where do you get your prices from?',
      answer: `
        <p>All card prices are sourced directly from <strong>TCGPlayer</strong>.</p>
        
        <p>The site displays market prices by default, which represent a fair selling price of cards. 
        This gives you a realistic estimate of what your cards are worth in the current market, 
        although you can change which price to use in your account settings.</p>
      `,
      category: 'pricing',
    },
    {
      question: 'How often are prices updated?',
      answer: `
        <p>Prices are updated <strong>every 24 hours</strong>.</p>
        <p>You can see when a card's price was last updated on its card page.</p>
      `,
      category: 'pricing',
    },
    {
      question: 'Why are some cards missing prices or have incorrect prices?',
      answer: `
        <p>That card may not yet be linked up to TCGPlayer, or it's so low-volume that there are 
        none up for sale on TCGPlayer, or a vendor made a typo in TCGPlayer.</p>

        <p>These issues usually clear up every 24 hours, but if you see a persistent one, reach out to me.</p>
      `,
      category: 'pricing',
    },
    {
      question: 'What are market, low, average, high, and foil prices? ',
      answer: `
        <p>These are all price types provided by TCGPlayer.</p>

        <ul>
          <li><strong>Market</strong> is a fair selling price based on recent sales of the card.</li>
          <li><strong>Low</strong> is the lowest listing price currently available on TCGPlayer.</li>
          <li><strong>Average</strong> is the average listing price currently available on TCGPlayer.</li>
          <li><strong>High</strong> is the highest listing price currently available on TCGPlayer.</li>
          <li><strong>Foil</strong> is the price of a foil version of the card, if available. (There isn't a market, low, average, or high price for foils.)</li>
        </ul>

        <p>You can choose which price type to use for your collection in your account settings. I personally recommend Market price.</p>
      `,
      category: 'pricing',
    },
    {
      question: 'How is my collection value calculated?',
      answer: `
        <p>Your collection value is calculated by adding up the current value of every card you own, based on pricing data from TCGPlayer that is updated every 24 hours. We use your preferred price type for the calculation, which defaults to Market price. You can change this setting in the Account page.</p>

        <p><strong>The formula is simple:</strong></p>

        <p>For each card in your collection, we multiply the quantity you own by the card's current price, then sum everything together.</p>

        <pre style="background: rgba(0, 0, 0, 0.05); padding: 12px; border-radius: 4px; overflow-x: auto; border: 1px solid rgba(0, 0, 0, 0.1);">Collection Value = Σ (Regular Quantity × Regular Price) + (Foil Quantity × Foil Price)</pre>

        <p><strong>Example:</strong></p>
        <ul>
          <li>You own 1 Black Lotus worth $5,000 → contributes $5,000</li>
          <li>You own 4 regular Lightning Bolts at $0.50 each → contributes $2.00</li>
          <li>You own 1 foil Lightning Bolt at $2.00 → contributes $2.00</li>
          <li><strong>Total Collection Value: $5,004.00</strong></li>
        </ul>

        <p><strong>Price types:</strong></p>

        <p>You can choose which TCGPlayer price to use in your settings:</p>
        <ul>
          <li><strong>Market Price</strong> (default)</li>
          <li><strong>Low Price</strong></li>
          <li><strong>Average Price</strong></li>
          <li><strong>High Price</strong></li>
        </ul>

        <p><strong>What if a card has no price data?</strong></p>

        <p>We automatically fall back through available prices: Market → Low → Average → High → Foil → $0.00. This ensures every card gets a fair valuation. There are some cards entirely missing price data, either due to low volume or an issue with its connection to TCGPlayer (sometimes vendors make typos and the price becomes too high), so be sure to double-check everything (perhaps with a spreadsheet export) before making any financial decisions.</p>

        <p><strong>Note:</strong> Your collection value includes <em>all</em> cards you own, regardless of what you're currently viewing or searching for. When viewing a specific goal, you'll see a separate "Goal Value" that shows only cards within that goal.</p>
      `,
      category: 'pricing',
    },
    {
      question: 'Why is this card or set missing?',
      answer: `
        <p>It's probably on my TODO list to add. I'm pretty good about adding new cards before or on 
        release dates, but there is a backlog of miscellaneous cards to support, not to mention the 
        eventual project to support all language printings of all cards.</p>

        <p>Feel free to contact me if a particular set or card is important to you. I can update you 
        on its status.</p>
      `,
      category: 'data',
    },
    {
      question: 'Who are you?',
      answer: `
        <p>Hi, I'm <strong>Brian</strong>! Although you may see me as <strong>Manath</strong> on Discord or on MTG Arena. I'm a software engineer.</p>

        <p>I developed the original <strong>MTG Collection Builder</strong> in college after being inspired by MTG Studio, 
        the app I used at the time, but wishing that I could see progress bars for my collection and its value.</p>

        <p>I also wanted to be able to press a button to automatically add to cart any cards I was missing 
        for a specific set -- and to know how much that would cost me.</p>

        <p>I had fun using it, although the first version didn't even have an account system, just input spreadsheet -> get an output. As part of giving me access to their data, TCGPlayer put a little link to the site on their site menu.</p>

        <p>To my surprise, I started getting users! And emails politely asking for basic features, and it eventually blossomed to a full-fledged side project.</p>

        <p>It's grown a lot since then, and after three full rewrites of the platform, I'm happy to <em>finally</em> release this new-and-improved version.</p>

        <p>Don't be shy about reaching out if you have feedback or need anything. There's an infinite number of features I can add, and even though I'm just a solo developer, I do want to hear what you'd like to see.</p>

        <p>Happy collecting!</p>
      `,
      category: 'general',
    },
    {
      question: `What is the best Magic format?`,
      answer: `<p><s>There isn't a definitive answer to this question since it all depends on personal preference and--</s></p><p>Just kidding, it's Booster Draft.</p><p>Speaking more seriously, it's a format where you get to collect <em>and</em> play at the same time, build different decks, and where more cards are playable than any constructed format. And the experience changes every few months! And you can sometimes make a profit with prizing or a lucky pull!</p>`,
      category: 'general',
    },
  ],
};

export const getFAQsByCategory = (category: FAQItem['category']): FAQItem[] => {
  return faqData.faqs.filter((faq) => faq.category === category);
};

export default faqData;
