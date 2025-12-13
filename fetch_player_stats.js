#!/usr/bin/env node
/**
 * Node.js script to fetch NFL player statistics by scraping ESPN game log pages.
 * 
 * This script is called from server.js to get player stats.
 * ESPN's API doesn't provide direct player stats endpoints, so we scrape
 * their game log pages which display comprehensive player statistics.
 * 
 * Usage: node fetch_player_stats.js <playerId> [playerName]
 * Example: node fetch_player_stats.js 3043078 "Derrick Henry"
 */

const https = require('https');
const http = require('http');

/**
 * Fetch HTML content from a URL
 * Uses Node.js built-in https/http modules (no external dependencies)
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Simple HTML parser to extract table data
 * Since we can't use external libraries, we'll parse HTML with regex/string manipulation
 */
function parseGameLogTable(html) {
  const games = [];
  let totalsRow = null;
  
  // Find the game log table
  // ESPN uses <table> tags with class "Table"
  const tableMatch = html.match(/<table[^>]*class="[^"]*Table[^"]*"[^>]*>([\s\S]*?)<\/table>/);
  if (!tableMatch) {
    return { games: [], totalsRow: null };
  }
  
  const tableHtml = tableMatch[1];
  
  // Find all rows
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const rowHtml = rowMatch[1];
    
    // Extract cell text from this row
    const cellRegex = /<t[dh][^>]*>(.*?)<\/t[dh]>/g;
    const cells = [];
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      // Remove HTML tags and decode entities
      let cellText = cellMatch[1]
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      cells.push(cellText);
    }
    
    // Check if this is the totals row
    if (cells.length > 0 && cells[0] === 'Regular Season Stats') {
      totalsRow = cells;
      continue;
    }
    
    // Check if this looks like a game row (has date, opponent, result)
    // Skip header rows
    if (cells.length >= 10 && cells[0] && !cells[0].includes('Date') && !cells[0].includes('Regular Season')) {
      try {
        const game = {
          date: cells[0] || '',
          opponent: cells[1] || '',
          result: cells[2] || '',
          rushing: {
            carries: cells[3] || '0',
            yards: cells[4] || '0',
            avg: cells[5] || '0',
            td: cells[6] || '0'
          },
          receiving: {
            receptions: cells[8] || '0',
            targets: cells[9] || '0',
            yards: cells[10] || '0',
            td: cells[12] || '0'
          }
        };
        games.push(game);
      } catch (e) {
        // Skip malformed rows
        continue;
      }
    }
  }
  
  return { games, totalsRow };
}

/**
 * Scrape ESPN player game log page to extract season statistics
 */
async function scrapeESPNGameLog(playerId, playerName) {
  // Construct URL with slug if player name provided
  let url;
  if (playerName) {
    const slug = playerName.toLowerCase().replace(/ /g, '-').replace(/\./g, '').replace(/'/g, '');
    url = `https://www.espn.com/nfl/player/gamelog/_/id/${playerId}/${slug}`;
  } else {
    url = `https://www.espn.com/nfl/player/gamelog/_/id/${playerId}`;
  }
  
  try {
    const html = await fetchUrl(url);
    const { games, totalsRow } = parseGameLogTable(html);
    
    // Extract player name from page title if not provided
    let extractedName = playerName;
    if (!extractedName) {
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/);
      if (titleMatch) {
        const titleText = titleMatch[1];
        const nameMatch = titleText.match(/^([^-|]+)/);
        if (nameMatch) {
          extractedName = nameMatch[1].replace(' Game Log', '').trim();
        }
      }
    }
    
    // Extract season totals from totals row
    let totalRushCar = 0, totalRushYds = 0, totalRushAvg = 0, totalRushTd = 0;
    
    if (totalsRow && totalsRow.length >= 5) {
      // Format: ['Regular Season Stats', '222', '1,025', '4.6', '10', ...]
      totalRushCar = parseInt((totalsRow[1] || '0').replace(/,/g, '')) || 0;
      totalRushYds = parseInt((totalsRow[2] || '0').replace(/,/g, '')) || 0;
      totalRushAvg = parseFloat((totalsRow[3] || '0')) || 0;
      totalRushTd = parseInt((totalsRow[4] || '0').replace(/,/g, '')) || 0;
    } else if (games.length > 0) {
      // Fallback: calculate from games
      totalRushYds = games.reduce((sum, g) => {
        const yds = parseInt(g.rushing.yards) || 0;
        return sum + yds;
      }, 0);
      totalRushTd = games.reduce((sum, g) => {
        const td = parseInt(g.rushing.td) || 0;
        return sum + td;
      }, 0);
      totalRushCar = games.reduce((sum, g) => {
        const car = parseInt(g.rushing.carries) || 0;
        return sum + car;
      }, 0);
      totalRushAvg = totalRushCar > 0 ? Math.round((totalRushYds / totalRushCar) * 10) / 10 : 0;
    }
    
    // Get most recent game (last in list - games are chronological)
    const lastGame = games.length > 0 ? games[games.length - 1] : null;
    
    // Build result JSON (same format as Python version)
    const result = {
      success: true,
      playerName: extractedName || 'Unknown',
      playerId: playerId,
      seasonStats: {
        rushing: {
          carries: totalRushCar,
          yards: totalRushYds,
          touchdowns: totalRushTd,
          average: totalRushAvg
        }
      },
      lastGame: lastGame ? {
        date: lastGame.date,
        opponent: lastGame.opponent,
        result: lastGame.result,
        rushing: {
          carries: parseInt(lastGame.rushing.carries) || 0,
          yards: parseInt(lastGame.rushing.yards) || 0,
          touchdowns: parseInt(lastGame.rushing.td) || 0,
          average: parseFloat(lastGame.rushing.avg) || 0
        }
      } : null,
      source: 'espn_gamelog',
      gamesPlayed: games.length
    };
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      playerId: playerId
    };
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(JSON.stringify({
      success: false,
      error: 'Player ID required as argument'
    }));
    process.exit(1);
  }
  
  const playerId = args[0];
  const playerName = args[1] || null;
  
  const result = await scrapeESPNGameLog(playerId, playerName);
  console.log(JSON.stringify(result));
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.log(JSON.stringify({
      success: false,
      error: error.message
    }));
    process.exit(1);
  });
}

