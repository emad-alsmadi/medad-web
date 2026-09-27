import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useDictation } from '@/hooks/shared/use-dictation';
import { notify } from '@/lib/notifications/toast';
import { DATE_BLANK, TIME_BLANK, TEXT_BLANK } from '@/lib/dictation/date-time-templates';

type SlotKind = 'date' | 'time' | 'text';

/** Matches a DATE_BLANK/TIME_BLANK/TEXT_BLANK marker, capturing which kind it is. */
const BLANK_PATTERN = /____(DATE|TIME|TEXT)____/g;

function blankFor(kind: SlotKind): string {
  if (kind === 'time') return TIME_BLANK;
  if (kind === 'text') return TEXT_BLANK;
  return DATE_BLANK;
}

interface DictationRichTextProps {
  id?: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  'aria-invalid'?: boolean;
}

export interface DictationRichTextHandle {
  focus: () => void;
}

/**
 * A plain-text field that behaves like a Textarea but renders every
 * date/time/id-number blank left by voice dictation (see
 * expandDateTimeKeywords) as a small removable date-picker, time-picker,
 * or plain text slot instead of literal underscores. Built on
 * contenteditable so the slot can sit inline inside the flowing text,
 * with the slot itself as a non-editable "island" (contenteditable=false)
 * holding a real <input type="date"|"time"|"text"> — the same pattern
 * used for mention chips in rich text editors.
 *
 * The value exposed via onChange stays plain text (backend contract
 * unchanged): a filled slot is serialized as its picked value, an empty
 * one stays as its blank marker until filled or removed.
 */
