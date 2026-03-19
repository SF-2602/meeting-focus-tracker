# Meeting Focus Tracker

A privacy-first analytics platform that monitors participant engagement during meetings by tracking window activity. It captures what applications/websites participants use during a meeting and categorizes them as meeting-related, work-related, or distracting — without recording screenshots, keystrokes, or personal content.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Architecture Notes](#architecture-notes)
- [Known Issues & TODOs](#known-issues--todos)

---

## Overview

**User flow:**

1. User registers with a user ID on the Login page
2. User creates or joins a meeting on the Meeting List page
3. After the meeting, user triggers analysis on the Dashboard
4. The backend queries ActivityWatch for window events during the meeting time range
5. Each event is categorized via a local Ollama LLM (Llama3)
6. Results are saved to Supabase and visualized as a timeline + statistics panel

**Activity categories:**

- `meeting` — Zoom, Teams, Google Meet, etc.
- `work_related` — VS Code, terminals, IDEs
- `instant_message` — Slack, Discord, WhatsApp
- `browser` — general browser usage
- `other` — everything else

Engagement is calculated as: `(meeting + work_related duration) / total duration * 100`

---

## Tech Stack

**Frontend**

- React 19 + TypeScript, Vite
- React Router v7, React Query
- TailwindCSS v4, Radix UI, Framer Motion
- Recharts (charts), Lucide React (icons)

**Backend**

- FastAPI + Uvicorn (Python)
- ActivityWatch Client (`aw-client`) — local activity data source
- Ollama + Llama3 — local LLM for activity categorization
- Supabase Python SDK

**Database**

- Supabase (managed PostgreSQL)

---

## Project Structure

```
.
├── main.py               # FastAPI server — all API endpoints
├── analyzer.py           # ActivityWatch integration + LLM categorization
├── requirements.txt      # Python dependencies
├── .env                  # Backend env vars (Supabase credentials)
├── .env.local            # Frontend env vars (Vite)
└── src/
    ├── App.tsx           # Router setup
    ├── pages/
    │   ├── Login.tsx         # User registration
    │   ├── MeetingList.tsx   # Browse / create / join meetings
    │   ├── Dashboard.tsx     # Analytics dashboard
    │   └── NotFound.tsx
    ├── components/
    │   ├── FocusTimeLine.tsx     # Per-user activity timeline
    │   ├── StatisticsPanel.tsx   # Engagement metrics + charts
    │   ├── MeetingHeader.tsx
    │   └── NavLink.tsx
    ├── services/
    │   └── api.ts            # All fetch calls to the backend
    ├── lib/
    │   └── supabase.ts       # Supabase client (frontend)
    └── utils/
        ├── categoryMapper.ts
        ├── getAppIcon.ts
        └── getDisplayAppName.ts
```

---

## Prerequisites

- Node.js 18+
- Python 3.10+
- [ActivityWatch](https://activitywatch.net/) running locally (default port 5600)
- [Ollama](https://ollama.com/) with the `llama3` model pulled:
  ```bash
  ollama pull llama3
  ```
- A [Supabase](https://supabase.com/) project with the schema below

---

## Environment Variables

**Backend — `.env`**

```env
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**Frontend — `.env.local`**

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

> The backend uses the **service role key** (bypasses RLS). Never expose it on the frontend.

---

## Getting Started

**1. Backend**

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**2. Frontend**

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and expects the backend at the URL set in `VITE_API_URL`.

**3. Build for production**

```bash
npm run build       # outputs to dist/
```

---

## API Reference

All endpoints are served from `http://localhost:8000`. Interactive docs available at `/docs` (Swagger UI).

### Users

| Method | Path                        | Description                            |
| ------ | --------------------------- | -------------------------------------- |
| POST   | `/users/register`           | Register or upsert a user by `user_id` |
| GET    | `/users/{user_id}/meetings` | Get all meetings a user has joined     |

### Meetings

| Method | Path                        | Description                                                 |
| ------ | --------------------------- | ----------------------------------------------------------- |
| POST   | `/meetings`                 | Create a new meeting                                        |
| GET    | `/meetings/public?user_id=` | List all meetings (marks joined ones if `user_id` provided) |
| GET    | `/meetings/{meeting_id}`    | Get meeting details + participant count                     |
| POST   | `/meetings/join`            | Join an existing meeting                                    |

### Analytics

| Method | Path                                      | Description                                                |
| ------ | ----------------------------------------- | ---------------------------------------------------------- |
| POST   | `/meetings/{meeting_id}/trigger-analysis` | Fetch ActivityWatch data, categorize, and save to Supabase |
| POST   | `/meetings/{meeting_id}/analyze`          | Return stored analytics for a meeting                      |

### Utility

| Method | Path               | Description  |
| ------ | ------------------ | ------------ |
| GET    | `/test-connection` | Health check |

**`trigger-analysis` request body:**

```json
{
  "user_id": "alice",
  "start_time": "2024-01-15T09:00:00",
  "end_time": "2024-01-15T10:00:00"
}
```

> Times are treated as **HKT (UTC+8)** and converted to UTC internally.

---

## Database Schema

Four tables in Supabase:

```sql
-- Users
users (
  id TEXT PRIMARY KEY
)

-- Meetings
meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meetings TEXT,          -- meeting name (column named "meetings")
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
)

-- Join table
user_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id),
  meeting_id UUID REFERENCES meetings(id),
  role TEXT DEFAULT 'participant',  -- 'host' or 'participant'
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, meeting_id)
)

-- Activity events
window_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  meeting_id UUID,
  timestamp TIMESTAMPTZ,
  app TEXT,
  title TEXT,
  category TEXT,
  duration_seconds FLOAT
)
```

> Note: the meeting name column in the `meetings` table is named `meetings` (not `name`). This is a quirk to be aware of when querying directly.

---

## Architecture Notes

**Activity categorization flow:**

1. `analyzer.py` queries ActivityWatch for window events in the given time range
2. Common apps (Zoom, VS Code, Slack, etc.) are matched via heuristics first
3. Unknown apps are sent to a local Ollama Llama3 model for categorization
4. Results are cached in-memory (`CATEGORIZATION_CACHE`) to avoid redundant LLM calls
5. Events are saved to `window_events` in Supabase

**Timeline binning:**

- Events are grouped into 5-minute bins
- The dominant activity (most overlap) per bin is selected for display
- Times are stored in UTC, converted to HKT for display

**ActivityWatch bucket names** are derived from the machine hostname at runtime:

```python
WINDOW_BUCKET = f"aw-watcher-window_{HOSTNAME}"
AFK_BUCKET    = f"aw-watcher-afk_{HOSTNAME}"
```

Each user must run the analysis trigger from their own machine for their data to be captured.

---

## Known Issues & TODOs

- `trigger-analysis` runs synchronously — for production, move to a task queue (e.g. Celery + Redis)
- The `meetings` table uses `meetings` as the column name for the meeting title, which is confusing and should be renamed to `name`
- CORS is currently set to `allow_origins=["*"]` — restrict this before deploying to production
- No authentication layer — user IDs are plain strings with no password or token verification
- ActivityWatch must be running on the same machine as the user triggering analysis; remote collection is not supported
- Ollama + Llama3 must be running locally; there is no fallback if the model is unavailable
