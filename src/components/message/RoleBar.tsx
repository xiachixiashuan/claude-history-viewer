interface RoleBarProps {
  role: "user" | "assistant" | "system";
  model?: string;
  version?: string;
  timestamp: string;
}

const ROLE_LABELS: Record<string, string> = {
  user: "USER",
  assistant: "ASSISTANT",
  system: "SYSTEM",
};

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return ts;
  }
}

export function RoleBar({ role, model, version, timestamp }: RoleBarProps) {
  const dotColor: Record<string, string> = {
    user: "bg-role-user shadow-[0_0_6px_rgba(34,197,94,0.3)]",
    assistant: "bg-role-assistant shadow-[0_0_6px_rgba(96,165,250,0.3)]",
    system: "bg-role-system shadow-[0_0_6px_rgba(251,191,36,0.3)]",
  };

  const nameColor: Record<string, string> = {
    user: "text-role-user",
    assistant: "text-role-assistant",
    system: "text-role-system",
  };

  const time = timestamp ? formatTimestamp(timestamp) : "";

  return (
    <div className="flex items-center gap-2 mb-2 px-0.5 font-mono">
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor[role]}`} />
      <span className={`text-[11px] font-semibold ${nameColor[role]}`}>
        {ROLE_LABELS[role]}
      </span>
      {model && (
        <span className="text-[9px] px-1.5 py-px rounded-md border border-role-assistant/20 text-role-assistant">
          {model}
        </span>
      )}
      {version && (
        <span className="text-[9px] px-1.5 py-px rounded-md border border-border text-muted-foreground">
          {version}
        </span>
      )}
      <span className="ml-auto text-[10px] text-muted-foreground/50">{time}</span>
    </div>
  );
}
