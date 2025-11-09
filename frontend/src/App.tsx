// @ts-nocheck
// TODO: Copy the React app from /mnt/user-data/outputs/nfl-research-app.jsx
// Rename .jsx to .tsx and place here
import React, { useState, useMemo } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, Minus, Send, ArrowUpDown, BarChart3, ChevronRight, ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react';

const TEAMS = ['KC', 'BUF', 'SF', 'PHI', 'DAL', 'MIA', 'BAL', 'DET', 'LAC', 'CIN'];
const POSITIONS = ['QB', 'RB', 'WR', 'TE'];
const LEAGUES = ['NFL', 'NBA', 'MLB'];
type PropFilter =
  | 'ALL'
  | 'passYds'
  | 'passTDs'
  | 'rushYds'
  | 'rushTDs'
  | 'rushRecYds'
  | 'recYds'
  | 'receptions'
  | 'passAttempts';

const mockGames = [
  { id: 1, homeTeam: 'BUF', awayTeam: 'KC', time: 'Sun 4:25 PM', spread: 'BUF -2.5', overUnder: 'O/U 52.5', weather: '45°F, Clear', stadium: 'Highmark Stadium' },
  { id: 2, homeTeam: 'SF', awayTeam: 'DAL', time: 'Sun 8:20 PM', spread: 'SF -6', overUnder: 'O/U 47.5', weather: '52°F, Partly Cloudy', stadium: "Levi's Stadium" },
  { id: 3, homeTeam: 'BAL', awayTeam: 'CIN', time: 'Sun 1:00 PM', spread: 'BAL -3.5', overUnder: 'O/U 49.5', weather: '38°F, Windy', stadium: 'M&T Bank Stadium' },
  { id: 4, homeTeam: 'LAC', awayTeam: 'MIA', time: 'Sun 4:05 PM', spread: 'LAC -1', overUnder: 'O/U 48', weather: '68°F, Sunny', stadium: 'SoFi Stadium' },
  { id: 5, homeTeam: 'PHI', awayTeam: 'DET', time: 'Sun 1:00 PM', spread: 'DET -3', overUnder: 'O/U 51', weather: 'Dome', stadium: 'Lincoln Financial Field' },
];

