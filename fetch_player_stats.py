#!/usr/bin/env python3
"""
Python script to fetch NFL player statistics by scraping ESPN game log pages.

This script is called from Node.js to get player stats.
ESPN's API doesn't provide direct player stats endpoints, so we scrape
their game log pages which display comprehensive player statistics.

Strategy:
1. Scrape ESPN player game log page (format: /nfl/player/gamelog/_/id/{id}/{slug})
2. Extract season totals from the "Regular Season Stats" row
3. Extract last game stats from the first game row
4. Return structured JSON data
"""

import sys
import json
import requests
import warnings
from bs4 import BeautifulSoup

# Suppress urllib3 SSL warnings
warnings.filterwarnings('ignore', category=UserWarning, module='urllib3')

def scrape_espn_gamelog(player_id, player_name=None):
    """
    Scrape ESPN player game log page to extract season statistics.
    
    ESPN URL format: https://www.espn.com/nfl/player/gamelog/_/id/{playerId}/{slug}
    If player_name is provided, we construct the slug from it.
    
    Args:
        player_id: ESPN player ID
        player_name: Optional player name to construct proper URL slug
        
    Returns:
        dict: Player statistics in JSON format, or None if error
    """
    # Construct slug from player name if provided
    if player_name:
        slug = player_name.lower().replace(" ", "-").replace(".", "").replace("'", "")
        url = f"https://www.espn.com/nfl/player/gamelog/_/id/{player_id}/{slug}"
    else:
        # Try without slug (may not work for all players)
        url = f"https://www.espn.com/nfl/player/gamelog/_/id/{player_id}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        
        if response.status_code != 200:
            return None
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract player name from page title if not provided
        extracted_name = player_name
        if not extracted_name:
            title_tag = soup.find('title')
            if title_tag:
                title_text = title_tag.get_text()
                # Title format: "Player Name Game Log - NFL" or similar
                match = title_text.split(' Game Log')[0] if ' Game Log' in title_text else None
                if match:
                    extracted_name = match.strip()
        
        # Find the game log table
        tables = soup.find_all('table')
        if not tables:
            return None
        
        first_table = tables[0]
        all_rows = first_table.find_all('tr')
        
        # Find the totals row (last row with "Regular Season Stats")
        totals_row = None
        for row in all_rows:
            cells = row.find_all(['td', 'th'])
            row_text = [cell.get_text(strip=True) for cell in cells]
            if len(row_text) > 0 and row_text[0] == 'Regular Season Stats':
                totals_row = row_text
                break
        
        # Parse game rows
        tbody = first_table.find('tbody')
        games = []
        
        if tbody:
            for row in tbody.find_all('tr'):
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 10:
                    row_data = [cell.get_text(strip=True) for cell in cells]
                    # Skip totals row (starts with "Regular Season Stats")
                    if len(row_data) > 0 and row_data[0] == 'Regular Season Stats':
                        continue
                    try:
                        game = {
                            'date': row_data[0] if len(row_data) > 0 else '',
                            'opponent': row_data[1] if len(row_data) > 1 else '',
                            'result': row_data[2] if len(row_data) > 2 else '',
                            'rushing': {
                                'carries': row_data[3] if len(row_data) > 3 else '0',
                                'yards': row_data[4] if len(row_data) > 4 else '0',
                                'avg': row_data[5] if len(row_data) > 5 else '0',
                                'td': row_data[6] if len(row_data) > 6 else '0'
                            },
                            'receiving': {
                                'receptions': row_data[8] if len(row_data) > 8 else '0',
                                'targets': row_data[9] if len(row_data) > 9 else '0',
                                'yards': row_data[10] if len(row_data) > 10 else '0',
                                'td': row_data[12] if len(row_data) > 12 else '0'
                            }
                        }
                        games.append(game)
                    except:
                        continue
        
        # Extract season totals from totals row (more accurate than summing)
        if totals_row and len(totals_row) >= 5:
            # Format: ['Regular Season Stats', '222', '1,025', '4.6', '10', ...]
            # Index:  CAR=1, YDS=2, AVG=3, TD=4, ...
            total_rush_car = int(totals_row[1].replace(',', '')) if totals_row[1].replace(',', '').isdigit() else 0
            total_rush_yds = int(totals_row[2].replace(',', '')) if totals_row[2].replace(',', '').isdigit() else 0
            total_rush_avg = float(totals_row[3]) if totals_row[3].replace('.', '').replace('-', '').isdigit() else 0
            total_rush_td = int(totals_row[4].replace(',', '')) if totals_row[4].replace(',', '').isdigit() else 0
        elif games:
            # Fallback: calculate from individual games
            total_rush_yds = sum(int(g['rushing']['yards']) for g in games if g['rushing']['yards'].isdigit())
            total_rush_td = sum(int(g['rushing']['td']) for g in games if g['rushing']['td'].isdigit())
            total_rush_car = sum(int(g['rushing']['carries']) for g in games if g['rushing']['carries'].isdigit())
            total_rush_avg = round(total_rush_yds / total_rush_car, 1) if total_rush_car > 0 else 0
        else:
            total_rush_car = total_rush_yds = total_rush_td = total_rush_avg = 0
        
        # Get most recent game (last in list - games are listed chronologically, oldest to newest)
        last_game = games[-1] if games else None
        
        # Build result JSON
        result = {
            "success": True,
            "playerName": extracted_name or "Unknown",
            "playerId": player_id,
            "seasonStats": {
                "rushing": {
                    "carries": total_rush_car,
                    "yards": total_rush_yds,
                    "touchdowns": total_rush_td,
                    "average": total_rush_avg
                }
            },
            "lastGame": {
                "date": last_game['date'],
                "opponent": last_game['opponent'],
                "result": last_game['result'],
                "rushing": {
                    "yards": int(last_game['rushing']['yards']) if last_game['rushing']['yards'].isdigit() else 0,
                    "touchdowns": int(last_game['rushing']['td']) if last_game['rushing']['td'].isdigit() else 0
                }
            } if last_game else None,
            "source": "espn_gamelog",
            "gamesPlayed": len(games)
        }
        
        return result
        
    except Exception as e:
        return None

def fetch_player_stats(player_id, player_name=None):
    """
    Main function to fetch player statistics.
    
    Args:
        player_id: ESPN player ID
        player_name: Optional player name to construct proper URL slug
        
    Returns:
        dict: Player statistics in JSON format
    """
    try:
        result = scrape_espn_gamelog(player_id, player_name)
        
        if result:
            return result
        else:
            return {
                "success": False,
                "error": f"Could not scrape ESPN game log page for player ID {player_id}",
                "playerId": player_id,
                "suggestion": "Player ID may be incorrect, or ESPN page structure has changed."
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "playerId": player_id
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Player ID required as argument"
        }))
        sys.exit(1)
    
    player_id = sys.argv[1]
    player_name = sys.argv[2] if len(sys.argv) > 2 else None
    result = fetch_player_stats(player_id, player_name)
    
    # Output JSON so Node.js can parse it
    print(json.dumps(result))
