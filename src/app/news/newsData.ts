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
      date: '2025-08-10',
      title: 'MTG Collection Builder Beta Launch',
      category: 'news',
      content:
        '<p>The latest version of the MTG Collection Builder beta is now live!</p><p>With it comes support for <strong>custom collection goals</strong>, <strong>card locations</strong>, <strong>subsets</strong>, and a greatly enhanced <strong>importer and exporter</strong>.</p><p>There are still a few finishing touches to make and loads of testing, but feel free to poke around and let me know what you think!</p>',
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
