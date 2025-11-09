import express from 'express';
import { query } from '../config/database';

const router = express.Router();

// GET /api/teams - Get all teams
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM teams
      ORDER BY name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// GET /api/teams/:id/defense-rankings - Get defense rankings
router.get('/:id/defense-rankings', async (req, res) => {
  try {
    const { id } = req.params;
    const { vsPosition, week, season = '2025' } = req.query;
    
    const result = await query(`
      SELECT *
      FROM defense_rankings
      WHERE team_id = $1 
        AND season = $2
        ${week ? 'AND week = $3' : ''}
      ORDER BY week DESC
    `, week ? [id, season, week] : [id, season]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching defense rankings:', error);
    res.status(500).json({ error: 'Failed to fetch defense rankings' });
  }
});

export default router;