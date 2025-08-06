import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, GamepadIcon, Sparkles } from 'lucide-react';

interface HomePageProps {
  onCreateRoom: (hostName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
}

export function HomePage({ onCreateRoom, onJoinRoom }: HomePageProps) {
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [hostName, setHostName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (hostName.trim()) {
      onCreateRoom(hostName.trim());
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim() && playerName.trim()) {
      onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {mode === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-8 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="inline-block"
            >
              <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            </motion.div>
            
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Tambola Master</h1>
            <p className="text-gray-600 mb-8">
              The ultimate multiplayer Housie experience with live voice announcements!
            </p>
            
            <div className="space-y-4">
              <motion.button
                onClick={() => setMode('create')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <GamepadIcon className="inline-block w-6 h-6 mr-2" />
                Create New Game
              </motion.button>
              
              <motion.button
                onClick={() => setMode('join')}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Users className="inline-block w-6 h-6 mr-2" />
                Join Existing Game
              </motion.button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Features</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>🎲 Real-time multiplayer gameplay</div>
                <div>🔊 Live voice announcements</div>
                <div>🎊 Celebration animations</div>
                <div>📱 Mobile-friendly design</div>
              </div>
            </div>
          </motion.div>
        )}

        {mode === 'create' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8"
          >
            <div className="text-center mb-6">
              <GamepadIcon className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800">Create New Game</h2>
              <p className="text-gray-600 mt-2">You'll be the host and control the game</p>
            </div>
            
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your name"
                  required
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setMode('home')}
                  className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Back
                </button>
                <motion.button
                  type="submit"
                  disabled={!hostName.trim()}
                  className={`
                    flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200
                    ${hostName.trim()
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                  whileHover={hostName.trim() ? { scale: 1.02 } : {}}
                  whileTap={hostName.trim() ? { scale: 0.98 } : {}}
                >
                  Create Room
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8"
          >
            <div className="text-center mb-6">
              <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800">Join Game</h2>
              <p className="text-gray-600 mt-2">Enter the room code shared by the host</p>
            </div>
            
            <form onSubmit={handleJoinRoom} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                  placeholder="ABCDEF"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setMode('home')}
                  className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Back
                </button>
                <motion.button
                  type="submit"
                  disabled={!roomCode.trim() || !playerName.trim()}
                  className={`
                    flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200
                    ${roomCode.trim() && playerName.trim()
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                  whileHover={roomCode.trim() && playerName.trim() ? { scale: 1.02 } : {}}
                  whileTap={roomCode.trim() && playerName.trim() ? { scale: 0.98 } : {}}
                >
                  Join Game
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}