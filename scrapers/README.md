# Scrapers

Python scrapers for collecting NFL data from various sources.

## Setup
```bash
pip install -r requirements.txt
```

## Usage

### Pro Football Reference Scraper
```bash
python pfr_scraper.py --season 2025 --week 11
```

## Adding New Scrapers

1. Create new scraper file (e.g., `sleeper_scraper.py`)
2. Inherit from `BaseScraper`
3. Implement scraping methods
4. Save data using `save_to_db()`

## Notes

- Scrapers respect rate limits (1 second between requests)
- All scrapers use the same database connection
- Data is upserted (insert or update on conflict)