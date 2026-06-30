import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import activities from '../data/roulette_activities.json';
import type { DimensionScores } from '../types';

interface ActivityRouletteProps {
  lowestDimension?: keyof DimensionScores | null;
}

interface RouletteResult {
  dimensionKey: string;
  dimensionLabel: string;
  colour: string;
  activity: string;
}

const SHADOW: Record<string, string> = {
  '#b5ead7': '#6aab90',
  '#c9b8f0': '#7a6fa0',
  '#ffeaa7': '#c9a84c',
  '#ffb7b2': '#c98a88',
  '#f7cac9': '#c98a88',
  '#ffe066': '#c9a84c',
};

function shadowFor(colour: string): string {
  return SHADOW[colour] ?? '#7a6fa0';
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function spin(bias?: string | null): RouletteResult {
  const dims = activities.dimensions;
  const keys = Object.keys(dims);

  let chosenKey: string;
  if (bias && dims[bias as keyof typeof dims] && Math.random() < 0.4) {
    chosenKey = bias;
  } else {
    chosenKey = keys[Math.floor(Math.random() * keys.length)];
  }

  const dim = dims[chosenKey as keyof typeof dims];
  const activityList = dim.activities;
  const activity = activityList[Math.floor(Math.random() * activityList.length)];

  return {
    dimensionKey: chosenKey,
    dimensionLabel: dim.label,
    colour: dim.colour,
    activity,
  };
}

export function ActivityRoulette({ lowestDimension }: ActivityRouletteProps) {
  const [result, setResult] = useState<RouletteResult | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  function handleSpin() {
    setIsSpinning(true);
    setDismissed(false);
    const keys = Object.keys(activities.dimensions);
    let count = 0;
    const interval = setInterval(() => {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const randomDim = activities.dimensions[randomKey as keyof typeof activities.dimensions];
      setResult({
        dimensionKey: randomKey,
        dimensionLabel: randomDim.label,
        colour: randomDim.colour,
        activity: '...',
      });
      count++;
      if (count >= 9) {
        clearInterval(interval);
        setResult(spin(lowestDimension));
        setIsSpinning(false);
      }
    }, 150);
  }

  const showResult = result && !dismissed;

  return (
    <div style={{ height: 56 }}>
      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.button
            key="spin-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSpin}
            style={{
              width: '100%',
              height: 56,
              padding: '6px 14px',
              background: '#16213e',
              border: '2px solid #9b89c4',
              borderRadius: 4,
              boxShadow: '3px 3px 0px #7a6fa0',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'box-shadow 0.1s, transform 0.1s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '1px 1px 0px #7a6fa0';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translate(2px, 2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '3px 3px 0px #7a6fa0';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translate(0,0)';
            }}
          >
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#c9b8f0' }}>
              🎲 SPIN FOR AN ACTIVITY
            </div>
            <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, color: 'rgba(155,137,196,0.7)' }}>
              Press to get something to do right now
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="result-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            style={{
              height: 56,
              background: hexToRgba(result.colour, 0.1),
              border: `2px solid ${result.colour}`,
              borderRadius: 4,
              boxShadow: `4px 4px 0px ${shadowFor(result.colour)}`,
              padding: '6px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
            }}
          >
            {/* Header row: label + respin + dismiss */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: result.colour }}>
                ✦ {result.dimensionLabel}
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleSpin}
                  disabled={isSpinning}
                  style={{ fontSize: 16, color: '#9b89c4', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, opacity: isSpinning ? 0.4 : 1 }}
                >
                  ↺
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  style={{ fontSize: 15, color: '#9b89c4', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Activity text */}
            {isSpinning ? (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ color: result.colour, fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}>
                  {result.dimensionLabel}
                </span>
              </div>
            ) : (
              <div style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: 11,
                fontWeight: 700,
                color: '#fdfcff',
                lineHeight: 1.35,
                textAlign: 'center',
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                alignSelf: 'center',
                width: '100%',
              }}>
                {`"${result.activity}"`}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
