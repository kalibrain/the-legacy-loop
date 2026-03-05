# Legacy Loop

Legacy Loop is an AI-powered knowledge transfer application for employee offboarding.

It helps teams preserve critical institutional knowledge by combining:
- documents already uploaded by managers/HR/supervisors,
- source-specific project data collected during intake (Drive, Slack/Teams, GitHub/GitLab/Jira, other uploads), and
- a guided AI interview that captures undocumented workflows, decisions, and workarounds.

The result is a structured knowledge capsule for future team members.

## Hackathon Context

This project is being built as part of the University of Michigan **Hacks with Friends 2026** event:

- https://it.umich.edu/community/hacks-with-friends/2026

## What the App Does

The current flow is:
1. `/start` - explains the process and preloaded leadership documents.
2. `/collect` - select one or more data sources.
3. `/collect/source/[sourceId]` - configure each selected source:
   - Google Drive: link or file upload
   - Slack/Teams: workspace URL + mocked channel selection
   - GitHub/GitLab/Jira: repository/project link
   - Other Source: file upload
4. `/collect/upload` - review configured inputs and start mocked collection.
5. `/collect/complete` - see collection stats, review summary, and consent.
6. `/interview` - single-thread chatbot interview with follow-up prompts and citations.
7. `/finish` - confirms knowledge capsule creation.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Local client-side persistence via `localStorage`
- Mocked API routes in Next.js Route Handlers

## Running Locally

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
npm install
```

### Start development server

```bash
npm run dev
```

Then open:

- http://localhost:3000/start

### Other useful commands

```bash
npm run lint
npm run build
npm run start
```

## Notes

- Collection and interview backends are mocked for prototype/demo use.
- Interview sessions are stored in-memory on the server runtime.
- Flow state is persisted in browser `localStorage` for reliability across refresh.
