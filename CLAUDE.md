# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Automated newsletter system that collects Claude Code / Anthropic news from RSS feeds, summarizes them with Groq LLM, and posts to Slack via Incoming Webhook. Runs on GitHub Actions cron (weekdays KST 09:00).

## Commands

```bash
npm install              # install dependencies
npm run build            # tsc → dist/
npm run send             # collect + summarize + send to Slack
npm run send -- --dry-run          # preview only (no Slack post)
npm run send -- --since 48         # collect items from last 48 hours
npm run send -- --since 48 --dry-run  # combine flags
```

## Architecture

Pipeline: `index.ts` (CLI + orchestrator) → `fetcher.ts` (RSS collect) → `summarizer.ts` (Groq AI summary) → `slack.ts` (Webhook post)

- **`src/sources.ts`** — RSS source definitions and `Category` type (`release | blog | community`). Add new sources here.
- **`src/fetcher.ts`** — Two fetch strategies: `fetchFromRss` (standard RSS) and `fetchFromReddit` (Reddit JSON API). Exports `NewsItem` interface used throughout.
- **`src/summarizer.ts`** — Groq API with `llama-3.1-8b-instant`. Gracefully degrades (skips summarization) when `GROQ_API_KEY` is missing.
- **`src/slack.ts`** — Builds Slack Block Kit payload, groups items by category. Uses raw `https` module (no axios/fetch).

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GROQ_API_KEY` | No | Groq Cloud API key; without it, raw summaries are used |
| `SLACK_WEBHOOK_URL` | Yes (for live send) | Slack Incoming Webhook URL |

## Key Conventions

- No external HTTP client library — uses Node.js built-in `https` module for all HTTP requests
- Korean-language output for Slack messages and console logs
- `rootDir` in tsconfig is `.` (project root), not `src/`
