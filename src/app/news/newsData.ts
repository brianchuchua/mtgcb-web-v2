interface NewsItem {
  date: string;
  title: string;
  category: 'feature' | 'news';
  content: string;
  author?: string;
}

interface NewsData {
  articles: NewsItem[];
}

const newsData: NewsData = {
  articles: [
    {
      date: '2025-10-15',
      title: 'MTG Collection Builder v1.0 Official Launch',
      category: 'news',
      content: `
        <p>MTG Collection Builder v1.0 is officially launched! 🎉</p>
        <p>After months of beta testing and valuable feedback from our amazing community and Patreon supporters, I'm happy to finally bring you the new MTG CB!</p>
        <p>Special thanks to all beta testers who helped make this release possible. Your feedback has been invaluable in shaping the platform into what it is today.</p>
        <p>Welcome to v1.0 - feel free to reach out to me with feedback (or to yell at me when you find a bug)!</p>
      `,
      author: 'MTG CB Team',
    },
    {
      date: '2025-08-10',
      title: 'MTG Collection Builder Beta Launch',
      category: 'news',
      content: `
        <p>The latest version of the MTG Collection Builder beta is now live for beta testing!</p>
        <p>With it comes support for <strong>custom collection goals</strong>, <strong>card locations</strong>, <strong>subsets</strong>, and a greatly enhanced <strong>importer and exporter</strong>.</p>
        <p>There are still a few finishing touches to make and loads of testing, but feel free to poke around and let me know what you think!</p>
      `,
      author: 'MTG CB Team',
    },
  ],
};

export const getLatestNews = (count: number = 3): NewsItem[] => {
  return newsData.articles.slice(0, count);
};

export const getNewsByCategory = (category: NewsItem['category']): NewsItem[] => {
  return newsData.articles.filter((article) => article.category === category);
};

export default newsData;
