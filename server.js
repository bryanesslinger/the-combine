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
const { exec } = require('child_process');
const { promisify } = require('util');
const Anthropic = require('@anthropic-ai/sdk');

// Convert exec to a Promise-based function
// Why? exec is callback-based, but we're using async/await everywhere
const execAsync = promisify(exec);

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

// Serve static files (logo, images, etc.)
app.use(express.static(__dirname));

/**
 * TOOL DEFINITIONS
 * 
 * These tools are what Claude can "use" to get data. They're generic - Claude doesn't
 * need to know which data source we use (ESPN, PFR, etc.). Our code handles that routing.
 * 
 * Why this separation? Makes it easy to add more data sources later without changing
 * how Claude works.
 */

/**
 * Tool: search_player_by_name
 * 
 * Claude uses this to find a player when given just a name.
 * Returns a player ID that can be used with fetch_player_stats.
 * 
 * Note: Tool description is generic (doesn't mention ESPN). Implementation details
 * are hidden in the searchPlayerByName function below.
 */
const SEARCH_PLAYER_TOOL = {
  name: 'search_player_by_name',
  description: 'Search for an NFL player by name to get their player ID. Use this when a user asks about a player but you need their ID to fetch stats.',
  input_schema: {
    type: 'object',
    properties: {
      playerName: {
        type: 'string',
        description: 'The player\'s name (e.g., "Tyreek Hill", "Patrick Mahomes", "Josh Allen")'
      }
    },
    required: ['playerName']
  }
};

/**
 * Tool: fetch_player_stats
 * 
 * Claude uses this to get actual player statistics after finding their ID.
 * 
 * Note: Tool description is generic. Our code decides which data source to use.
 */
const FETCH_PLAYER_STATS_TOOL = {
  name: 'fetch_player_stats',
  description: 'Fetch NFL player statistics. Requires a player ID from search_player_by_name.',
  input_schema: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'Player ID (get this from search_player_by_name first)'
      }
    },
    required: ['playerId']
  }
};

/**
 * ============================================================================
 * DATA SOURCE IMPLEMENTATIONS
 * ============================================================================
 * 
 * These functions handle the actual data fetching. Currently using ESPN, but
 * structured so we can easily add more sources later (PFR, Sleeper, etc.).
 * 
 * Future: Could add functions like searchPFR(), fetchPFRStats() and route
 * requests based on availability, quality, or user preference.
 */

/**
 * Function: searchPlayerByName
 * 
 * Searches for a player by name and returns a player identifier.
 * 
 * Current implementation: ESPN (lookup table + roster search)
 * Future: Could try multiple sources (ESPN → PFR → Sleeper) if first fails
 * 
 * @param {string} playerName - The player's name to search for
 * @returns {object} - { success: boolean, playerName: string, playerId: string, source: string }
 */
async function searchPlayerByName(playerName) {
  // TODO: In future, could try multiple sources:
  // 1. Try ESPN first (current implementation below)
  // 2. If fails, try PFR search
  // 3. If fails, try Sleeper search
  // For now, just use ESPN
  
  return await searchESPN(playerName);
}

/**
 * ESPN-specific search implementation
 * 
 * This is isolated so we can add other sources without touching this code.
 * Currently uses a lookup table of common players (fast for popular players).
 */
