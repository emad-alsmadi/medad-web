import type { ReactNode } from 'react';

/** `**bold**` inside a line; every other character stays plain text (never parsed as HTML). */
function renderInline(text: string): ReactNode[] {
  return text
    .split(/\*\*(.+?)\*\*/g)
    .map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part));
}

function renderLine(line: string, index: number): ReactNode {
  if (line.startsWith('#')) {
    return (
      <p key={index} className="text-center font-bold">
        {renderInline(line.replace(/^#\s*/, ''))}
      </p>
    );
  }
  if (line.startsWith('@')) {
    const cells = line.slice(1).split('\t');
    return (
      <div
        key={index}
        className="grid gap-2 pt-2 text-center text-sm font-medium"
        style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
      >
        {cells.map((cell, cellIndex) => (
          <span key={cellIndex}>{renderInline(cell.trim())}</span>
        ))}
      </div>
    );
  }
  if (line.startsWith('>')) {
    return (
      <p key={index} className="text-center">
        {renderInline(line.replace(/^>\s*/, ''))}
      </p>
    );
  }
  return (
    <p key={index} className="text-justify">
      {renderInline(line)}
    </p>
  );
}

/**
 * A report/template text section rendered with the same markup the PDF
 * uses (API_INTEGRATION.md §7.6): `# ` subheading, `@a<TAB>b` signature
 * row, `> ` centred line, `**x**` bold; any other line is a paragraph.
 */
export function ReportTextView({ text }: { text: string }) {
  return (
    <div className="space-y-1.5 leading-relaxed">
      {text
        .split(/\r?\n/)
        .filter((line) => line.trim() !== '')
        .map(renderLine)}
    </div>
  );
}
