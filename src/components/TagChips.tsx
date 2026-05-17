import { TAGS, TAG_GROUP_ORDER } from '../data/constants';
import type { Tag } from '../types';

interface Props {
  selected: string[];
  onToggle: (id: string) => void;
}

const COLUMNS: string[][] = [
  ['Body', 'Social'],
  ['Creative', 'Work', 'Mind'],
  ['Rest', 'Life'],
];

export function TagChips({ selected, onToggle }: Props) {
  const byGroup = Object.fromEntries(
    TAG_GROUP_ORDER.map((g) => [g, TAGS.filter((t: Tag) => t.group === g)])
  );

  return (
    <div className="bg-deep-indigo border border-muted-purple/40 rounded p-3 shadow-lilac">
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold text-[11px] text-star-gold tracking-widest uppercase">What happened?</span>
        <span className="font-body text-[11px] text-lilac-shadow">{selected.length} selected</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {COLUMNS.map((groups, ci) => (
          <div key={ci} className="flex flex-col gap-4">
            {groups.map((g) => (
              <div key={g}>
                <div className="font-bold text-[10px] text-lilac-shadow uppercase tracking-widest pb-1 mb-2 border-b border-muted-purple/30">
                  {g}
                </div>
                <div className="flex flex-col gap-1">
                  {byGroup[g]?.map((t: Tag) => (
                    <button
                      key={t.id}
                      onClick={() => onToggle(t.id)}
                      className={`chip ${selected.includes(t.id) ? 'chip-on' : ''}`}
                    >
                      <span className="text-base leading-none">{t.em}</span>
                      <span className="font-body text-[13px] font-semibold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
