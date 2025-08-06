import React from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Play, LogOut } from 'lucide-react';
import { GameRoom, Player } from '../types/game';

interface GameLobbyProps {
  room: GameRoom;
  currentPlayer: Player;
  isHost: boolean;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export function GameLobby({ room, currentPlayer, isHost, onStartGame, onLeaveRoom }: GameLobbyProps) {
  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.code);
    // In a real app, you'd show a toast notification here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Game Lobby</h1>
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="bg-indigo-100 px-6 py-3 rounded-xl">
                <div className="text-sm text-indigo-600 font-medium">Room Code</div>
                <div className="text-2xl font-bold text-indigo-800 flex items-center">
                  {room.code}
                  <button
                    onClick={copyRoomCode}
                    className="ml-2 p-1 hover:bg-indigo-200 rounded transition-colors"
                    title="Copy room code"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            {isHost && (
              <p className="text-gray-600">Share this code with your friends to let them join!</p>
            )}
          </div>

          {/* Players List */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                <Users className="w-6 h-6 mr-2" />
                Players ({room.players.length})
              </h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {room.players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2
                    ${player.id === currentPlayer.id 
                      ? 'border-blue-400 shadow-lg' 
                      : 'border-gray-200'
                    }
                    ${player.id === room.hostId 
                      ? 'ring-2 ring-yellow-400' 
                      : ''
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {player.name}
                        {player.id === room.hostId && (
                          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Host
                          </span>
                        )}
                        {player.id === currentPlayer.id && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Ready to play</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl mb-8 border border-yellow-200">
            <h3 className="text-xl font-semibold text-orange-800 mb-3">How to Play</h3>
            <ul className="text-orange-700 space-y-2">
              <li>• Each player gets a unique Tambola ticket with 15 numbers</li>
              <li>• Numbers will be called out randomly from 1 to 90</li>
              <li>• Mark the numbers on your ticket as they are called</li>
              <li>• Win prizes for completing First Row, Second Row, Third Row, or Full House</li>
              <li>• Listen to the voice announcements for each number</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            {isHost ? (
              <motion.button
                onClick={onStartGame}
                disabled={room.players.length < 1}
                className={`
                  px-8 py-4 rounded-xl font-semibold text-white text-lg shadow-lg transition-all duration-200
                  ${room.players.length >= 1
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'
                    : 'bg-gray-400 cursor-not-allowed'
                  }
                `}
                whileHover={room.players.length >= 1 ? { scale: 1.05 } : {}}
                whileTap={room.players.length >= 1 ? { scale: 0.95 } : {}}
              >
                <Play className="inline-block w-6 h-6 mr-2" />
                Start Game
              </motion.button>
            ) : (
              <div className="text-center">
                <div className="text-lg font-medium text-gray-700 mb-2">
                  Waiting for host to start the game...
                </div>
                <div className="animate-pulse flex justify-center">
                  <div className="w-4 h-4 bg-blue-400 rounded-full mr-1"></div>
                  <div className="w-4 h-4 bg-blue-400 rounded-full mr-1 animation-delay-150"></div>
                  <div className="w-4 h-4 bg-blue-400 rounded-full animation-delay-300"></div>
                </div>
              </div>
            )}
            
            <motion.button
              onClick={onLeaveRoom}
              className="px-6 py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="inline-block w-5 h-5 mr-2" />
              Leave Room
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}