const mockPlayers = [
  { 
    id: 1, name: 'Patrick Mahomes', position: 'QB', team: 'KC', opponent: '@BUF', 
    defRank: 8, trend: 'up', homeAway: 'A',
    props: {
      passYds: { line: 267.5, odds: '-110', streak: 3, streakType: 'over', hitRate: 7, total: 10 },
      passTDs: { line: 1.5, odds: '-125', streak: 5, streakType: 'over', hitRate: 8, total: 10 },
      rushYds: { line: 13.5, odds: '-110', streak: 2, streakType: 'under', hitRate: 6, total: 10 },
      passAttempts: { line: 34.5, odds: '-110', streak: 4, streakType: 'over', hitRate: 7, total: 10 }
    },
    stats: {
      week11: { passYds: 285, passTD: 2, passInt: 1, rushYds: 21, rushTD: 0, targets: 0, rec: 0, recYds: 0, recTD: 0, fpts: 24.5 },
      week10: { passYds: 320, passTD: 3, passInt: 0, rushYds: 15, rushTD: 1, targets: 0, rec: 0, recYds: 0, recTD: 0, fpts: 32.8 },
      week9: { passYds: 262, passTD: 2, passInt: 2, rushYds: 8, rushTD: 0, targets: 0, rec: 0, recYds: 0, recTD: 0, fpts: 18.2 },
      week8: { passYds: 291, passTD: 2, passInt: 0, rushYds: 12, rushTD: 0, targets: 0, rec: 0, recYds: 0, recTD: 0, fpts: 23.6 },
      season: { passYds: 2847, passTD: 21, passInt: 8, rushYds: 187, rushTD: 2, targets: 0, rec: 0, recYds: 0, recTD: 0, fpts: 253.2 }
    }
  },
  { 
    id: 2, name: 'Josh Allen', position: 'QB', team: 'BUF', opponent: 'KC',
    defRank: 12, trend: 'up', homeAway: 'H',
    props: {
      passYds: { line: 245.5, odds: '-115', streak: 4, streakType: 'over', hitRate: 8, total: 10 },
      passTDs: { line: 2.5, odds: '-110', streak: 3, streakType: 'over', hitRate: 6, total: 10 },
      rushYds: { line: 32.5, odds: '-120', streak: 5, streakType: 'over', hitRate: 9, total: 10 },
      passAttempts: { line: 31.5, odds: '-110', streak: 2, streakType: 'over', hitRate: 6, total: 10 }
    },
    stats: {
      week11: { passYds: 298, passTD: 3, passInt: 0, rushYds: 45, rushTD: 1, targets: 0, rec: 0, recYds: 0, recTD: 0, fpts: 33.4 },
      week10: { passYds: 275, passTD: 2, passInt: 1, rushYds: 52, rushTD: 1, targets: 0, rec: 0, recYds: 0, recTD: 0, fpts: 28.8 },
      week9: { passYds: 315, passTD: 4, passInt: 0, rushYds: 28, rushTD: 0, targets: 0, rec: 0, recYds: 0, recTD: 0, fpts: 35.2 },
      week8: { passYds: 283, passTD: 2, passInt: 1, rushYds: 38, rushTD: 1, targets: 0, rec: 0, recYds: 0, recTD: 0, fpts: 27.6 },
      season: { passYds: 3156, passTD: 28, passInt: 7, rushYds: 412, rushTD: 6, targets: 0, rec: 0, recYds: 0, recTD: 0, fpts: 312.4 }
    }
  },
  { 
    id: 3, name: 'Travis Kelce', position: 'TE', team: 'KC', opponent: '@BUF',
    defRank: 15, trend: 'neutral', homeAway: 'A',
    props: {
      recYds: { line: 65.5, odds: '-115', streak: 3, streakType: 'over', hitRate: 6, total: 10 },
      receptions: { line: 5.5, odds: '-120', streak: 4, streakType: 'over', hitRate: 7, total: 10 },
      recTDs: { line: 0.5, odds: '+105', streak: 2, streakType: 'under', hitRate: 4, total: 10 }
    },
    stats: {
      week11: { passYds: 0, passTD: 0, passInt: 0, rushYds: 0, rushTD: 0, targets: 9, rec: 6, recYds: 72, recTD: 1, fpts: 15.2 },
      week10: { passYds: 0, passTD: 0, passInt: 0, rushYds: 0, rushTD: 0, targets: 8, rec: 5, recYds: 58, recTD: 0, fpts: 10.8 },
      week9: { passYds: 0, passTD: 0, passInt: 0, rushYds: 0, rushTD: 0, targets: 11, rec: 7, recYds: 89, recTD: 1, fpts: 17.9 },
      week8: { passYds: 0, passTD: 0, passInt: 0, rushYds: 0, rushTD: 0, targets: 7, rec: 4, recYds: 45, recTD: 0, fpts: 8.5 },
      season: { passYds: 0, passTD: 0, passInt: 0, rushYds: 0, rushTD: 0, targets: 89, rec: 62, recYds: 742, recTD: 6, fpts: 138.2 }
    }
  },
  { 
    id: 4, name: 'Tyreek Hill', position: 'WR', team: 'MIA', opponent: '@LAC',
    defRank: 22, trend: 'up', homeAway: 'A',
    props: {
      recYds: { line: 87.5, odds: '-110', streak: 7, streakType: 'over', hitRate: 9, total: 10 },
      receptions: { line: 6.5, odds: '-115', streak: 5, streakType: 'over', hitRate: 8, total: 10 },
      recTDs: { line: 0.5, odds: '-105', streak: 3, streakType: 'over', hitRate: 6, total: 10 }
    },
    stats: {
      week11: { passYds: 0, passTD: 0, passInt: 0, rushYds: 5, rushTD: 0, targets: 12, rec: 8, recYds: 98, recTD: 1, fpts: 21.3 },
      week10: { passYds: 0, passTD: 0, passInt: 0, rushYds: 8, rushTD: 0, targets: 10, rec: 7, recYds: 112, recTD: 1, fpts: 24.0 },
      week9: { passYds: 0, passTD: 0, passInt: 0, rushYds: 0, rushTD: 0, targets: 11, rec: 6, recYds: 76, recTD: 0, fpts: 13.6 },
      week8: { passYds: 0, passTD: 0, passInt: 0, rushYds: 12, rushTD: 0, targets: 9, rec: 5, recYds: 68, recTD: 1, fpts: 16.0 },
      season: { passYds: 0, passTD: 0, passInt: 0, rushYds: 45, rushTD: 0, targets: 105, rec: 71, recYds: 1021, recTD: 8, fpts: 192.6 }
    }
  },
  { 
    id: 5, name: 'Christian McCaffrey', position: 'RB', team: 'SF', opponent: 'DAL',
    defRank: 18, trend: 'up', homeAway: 'H',
    props: {
      rushYds: { line: 78.5, odds: '-110', streak: 6, streakType: 'over', hitRate: 8, total: 10 },
      rushRecYds: { line: 112.5, odds: '-115', streak: 5, streakType: 'over', hitRate: 9, total: 10 },
      recYds: { line: 34.5, odds: '-110', streak: 3, streakType: 'over', hitRate: 6, total: 10 },
      rushTDs: { line: 0.5, odds: '-120', streak: 4, streakType: 'over', hitRate: 7, total: 10 }
    },
    stats: {
      week11: { passYds: 0, passTD: 0, passInt: 0, rushYds: 85, rushTD: 1, targets: 7, rec: 5, recYds: 42, recTD: 0, fpts: 21.7 },
      week10: { passYds: 0, passTD: 0, passInt: 0, rushYds: 112, rushTD: 2, targets: 6, rec: 4, recYds: 38, recTD: 0, fpts: 27.0 },
      week9: { passYds: 0, passTD: 0, passInt: 0, rushYds: 98, rushTD: 1, targets: 5, rec: 3, recYds: 28, recTD: 0, fpts: 18.6 },
      week8: { passYds: 0, passTD: 0, passInt: 0, rushYds: 105, rushTD: 2, targets: 8, rec: 6, recYds: 51, recTD: 1, fpts: 32.6 },
      season: { passYds: 0, passTD: 0, passInt: 0, rushYds: 1024, rushTD: 12, targets: 68, rec: 52, recYds: 412, recTD: 3, fpts: 246.6 }
    }
  },
  { 
    id: 6, name: 'CeeDee Lamb', position: 'WR', team: 'DAL', opponent: '@SF',
    defRank: 9, trend: 'neutral', homeAway: 'A',
    props: {
      recYds: { line: 82.5, odds: '-110', streak: 3, streakType: 'over', hitRate: 6, total: 10 },
      receptions: { line: 6.5, odds: '-115', streak: 4, streakType: 'over', hitRate: 7, total: 10 },
      recTDs: { line: 0.5, odds: '+110', streak: 2, streakType: 'over', hitRate: 5, total: 10 }
    },
    stats: {
      week11: { passYds: 0, passTD: 0, passInt: 0, rushYds: 0, rushTD: 0, targets: 10, rec: 7, recYds: 94, recTD: 1, fpts: 19.4 },
      week10: { passYds: 0, passTD: 0, passInt: 0, rushYds: 0, rushTD: 0, targets: 9, rec: 6, recYds: 82, recTD: 0, fpts: 14.2 },
      week9: { passYds: 0, passTD: 0, passInt: 0, rushYds: 0, rushTD: 0, targets: 11, rec: 8, recYds: 105, recTD: 1, fpts: 22.5 },
      week8: { passYds: 0, passTD: 0, passInt: 0, rushYds: 0, rushTD: 0, targets: 8, rec: 5, recYds: 67, recTD: 0, fpts: 11.7 },
      season: { passYds: 0, passTD: 0, passInt: 0, rushYds: 0, rushTD: 0, targets: 98, rec: 68, recYds: 912, recTD: 7, fpts: 168.2 }
    }
  },
];

