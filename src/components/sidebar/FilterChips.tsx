const FILTERS = ["All", "Bash", "Read", "Write", "Edit", "Agent", "Skill", "Grep", "Glob", "TaskCreate", "TaskUpdate"];

interface FilterChipsProps {
  active: string;
  onChange: (filter: string) => void;
}

export function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-1.5 px-4 py-2.5 border-b border-border overflow-x-auto">
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono whitespace-nowrap border transition-colors cursor-pointer ${
            active === f
              ? "border-accent/30 text-accent bg-accent/5"
              : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground/60"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
