export type Category = 'release' | 'blog' | 'community';

export type SourceType = 'rss' | 'reddit_json';

export interface RssSource {
  name: string;
  category: Category;
  url: string;
  maxItems: number;
  type: SourceType;
}

export const CATEGORY_EMOJI: Record<Category, string> = {
  release: '🚀',
  blog: '📝',
  community: '💬',
};

export const RSS_SOURCES: RssSource[] = [
  {
    name: 'Claude Code GitHub Releases',
    category: 'release',
    url: 'https://github.com/anthropics/claude-code/releases.atom',
    maxItems: 3,
    type: 'rss',
  },
  {
    name: 'Anthropic & Claude News',
    category: 'blog',
    url: 'https://news.google.com/rss/search?q=anthropic+claude&hl=en&gl=US&ceid=US:en',
    maxItems: 3,
    type: 'rss',
  },
  {
    name: 'r/ClaudeAI',
    category: 'community',
    url: 'https://www.reddit.com/r/ClaudeAI/top.json?t=day&limit=5',
    maxItems: 3,
    type: 'reddit_json',
  },
  {
    name: 'Hacker News - Claude',
    category: 'community',
    url: 'https://hnrss.org/newest?q=claude+code&points=10',
    maxItems: 3,
    type: 'rss',
  },
];