// TrendIndicator Component
const TrendIndicator = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };
  
  // Sparkline Component
  const Sparkline = ({ player }: { player: any }) => {
    const weeks = ['week8', 'week9', 'week10', 'week11'];
    const points = weeks.map(w => player.stats[w].fpts);
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;
    
    return (
      <svg width="40" height="20" className="inline-block">
        <polyline
          points={points.map((p, i) => `${i * 13},${20 - ((p - min) / range) * 15}`).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-blue-500"
        />
      </svg>
    );
  };
  
  // ChatMessage Component
  const ChatMessage = ({ role, content, data }: { role: string; content: string; data?: string[] }) => (
    <div className={`mb-4 ${role === 'user' ? 'text-right' : ''}`}>
      <div className={`inline-block max-w-[90%] p-3 rounded-lg ${
        role === 'user' 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 text-gray-900'
      }`}>
        <div className="text-sm">{content}</div>
        {data && (
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="text-xs font-semibold mb-2">Supporting Data:</div>
            <div className="text-xs space-y-1">
              {data.map((item, i) => (
                <div key={i}>• {item}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  // GameCard Component
  const GameCard = ({ game, isSelected, onClick }: { game: any; isSelected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border-2 transition-all mb-2 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{game.awayTeam}</span>
          <span className="text-gray-400 text-xs">@</span>
          <span className="font-bold text-sm">{game.homeTeam}</span>
        </div>
      </div>
      <div className="text-xs text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>{game.time}</span>
          <span className="font-medium text-gray-900">{game.spread}</span>
        </div>
        <div className="flex justify-between">
          <span>{game.weather}</span>
          <span className="text-gray-500">{game.overUnder}</span>
        </div>
      </div>
    </button>
  );
  
  // PlayerModal Component
  const PlayerModal = ({ player, onClose }: { player: any; onClose: () => void }) => {
    if (!player) return null;
    
    const weekKeys = ['week8', 'week9', 'week10', 'week11'];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{player.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">{player.position}</span>
                  <span className="text-sm">{player.team} • {player.opponent}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
  
          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Season Stats Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Season Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {player.position === 'QB' && (
                  <>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600">Pass Yards</div>
                      <div className="text-xl font-bold text-gray-900">{player.stats.season.passYds}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600">Pass TDs</div>
                      <div className="text-xl font-bold text-gray-900">{player.stats.season.passTD}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600">Interceptions</div>
                      <div className="text-xl font-bold text-gray-900">{player.stats.season.passInt}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600">Fantasy Pts</div>
                      <div className="text-xl font-bold text-gray-900">{player.stats.season.fpts.toFixed(1)}</div>
                    </div>
                  </>
                )}
                {(player.position === 'WR' || player.position === 'TE') && (
                  <>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600">Receptions</div>
                      <div className="text-xl font-bold text-gray-900">{player.stats.season.rec}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600">Rec Yards</div>
                      <div className="text-xl font-bold text-gray-900">{player.stats.season.recYds}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600">Rec TDs</div>
                      <div className="text-xl font-bold text-gray-900">{player.stats.season.recTD}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600">Fantasy Pts</div>
                      <div className="text-xl font-bold text-gray-900">{player.stats.season.fpts.toFixed(1)}</div>
                    </div>
                  </>
                )}
                {player.position === 'RB' && (
                  <>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600">Rush Yards</div>
                      <div className="text-xl font-bold text-gray-900">{player.stats.season.rushYds}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600">Rush TDs</div>
                      <div className="text-xl font-bold text-gray-900">{player.stats.season.rushTD}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600">Receptions</div>
                      <div className="text-xl font-bold text-gray-900">{player.stats.season.rec}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600">Fantasy Pts</div>
                      <div className="text-xl font-bold text-gray-900">{player.stats.season.fpts.toFixed(1)}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
  
            {/* Game Log */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Recent Game Log</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Week</th>
                      {player.position === 'QB' && (
                        <>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Pass Yds</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Pass TD</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">INT</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Rush Yds</th>
                        </>
                      )}
                      {(player.position === 'WR' || player.position === 'TE') && (
                        <>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Targets</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Rec</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Rec Yds</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Rec TD</th>
                        </>
                      )}
                      {player.position === 'RB' && (
                        <>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Rush Yds</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Rush TD</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Rec</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Rec Yds</th>
                        </>
                      )}
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">FPts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {weekKeys.reverse().map((week) => {
                      const weekNum = parseInt(week.replace('week', ''));
                      const stats = player.stats[week];
                      return (
                        <tr key={week} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">Week {weekNum}</td>
                          {player.position === 'QB' && (
                            <>
                              <td className="px-4 py-2 text-right">{stats.passYds}</td>
                              <td className="px-4 py-2 text-right">{stats.passTD}</td>
                              <td className="px-4 py-2 text-right text-red-600">{stats.passInt}</td>
                              <td className="px-4 py-2 text-right">{stats.rushYds}</td>
                            </>
                          )}
                          {(player.position === 'WR' || player.position === 'TE') && (
                            <>
                              <td className="px-4 py-2 text-right">{stats.targets}</td>
                              <td className="px-4 py-2 text-right">{stats.rec}</td>
                              <td className="px-4 py-2 text-right">{stats.recYds}</td>
                              <td className="px-4 py-2 text-right">{stats.recTD}</td>
                            </>
                          )}
                          {player.position === 'RB' && (
                            <>
                              <td className="px-4 py-2 text-right">{stats.rushYds}</td>
                              <td className="px-4 py-2 text-right">{stats.rushTD}</td>
                              <td className="px-4 py-2 text-right">{stats.rec}</td>
                              <td className="px-4 py-2 text-right">{stats.recYds}</td>
                            </>
                          )}
                          <td className="px-4 py-2 text-right font-semibold">{stats.fpts.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
  
            {/* Helpful Links */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a href={`https://www.pro-football-reference.com/search/search.fcgi?search=${player.name}`} target="_blank" rel="noopener noreferrer" 
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-blue-600">📊</span>
                  <span className="text-sm font-medium">Pro Football Reference</span>
                </a>
                <a href={`https://www.espn.com/nfl/player/_/name/${player.name.toLowerCase().replace(' ', '-')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-red-600">🏈</span>
                  <span className="text-sm font-medium">ESPN Player Page</span>
                </a>
                <a href={`https://twitter.com/search?q=${encodeURIComponent(player.name + ' NFL')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-sky-500">🐦</span>
                  <span className="text-sm font-medium">Twitter News</span>
                </a>
                <a href={`https://www.rotowire.com/football/player/${player.name.toLowerCase().replace(' ', '-')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-green-600">📰</span>
                  <span className="text-sm font-medium">RotoWire News</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main App Component
export default function NFLResearchApp() {
    const [selectedLeague, setSelectedLeague] = useState('NFL');
    const [selectedPosition, setSelectedPosition] = useState('ALL');
    const [selectedTeam, setSelectedTeam] = useState('ALL');
    const [selectedGame, setSelectedGame] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [timePeriod, setTimePeriod] = useState('week11');
    const [propFilter, setPropFilter] = useState<PropFilter>('ALL');
    const [sortConfig, setSortConfig] = useState({ key: 'fpts', direction: 'desc' });
    const [chatCollapsed, setChatCollapsed] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
    const [matchupsCollapsed, setMatchupsCollapsed] = useState(false);
    const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  
    const [chatMessages, setChatMessages] = useState([
      { role: 'assistant', content: 'Hi! I can help you analyze player stats, props, and betting lines. Try clicking a prop filter button (Pass Yds, Rec Yds, etc.) or ask questions like: "Kelce receiving yards prop" or "Who has hot streaks?"' }
    ]);
    const [chatInput, setChatInput] = useState('');
  
    const handleSort = (key: string) => {
      setSortConfig(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
      }));
    };
  
    const filteredPlayers = useMemo(() => {
      let filtered = mockPlayers.map(player => {
        let currentStats = player.stats[timePeriod];
        
        if (timePeriod === 'last4') {
          const weeks = ['week8', 'week9', 'week10', 'week11'];
          currentStats = {
            passYds: Math.round(weeks.reduce((sum, w) => sum + player.stats[w].passYds, 0) / 4),
            passTD: Math.round(weeks.reduce((sum, w) => sum + player.stats[w].passTD, 0) / 4 * 10) / 10,
            passInt: Math.round(weeks.reduce((sum, w) => sum + player.stats[w].passInt, 0) / 4 * 10) / 10,
            rushYds: Math.round(weeks.reduce((sum, w) => sum + player.stats[w].rushYds, 0) / 4),
            rushTD: Math.round(weeks.reduce((sum, w) => sum + player.stats[w].rushTD, 0) / 4 * 10) / 10,
            targets: Math.round(weeks.reduce((sum, w) => sum + player.stats[w].targets, 0) / 4),
            rec: Math.round(weeks.reduce((sum, w) => sum + player.stats[w].rec, 0) / 4),
            recYds: Math.round(weeks.reduce((sum, w) => sum + player.stats[w].recYds, 0) / 4),
            recTD: Math.round(weeks.reduce((sum, w) => sum + player.stats[w].recTD, 0) / 4 * 10) / 10,
            fpts: Math.round(weeks.reduce((sum, w) => sum + player.stats[w].fpts, 0) / 4 * 10) / 10,
          };
        }
        
        return { ...player, currentStats };
      });
      
      if (selectedGame) {
        const game = mockGames.find(g => g.id === selectedGame);
        if (game) {
          filtered = filtered.filter(p => p.team === game.homeTeam || p.team === game.awayTeam);
        }
      }
      
      if (selectedPosition !== 'ALL') {
        filtered = filtered.filter(p => p.position === selectedPosition);
      }
      
      if (selectedTeam !== 'ALL') {
        filtered = filtered.filter(p => p.team === selectedTeam);
      }
      
      if (searchQuery) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      filtered = [...filtered].sort((a, b) => {
        let aVal = sortConfig.key === 'name' ? a[sortConfig.key] : a.currentStats[sortConfig.key] || a[sortConfig.key];
        let bVal = sortConfig.key === 'name' ? b[sortConfig.key] : b.currentStats[sortConfig.key] || b[sortConfig.key];
        
        if (sortConfig.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
      
      return filtered;
    }, [selectedPosition, selectedTeam, searchQuery, sortConfig, timePeriod, selectedGame]);
  
    const handleChatSubmit = () => {
      if (!chatInput.trim()) return;
      
      const userMessage = chatInput;
      setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      setChatInput('');
  
      setTimeout(() => {
        let response: any = { role: 'assistant', content: '', data: [] };
        
        if (userMessage.toLowerCase().includes('kelce') && userMessage.toLowerCase().includes('prop')) {
          const kelce = mockPlayers.find(p => p.name.includes('Kelce'));
          if (kelce) {
            response.content = `Travis Kelce receiving yards prop analysis:`;
            response.data = [
              `Prop Line: O/U ${kelce.props.recYds.line} yards (${kelce.props.recYds.odds})`,
              `Current Streak: ${kelce.props.recYds.streak} games ${kelce.props.recYds.streakType}`,
              `Hit Rate: ${kelce.props.recYds.hitRate}/${kelce.props.recYds.total} (${Math.round(kelce.props.recYds.hitRate/kelce.props.recYds.total*100)}%)`,
              `Week 11 Projection: ${kelce.stats.week11.recYds} yards`,
              `Recommendation: OVER ${kelce.props.recYds.line} - Strong matchup vs #15 TE defense`
            ];
          }
        } else if (userMessage.toLowerCase().includes('kelce')) {
          const kelce = mockPlayers.find(p => p.name.includes('Kelce'));
          if (kelce) {
            const last4 = ['week8', 'week9', 'week10', 'week11'];
            const avgYds = Math.round(last4.reduce((sum, w) => sum + kelce.stats[w].recYds, 0) / 4);
            
            response.content = `Based on Travis Kelce's recent performance and matchup vs BUF defense (ranked #15 vs TE), I recommend OVER 65.5 receiving yards with 72% confidence.`;
            response.data = [
              `Last 4 weeks avg: ${avgYds} rec yards (${kelce.stats.week8.recYds}, ${kelce.stats.week9.recYds}, ${kelce.stats.week10.recYds}, ${kelce.stats.week11.recYds})`,
              `Week 11 projection: ${kelce.stats.week11.recYds} yards on ${kelce.stats.week11.targets} targets`,
              `Prop line: O/U ${kelce.props.recYds.line} (${kelce.props.recYds.odds})`,
              `Hit rate: ${kelce.props.recYds.hitRate}/${kelce.props.recYds.total} games over`,
              'Historical trend shows consistent volume in this matchup'
            ];
          }
        } else if (userMessage.toLowerCase().includes('streak') || userMessage.toLowerCase().includes('hot')) {
          response.content = 'Top prop streaks this week (players hitting their lines consistently):';
          response.data = [
            '1. Tyreek Hill - Rec Yds: 7 game OVER streak (9/10 hit rate)',
            '2. Christian McCaffrey - Rush Yds: 6 game OVER streak',
            '3. Josh Allen - Rush Yds: 5 game OVER streak',
            'Click a prop filter (Pass Yds, Rec Yds, etc.) to see all props for that category'
          ];
        } else if (userMessage.toLowerCase().includes('prop')) {
          response.content = 'Use the prop filter buttons in the left sidebar to analyze specific betting markets:';
          response.data = [
            'Pass Yds, Pass TDs - QB passing props',
            'Rush Yds, Rush+Rec Yds - RB/QB rushing props',
            'Rec Yds, Receptions - WR/TE receiving props',
            'Each shows: Prop Line, Streak, Hit Rate, and Odds',
            'Green = Over streak, Red = Under streak'
          ];
        } else if (userMessage.toLowerCase().includes('matchup') || userMessage.toLowerCase().includes('wr')) {
          response.content = 'Top 3 WR matchups this week based on defense rankings and projected volume:';
          response.data = [
            '1. Tyreek Hill vs LAC (#22 vs WR) - 8 rec, 98 yds projected',
            '2. Justin Jefferson vs GB (#19 vs WR) - Favorable coverage matchup',
            '3. CeeDee Lamb vs SF (#9 vs WR) - Tough defense but high volume (10 targets)'
          ];
        } else if (userMessage.toLowerCase().includes('home') || userMessage.toLowerCase().includes('away') || userMessage.toLowerCase().includes('split')) {
          response.content = 'Home vs Away performance shows significant differences for top players:';
          response.data = [
            'Josh Allen: 28.5 FPts avg at home (current game is home)',
            'Patrick Mahomes: Playing @ BUF (away), 23.2 FPts away avg',
            'Christian McCaffrey: At home vs DAL, 24.8 FPts home avg',
            'Home teams averaging 2.3 more FPts this season'
          ];
        } else if (userMessage.toLowerCase().includes('season') || userMessage.toLowerCase().includes('total')) {
          response.content = 'Season leaders by position show clear frontrunners:';
          response.data = [
            'QB: Josh Allen (312.4 FPts, 3156 pass yds, 28 TDs)',
            'RB: Christian McCaffrey (246.6 FPts, 1024 rush yds, 12 TDs)',
            'WR: Tyreek Hill (192.6 FPts, 1021 rec yds, 8 TDs)',
            'TE: Travis Kelce (138.2 FPts, 742 rec yds, 6 TDs)'
          ];
        } else {
          response.content = 'I can analyze player performance, props, and betting trends. Try asking:';
          response.data = [
            'Prop analysis: "Kelce receiving yards prop"',
            'Streaks: "Who has the hottest prop streaks?"',
            'Matchups: "Best WR matchups this week"',
            'General: Use prop filter buttons in the left sidebar'
          ];
        }
        
        setChatMessages(prev => [...prev, response]);
      }, 800);
    };
  
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
        `}</style>
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sports Research Platform</h1>
                <p className="text-sm text-gray-500">Week 11 • 2025 Season • {
                  timePeriod === 'week11' ? 'Week 11 Stats' :
                  timePeriod === 'week10' ? 'Week 10 Stats' :
                  timePeriod === 'week9' ? 'Week 9 Stats' :
                  timePeriod === 'week8' ? 'Week 8 Stats' :
                  timePeriod === 'last4' ? 'Last 4 Weeks Average' :
                  'Season Totals'
                }</p>
              </div>
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-gray-900"
              >
                {LEAGUES.map(league => (
                  <option key={league} value={league}>{league}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-600">Players:</span>
                <span className="font-semibold ml-2">{filteredPlayers.length}</span>
              </div>
            </div>
          </div>
        </div>
  
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto flex-shrink-0">
            {/* Matchups Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setMatchupsCollapsed(!matchupsCollapsed)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase hover:text-gray-700 transition-colors"
                >
                  Week 11 Matchups
                  {matchupsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
                {selectedGame && !matchupsCollapsed && (
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {!matchupsCollapsed && (
                <div className="space-y-2 animate-fadeIn">
                  {mockGames.map(game => (
                    <GameCard
                      key={game.id}
                      game={game}
                      isSelected={selectedGame === game.id}
                      onClick={() => setSelectedGame(selectedGame === game.id ? null : game.id)}
                    />
                  ))}
                </div>
              )}
            </div>
  
            {/* Filters Section */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase mb-3 hover:text-gray-700 transition-colors w-full"
              >
                <Filter className="w-4 h-4" />
                Filters
                {filtersCollapsed ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronUp className="w-4 h-4 ml-auto" />}
              </button>
              
              {!filtersCollapsed && (
                <div className="animate-fadeIn">
                  {/* Position Filter */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Position</label>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedPosition('ALL')}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          selectedPosition === 'ALL' 
                            ? 'bg-blue-100 text-blue-700 font-medium' 
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        All Offense
                      </button>
                      {POSITIONS.map(pos => (
                        <button
                          key={pos}
                          onClick={() => setSelectedPosition(pos)}
                          className={`w-full text-left px-3 py-2 rounded text-sm ${
                            selectedPosition === pos 
                              ? 'bg-blue-100 text-blue-700 font-medium' 
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>
  
                  {/* Team Filter */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Team</label>
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">All Teams</option>
                      {TEAMS.map(team => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Prop Type Filters */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Prop Markets</label>
                    <div className="space-y-1">
                      <button
                        onClick={() => setPropFilter('ALL')}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs ${
                          propFilter === 'ALL' 
                            ? 'bg-blue-600 text-white font-medium' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        All Stats
                      </button>
                      <button
                        onClick={() => setPropFilter('passYds')}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs ${
                          propFilter === 'passYds' 
                            ? 'bg-blue-600 text-white font-medium' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Pass Yards
                      </button>
                      <button
                        onClick={() => setPropFilter('passTDs')}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs ${
                          propFilter === 'passTDs' 
                            ? 'bg-blue-600 text-white font-medium' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Pass TDs
                      </button>
                      <button
                        onClick={() => setPropFilter('rushYds')}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs ${
                          propFilter === 'rushYds' 
                            ? 'bg-green-600 text-white font-medium' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Rush Yards
                      </button>
                      <button
                        onClick={() => setPropFilter('rushRecYds')}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs ${
                          propFilter === 'rushRecYds' 
                            ? 'bg-green-600 text-white font-medium' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Rush + Rec Yds
                      </button>
                      <button
                        onClick={() => setPropFilter('recYds')}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs ${
                          propFilter === 'recYds' 
                            ? 'bg-purple-600 text-white font-medium' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Rec Yards
                      </button>
                      <button
                        onClick={() => setPropFilter('receptions')}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs ${
                          propFilter === 'receptions' 
                            ? 'bg-purple-600 text-white font-medium' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Receptions
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
  
          {/* Data Table Section */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden bg-gray-50 border-r-4 border-blue-200 min-w-0">
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Player Data</h2>
            </div>
            
            {/* Search and Time Period Filter */}
            <div className="mb-3 flex gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-sm"
              >
                <option value="week11">Week 11</option>
                <option value="week10">Week 10</option>
                <option value="week9">Week 9</option>
                <option value="week8">Week 8</option>
                <option value="last4">Last 4 Weeks (Avg)</option>
                <option value="season">Season Total</option>
              </select>
            </div>
  
            {/* Table */}
            <div className="flex-1 bg-white rounded-lg border-2 border-gray-300 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-blue-50 px-4 py-2 border-b-2 border-blue-200">
                <div className="text-xs font-semibold text-blue-900 uppercase">
                  {propFilter === 'ALL' 
                    ? 'Player Stats Table - Click Column Headers to Sort' 
                    : `${propFilter.replace(/([A-Z])/g, ' $1').trim()} Props - Showing Betting Lines & Streaks`
                  }
                </div>
              </div>
              <div className="overflow-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left sticky left-0 bg-gray-50 z-20">
                        <button onClick={() => handleSort('name')} className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900">
                          Player <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Pos</th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Team</th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Opp</th>
                      
                      {/* Passing Stats */}
                      <th className="px-2 py-2 text-right border-l-2 border-blue-200 bg-blue-50/30">
                        <button onClick={() => handleSort('passYds')} className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900 ml-auto">
                          Pass Yds <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-2 py-2 text-right bg-blue-50/30">
                        <button onClick={() => handleSort('passTD')} className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900 ml-auto">
                          Pass TD <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-2 py-2 text-right bg-blue-50/30">
                        <button onClick={() => handleSort('passInt')} className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900 ml-auto">
                          INT <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      
                      {/* Rushing Stats */}
                      <th className="px-2 py-2 text-right border-l-2 border-green-200 bg-green-50/30">
                        <button onClick={() => handleSort('rushYds')} className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900 ml-auto">
                          Rush Yds <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-2 py-2 text-right bg-green-50/30">
                        <button onClick={() => handleSort('rushTD')} className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900 ml-auto">
                          Rush TD <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      
                      {/* Receiving Stats */}
                      <th className="px-2 py-2 text-right border-l-2 border-purple-200 bg-purple-50/30">
                        <button onClick={() => handleSort('targets')} className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900 ml-auto">
                          Tgt <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-2 py-2 text-right bg-purple-50/30">
                        <button onClick={() => handleSort('rec')} className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900 ml-auto">
                          Rec <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-2 py-2 text-right bg-purple-50/30">
                        <button onClick={() => handleSort('recYds')} className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900 ml-auto">
                          Rec Yds <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-2 py-2 text-right bg-purple-50/30">
                        <button onClick={() => handleSort('recTD')} className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900 ml-auto">
                          Rec TD <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      
                      {/* Fantasy & Matchup */}
                      <th className="px-2 py-2 text-right border-l-2 border-orange-200">
                        <button onClick={() => handleSort('fpts')} className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900 ml-auto">
                          FPts <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-2 py-2 text-right">
                        <button onClick={() => handleSort('defRank')} className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900 ml-auto">
                          Def Rnk <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Trend (4wk)</th>
                      
                      {/* Prop Betting Columns */}
                      {propFilter !== 'ALL' && (
                        <>
                          <th className="px-2 py-2 text-center border-l-2 border-yellow-200 bg-yellow-50">
                            <div className="text-xs font-semibold text-yellow-800 uppercase">Prop Line</div>
                          </th>
                          <th className="px-2 py-2 text-center bg-yellow-50">
                            <div className="text-xs font-semibold text-yellow-800 uppercase">Streak</div>
                          </th>
                          <th className="px-2 py-2 text-center bg-yellow-50">
                            <div className="text-xs font-semibold text-yellow-800 uppercase">Hit Rate</div>
                          </th>
                          <th className="px-2 py-2 text-center bg-yellow-50">
                            <div className="text-xs font-semibold text-yellow-800 uppercase">Odds</div>
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPlayers.map(player => {
                      const stats = player.currentStats;
                      return (
                        <tr key={player.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                          <td className="px-3 py-2 sticky left-0 bg-white hover:bg-gray-50 z-10">
                            <button 
                              onClick={() => setSelectedPlayer(player)}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap text-left"
                            >
                              {player.name}
                            </button>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              player.position === 'QB' ? 'bg-blue-100 text-blue-700' :
                              player.position === 'RB' ? 'bg-green-100 text-green-700' :
                              player.position === 'WR' ? 'bg-purple-100 text-purple-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {player.position}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center text-xs font-medium text-gray-700">{player.team}</td>
                          <td className="px-2 py-2 text-center text-xs text-gray-600">{player.opponent}</td>
                          
                          {/* Passing Stats */}
                          <td className="px-2 py-2 text-right text-xs border-l-2 border-blue-200 bg-blue-50/30">
                            {stats.passYds > 0 ? stats.passYds : '-'}
                          </td>
                          <td className="px-2 py-2 text-right text-xs bg-blue-50/30">
                            {stats.passTD > 0 ? stats.passTD : '-'}
                          </td>
                          <td className="px-2 py-2 text-right text-xs bg-blue-50/30">
                            {stats.passInt > 0 ? <span className="text-red-600">{stats.passInt}</span> : '-'}
                          </td>
                          
                          {/* Rushing Stats */}
                          <td className="px-2 py-2 text-right text-xs border-l-2 border-green-200 bg-green-50/30">
                            {stats.rushYds > 0 ? stats.rushYds : '-'}
                          </td>
                          <td className="px-2 py-2 text-right text-xs bg-green-50/30">
                            {stats.rushTD > 0 ? stats.rushTD : '-'}
                          </td>
                          
                          {/* Receiving Stats */}
                          <td className="px-2 py-2 text-right text-xs border-l-2 border-purple-200 bg-purple-50/30">
                            {stats.targets > 0 ? stats.targets : '-'}
                          </td>
                          <td className="px-2 py-2 text-right text-xs bg-purple-50/30">
                            {stats.rec > 0 ? stats.rec : '-'}
                          </td>
                          <td className="px-2 py-2 text-right text-xs bg-purple-50/30">
                            {stats.recYds > 0 ? stats.recYds : '-'}
                          </td>
                          <td className="px-2 py-2 text-right text-xs bg-purple-50/30">
                            {stats.recTD > 0 ? stats.recTD : '-'}
                          </td>
                          
                          {/* Fantasy & Matchup */}
                          <td className="px-2 py-2 text-right text-xs font-semibold text-gray-900 border-l-2 border-orange-200">
                            {stats.fpts.toFixed(1)}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <span className={`text-xs font-medium ${
                              player.defRank <= 10 ? 'text-green-600' : 
                              player.defRank <= 20 ? 'text-yellow-600' : 
                              'text-red-600'
                            }`}>
                              #{player.defRank}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <TrendIndicator trend={player.trend} />
                              <Sparkline player={player} />
                            </div>
                          </td>
                          
                          {/* Prop Betting Data */}
                          {propFilter !== 'ALL' && player.props && (player.props as any)[propFilter] && (
                            <>
                              <td className="px-2 py-2 text-center border-l-2 border-yellow-200 bg-yellow-50/30">
                                <div className="text-xs font-semibold text-gray-900">
                                  {(player.props as any)[propFilter].line}
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center bg-yellow-50/30">
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                  (player.props as any)[propFilter].streakType === 'over' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {(player.props as any)[propFilter].streak} {(player.props as any)[propFilter].streakType === 'over' ? '↑' : '↓'}
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center bg-yellow-50/30">
                                <div className="text-xs font-medium text-gray-700">
                                  {(player.props as any)[propFilter].hitRate}/{(player.props as any)[propFilter].total}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  ({Math.round(((player.props as any)[propFilter].hitRate / (player.props as any)[propFilter].total) * 100)}%)
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center bg-yellow-50/30">
                                <div className={`text-xs font-semibold ${
                                  (player.props as any)[propFilter].streakType === 'over' 
                                    ? 'text-green-700' 
                                    : 'text-red-700'
                                }`}>
                                  {(player.props as any)[propFilter].streakType === 'over' ? 'O' : 'U'} {(player.props as any)[propFilter].line}
                                </div>
                                <div className="text-[10px] text-gray-600">
                                  ({(player.props as any)[propFilter].odds})
                                </div>
                              </td>
                            </>
                          )}
                          {propFilter !== 'ALL' && (!player.props || !(player.props as any)[propFilter]) && (
                            <>
                              <td className="px-2 py-2 text-center border-l-2 border-yellow-200 bg-yellow-50/30 text-gray-400 text-xs" colSpan={4}>
                                No prop data
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
  
          {/* Chat Section */}
          <div className={`bg-white flex flex-col flex-shrink-0 shadow-lg transition-all duration-300 ${
            chatCollapsed ? 'w-12' : 'w-96'
          }`}>
            <div className="px-4 py-3 bg-blue-600 text-white flex items-center justify-between">
              {!chatCollapsed && (
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    AI Research Assistant
                  </h2>
                  <p className="text-xs mt-1 text-blue-100">Ask about stats, matchups, or predictions</p>
                </div>
              )}
              <button
                onClick={() => setChatCollapsed(!chatCollapsed)}
                className="p-2 hover:bg-blue-700 rounded transition-colors"
                title={chatCollapsed ? "Expand chat" : "Collapse chat"}
              >
                {chatCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
  
            {!chatCollapsed && (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  {chatMessages.map((msg, i) => (
                    <ChatMessage key={i} {...msg} />
                  ))}
                </div>
  
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                      placeholder="Ask about props, streaks, matchups..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={handleChatSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Try: "Who has the hottest prop streaks?" or click a prop filter
                  </div>
                </div>
              </>
            )}
            
            {chatCollapsed && (
              <div className="flex-1 flex items-center justify-center">
                <div className="transform -rotate-90 whitespace-nowrap text-xs font-semibold text-gray-500">
                  AI Chat
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Player Modal */}
        {selectedPlayer && (
          <PlayerModal 
            player={selectedPlayer} 
            onClose={() => setSelectedPlayer(null)} 
          />
        )}
      </div>
    );
  }