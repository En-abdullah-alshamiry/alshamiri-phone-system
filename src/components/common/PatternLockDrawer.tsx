import React, { useState } from 'react';
import { RefreshCw, Check } from 'lucide-react';

interface PatternLockDrawerProps {
  value: string; // e.g. "1-2-5-8-9"
  onChange?: (newValue: string) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PatternLockDrawer: React.FC<PatternLockDrawerProps> = ({
  value,
  onChange,
  readOnly = false,
  size = 'md',
}) => {
  const [selectedDots, setSelectedDots] = useState<number[]>(() => {
    if (!value) return [];
    return value
      .split('-')
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 9);
  });

  const handleDotClick = (dotIndex: number) => {
    if (readOnly) return;
    if (selectedDots.includes(dotIndex)) {
      // If clicking already selected, ignore or allow reset
      return;
    }
    const newSeq = [...selectedDots, dotIndex];
    setSelectedDots(newSeq);
    onChange?.(newSeq.join('-'));
  };

  const handleReset = () => {
    if (readOnly) return;
    setSelectedDots([]);
    onChange?.('');
  };

  const activeDots = readOnly
    ? value
        ? value
            .split('-')
            .map((n) => parseInt(n.trim(), 10))
            .filter((n) => !isNaN(n) && n >= 1 && n <= 9)
        : []
    : selectedDots;

  // Dot coordinates in 3x3 (1-indexed: 1..9)
  const getCoords = (dot: number) => {
    const row = Math.floor((dot - 1) / 3);
    const col = (dot - 1) % 3;
    // Map to percentage 0..100
    return {
      x: 16.6 + col * 33.3,
      y: 16.6 + row * 33.3,
    };
  };

  const dimensionClass =
    size === 'sm' ? 'w-24 h-24' : size === 'lg' ? 'w-56 h-56' : 'w-40 h-40';
  const dotSizeClass =
    size === 'sm' ? 'w-4 h-4 text-[9px]' : size === 'lg' ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-xs';

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative ${dimensionClass} bg-slate-900 rounded-2xl p-2 select-none shadow-inner border border-slate-750 flex items-center justify-center`}
      >
        {/* SVG lines between consecutive dots */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {activeDots.map((dot, index) => {
            if (index === 0) return null;
            const prevDot = activeDots[index - 1];
            const p1 = getCoords(prevDot);
            const p2 = getCoords(dot);
            return (
              <line
                key={`line-${index}`}
                x1={`${p1.x}%`}
                y1={`${p1.y}%`}
                x2={`${p2.x}%`}
                y2={`${p2.y}%`}
                stroke="#38bdf8"
                strokeWidth={size === 'sm' ? 2 : 3}
                strokeLinecap="round"
                strokeDasharray="none"
              />
            );
          })}
        </svg>

        {/* 3x3 Grid */}
        <div className="grid grid-cols-3 gap-2 w-full h-full z-20 place-items-center">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((dot) => {
            const isSelected = activeDots.includes(dot);
            const orderIndex = activeDots.indexOf(dot) + 1;
            return (
              <button
                key={dot}
                type="button"
                disabled={readOnly}
                onClick={() => handleDotClick(dot)}
                className={`${dotSizeClass} rounded-full flex items-center justify-center font-bold transition-all ${
                  isSelected
                    ? 'bg-sky-400 text-slate-950 ring-4 ring-sky-500/30 scale-110 shadow-lg shadow-sky-500/50'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600 active:scale-95'
                } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                title={`نقطة ${dot}`}
              >
                {isSelected ? orderIndex : ''}
              </button>
            );
          })}
        </div>
      </div>

      {!readOnly && (
        <div className="flex items-center gap-2 mt-2 w-full justify-between px-1">
          <span className="text-xs text-slate-500 font-mono" dir="ltr">
            {activeDots.length > 0 ? activeDots.join(' → ') : 'اضغط بالترتيب'}
          </span>
          {activeDots.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 hover:underline"
            >
              <RefreshCw className="w-3 h-3" />
              إعادة الرسم
            </button>
          )}
        </div>
      )}
    </div>
  );
};
