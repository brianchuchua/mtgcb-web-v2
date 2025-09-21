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
