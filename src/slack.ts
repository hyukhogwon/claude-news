import https from 'https';
import http from 'http';
import { URL } from 'url';
import type { NewsItem } from './fetcher';
import { CATEGORY_EMOJI, type Category } from './sources';

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: Array<{ type: string; text: string }>;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

const CATEGORY_LABELS: Record<Category, string> = {
  release: '릴리즈',
  blog: '공식 블로그',
  community: '커뮤니티',
};

function buildBlocks(items: NewsItem[]): SlackBlock[] {
  const blocks: SlackBlock[] = [];
  const today = formatDate(new Date());

  // Header
  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: `📰 Claude Code Daily News — ${today}`,
      emoji: true,
    },
  });

  blocks.push({ type: 'divider' });

  // Group by category
  const grouped = new Map<Category, NewsItem[]>();
  for (const item of items) {
    const list = grouped.get(item.category) || [];
    list.push(item);
    grouped.set(item.category, list);
  }

  // Category order
  const categoryOrder: Category[] = ['release', 'blog', 'community'];

  for (const category of categoryOrder) {
    const categoryItems = grouped.get(category);
    if (!categoryItems || categoryItems.length === 0) continue;

    const emoji = CATEGORY_EMOJI[category];
    const label = CATEGORY_LABELS[category];

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} *${label}*`,
      },
    });

    for (const item of categoryItems) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<${item.link}|${item.title}>*\n${item.summary}`,
        },
      });
    }

    blocks.push({ type: 'divider' });
  }

  // Footer
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `총 ${items.length}개 항목 | AI 요약: Groq llama-3.1-8b-instant | <https://github.com/anthropics/claude-code/releases|Claude Code Releases>`,
      },
    ],
  });

  return blocks;
}

function postJson(webhookUrl: string, payload: object): Promise<void> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const parsed = new URL(webhookUrl);
    const transport = parsed.protocol === 'https:' ? https : http;

    const req = transport.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`Slack responded ${res.statusCode}: ${body}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

export async function sendToSlack(
  items: NewsItem[],
  dryRun: boolean = false
): Promise<void> {
  const blocks = buildBlocks(items);
  const payload = { blocks };

  if (dryRun) {
    console.log('\n🔍 [DRY RUN] Slack 메시지 미리보기:\n');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('SLACK_WEBHOOK_URL 환경변수가 설정되지 않았습니다.');
  }

  await postJson(webhookUrl, payload);
  console.log('✅ Slack 발송 완료');
}
