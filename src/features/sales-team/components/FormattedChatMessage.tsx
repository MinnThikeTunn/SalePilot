import React from "react";

interface FormattedChatMessageProps {
  content: string;
  isUser?: boolean;
  className?: string;
}

interface Block {
  type: "paragraph" | "bullet_list" | "ordered_list" | "header" | "blockquote";
  level?: number;
  items?: string[];
  content?: string;
}

/**
 * Safely parses inline markdown (bold **text**, italic *text*, code `text`)
 * without external dependencies.
 */
export function renderInlineMarkdown(text: string, isUser = false): React.ReactNode[] {
  if (!text) return [];

  // Match **bold**, `code`, or *italic* with double asterisks taking precedence
  const tokenRegex = /(\*\*[^*]+?\*\*|`[^`]+?`|\*[^*\n]+?\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;

    // Bold: **text**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong
          key={i}
          className={`font-bold ${isUser ? "text-white" : "text-[#0A1B2A]"}`}
        >
          {boldText}
        </strong>
      );
    }

    // Inline Code: `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const codeText = part.slice(1, -1);
      return (
        <code
          key={i}
          className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
            isUser
              ? "bg-white/20 text-white"
              : "bg-[#F1F5F9] text-[#0069FF] border border-[#E2E8F0]"
          }`}
        >
          {codeText}
        </code>
      );
    }

    // Italic: *text*
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      const italicText = part.slice(1, -1);
      return (
        <em key={i} className="italic opacity-90">
          {italicText}
        </em>
      );
    }

    // Plain text segment
    return <span key={i}>{part}</span>;
  });
}

/**
 * Parses multi-line markdown blocks (paragraphs, bullet lists, ordered lists, headers)
 */
function parseMarkdownBlocks(rawText: string): Block[] {
  const lines = rawText.split("\n");
  const blocks: Block[] = [];
  let currentList: { type: "bullet_list" | "ordered_list"; items: string[] } | null = null;
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        content: currentParagraphLines.join("\n"),
      });
      currentParagraphLines = [];
    }
  };

  const flushList = () => {
    if (currentList) {
      blocks.push({
        type: currentList.type,
        items: currentList.items,
      });
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line separates blocks
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // Bullet list item (* or -)
    const bulletMatch = line.match(/^\s*[\*\-]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "bullet_list") {
        flushList();
        currentList = { type: "bullet_list", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Numbered list item (1. 2.)
    const numberMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (numberMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "ordered_list") {
        flushList();
        currentList = { type: "ordered_list", items: [] };
      }
      currentList.items.push(numberMatch[2]);
      continue;
    }

    // Headers (# ## ###)
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "header",
        level: headerMatch[1].length,
        content: headerMatch[2],
      });
      continue;
    }

    // Blockquote (> text)
    const quoteMatch = line.match(/^>\s*(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "blockquote",
        content: quoteMatch[1],
      });
      continue;
    }

    // If continuing in a normal paragraph
    flushList();
    currentParagraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

export function FormattedChatMessage({
  content,
  isUser = false,
  className = "",
}: FormattedChatMessageProps) {
  if (!content) return null;

  const blocks = parseMarkdownBlocks(content);

  return (
    <div className={`space-y-2.5 text-xs sm:text-sm leading-relaxed ${className}`}>
      {blocks.map((block, bIdx) => {
        switch (block.type) {
          case "bullet_list":
            return (
              <ul key={bIdx} className="space-y-1.5 my-2 pl-0.5">
                {block.items?.map((item, iIdx) => (
                  <li key={iIdx} className="flex items-start gap-2.5">
                    <span
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                        isUser ? "bg-white/90" : "bg-[#0069FF]"
                      }`}
                    />
                    <div className="flex-1 leading-relaxed">
                      {renderInlineMarkdown(item, isUser)}
                    </div>
                  </li>
                ))}
              </ul>
            );

          case "ordered_list":
            return (
              <ol key={bIdx} className="space-y-1.5 my-2 pl-0.5">
                {block.items?.map((item, iIdx) => (
                  <li key={iIdx} className="flex items-start gap-2">
                    <span
                      className={`font-mono text-[11px] font-bold shrink-0 ${
                        isUser ? "text-white/80" : "text-[#0069FF]"
                      }`}
                    >
                      {iIdx + 1}.
                    </span>
                    <div className="flex-1 leading-relaxed">
                      {renderInlineMarkdown(item, isUser)}
                    </div>
                  </li>
                ))}
              </ol>
            );

          case "header":
            if (block.level === 1) {
              return (
                <h3
                  key={bIdx}
                  className={`font-bold text-base mt-2 mb-1 ${
                    isUser ? "text-white" : "text-[#0A1B2A]"
                  }`}
                >
                  {renderInlineMarkdown(block.content || "", isUser)}
                </h3>
              );
            }
            if (block.level === 2) {
              return (
                <h4
                  key={bIdx}
                  className={`font-bold text-sm mt-2 mb-1 ${
                    isUser ? "text-white" : "text-[#0A1B2A]"
                  }`}
                >
                  {renderInlineMarkdown(block.content || "", isUser)}
                </h4>
              );
            }
            return (
              <h5
                key={bIdx}
                className={`font-bold text-xs uppercase tracking-wider mt-1.5 mb-0.5 ${
                  isUser ? "text-white/90" : "text-[#0A1B2A]"
                }`}
              >
                {renderInlineMarkdown(block.content || "", isUser)}
              </h5>
            );

          case "blockquote":
            return (
              <div
                key={bIdx}
                className={`border-l pl-3 py-1 my-1.5 italic rounded-r-lg ${
                  isUser
                    ? "border-white/40 bg-white/10 text-white/90"
                    : "border-[#0069FF]/40 bg-[#FAF8F5] text-slate-700"
                }`}
              >
                {renderInlineMarkdown(block.content || "", isUser)}
              </div>
            );

          case "paragraph":
          default:
            return (
              <p key={bIdx} className="leading-relaxed">
                {block.content?.split("\n").map((line, lIdx, arr) => (
                  <React.Fragment key={lIdx}>
                    {renderInlineMarkdown(line, isUser)}
                    {lIdx < arr.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
