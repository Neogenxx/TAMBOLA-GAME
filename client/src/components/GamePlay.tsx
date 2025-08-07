import * as React from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { LogOut, Volume2, VolumeX } from 'lucide-react';
import { GameRoom, Player } from '../types/game';
import { TambolaTicket } from './TambolaTicket';
import { NumberCaller } from './NumberCaller';
import { Scoreboard } from './Scoreboard';
import { VoiceAnnouncer } from '../utils/voiceAnnouncer';
import { useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function GameLobby() {
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    // When this client becomes the host
    socket.on("host-permission", () => {
      setIsHost(true);
    });

    return () => {
      socket.off("host-permission");
    };
  }, []);

  return (
    <div>
      <h1>Game Lobby</h1>
      {isHost ? (
        <button onClick={() => socket.emit("start-game")}>Start Game</button>
      ) : (
        <p>Waiting for host to start the game...</p>
      )}
    </div>
  );
}


interface GamePlayProps {
  room: GameRoom;
  currentPlayer: Player;
  isHost: boolean;
  onCallNumber: () => void;
  onMarkNumber: (number: number) => void;
  onLeaveRoom: () => void;
  voiceAnnouncer: VoiceAnnouncer;
}

export function GamePlay({ 
  room, 
  currentPlayer, 
  isHost, 
  onCallNumber, 
  onMarkNumber, 
  onLeaveRoom,
  voiceAnnouncer
}: GamePlayProps) {
  const [voiceEnabled, setVoiceEnabled] = React.useState(true);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [celebrationMessage, setCelebrationMessage] = React.useState('');

  // Handle voice announcements
  useEffect(() => {
    if (room.currentNumber && voiceEnabled) {
      voiceAnnouncer.announceNumber(room.currentNumber);
    }
  }, [room.currentNumber, voiceEnabled, voiceAnnouncer]);

  // Check for new achievements
  useEffect(() => {
    if (currentPlayer.hasFullHouse && !showConfetti) {
      setShowConfetti(true);
      setCelebrationMessage('🎉 Full House! 🎉');
      setTimeout(() => setShowConfetti(false), 5000);
    } else if (currentPlayer.completedRows.some(Boolean) && !showConfetti) {
      const completedRowIndex = currentPlayer.completedRows.findIndex(Boolean);
      if (completedRowIndex !== -1) {
        setShowConfetti(true);
        setCelebrationMessage(`🎊 Row ${completedRowIndex + 1} Complete! 🎊`);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  }, [currentPlayer.completedRows, currentPlayer.hasFullHouse, showConfetti]);

  const handleCallNumber = () => {
    onCallNumber();
    // If you want to announce the number, do it inside onCallNumber or pass the number as a parameter.
    // Example: If room.currentNumber is updated after calling onCallNumber, you can announce it here:
    if (voiceEnabled && room.currentNumber) {
      voiceAnnouncer.announceNumber(room.currentNumber);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}
      
      {celebrationMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: -100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: -100 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white px-8 py-4 rounded-2xl shadow-2xl"
        >
          <div className="text-2xl font-bold text-center text-purple-600">
            {celebrationMessage}
          </div>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Tambola Game - Room {room.code}
            </h1>
            <p className="text-purple-200">
              {isHost ? 'You are the host' : 'Waiting for numbers...'}
            </p>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`
                p-3 rounded-xl transition-all duration-200
                ${voiceEnabled 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
                }
              `}
              title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {voiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
            
            <motion.button
              onClick={onLeaveRoom}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="inline-block w-5 h-5 mr-2" />
              Leave
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-6 items-start">
          {/* Left Column - Number Caller */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <NumberCaller
                currentNumber={room.currentNumber}
                calledNumbers={room.calledNumbers}
                onCallNumber={handleCallNumber}
                isHost={isHost}
                gameStarted={room.gameStarted}
              />
            </div>
          </div>

          {/* Center Column - Player's Ticket */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4 text-center">
                Your Ticket
              </h2>
              <TambolaTicket
                ticket={currentPlayer.ticket}
                markedNumbers={currentPlayer.markedNumbers}
                calledNumbers={room.calledNumbers}
                completedRows={currentPlayer.completedRows}
                onNumberClick={onMarkNumber}
                isInteractive={true}
                size="large"
              />
              
              {/* Player Stats */}
              <div className="mt-6 bg-white/20 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {currentPlayer.markedNumbers.size}
                    </div>
                    <div className="text-purple-200 text-sm">Numbers Marked</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {currentPlayer.completedRows.filter(Boolean).length}
                    </div>
                    <div className="text-purple-200 text-sm">Rows Complete</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Scoreboard */}
          <div className="lg:col-span-1">
            <Scoreboard players={room.players} currentPlayer={currentPlayer} />
          </div>
        </div>
      </div>
    </div>
  );
}