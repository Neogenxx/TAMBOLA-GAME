import React from 'react';
import { motion } from 'framer-motion';
import { TambolaTicket as TambolaTicketType } from '../types/game';

interface TambolaTicketProps {
  ticket?: TambolaTicketType | null;
  markedNumbers?: Set<number>;
  calledNumbers?: number[];
  completedRows?: boolean[];
  onNumberClick?: (number: number) => void;
  isInteractive?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function TambolaTicket({ 
  ticket, 
  markedNumbers = new Set(),
  calledNumbers = [],
  completedRows = [],
  onNumberClick,
  isInteractive = true,
  size = 'medium'
}: TambolaTicketProps) {
  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-12 h-12 text-sm',
    large: 'w-16 h-16 text-base'
  };

  const getCellClass = (number: number | null, rowIndex: number) => {
    if (number === null) return 'bg-gray-100 border-gray-200';

    const isMarked = markedNumbers.has(number);
    const isCalled = calledNumbers.includes(number);
    const isRowComplete = completedRows[rowIndex] || false;

    if (isMarked && isCalled) {
      return isRowComplete 
        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-600 shadow-lg' 
        : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-600 shadow-md';
    }

    if (isCalled) {
      return 'bg-gradient-to-br from-yellow-300 to-orange-400 text-white border-yellow-500 animate-pulse';
    }

    return 'bg-white border-gray-300 hover:bg-gray-50';
  };

  if (!ticket?.grid) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 flex items-center justify-center text-gray-500 text-sm">
        Loading ticket...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200">
      {/* Column headers */}
      <div className="grid grid-cols-9 gap-1 mb-2">
        {['1-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-90'].map((range) => (
          <div key={range} className="text-xs text-gray-500 text-center font-medium py-1">
            {range}
          </div>
        ))}
      </div>

      {/* Ticket grid */}
      <div className="space-y-1">
        {ticket.grid.map((row, rowIndex) => (
          <motion.div
            key={rowIndex}
            className={`grid grid-cols-9 gap-1 ${completedRows[rowIndex] ? 'bg-green-50 p-1 rounded-lg' : ''}`}
            animate={completedRows[rowIndex] ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            {row.map((number, colIndex) => (
              <motion.button
                key={`${rowIndex}-${colIndex}`}
                className={`
                  ${sizeClasses[size]} 
                  ${getCellClass(number, rowIndex)}
                  border-2 rounded-lg font-semibold transition-all duration-200
                  ${isInteractive && number !== null ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                  ${number === null ? '' : 'active:scale-95'}
                  flex items-center justify-center
                `}
                onClick={() => number !== null && onNumberClick && onNumberClick(number)}
                disabled={!isInteractive || number === null}
                whileHover={number !== null && isInteractive ? { scale: 1.05 } : {}}
                whileTap={number !== null && isInteractive ? { scale: 0.95 } : {}}
                animate={markedNumbers.has(number) ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {number}
              </motion.button>
            ))}
          </motion.div>
        ))}
      </div>

      {/* Row completion indicators */}
      <div className="mt-3 flex justify-center space-x-2">
        {(completedRows || []).map((completed, index) => (
          <motion.div
            key={index}
            className={`
              w-3 h-3 rounded-full
              ${completed ? 'bg-green-500 shadow-md' : 'bg-gray-200'}
            `}
            animate={completed ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}
