# Claude Code Newsletter

Claude Code 및 Anthropic 관련 최신 소식을 자동으로 수집하여 Slack 채널에 매일 발송하는 뉴스 다이제스트 시스템입니다.

## 아키텍처

```
GitHub Actions (평일 KST 09:00)
 └─ 1. RSS 수집       (fetcher.ts)
       ├─ Claude Code GitHub Releases
       ├─ Anthropic Blog
       ├─ r/ClaudeAI (Reddit)
       └─ Hacker News (claude+code, 10점 이상)
 └─ 2. AI 요약        (summarizer.ts)
       └─ Groq API → llama-3.1-8b-instant
 └─ 3. Slack 발송     (slack.ts)
       └─ Incoming Webhook → Block Kit 카드
```

## 기술 스택

| 항목 | 기술 |
|------|------|
| Runtime | Node.js 20, TypeScript |
| RSS 파싱 | rss-parser |
| AI 요약 | Groq Cloud API (llama-3.1-8b-instant) |
| 알림 | Slack Incoming Webhook (Block Kit) |
| 스케줄 | GitHub Actions cron |

## 설정

### 1. 환경변수

```bash
cp .env.example .env
```

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `GROQ_API_KEY` | 선택 | [Groq Cloud API 키](https://console.groq.com/keys). 없으면 원문 그대로 발송 |
| `SLACK_WEBHOOK_URL` | 필수 | Slack Incoming Webhook URL |

### 2. GitHub Secrets 등록

**Settings → Secrets and variables → Actions**에서 등록:

- `GROQ_API_KEY`: [console.groq.com/keys](https://console.groq.com/keys)
- `SLACK_WEBHOOK_URL`: Slack 앱 → Incoming Webhooks

## 사용법

### 로컬 실행

```bash
npm install
npm run send -- --dry-run            # 로그만 (Slack 미발송)
npm run send                          # 실제 발송
npm run send -- --since 48            # 48시간 이내 항목
```

### GitHub Actions 수동 실행

Actions 탭 → **Claude Code Newsletter** → **Run workflow** → `since_hours` / `dry_run` 옵션 선택

## RSS 소스

| 소스 | 카테고리 | URL |
|------|----------|-----|
| Claude Code GitHub Releases | 🚀 릴리즈 | `github.com/anthropics/claude-code/releases.atom` |
| Anthropic Blog | 📝 공식 블로그 | `anthropic.com/rss.xml` |
| r/ClaudeAI | 💬 커뮤니티 | `reddit.com/r/ClaudeAI/top/.rss?t=day` |
| Hacker News - Claude | 💬 커뮤니티 | `hnrss.org/newest?q=claude+code&points=10` |

## 확장

- **소스 추가**: `src/sources.ts`에 URL과 카테고리 추가
- **모델 교체**: `src/summarizer.ts`의 `MODEL` 값 변경
- **주간 다이제스트**: cron 변경 + `--since 168`
- **다중 채널**: `SLACK_WEBHOOK_URL` 복수 지원으로 확장 가능

## 라이선스

MIT
