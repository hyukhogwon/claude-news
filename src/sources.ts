export type Category = 'release' | 'blog' | 'community';

export interface RssSource {
  name: string;
  category: Category;
  url: string;
  maxItems: number;
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
  },
  {
    name: 'Anthropic Blog',
    category: 'blog',
    url: 'https://www.anthropic.com/rss.xml',
    maxItems: 3,
  },
  {
    name: 'r/ClaudeAI',
    category: 'community',
    url: 'https://www.reddit.com/r/ClaudeAI/top/.rss?t=day',
    maxItems: 3,
  },
  {
    name: 'Hacker News - Claude',
    category: 'community',
    url: 'https://hnrss.org/newest?q=claude+code&points=10',
    maxItems: 3,
  },
];
