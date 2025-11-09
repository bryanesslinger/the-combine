# Setup & Deployment Guide

## Local Development Setup

### 1. Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL 14+
- Git
- Claude API key from https://console.anthropic.com

### 2. Clone and Install
```bash
# Clone repository
git clone <your-repo-url>
cd nfl-research-app

# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install

# Scrapers
cd ../scrapers
pip install -r requirements.txt
```

### 3. Environment Setup
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your credentials:
DATABASE_URL=postgresql://user:password@localhost:5432/nfl_research
ANTHROPIC_API_KEY=your_claude_api_key_here
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
```

### 4. Database Setup
```bash
# Create database
createdb nfl_research

# Run schema
psql nfl_research < database/schema.sql

# Or with connection string:
psql $DATABASE_URL < database/schema.sql
```

### 5. Start Development Servers
```bash
# Terminal 1 - Backend (runs on port 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (runs on port 3000)
cd frontend
npm start

# Terminal 3 - Run scraper (optional)
cd scrapers
python pfr_scraper.py --season 2025 --week 11
```

Visit http://localhost:3000

---

## Deployment to Render

### Quick Deploy (Using render.yaml)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Deploy on Render**
- Go to https://render.com
- Sign in with GitHub
- Click "New" → "Blueprint"
- Select your repository
- Render auto-detects `render.yaml` and deploys everything

3. **Set Environment Variable**
- In Render dashboard → Backend service
- Add environment variable: `ANTHROPIC_API_KEY`
- Database URL is auto-configured

4. **Access Your App**
- Frontend: `https://your-app.onrender.com`
- Backend API: `https://your-api.onrender.com`

---

## Seed Initial Data
```sql
-- Connect to your database
psql $DATABASE_URL

-- Insert NFL teams (example for a few teams)
INSERT INTO teams (name, abbreviation, conference, division) VALUES
('Kansas City Chiefs', 'KC', 'AFC', 'West'),
('Buffalo Bills', 'BUF', 'AFC', 'East'),
('San Francisco 49ers', 'SF', 'NFC', 'West'),
('Philadelphia Eagles', 'PHI', 'NFC', 'East'),
('Dallas Cowboys', 'DAL', 'NFC', 'East'),
('Miami Dolphins', 'MIA', 'AFC', 'East'),
('Baltimore Ravens', 'BAL', 'AFC', 'North'),
('Detroit Lions', 'DET', 'NFC', 'North'),
('Los Angeles Chargers', 'LAC', 'AFC', 'West'),
('Cincinnati Bengals', 'CIN', 'AFC', 'North');

-- Run scrapers to populate player data
cd scrapers
python pfr_scraper.py --season 2025
```

---

## Common Issues

### Database Connection Fails
```bash
# Check DATABASE_URL format
# Should be: postgresql://user:pass@host:5432/db?sslmode=require

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### CORS Errors
Add frontend URL to backend `.env`:
```
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.onrender.com
```

### TypeScript Errors in Frontend
```bash
cd frontend
npm install
# Errors will disappear after dependencies install
```

### Scraper Fails
- Check rate limiting (add delays between requests)
- Verify website structure hasn't changed
- Ensure DATABASE_URL is set in scraper environment

---

## Cost Estimate (Render)

- PostgreSQL Starter: **$7/month**
- Backend Web Service: **$7/month**  
- Frontend Static Site: **Free**
- Cron Jobs (2): **Free**

**Total: ~$14/month**

---

## Next Steps

1. ✅ Get app running locally
2. ✅ Deploy to Render
3. 🔄 Run scrapers to populate data
4. 🔄 Add more data sources (Sleeper, ESPN)
5. 🔄 Implement real-time updates
6. 🔄 Add user authentication
7. 🔄 Build NBA/MLB support

---

## Support

- Render docs: https://render.com/docs
- PostgreSQL docs: https://www.postgresql.org/docs/
- React docs: https://react.dev
- Claude API: https://docs.anthropic.com