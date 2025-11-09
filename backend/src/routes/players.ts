import express from 'express';
import { query } from '../config/database';

const router = express.Router();

// GET /api/players - Get all players with filters
router.get('/', async (req, res) => {
  try {
    const { position, team, week, season = '2025', game_id } = req.query;
    
    let sql = `
      SELECT 
        p.id, p.name, p.position, t.abbreviation as team,
        ps.passing_yards, ps.passing_tds, ps.passing_int,
        ps.rushing_yards, ps.rushing_tds,
        ps.targets, ps.receptions, ps.receiving_yards, ps.receiving_tds,
        ps.fantasy_points
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN player_stats ps ON p.id = ps.player_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    
    if (position) {
      sql += ` AND p.position = $${paramCount}`;
      params.push(position);
      paramCount++;
    }
    
    if (team) {
      sql += ` AND t.abbreviation = $${paramCount}`;
      params.push(team);
      paramCount++;
    }
    
    if (week) {
      sql += ` AND ps.week = $${paramCount}`;
      params.push(week);
      paramCount++;
    }
    
    if (season) {
      sql += ` AND ps.season = $${paramCount}`;
      params.push(season);
      paramCount++;
    }
    
    if (game_id) {
      sql += ` AND ps.game_id = $${paramCount}`;
      params.push(game_id);
      paramCount++;
    }
    
    sql += ' ORDER BY ps.fantasy_points DESC NULLS LAST';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// GET /api/players/:id - Get player details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT p.*, t.name as team_name, t.abbreviation as team
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// GET /api/players/:id/stats - Get player game log
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { weeks, season = '2025' } = req.query;
    
    let sql = `
      SELECT 
        ps.*,
        g.week, g.game_date,
        ht.abbreviation as home_team,
        at.abbreviation as away_team
      FROM player_stats ps
      JOIN games g ON ps.game_id = g.id
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      WHERE ps.player_id = $1 AND ps.season = $2
    `;
    
    const params: any[] = [id, season];
    
    if (weeks) {
      sql += ` AND ps.week <= $3`;
      params.push(weeks);
    }
    
    sql += ' ORDER BY ps.week DESC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

export default router;