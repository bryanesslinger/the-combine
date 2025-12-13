# Quick Start Guide

## Setup (One-Time)

1. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your Anthropic API key from https://console.anthropic.com/

2. **Install dependencies** (already done):
   ```bash
   npm install
   ```

## Running the Prototype

1. **Start the server:**
   ```bash
   npm start
   ```
   You should see: `🚀 NFL Research Chat Server running on http://localhost:3000`

2. **Open the chat UI:**
   - Open `index.html` in your browser (double-click or `open index.html`)
   - Or serve it: `python3 -m http.server 8080` then visit http://localhost:8080

3. **Try it out:**
   - Ask: "How many yards did Tyreek Hill have last game?" (use player ID 2976499)
   - Or: "What are Tyreek Hill's season stats?" (player ID 2976499)

## How It Works

**Key Architecture Decision:** We use Claude's **tool calling** feature. Here's the flow:

1. User asks question → Frontend sends to `/api/chat`
2. Server sends question to Claude with ESPN tool available
3. Claude **decides** if it needs data (returns `tool_use`)
4. Server executes tool → Fetches from ESPN API
5. Server sends ESPN data back to Claude
6. Claude synthesizes natural language answer
7. Server returns answer to frontend

**Why Tool Calling?** Instead of pre-fetching all data, Claude intelligently decides what it needs. More efficient and allows Claude to reason about requests.

## Current Limitations

- **Player IDs Required:** ESPN uses IDs, not names. You need to know the player ID (e.g., Tyreek Hill = 2976499)
- **ESPN Only:** Only one data source for now
- **No Persistence:** Chat history resets on page reload

## Next Steps (Future)

- Add player name → ID lookup/search
- Add more APIs (Pro Football Reference, Sleeper, etc.)
- Add chat history persistence
- Improve error handling for unknown players

