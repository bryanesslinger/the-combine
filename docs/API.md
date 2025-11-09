# API Documentation

Base URL: 
- Development: `http://localhost:3001/api`
- Production: `https://your-api.onrender.com/api`

---

## Health Check
```
GET /health
```

Returns server status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## Players

### Get All Players
```
GET /api/players
```

**Query Parameters:**
- `position` - Filter by position (QB, RB, WR, TE)
- `team` - Filter by team abbreviation
- `week` - Filter by week number
- `season` - Season year (default: 2025)
- `game_id` - Filter by specific game

**Example:**
```
GET /api/players?position=QB&week=11&season=2025
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Patrick Mahomes",
    "position": "QB",
    "team": "KC",
    "passing_yards": 285,
    "passing_tds": 2,
    "passing_int": 1,
    "rushing_yards": 21,
    "fantasy_points": 24.5
  }
]
```

### Get Player Details
```
GET /api/players/:id
```

**Response:**
```json
{
  "id": 1,
  "name": "Patrick Mahomes",
  "position": "QB",
  "team": "KC",
  "team_name": "Kansas City Chiefs",
  "status": "active"
}
```

### Get Player Game Log
```
GET /api/players/:id/stats
```

**Query Parameters:**
- `weeks` - Number of weeks to return
- `season` - Season year (default: 2025)

---

## Teams

### Get All Teams
```
GET /api/teams
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Kansas City Chiefs",
    "abbreviation": "KC",
    "conference": "AFC",
    "division": "West"
  }
]
```

### Get Defense Rankings
```
GET /api/teams/:id/defense-rankings
```

**Query Parameters:**
- `week` - Specific week
- `season` - Season year (default: 2025)

---

## Games

### Get Games
```
GET /api/games
```

**Query Parameters:**
- `week` - Filter by week
- `season` - Season year (default: 2025)

**Response:**
```json
[
  {
    "id": 1,
    "week": 11,
    "season": 2025,
    "home_team": "BUF",
    "away_team": "KC",
    "game_date": "2025-11-17T16:25:00Z",
    "spread": -2.5,
    "over_under": 52.5,
    "weather": "45°F, Clear"
  }
]
```

---

## Chat

### Send Message to AI Assistant
```
POST /api/chat
```

**Request Body:**
```json
{
  "message": "Should I take Kelce over 65.5 receiving yards?",
  "context": "Optional additional context"
}
```

**Response:**
```json
{
  "response": "Based on Travis Kelce's recent performance...",
  "model": "claude-sonnet-4-20250514",
  "usage": {
    "input_tokens": 150,
    "output_tokens": 200
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid parameter value"
}
```

### 404 Not Found
```json
{
  "error": "Player not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch data"
}
```

---

## Rate Limiting

- Development: No rate limiting
- Production: Implement rate limiting middleware
- Recommended: 100 requests per hour per IP

---

## CORS

Configured to allow:
- Development: `http://localhost:3000`
- Production: Your frontend domain (set in `ALLOWED_ORIGINS`)