export const DictationRichText = forwardRef<DictationRichTextHandle, DictationRichTextProps>(
  (
    { id, value, onChange, placeholder, maxLength, className, 'aria-invalid': ariaInvalid },
    forwardedRef,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastSerialized = useRef<string>('');
    /** Lets buildSlot call the not-yet-defined handleInput without a circular dependency. */
    const handleInputRef = useRef<() => void>(() => undefined);

    useImperativeHandle(forwardedRef, () => ({
      focus: () => containerRef.current?.focus(),
    }));

    const serialize = useCallback((root: HTMLElement): string => {
      let out = '';
      for (const node of Array.from(root.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE) {
          out += node.textContent ?? '';
        } else if (node instanceof HTMLElement && node.dataset.slot) {
          const input = node.querySelector('input');
          const filled = input?.value.trim();
          const kind = node.dataset.slot as SlotKind;
          // Always pad with spaces — a filled slot's value must not fuse
          // with the surrounding words (e.g. "بتاريخ2024-01-01اليوم").
          // Collapsed below along with any other double spaces.
          out += ` ${filled || blankFor(kind)} `;
        } else if (node instanceof HTMLBRElement) {
          out += '\n';
        } else if (node instanceof HTMLElement) {
          out += node.textContent ?? '';
        }
      }
      return out.replace(/[^\S\n]+/g, ' ').trim();
    }, []);

    const buildSlot = useCallback(
      (kind: SlotKind, initialValue: string) => {
        const wrapper = document.createElement('span');
        wrapper.dataset.slot = kind;
        wrapper.contentEditable = 'false';
        wrapper.className = 'mx-1 inline-flex items-center gap-0.5 align-middle';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.setAttribute('aria-label', 'حذف الحقل');
        removeBtn.className =
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-destructive';
        removeBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-2.5 w-2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
        removeBtn.addEventListener('click', () => {
          wrapper.remove();
          onChange(serialize(containerRef.current as HTMLElement));
        });

        const input = document.createElement('input');
        input.type = kind === 'time' ? 'time' : kind === 'date' ? 'date' : 'text';
        input.value = initialValue;
        input.className = cn(
          'h-5 rounded border border-input bg-card px-1 text-center text-xs text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15',
          kind === 'text' && 'w-14',
        );
        if (kind === 'text') input.size = 2;

        if (kind === 'text') {
          // A free-text slot only commits (replacing itself with the
          // typed word, spaced on both sides) on Enter — committing on
          // every keystroke would re-serialize mid-word, which flows
          // back through onChange -> the `value` prop -> the effect
          // below, which then sees a stale `lastSerialized` (this
          // listener never updated it) and wipes/rebuilds the whole
          // contenteditable DOM, dropping focus after a single
          // character. Date/time inputs don't have this problem since
          // they only ever emit a complete, already-valid value.
          input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              e.preventDefault();
              const filled = input.value.trim();
              if (filled) {
                wrapper.replaceWith(document.createTextNode(` ${filled} `));
              } else {
                wrapper.remove();
              }
              handleInputRef.current();
            }
          });
        } else {
          input.addEventListener('input', () => {
            onChange(serialize(containerRef.current as HTMLElement));
          });
          input.addEventListener('keydown', (e) => e.stopPropagation());
        }

        wrapper.append(removeBtn, input);
        return wrapper;
      },
      [onChange, serialize],
    );

    /** Splits `text` into plain-text parts and blank markers, preserving order. */
    const splitOnBlanks = useCallback((text: string): { text?: string; kind?: SlotKind }[] => {
      const parts: { text?: string; kind?: SlotKind }[] = [];
      let lastIndex = 0;
      for (const match of text.matchAll(BLANK_PATTERN)) {
        const index = match.index ?? 0;
        if (index > lastIndex) parts.push({ text: text.slice(lastIndex, index) });
        const kind: SlotKind = match[1] === 'TIME' ? 'time' : match[1] === 'TEXT' ? 'text' : 'date';
        parts.push({ kind });
        lastIndex = index + match[0].length;
      }
      if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex) });
      return parts;
    }, []);

    /** Rebuilds the DOM from `value` — only called when the value changed externally (not from local typing). */
    const render = useCallback(
      (text: string) => {
        const root = containerRef.current;
        if (!root) return;
        root.innerHTML = '';
        for (const part of splitOnBlanks(text)) {
          if (part.text) root.appendChild(document.createTextNode(part.text));
          else if (part.kind) root.appendChild(buildSlot(part.kind, ''));
        }
        lastSerialized.current = serialize(root);
      },
      [buildSlot, serialize, splitOnBlanks],
    );

    useEffect(() => {
      if (value !== lastSerialized.current) {
        render(value);
      }
      // Only re-sync when the external value actually diverges from what
      // this component last emitted — otherwise every keystroke's own
      // onChange would immediately re-render and reset the caret.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleInput = useCallback(() => {
      const root = containerRef.current;
      if (!root) return;
      const text = serialize(root);
      lastSerialized.current = text;
      onChange(text);
    }, [onChange, serialize]);
    handleInputRef.current = handleInput;

    const { status, partialText, errorMessage, start, stop } = useDictation({
      onFinalText: (text) => {
        const root = containerRef.current;
        if (!root) return;
        const needsSpace = root.textContent && !root.textContent.endsWith(' ');
        if (needsSpace) root.appendChild(document.createTextNode(' '));
        for (const part of splitOnBlanks(text)) {
          if (part.text) root.appendChild(document.createTextNode(part.text));
          else if (part.kind) root.appendChild(buildSlot(part.kind, ''));
        }
        handleInput();
      },
    });
    const lastError = useRef<string | null>(null);

    useEffect(() => {
      if (errorMessage && errorMessage !== lastError.current) {
        lastError.current = errorMessage;
        notify.error(errorMessage);
      }
    }, [errorMessage]);

    const isRecording = status === 'recording';
    const isConnecting = status === 'connecting';

    return (
      <div className="relative">
        <div
          ref={containerRef}
          id={id}
          role="textbox"
          aria-multiline="true"
          aria-invalid={ariaInvalid}
          aria-placeholder={placeholder}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBeforeInput={(e) => {
            if (!maxLength) return;
            const root = containerRef.current;
            if (!root) return;
            const currentLength = serialize(root).length;
            const incoming = e.nativeEvent.data?.length ?? 0;
            if (currentLength + incoming > maxLength) e.preventDefault();
          }}
          className={cn(
            'flex min-h-24 w-full flex-wrap items-center whitespace-pre-wrap rounded-md border border-input bg-card px-3.5 py-2 pb-11 text-sm text-foreground shadow-none transition-all duration-syid ease-out empty:before:text-muted-foreground empty:before:content-[attr(aria-placeholder)] hover:border-syid-gold-dark/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/15',
            className,
          )}
        />

        {isRecording && partialText && (
          <span
            className="pointer-events-none absolute inset-x-3 bottom-11 truncate rounded-md bg-card/95 text-xs text-muted-foreground"
            aria-live="polite"
          >
            {partialText}
          </span>
        )}

        <button
          type="button"
          disabled={isConnecting}
          onClick={() => void (isRecording ? stop() : start())}
          aria-pressed={isRecording}
          aria-label={isRecording ? 'إيقاف الإملاء الصوتي' : 'بدء الإملاء الصوتي'}
          title={isRecording ? 'إيقاف الإملاء الصوتي' : 'إملاء صوتي'}
          className={cn(
            'absolute bottom-2.5 end-2.5 inline-flex size-7 items-center justify-center rounded-full transition-all duration-syid ease-out disabled:pointer-events-none disabled:opacity-60',
            isRecording
              ? 'bg-destructive text-destructive-foreground shadow-syid animate-pulse'
              : 'bg-primary/10 text-primary hover:bg-primary/15',
          )}
        >
          {isConnecting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : isRecording ? (
            <Square className="size-3" />
          ) : (
            <Mic className="size-3.5" />
          )}
        </button>
      </div>
    );
  },
);
DictationRichText.displayName = 'DictationRichText';
