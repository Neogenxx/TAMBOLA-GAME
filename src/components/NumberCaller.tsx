import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';

interface NumberCallerProps {
  currentNumber: number | null;
  calledNumbers: number[];
  onCallNumber: () => void;
  onReset?: () => void;
  isHost: boolean;
  gameStarted: boolean;
}

export function NumberCaller({ 
  currentNumber, 
  calledNumbers, 
  onCallNumber, 
  onReset,
  isHost,
  gameStarted 
}: NumberCallerProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleCallNumber = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    onCallNumber();
    setTimeout(() => setIsAnimating(false), 1000);
  };

  const remainingNumbers = 90 - calledNumbers.length;

  return (
    <div className="text-center space-y-6">
      {/* Current Number Display */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {currentNumber && (
            <motion.div
              key={currentNumber}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                duration: 0.6 
              }}
              className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl"
            >
              <span className="text-4xl font-bold text-white">{currentNumber}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!currentNumber && gameStarted && (
          <div className="mx-auto w-32 h-32 bg-gray-100 border-4 border-dashed border-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-400 text-lg font-medium">Ready</span>
          </div>
        )}
      </div>

      {/* Controls */}
      {isHost && gameStarted && (
        <div className="flex justify-center space-x-4">
          <motion.button
            onClick={handleCallNumber}
            disabled={isAnimating || remainingNumbers === 0}
            className={`
              px-8 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-200
              ${remainingNumbers > 0 
                ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600' 
                : 'bg-gray-400 cursor-not-allowed'
              }
              ${isAnimating ? 'animate-pulse' : ''}
            `}
            whileHover={remainingNumbers > 0 ? { scale: 1.05 } : {}}
            whileTap={remainingNumbers > 0 ? { scale: 0.95 } : {}}
          >
            <Play className="inline-block w-5 h-5 mr-2" />
            {isAnimating ? 'Calling...' : 'Call Number'}
          </motion.button>
          
          {onReset && (
            <motion.button
              onClick={onReset}
              className="px-6 py-3 rounded-xl bg-gray-500 hover:bg-gray-600 text-white font-semibold shadow-lg transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw className="inline-block w-5 h-5 mr-2" />
              Reset
            </motion.button>
          )}
        </div>
      )}

      {/* Game Statistics */}
      <div className="bg-white rounded-xl shadow-lg p-4 max-w-md mx-auto">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{calledNumbers.length}</div>
            <div className="text-sm text-gray-600">Called</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{remainingNumbers}</div>
            <div className="text-sm text-gray-600">Remaining</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">90</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Called Numbers History */}
      {calledNumbers.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Called Numbers</h3>
          <div className="grid grid-cols-10 gap-2 max-h-32 overflow-y-auto">
            {calledNumbers.map((number, index) => (
              <motion.div
                key={number}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold
                  ${index === calledNumbers.length - 1 
                    ? 'bg-yellow-200 text-yellow-800 ring-2 ring-yellow-400' 
                    : 'bg-gray-100 text-gray-700'
                  }
                `}
              >
                {number}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}