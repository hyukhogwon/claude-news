import Parser from 'rss-parser';
import { RSS_SOURCES, type Category, type RssSource } from './sources';

export interface NewsItem {
  title: string;
  link: string;
  summary: string;
  published: Date;
  source: string;
  category: Category;
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'claude-news-bot/1.0',
  },
});

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchFromSource(
  source: RssSource,
  sinceDate: Date
): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const items: NewsItem[] = [];

    for (const entry of feed.items) {
      const published = entry.pubDate ? new Date(entry.pubDate) : null;
      if (!published || published < sinceDate) continue;

      const rawSummary =
        entry.contentSnippet || entry.content || entry.summary || '';
      const summary = stripHtml(rawSummary).slice(0, 500);

      items.push({
        title: entry.title || '(제목 없음)',
        link: entry.link || '',
        summary,
        published,
        source: source.name,
        category: source.category,
      });
    }

    items.sort((a, b) => b.published.getTime() - a.published.getTime());
    return items.slice(0, source.maxItems);
  } catch (error) {
    console.warn(`⚠️  ${source.name} 수집 실패:`, (error as Error).message);
    return [];
  }
}

export async function fetchNews(sinceHours: number = 24): Promise<NewsItem[]> {
  const sinceDate = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

  console.log(
    `📡 ${RSS_SOURCES.length}개 소스에서 최근 ${sinceHours}시간 뉴스 수집 중...`
  );

  const results = await Promise.allSettled(
    RSS_SOURCES.map((source) => fetchFromSource(source, sinceDate))
  );

  const allItems: NewsItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  }

  allItems.sort((a, b) => b.published.getTime() - a.published.getTime());

  console.log(`✅ 총 ${allItems.length}개 항목 수집 완료`);
  return allItems;
}
