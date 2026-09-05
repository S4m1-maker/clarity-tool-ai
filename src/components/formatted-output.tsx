import { Fragment } from "react";

function inline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <span key={`${keyPrefix}-${index}`} className="font-medium text-card-foreground">
        {part.slice(2, -2)}
      </span>
    ) : (
      <Fragment key={`${keyPrefix}-${index}`}>{part}</Fragment>
    ),
  );
}

type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; lines: string[] }
  | { kind: "list"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][] };

function splitRow(line: string) {
  return line
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

function parse(source: string): Block[] {
  const lines = source.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^#{1,4}\s/.test(line)) {
      blocks.push({ kind: "heading", text: line.replace(/^#{1,4}\s*/, "") });
      index += 1;
      continue;
    }

    if (line.trim().startsWith("|") && (lines[index + 1] ?? "").includes("---")) {
      const head = splitRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && (lines[index] ?? "").trim().startsWith("|")) {
        rows.push(splitRow(lines[index] ?? ""));
        index += 1;
      }
      blocks.push({ kind: "table", head, rows });
      continue;
    }

    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*•]\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^\s*[-*•]\s+/, ""));
        index += 1;
      }
      blocks.push({ kind: "list", items });
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      (lines[index] ?? "").trim() &&
      !/^#{1,4}\s/.test(lines[index] ?? "") &&
      !/^\s*[-*•]\s+/.test(lines[index] ?? "") &&
      !(lines[index] ?? "").trim().startsWith("|")
    ) {
      paragraph.push(lines[index] ?? "");
      index += 1;
    }
    blocks.push({ kind: "paragraph", lines: paragraph });
  }

  return blocks;
}

export function FormattedOutput({ text }: { text: string }) {
  const blocks = parse(text);

  return (
    <div className="space-y-4 text-sm leading-relaxed text-foreground">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          return (
            <h2
              key={index}
              className="font-display text-sm font-semibold tracking-wide text-card-foreground"
            >
              {block.text}
            </h2>
          );
        }

        if (block.kind === "list") {
          return (
            <ul key={index} className="ml-5 list-disc space-y-1.5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{inline(item, `${index}-${itemIndex}`)}</li>
              ))}
            </ul>
          );
        }

        if (block.kind === "table") {
          return (
            <div key={index} className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-foreground/5">
                  <tr>
                    {block.head.map((cell, cellIndex) => (
                      <th
                        key={cellIndex}
                        className="px-3 py-2 font-display font-medium text-card-foreground"
                      >
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-border">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 align-top">
                          {cellIndex > 0 && cell ? (
                            <span className="text-accent">{cell}</span>
                          ) : (
                            inline(cell, `${index}-${rowIndex}-${cellIndex}`)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        const isSubject = block.lines[0]?.toLowerCase().startsWith("subject:");
        return (
          <p
            key={index}
            className={
              isSubject
                ? "font-display font-medium text-card-foreground"
                : "whitespace-pre-line text-foreground"
            }
          >
            {inline(block.lines.join("\n"), String(index))}
          </p>
        );
      })}
    </div>
  );
}
