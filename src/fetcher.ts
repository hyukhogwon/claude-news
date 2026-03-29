import https from 'https';
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

const USER_AGENT = 'claude-news-bot/1.0 (https://github.com/hyukhogwon/claude-news)';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': USER_AGENT,
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

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        if (location) return httpGet(location).then(resolve, reject);
      }
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        return reject(new Error(`Status code ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function fetchFromReddit(
  source: RssSource,
  sinceDate: Date
): Promise<NewsItem[]> {
  const body = await httpGet(source.url);
  const json = JSON.parse(body);
  const posts = json?.data?.children || [];
  const items: NewsItem[] = [];

  for (const post of posts) {
    const d = post.data;
    if (!d) continue;

    const published = new Date(d.created_utc * 1000);
    if (published < sinceDate) continue;

    items.push({
      title: d.title || '(제목 없음)',
      link: `https://www.reddit.com${d.permalink}`,
      summary: stripHtml(d.selftext || d.title || '').slice(0, 500),
      published,
      source: source.name,
      category: source.category,
    });
  }

  items.sort((a, b) => b.published.getTime() - a.published.getTime());
  return items.slice(0, source.maxItems);
}

async function fetchFromRss(
  source: RssSource,
  sinceDate: Date
): Promise<NewsItem[]> {
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
}

async function fetchFromSource(
  source: RssSource,
  sinceDate: Date
): Promise<NewsItem[]> {
  try {
    if (source.type === 'reddit_json') {
      return await fetchFromReddit(source, sinceDate);
    }
    return await fetchFromRss(source, sinceDate);
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
