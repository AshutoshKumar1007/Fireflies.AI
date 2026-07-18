# Fireflies.ai – Meeting Intelligence Platform

A full-stack meeting intelligence application built as part of a technical assessment.

The project provides an end-to-end workflow for meeting management, transcript ingestion, semantic search, AI-generated summaries, and action item tracking through a modern React frontend and a FastAPI backend.

---

## Features

- Create, edit and delete meetings
- Upload meeting transcripts
- Automatic transcript parsing
- Speaker-aware transcript representation
- AI-generated meeting summaries
- Action item extraction and tracking
- Semantic transcript search
- Meeting dashboard with sorting and filtering
- RESTful API using FastAPI
- Modern Next.js frontend with TypeScript

---

# Tech Stack

## Backend

- FastAPI
- SQLAlchemy ORM
- SQLite
- Pydantic
- Uvicorn

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

---

# Project Structure

```
.
├── backend
│   ├── core
│   ├── routers
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   └── main.py
│
├── frontend
│   ├── src
│   │   ├── app
│   │   ├── components
│   │   └── lib
│   ├── package.json
│   └── next.config.mjs
│
└── README.md
```

---

# Architecture

```
                +-----------------------+
                |   Next.js Frontend    |
                +-----------+-----------+
                            |
                            |
                      REST API (JSON)
                            |
                            |
                +-----------v-----------+
                |      FastAPI API      |
                +-----------+-----------+
                            |
          +-----------------+------------------+
          |                 |                  |
          |                 |                  |
     Meetings          Transcripts         Search
          |                 |                  |
          +-----------------+------------------+
                            |
                     SQLAlchemy ORM
                            |
                        SQLite Database
```

---

# Backend Components

## Meetings

Responsible for

- Meeting CRUD operations
- Meeting metadata
- Meeting duration
- Meeting participants

---

## Transcript Pipeline

Transcript upload performs

1. Parse transcript
2. Detect speakers
3. Extract timestamps
4. Create transcript segments
5. Persist transcript segments

Supported formats include

```
Speaker [00:05]: Hello
```

and

```
[00:05] Speaker: Hello
```

---

## Search

Provides semantic transcript search over uploaded meetings.

---

## Summary

Generates structured meeting summaries including

- Overview
- Key discussion points
- Decisions
- Next steps

---

## Action Items

Stores

- Task description
- Assignee
- Completion status

---

# Frontend

The frontend is implemented using the Next.js App Router.

Major UI modules include

- Dashboard
- Meeting Details
- Transcript Viewer
- Summary Panel
- Action Item Panel
- Search Interface

The frontend communicates exclusively through REST APIs exposed by the FastAPI backend.

---

# API Endpoints

## Meetings

```
GET    /api/meetings
GET    /api/meetings/{id}
POST   /api/meetings
PUT    /api/meetings/{id}
DELETE /api/meetings/{id}
```

---

## Transcript

```
GET  /api/meetings/{id}/transcript
POST /api/meetings/{id}/transcript
```

---

## Summary

```
GET /api/meetings/{id}/summary
```

---

## Action Items

```
GET /api/meetings/{id}/action-items
PUT /api/action-items/{id}
```

---

## Search

```
GET /api/search
```

---

# Running the Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt

python seed.py

uvicorn main:app --reload
```

Backend runs on

```
http://localhost:8000
```

---

# Running the Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on

```
http://localhost:3000
```

---

# Development Notes

The application follows a layered architecture separating

- Database models
- API schemas
- Routing logic
- Frontend API client
- UI components

This separation minimizes coupling between the frontend and backend while keeping the REST contract explicit.

---

# Assumptions

- SQLite is used for local development.
- Transcript uploads replace any previously uploaded transcript for a meeting.
- Speaker references are optional for transcript segments when no matching participant exists.
- The frontend consumes only documented REST endpoints.

---

# Future Improvements

- Authentication
- Streaming transcript ingestion
- Speaker diarization
- Vector database backed semantic search
- LLM-powered meeting summarization
- Real-time collaboration
- Transcript editing
- WebSocket updates

---

# License

This project was developed solely for educational and technical assessment purposes.