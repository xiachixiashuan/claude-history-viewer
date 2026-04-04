interface ToolResultProps {
  result: string;
  isError?: boolean;
  toolName: string;
}

export function ToolResult({ result, isError, toolName }: ToolResultProps) {
  if (!result) return null;

  const isEdit = toolName === "Edit";

  return (
    <div
      className={`mt-2 p-2 rounded bg-black/30 text-[10px] leading-relaxed font-mono max-h-[120px] overflow-y-auto ${
        isError ? "border-l-2 border-l-error/30" : ""
      }`}
    >
      {isEdit ? <DiffView text={result} /> : <span className="text-muted-foreground/70">{result}</span>}
    </div>
  );
}

function DiffView({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith("+") || line.startsWith("> ")) {
          return <div key={i} className="text-diff-add">{line}</div>;
        }
        if (line.startsWith("-") || line.startsWith("< ")) {
          return <div key={i} className="text-diff-del">{line}</div>;
        }
        return <div key={i} className="text-muted-foreground/70">{line}</div>;
      })}
    </>
  );
}
