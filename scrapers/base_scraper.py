import requests
from bs4 import BeautifulSoup
import psycopg2
from psycopg2.extras import execute_batch
import os
from dotenv import load_dotenv
import time

load_dotenv()

class BaseScraper:
    """Base class for all scrapers"""
    
    def __init__(self):
        self.db_conn = None
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
    def connect_db(self):
        """Connect to PostgreSQL database"""
        if not self.db_conn or self.db_conn.closed:
            self.db_conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        return self.db_conn
    
    def close_db(self):
        """Close database connection"""
        if self.db_conn:
            self.db_conn.close()
    
    def fetch_url(self, url, retry=3):
        """Fetch URL with retry logic"""
        for attempt in range(retry):
            try:
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                time.sleep(1)  # Rate limiting
                return response
            except requests.RequestException as e:
                print(f"Attempt {attempt + 1} failed: {e}")
                if attempt == retry - 1:
                    raise
                time.sleep(2 ** attempt)
        return None
    
    def parse_html(self, html):
        """Parse HTML with BeautifulSoup"""
        return BeautifulSoup(html, 'lxml')
    
    def save_to_db(self, table, data, conflict_cols=None):
        """Save data to database with upsert"""
        if not data:
            return
        
        conn = self.connect_db()
        cursor = conn.cursor()
        
        columns = data[0].keys()
        values = [tuple(row.values()) for row in data]
        
        placeholders = ', '.join(['%s'] * len(columns))
        columns_str = ', '.join(columns)
        
        sql = f"INSERT INTO {table} ({columns_str}) VALUES ({placeholders})"
        
        if conflict_cols:
            update_cols = [col for col in columns if col not in conflict_cols]
            update_str = ', '.join([f"{col} = EXCLUDED.{col}" for col in update_cols])
            sql += f" ON CONFLICT ({', '.join(conflict_cols)}) DO UPDATE SET {update_str}"
        
        try:
            execute_batch(cursor, sql, values)
            conn.commit()
            print(f"Saved {len(data)} rows to {table}")
        except Exception as e:
            conn.rollback()
            print(f"Error saving to {table}: {e}")
            raise
        finally:
            cursor.close()