/**
 * Minimal NFL Research Chat Server
 * 
 * This server provides a conversational AI agent that answers NFL questions
 * by fetching live data from ESPN API when needed.
 * 
 * Architecture Decision: We use Claude's tool calling feature because it allows
 * Claude to decide WHEN to fetch data, rather than us pre-fetching everything.
 * This is more efficient and allows Claude to reason about what data it needs.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Claude SDK
// API key comes from .env file for security (never commit keys)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Middleware setup
// CORS allows our HTML file (even from file:// or different port) to call this API
app.use(cors());
// Parse JSON request bodies - Claude sends structured data
app.use(express.json());

/**
 * Tool Definition: fetchPlayerStats
 * 
 * This is what we tell Claude about - Claude will "decide" to use this tool
 * when it needs player statistics. The tool schema tells Claude:
 * - What the tool is called
 * - What parameters it accepts
 * - What it returns
 * 
 * We use ESPN's public API (no key needed) because it's free and reliable.
 * ESPN uses player IDs, not names, so we accept playerId as parameter.
 */
const ESPNAPI_TOOL = {
  name: 'fetch_player_stats',
  description: 'Fetch NFL player statistics from ESPN API. Requires a player ID (not name). For example, Tyreek Hill\'s ID is 2976499.',
  input_schema: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'ESPN player ID. Example: 2976499 for Tyreek Hill'
      }
    },
    required: ['playerId']
  }
};

/**
 * Helper Function: fetchFromESPN
 * 
 * Why separate function? Makes testing easier, cleaner error handling,
 * and we can reuse it if we add more endpoints later.
 * 
 * ESPN API returns data in a nested structure. We extract the most useful
 * fields (current season stats, recent game) to send back to Claude.
 */
