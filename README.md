# Legacy Loop

Legacy Loop is an AI-powered knowledge retention application for employee offboarding.

It helps teams preserve critical institutional knowledge by combining:
- documents already uploaded by managers/HR/supervisors,
- source-specific project data collected during intake (Drive, Slack/Teams, GitHub/GitLab/Jira, other uploads), and
- a live AI interview that captures undocumented workflows, decisions, and workarounds.

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
6. `/interview` - live AI chatbot interview powered by the U-M GPT Toolkit, with RAG-generated questions from Maizey.
7. `/finish` - confirms knowledge capsule creation.

## AI Integration

Legacy Loop uses two University of Michigan AI services that work together to power the interview:

### Maizey RAG API — Question Generation

At the start of each interview session, the app queries the **Maizey** knowledge base via its REST API. A structured prompt is sent that includes the employee's selected data sources and any preloaded leadership documents. Maizey's RAG engine grounds its response in the org's actual indexed content and returns exactly 5 targeted exit interview questions covering:

1. Undocumented workflows and tribal knowledge
2. Key decisions and their rationale
3. Known workarounds and technical debt
4. Critical vendor/tool relationships and dependencies
5. Escalation paths and key contacts

Implementation: `src/lib/maizey-client.ts`

### U-M GPT Toolkit — Real-Time Interview Chat

During the interview, every user reply is sent to the **U-M GPT Toolkit** (an Azure OpenAI-compatible gateway). The model receives a system prompt containing the current question, data source context, and the last 10 messages of conversation history. It responds with structured JSON:

```json
{ "message": "follow-up question text", "advance": false, "reasoning": "internal note" }
```

The interview engine uses the `advance` flag — combined with a minimum/maximum follow-up count — to decide when to move to the next question.

Implementation: `src/lib/um-gpt-client.ts`

### System Interaction Flow

```
[Interview Start]
       │
       ▼
 Maizey RAG API ──── reads org knowledge base
       │              returns 5 grounded questions
       ▼
 Interview Engine stores session + shows Question 1
       │
 [Each user reply]
       │
       ▼
 U-M GPT Toolkit ── system prompt (question + data sources)
       │              + last 10 messages of conversation history
       │              returns: { message, advance, reasoning }
       ▼
 Interview Engine applies advance logic:
   • advance=false, followUpCount < 2  → show GPT follow-up
   • advance=true,  followUpCount ≥ 1  → transition to next question
   • followUpCount ≥ 2                 → force advance regardless
       │
       ▼
 Next question (repeat GPT loop for new question context)
```

Maizey and U-M GPT never communicate directly. The interview engine in `src/lib/interview-engine.ts` orchestrates both: Maizey generates *what* to ask, U-M GPT handles *how* to probe deeper in real time.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Local client-side persistence via `localStorage`
- [Maizey RAG API](https://umgpt.umich.edu) — question generation
- [U-M GPT Toolkit](https://api.umgpt.umich.edu/azure-openai-api) — real-time interview chat (gpt-4.1)

## Running Locally

### Prerequisites

- Node.js 20+
- npm

### Environment Variables

Create a `.env.local` file in the project root with the following:

```env
# U-M GPT Toolkit (Azure OpenAI-compatible gateway)
UM_GPT_BASE_URL=https://api.umgpt.umich.edu/azure-openai-api
UM_GPT_API_KEY=your_api_key
UM_GPT_DEPLOYMENT=gpt-4.1
UM_GPT_API_VERSION=2025-04-01-preview
UM_GPT_ORGANIZATION=your_6_digit_shortcode

# Maizey RAG API
MAIZEY_BASE_URL=https://umgpt.umich.edu
MAIZEY_API_KEY=your_maizey_api_key
MAIZEY_PROJECT_PK=your_project_uuid
```

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

- Data collection backends are mocked for prototype/demo use.
- Interview sessions are stored in-memory on the server runtime (lost on server restart).
- Flow state is persisted in browser `localStorage` for reliability across page refresh.
- If Maizey is unavailable, the interview falls back to a set of hardcoded general-purpose questions.
