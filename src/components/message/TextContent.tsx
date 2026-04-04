interface TextContentProps {
  text: string;
  role: "user" | "assistant" | "system";
}

export function TextContent({ text, role }: TextContentProps) {
  if (!text.trim()) return null;

  const cleaned = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "").trim();
  if (!cleaned) return null;

  const baseClass = "text-xs leading-relaxed whitespace-pre-wrap py-2 px-3";
  const roleClass = role === "user"
    ? "text-card-foreground bg-accent/3 rounded font-mono"
    : "text-muted-foreground";

  return <div className={`${baseClass} ${roleClass}`}>{cleaned}</div>;
}
