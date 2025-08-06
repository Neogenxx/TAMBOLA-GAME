import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Star, Award } from 'lucide-react';
import { Player } from '../types/game';

interface ScoreboardProps {
  players: Player[];
  currentPlayer: Player;
}

export function Scoreboard({ players, currentPlayer }: ScoreboardProps) {
  const getPlayerStatus = (player: Player) => {
    if (player.hasFullHouse) return { text: 'Full House!', color: 'text-purple-600', icon: Crown };
    if (player.hasThirdRow) return { text: 'Third Row', color: 'text-green-600', icon: Trophy };
    if (player.hasSecondRow) return { text: 'Second Row', color: 'text-blue-600', icon: Award };
    if (player.hasFirstRow) return { text: 'First Row', color: 'text-orange-600', icon: Star };
    
    const completedCount = player.completedRows.filter(Boolean).length;
    const markedCount = player.markedNumbers.size;
    return { 
      text: `${markedCount} numbers marked`, 
      color: 'text-gray-600',
      icon: null 
    };
  };

  const getProgressPercentage = (player: Player) => {
    const totalNumbers = player.ticket.grid.flat().filter(cell => cell !== null).length;
    return (player.markedNumbers.size / totalNumbers) * 100;
  };

  const sortedPlayers = [...players].sort((a, b) => {
    // Sort by achievement level, then by numbers marked
    const aLevel = (a.hasFullHouse ? 4 : 0) + a.completedRows.filter(Boolean).length;
    const bLevel = (b.hasFullHouse ? 4 : 0) + b.completedRows.filter(Boolean).length;
    
    if (aLevel !== bLevel) return bLevel - aLevel;
    return b.markedNumbers.size - a.markedNumbers.size;
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
          Leaderboard
        </h2>
        <div className="text-sm text-gray-500">
          {players.length} player{players.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {sortedPlayers.map((player, index) => {
            const status = getPlayerStatus(player);
            const progress = getProgressPercentage(player);
            const isCurrentPlayer = player.id === currentPlayer.id;
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-300
                  ${isCurrentPlayer 
                    ? 'bg-blue-50 border-blue-300 shadow-md' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }
                  ${player.hasFullHouse ? 'ring-2 ring-purple-500 bg-purple-50' : ''}
                `}
              >
                {/* Winner Badge */}
                {index === 0 && (player.hasFullHouse || player.completedRows.some(Boolean)) && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Crown className="w-4 h-4 text-white" />
                  </motion.div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                      ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                        'bg-gradient-to-br from-blue-400 to-blue-500'}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-semibold ${isCurrentPlayer ? 'text-blue-700' : 'text-gray-800'}`}>
                          {player.name}
                        </span>
                        {isCurrentPlayer && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <div className={`flex items-center space-x-1 ${status.color}`}>
                        {StatusIcon && <StatusIcon className="w-4 h-4" />}
                        <span className="text-sm font-medium">{status.text}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">
                      {player.markedNumbers.size}
                    </div>
                    <div className="text-xs text-gray-500">numbers</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      player.hasFullHouse ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                      progress > 70 ? 'bg-gradient-to-r from-green-500 to-blue-500' :
                      progress > 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {Math.round(progress)}% complete
                </div>

                {/* Achievement Badges */}
                <div className="flex space-x-1 mt-2">
                  {player.completedRows.map((completed, rowIndex) => (
                    <motion.div
                      key={rowIndex}
                      className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${completed 
                          ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                          : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                        }
                      `}
                      animate={completed ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {rowIndex + 1}
                    </motion.div>
                  ))}
                  {player.hasFullHouse && (
                    <motion.div
                      className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 border-2 border-purple-300 flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.3 }}
                    >
                      <Crown className="w-3 h-3" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}