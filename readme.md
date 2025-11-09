# NFL Research Platform

Comprehensive sports research platform for data-driven betting decisions.

## Quick Start

1. Clone repo
2. Copy `.env.example` to `.env` and add your API keys
3. Setup database: `psql your_db < database/schema.sql`
4. Backend: `cd backend && npm install && npm run dev`
5. Frontend: `cd frontend && npm install && npm start`
6. Scrapers: `cd scrapers && pip install -r requirements.txt`

## Tech Stack
- Frontend: React + TypeScript + Tailwind
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL with pgvector
- AI: Claude API

## Deployment
Push to GitHub, connect to Render, deploy from `render.yaml`

Full docs in `docs/SETUP.md`