async function searchESPN(playerName) {
  try {
    const normalizedName = playerName.toLowerCase().trim();
    
    // ESPN player lookup table: name -> ESPN player ID
    // Note: This is ESPN-specific. Other sources might use different ID formats.
    // Format: normalized name (lowercase) -> { id, displayName }
    const espnPlayerLookup = {
      'tyreek hill': { id: '2976499', name: 'Tyreek Hill' },
      'patrick mahomes': { id: '3139477', name: 'Patrick Mahomes' },
      'josh allen': { id: '3918297', name: 'Josh Allen' },
      'travis kelce': { id: '2577417', name: 'Travis Kelce' },
      'justin jefferson': { id: '4362628', name: 'Justin Jefferson' },
      'cooper kupp': { id: '3128398', name: 'Cooper Kupp' },
      'austin ekeler': { id: '3128195', name: 'Austin Ekeler' },
      'christian mccaffrey': { id: '3133605', name: 'Christian McCaffrey' },
      'davante adams': { id: '3127418', name: 'Davante Adams' },
      'stefon diggs': { id: '3140045', name: 'Stefon Diggs' },
      'derrick henry': { id: '3043078', name: 'Derrick Henry' },
      'saquon barkley': { id: '3918286', name: 'Saquon Barkley' },
      'lamar jackson': { id: '3916387', name: 'Lamar Jackson' },
      'joe burrow': { id: '4362627', name: 'Joe Burrow' },
      'aaron rodgers': { id: '2330', name: 'Aaron Rodgers' },
      'tom brady': { id: '2330', name: 'Tom Brady' }, // Note: retired, might need updating
      'deebo samuel': { id: '3918307', name: 'Deebo Samuel' },
      'amari cooper': { id: '3139476', name: 'Amari Cooper' },
      'keenan allen': { id: '2990942', name: 'Keenan Allen' },
      'mike evans': { id: '3128734', name: 'Mike Evans' }
    };
    
    // First, try exact match (fastest)
    if (espnPlayerLookup[normalizedName]) {
      const player = espnPlayerLookup[normalizedName];
      console.log(`[Search] Found "${playerName}" in lookup table: ${player.id}`);
      return {
        success: true,
        playerName: player.name,
        playerId: player.id,
        source: 'lookup_table'
      };
    }
    
    // Try partial match (e.g., "mahomes" matches "patrick mahomes")
    // This handles cases where user types just last name or nickname
    for (const [key, player] of Object.entries(espnPlayerLookup)) {
      if (key.includes(normalizedName) || normalizedName.includes(key.split(' ')[1])) {
        console.log(`[Search] Found "${playerName}" via partial match: ${player.id}`);
        return {
          success: true,
          playerName: player.name,
          playerId: player.id,
          source: 'lookup_table_partial'
        };
      }
    }
    
    // If not in lookup table, search ESPN team rosters
    // ESPN's structure: /sports/football/nfl/teams/{teamId}/roster
    // We'll try a few major teams' rosters to find the player
    // Note: This is slower but more comprehensive
    console.log(`[Search] "${playerName}" not in lookup, searching rosters...`);
    
    // For MVP, return a helpful error that we can't find them
    // In future, we'd search team rosters here
    return {
      success: false,
      playerName: playerName,
      error: `Player "${playerName}" not found in our database. Please try a more popular player, or we can add them to the lookup table.`,
      suggestion: 'Try players like: Tyreek Hill, Patrick Mahomes, Josh Allen, Travis Kelce'
    };
    
  } catch (error) {
    console.error(`[Search] Error searching for "${playerName}":`, error.message);
    return {
      success: false,
      playerName: playerName,
      error: error.message
    };
  }
}

/**
 * Function: fetchPlayerStats
 * 
 * Fetches player statistics using the given player ID.
 * 
 * Current implementation: ESPN
 * Future: Could try multiple sources or route based on ID format/prefix
 * 
 * @param {string} playerId - The player identifier (from searchPlayerByName)
 * @returns {object} - Player statistics and info
 */
async function fetchPlayerStats(playerId) {
  // TODO: In future, could determine source from ID format or try multiple:
  // if (playerId.startsWith('espn_')) return await fetchESPN(playerId);
  // if (playerId.startsWith('pfr_')) return await fetchPFR(playerId);
  // For now, assume all IDs are ESPN IDs
  
  return await fetchESPN(playerId);
}

/**
 * ESPN-specific stats fetching implementation
 * 
 * This calls a Python script to fetch player stats.
 * Why Python? ESPN's API structure is complex, and the espn-api library
 * (or direct API exploration) is easier in Python. We call it from Node.js.
 * 
 * Architecture: Node.js → Python script → ESPN API → JSON → Node.js → Claude
 */
