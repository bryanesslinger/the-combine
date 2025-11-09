from base_scraper import BaseScraper
import argparse

class PFRScraper(BaseScraper):
    """Scraper for Pro Football Reference"""
    
    BASE_URL = "https://www.pro-football-reference.com"
    
    def scrape_player_stats(self, season=2025, week=None):
        """Scrape player stats for a given week/season"""
        url = f"{self.BASE_URL}/years/{season}/fantasy.htm"
        
        print(f"Fetching player stats for {season}...")
        response = self.fetch_url(url)
        soup = self.parse_html(response.content)
        
        # Find stats table
        table = soup.find('table', {'id': 'fantasy'})
        if not table:
            print("Stats table not found")
            return []
        
        players_data = []
        rows = table.find('tbody').find_all('tr')
        
        for row in rows:
            if row.get('class') and 'thead' in row.get('class'):
                continue
            
            cells = row.find_all('td')
            if not cells:
                continue
            
            try:
                player_data = {
                    'name': cells[0].get_text(strip=True),
                    'team': cells[1].get_text(strip=True),
                    'position': cells[2].get_text(strip=True),
                    'passing_yards': int(cells[5].get_text(strip=True) or 0),
                    'passing_tds': int(cells[6].get_text(strip=True) or 0),
                    'passing_int': int(cells[7].get_text(strip=True) or 0),
                    'rushing_yards': int(cells[9].get_text(strip=True) or 0),
                    'rushing_tds': int(cells[10].get_text(strip=True) or 0),
                    'receptions': int(cells[12].get_text(strip=True) or 0),
                    'receiving_yards': int(cells[13].get_text(strip=True) or 0),
                    'receiving_tds': int(cells[14].get_text(strip=True) or 0),
                    'fantasy_points': float(cells[16].get_text(strip=True) or 0),
                    'season': season,
                    'week': week
                }
                players_data.append(player_data)
            except (IndexError, ValueError) as e:
                print(f"Error parsing row: {e}")
                continue
        
        return players_data
    
    def scrape_team_defense(self, season=2025):
        """Scrape team defense rankings"""
        url = f"{self.BASE_URL}/years/{season}/opp.htm"
        
        print(f"Fetching defense rankings for {season}...")
        response = self.fetch_url(url)
        soup = self.parse_html(response.content)
        
        # Parse defense table
        table = soup.find('table', {'id': 'team_stats'})
        if not table:
            return []
        
        defense_data = []
        rows = table.find('tbody').find_all('tr')
        
        for row in rows:
            cells = row.find_all('td')
            if not cells:
                continue
            
            try:
                defense_data.append({
                    'team': cells[0].get_text(strip=True),
                    'points_allowed': float(cells[3].get_text(strip=True) or 0),
                    'yards_allowed': float(cells[4].get_text(strip=True) or 0),
                    'season': season
                })
            except (IndexError, ValueError) as e:
                print(f"Error parsing defense row: {e}")
                continue
        
        return defense_data
    
    def run(self, season=2025, week=None):
        """Run the scraper"""
        print("Starting Pro Football Reference scraper...")
        
        try:
            # Scrape player stats
            player_stats = self.scrape_player_stats(season, week)
            if player_stats:
                # Note: You'll need to handle player_id lookups and proper table structure
                print(f"Scraped {len(player_stats)} player stat records")
                # TODO: Map player names to IDs and save to player_stats table
            
            # Scrape defense rankings
            defense_stats = self.scrape_team_defense(season)
            if defense_stats:
                print(f"Scraped {len(defense_stats)} defense records")
                # TODO: Map team names to IDs and save to defense_rankings table
            
            print("Scraping complete!")
            
        except Exception as e:
            print(f"Error during scraping: {e}")
        finally:
            self.close_db()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Scrape Pro Football Reference')
    parser.add_argument('--season', type=int, default=2025, help='Season year')
    parser.add_argument('--week', type=int, help='Week number (optional)')
    
    args = parser.parse_args()
    
    scraper = PFRScraper()
    scraper.run(season=args.season, week=args.week)