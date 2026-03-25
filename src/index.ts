import 'dotenv/config';
import { fetchNews } from './fetcher';
import { summarizeItems } from './summarizer';
import { sendToSlack } from './slack';

function parseArgs(): { sinceHours: number; dryRun: boolean } {
  const args = process.argv.slice(2);
  let sinceHours = 24;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--since' && args[i + 1]) {
      sinceHours = parseInt(args[i + 1], 10);
      if (isNaN(sinceHours) || sinceHours <= 0) {
        console.error('❌ --since 값은 양의 정수여야 합니다.');
        process.exit(1);
      }
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { sinceHours, dryRun };
}

async function main(): Promise<void> {
  const { sinceHours, dryRun } = parseArgs();

  console.log(`\n🗞️  Claude Code Newsletter`);
  console.log(`   기간: 최근 ${sinceHours}시간 | 모드: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  // 1. RSS 수집
  const items = await fetchNews(sinceHours);

  if (items.length === 0) {
    console.log('📭 수집된 뉴스가 없습니다. 종료합니다.');
    process.exit(0);
  }

  // 2. AI 요약
  const summarized = await summarizeItems(items);

  // 3. Slack 발송
  await sendToSlack(summarized, dryRun);

  console.log('\n🎉 완료!\n');
}

main().catch((error) => {
  console.error('❌ 실행 실패:', error);
  process.exit(1);
});
