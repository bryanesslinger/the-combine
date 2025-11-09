# Architecture Overview

## System Design
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend    │────▶│  PostgreSQL │
│   (React)   │     │  (Express)   │     │             │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Claude API  │
                    │ (Anthropic)  │
                    └──────────────┘
                           ▲
                           │
                    ┌──────────────┐
                    │   Scrapers   │
                    │  (Python)    │
                    └──────────────┘
```

## Component Breakdown

### Frontend (React + TypeScript)
- **UI Components**: Collapsible sidebar, data table, chat interface
- **State Management**: React hooks (useState, useMemo)
- **Styling**: Tailwind CSS
- **API Client**: Axios for backend calls

### Backend (Node.js + Express)
- **Routes**: Players, Teams, Games, Chat
- **Database**: PostgreSQL connection pool
- **AI Integration**: Anthropic Claude API
- **Middleware**: CORS, JSON parsing, error handling

### Database (PostgreSQL)
- **Tables**: teams, players, games, player_stats, defense_rankings, prop_bets
- **Indexes**: Optimized for common queries
- **Triggers**: Auto-update timestamps

### Scrapers (Python)
- **Base Class**: Reusable scraper foundation
- **Sources**: Pro Football Reference, ESPN, Sleeper
- **Schedule**: Cron jobs on Render

## Data Flow

1. **User Request** → Frontend sends API call
2. **Backend Processing** → Express routes handle request
3. **Database Query** → PostgreSQL returns data
4. **AI Enhancement** → Claude enriches insights
5. **Response** → JSON sent back to frontend
6. **UI Update** → React re-renders with new data

## Security

- Environment variables for sensitive data
- CORS configured for specific origins
- SQL injection prevention via parameterized queries
- Rate limiting on production API

## Scalability

- Horizontal scaling via Render
- Database connection pooling
- Caching layer (future: Redis)
- CDN for static assets