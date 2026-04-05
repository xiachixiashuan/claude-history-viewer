interface TextContentProps {
  text: string;
  role: "user" | "assistant" | "system";
}

export function TextContent({ text, role }: TextContentProps) {
  if (!text.trim()) return null;

  const cleaned = text
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
    .replace(/<command-[^>]*>[\s\S]*?<\/command-[^>]*>/g, "")
    .replace(/<local-command-[^>]*>[\s\S]*?<\/local-command-[^>]*>/g, "")
    .replace(/<EXTREMELY_IMPORTANT>[\s\S]*?<\/EXTREMELY_IMPORTANT>/g, "")
    .replace(/<EXTREMELY-IMPORTANT>[\s\S]*?<\/EXTREMELY-IMPORTANT>/g, "")
    .trim();
  if (!cleaned) return null;

  const baseClass = "text-xs leading-relaxed whitespace-pre-wrap py-2 px-3";
  const roleClass = role === "user"
    ? "text-card-foreground bg-accent/3 rounded font-mono"
    : "text-muted-foreground";

  return <div className={`${baseClass} ${roleClass}`}>{cleaned}</div>;
}