async function fetchESPN(playerId) {
  try {
    console.log(`[ESPN] Fetching player ${playerId} via Python script...`);
    
    // Try to get player name from lookup table to construct proper ESPN URL
    // This helps with ESPN's URL slug format
    let playerName = null;
    const lookupTable = {
      '2976499': 'Tyreek Hill',
      '3139477': 'Patrick Mahomes',
      '3918297': 'Josh Allen',
      '2577417': 'Travis Kelce',
      '4362628': 'Justin Jefferson',
      '3128398': 'Cooper Kupp',
      '3128195': 'Austin Ekeler',
      '3133605': 'Christian McCaffrey',
      '3127418': 'Davante Adams',
      '3140045': 'Stefon Diggs',
      '3043078': 'Derrick Henry',
      '3918286': 'Saquon Barkley',
      '3916387': 'Lamar Jackson',
      '4362627': 'Joe Burrow',
      '2330': 'Aaron Rodgers',
      '3918307': 'Deebo Samuel',
      '3139476': 'Amari Cooper',
      '2990942': 'Keenan Allen',
      '3128734': 'Mike Evans'
    };
    playerName = lookupTable[playerId] || null;
    
    // Get the path to our Python script
    const scriptPath = path.join(__dirname, 'fetch_player_stats.py');
    
    // Execute Python script with player ID and optional player name
    // If we have the name, pass it to help construct the proper ESPN URL
    const command = playerName 
      ? `python3 "${scriptPath}" "${playerId}" "${playerName}"`
      : `python3 "${scriptPath}" "${playerId}"`;
    
    const { stdout, stderr } = await execAsync(command);
    
    // Python script outputs JSON to stdout
    // stderr may contain warnings (like urllib3 SSL warnings) - we can ignore those
    // Only log stderr if it's not just warnings
    if (stderr && !stderr.includes('NotOpenSSLWarning')) {
      console.log(`[ESPN] Python stderr: ${stderr}`);
    }
    
    // Parse JSON from stdout (Python script prints JSON there)
    // stdout.trim() removes any trailing newlines
    const result = JSON.parse(stdout.trim());
    
    // Return the result (already in the format we need)
    return result;
    
  } catch (error) {
    // Handle errors: Python script failed, JSON parse failed, etc.
    console.error(`[ESPN] Error fetching player ${playerId}:`, error.message);
    
    // If stdout exists but JSON parse failed, log it
    if (error.stdout) {
      console.error(`[ESPN] Python output: ${error.stdout}`);
    }
    
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
    // Note: We don't mention specific data sources (ESPN, etc.) - keep it generic
    const systemMessage = `You are a helpful NFL research assistant.
    
    When answering questions about a player's last game, ALWAYS include the date of that game in your response.
    The date will be provided in the player stats data (e.g., "Sun 12/7"). 
You can answer questions about NFL players, teams, and games by fetching live data.

When a user asks about a player's stats:
1. FIRST use search_player_by_name to find their player ID
2. THEN use fetch_player_stats with that player ID to get their statistics

Always search by name first - never ask users for player IDs. They provide names, you handle the lookup.
Format your responses naturally and conversationally.`;
    
    // Initial message to Claude with tools available
    // We use messages array format (Claude's API style)
    // Both tools available: search (to find IDs) and fetch (to get stats)
    const initialResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // Claude Sonnet 4 (with tool calling support)
      max_tokens: 1024,
      system: systemMessage,
      tools: [SEARCH_PLAYER_TOOL, FETCH_PLAYER_STATS_TOOL], // Search tool first, then stats tool
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
          
          // Handle player search tool
          // Claude will use this first to get player IDs when users ask by name
          if (toolUse.name === 'search_player_by_name') {
            const result = await searchPlayerByName(toolUse.input.playerName);
            
            return {
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(result)
            };
          }
          
          // Handle stats fetch tool
          // Claude uses this after getting player ID from search
          if (toolUse.name === 'fetch_player_stats') {
            // Execute our ESPN fetch function
            const result = await fetchPlayerStats(toolUse.input.playerId);
            
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
      
      // Send tool results back to Claude
      // Claude might want to use MORE tools (like fetch_player_stats after search)
      // We need to keep looping until Claude gives us a text response
      let conversationHistory = [
        {
          role: 'user',
          content: message
        },
        {
          role: 'assistant',
          content: initialResponse.content
        },
        {
          role: 'user',
          content: toolResults
        }
      ];
      
      let currentResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemMessage,
        tools: [SEARCH_PLAYER_TOOL, FETCH_PLAYER_STATS_TOOL],
        messages: conversationHistory
      });
      
      // Keep looping if Claude wants to use more tools
      while (currentResponse.stop_reason === 'tool_use') {
        // Check if this response wants to use tools
        const toolUses = currentResponse.content.filter(item => item.type === 'tool_use');
        
        if (toolUses.length > 0) {
          console.log(`[Claude] Requesting ${toolUses.length} more tool(s)...`);
          
          // Execute the tools
          const moreToolResults = await Promise.all(
            toolUses.map(async (toolUse) => {
              console.log(`[Claude] Requesting tool: ${toolUse.name} with params:`, toolUse.input);
              
              if (toolUse.name === 'search_player_by_name') {
                const result = await searchPlayerByName(toolUse.input.playerName);
                return {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(result)
                };
              }
              
              if (toolUse.name === 'fetch_player_stats') {
                const result = await fetchPlayerStats(toolUse.input.playerId);
                return {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(result)
                };
              }
              
              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                is_error: true,
                content: `Unknown tool: ${toolUse.name}`
              };
            })
          );
          
          // Add assistant's tool requests and our results to conversation
          conversationHistory.push({
            role: 'assistant',
            content: currentResponse.content
          });
          conversationHistory.push({
            role: 'user',
            content: moreToolResults
          });
          
          // Get Claude's next response
          currentResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemMessage,
            tools: [SEARCH_PLAYER_TOOL, FETCH_PLAYER_STATS_TOOL],
            messages: conversationHistory
          });
          
          console.log(`[Claude] Response type: ${currentResponse.stop_reason}`);
        } else {
          break;
        }
      }
      
      // Extract text response (Claude returns array of content blocks)
      const textContent = currentResponse.content.find(item => item.type === 'text');
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
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use.`);
    console.error(`   To fix, run: lsof -ti:${PORT} | xargs kill -9\n`);
    process.exit(1);
  } else {
    throw err;
  }
});

