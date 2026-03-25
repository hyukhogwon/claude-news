import Groq from 'groq-sdk';
import type { NewsItem } from './fetcher';

const MODEL = 'llama-3.1-8b-instant';
const DELAY_MS = 300;

const SYSTEM_PROMPT = `You are an AI news editor writing for a Korean tech audience.
Summarize the given article in Korean, in 1-2 concise sentences.
Focus on what changed, what's new, or why it matters.
Do not include greetings or filler. Output only the summary text.`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function summarizeItems(
  items: NewsItem[]
): Promise<NewsItem[]> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.log('⚠️  GROQ_API_KEY 미설정 — 원문 요약 그대로 사용');
    return items;
  }

  const client = new Groq({ apiKey });

  console.log(`🤖 Groq (${MODEL})로 ${items.length}개 항목 요약 중...`);

  const summarized: NewsItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    try {
      const userContent = `제목: ${item.title}\n원문 요약: ${item.summary}`;

      const response = await client.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        max_tokens: 120,
        temperature: 0.3,
      });

      const aiSummary = response.choices[0]?.message?.content?.trim();
      summarized.push({
        ...item,
        summary: aiSummary || item.summary,
      });
    } catch (error) {
      console.warn(
        `⚠️  요약 실패 (${item.title}):`,
        (error as Error).message
      );
      summarized.push(item);
    }

    if (i < items.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`✅ 요약 완료`);
  return summarized;
}
