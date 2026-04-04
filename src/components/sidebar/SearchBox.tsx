interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="搜索对话、工具、关键词..."
      className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground text-xs font-mono placeholder:text-muted-foreground outline-none focus:border-accent/30 transition-colors"
    />
  );
}
