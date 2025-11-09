import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { query } from '../config/database';

const router = express.Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST /api/chat - Send message to AI assistant
router.post('/', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Build context from database
    let dbContext = '';
    
    // If query mentions a player, fetch their stats
    const playerMatch = message.match(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/);
    if (playerMatch) {
      const playerName = playerMatch[1];
      const playerData = await query(`
        SELECT p.name, p.position, t.abbreviation as team, ps.*
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        LEFT JOIN player_stats ps ON p.id = ps.player_id
        WHERE p.name ILIKE $1
        ORDER BY ps.week DESC
        LIMIT 5
      `, [`%${playerName}%`]);
      
      if (playerData.rows.length > 0) {
        dbContext = `Player stats for ${playerName}:\n${JSON.stringify(playerData.rows, null, 2)}`;
      }
    }
    
    // Create Claude message
    const claudeMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are an NFL research analyst. Answer this question based on the data provided.

User Question: ${message}

${dbContext ? `Database Context:\n${dbContext}` : ''}

${context ? `Additional Context:\n${context}` : ''}

Provide a helpful, data-driven response with specific stats and recommendations.`
      }]
    });
    
    const responseText = claudeMessage.content[0].type === 'text' 
      ? claudeMessage.content[0].text 
      : 'Unable to generate response';
    
    res.json({
      response: responseText,
      model: claudeMessage.model,
      usage: claudeMessage.usage
    });
    
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router;