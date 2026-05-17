import { DIMENSIONS } from '../data/constants';
import type { DimensionScores } from '../types';

interface Props {
  dimensions: DimensionScores;
}

interface TickerItem {
  text: string;
  color: string;
}

export function NewsTicker({ dimensions }: Props) {
  const items: TickerItem[] = DIMENSIONS.flatMap((d) => {
    const val = dimensions[d.key];
    if (val >= 7) return [{ text: `${d.label}: Stable`, color: '#86efac' }];
    if (val >= 4) return d.adds.slice(0, 2).map((a) => ({ text: `${d.label}: ${a}`, color: '#fcd34d' }));
    return d.adds.slice(0, 2).map((a) => ({ text: `${d.label}: ${a}`, color: '#f87171' }));
  });

  const sep = <span className="text-muted-purple/35 px-4">·</span>;

  const renderCopy = (prefix: string) =>
    items.map((item, i) => (
      <span key={`${prefix}-${i}`}>
        <span className="font-body text-[11px] font-bold" style={{ color: item.color }}>{item.text}</span>
        {sep}
      </span>
    ));

  return (
    <div className="overflow-hidden mb-3" style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
      <div className="ticker-inner inline-flex whitespace-nowrap">
        {renderCopy('a')}
        {renderCopy('b')}
      </div>
    </div>
  );
}