async function fetchFromESPN(playerId) {
  try {
    // ESPN's athlete endpoint returns full player profile including stats
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/${playerId}`;
    
    console.log(`[ESPN] Fetching player ${playerId}...`);
    
    // Use native fetch (Node 18+) instead of axios to reduce dependencies
    const response = await fetch(url);
    
    if (!response.ok) {
      // ESPN returns 404 for invalid IDs, 429 for rate limits, etc.
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // ESPN's response structure: data.athlete contains player info
    // data.athlete.seasons[0] contains current season stats
    // We extract what's most useful for answering questions
    
    const athlete = data.athlete;
    
    // Extract season stats - ESPN organizes by season, most recent first
    const currentSeason = athlete.seasons && athlete.seasons[0];
    const seasonStats = currentSeason?.stats || [];
    
    // Extract recent game stats (last game played)
    const lastGame = seasonStats.find(stat => stat.type === 'gamelog') || seasonStats[0];
    
    // Return a structured summary that Claude can easily interpret
    // We format it clearly because Claude reads this to answer questions
    return {
      success: true,
      playerName: athlete.fullName,
      position: athlete.position?.displayName || 'N/A',
      team: athlete.team?.displayName || 'N/A',
      seasonStats: seasonStats.map(stat => ({
        type: stat.type,
        displayName: stat.displayName,
        value: stat.value
      })),
      lastGame: lastGame ? {
        displayName: lastGame.displayName,
        value: lastGame.value,
        date: lastGame.date
      } : null,
      rawData: data // Include full data in case Claude needs something specific
    };
    
  } catch (error) {
    // Explicit error handling - log everything so we can debug
    console.error(`[ESPN] Error fetching player ${playerId}:`, error.message);
    return {
      success: false,
      error: error.message,
      playerId: playerId
    };
  }
}

/**
 * Main Chat Endpoint: POST /api/chat
 * 
 * This is where the magic happens. Flow:
 * 1. User sends question via frontend
 * 2. We send question to Claude with ESPN tool available
 * 3. Claude decides if it needs data (returns tool_use)
 * 4. We execute the tool (fetch ESPN data)
 * 5. We send tool results back to Claude
 * 6. Claude synthesizes final answer
 * 7. We return answer to frontend
 * 
 * Why async/await? Tool calling requires multiple back-and-forth with Claude,
 * so we need to handle promises cleanly. Try/catch ensures errors don't crash server.
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Validate input - simple check to catch missing data early
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required and must be a string' 
      });
    }
    
    console.log(`[Chat] Received: "${message}"`);
    
    // System message tells Claude its role and capabilities
    // This is important: Claude needs context about what it can do
    const systemMessage = `You are a helpful NFL research assistant. 
You can answer questions about NFL players, teams, and games by fetching live data from ESPN.
When a user asks about a specific player's stats, use the fetch_player_stats tool with their ESPN player ID.
If you don't know a player's ID, tell the user you need more specific information.
Format your responses naturally and conversationally.`;
    
    // Initial message to Claude with tool available
    // We use messages array format (Claude's API style)
    const initialResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022', // Latest Claude model with best tool calling
      max_tokens: 1024,
      system: systemMessage,
      tools: [ESPNAPI_TOOL], // Make the ESPN tool available
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    });
    
    console.log(`[Claude] Initial response type: ${initialResponse.stop_reason}`);
    
    // Check if Claude wants to use a tool
    // stop_reason === 'tool_use' means Claude decided it needs data
    if (initialResponse.stop_reason === 'tool_use') {
      
      // Claude can request multiple tools, so we handle them all
      const toolUses = initialResponse.content.filter(item => item.type === 'tool_use');
      
      // Execute each tool request
      // Why Promise.all? Multiple tools can run in parallel if Claude requests them
      const toolResults = await Promise.all(
        toolUses.map(async (toolUse) => {
          console.log(`[Claude] Requesting tool: ${toolUse.name} with params:`, toolUse.input);
          
          if (toolUse.name === 'fetch_player_stats') {
            // Execute our ESPN fetch function
            const result = await fetchFromESPN(toolUse.input.playerId);
            
            // Return in Claude's expected format
            // tool_use_id links result back to Claude's original request
            return {
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(result)
            };
          }
          
          // If tool not recognized, return error
          return {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            is_error: true,
            content: `Unknown tool: ${toolUse.name}`
          };
        })
      );
      
      // Send tool results back to Claude for final answer
      // Claude now has the data it requested and can synthesize response
      const finalResponse = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemMessage,
        tools: [ESPNAPI_TOOL],
        messages: [
          {
            role: 'user',
            content: message
          },
          {
            role: 'assistant',
            content: initialResponse.content // Claude's tool requests
          },
          {
            role: 'user',
            content: toolResults // Our tool execution results
          }
        ]
      });
      
      // Extract text response (Claude returns array of content blocks)
      const textContent = finalResponse.content.find(item => item.type === 'text');
      const responseText = textContent ? textContent.text : 'I apologize, but I couldn\'t generate a response.';
      
      console.log(`[Claude] Final response generated`);
      
      return res.json({ 
        response: responseText 
      });
      
    } else {
      // Claude answered directly without needing tools
      // This happens for general questions or when Claude already knows the answer
      const textContent = initialResponse.content.find(item => item.type === 'text');
      const responseText = textContent ? textContent.text : 'I apologize, but I couldn\'t generate a response.';
      
      console.log(`[Claude] Direct response (no tools needed)`);
      
      return res.json({ 
        response: responseText 
      });
    }
    
  } catch (error) {
    // Catch-all error handler
    // Log full error for debugging, but don't expose internals to frontend
    console.error('[Chat] Error:', error);
    
    return res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Serve the HTML chat interface at root path
// Why here? Users expect to open localhost:3000 and see the UI
// path.join(__dirname, ...) ensures we find index.html regardless of where node is run from
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint - useful for testing if server is running
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NFL Research Chat Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  
  // Validate API key is set
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  WARNING: ANTHROPIC_API_KEY not found in .env file');
    console.warn('   Server will start but chat endpoint will fail');
  }
});

