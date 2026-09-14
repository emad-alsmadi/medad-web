import { forwardRef, useEffect, useRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/cn';
import { useDictation } from '@/hooks/shared/use-dictation';
import { notify } from '@/lib/notifications/toast';

interface DictationTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Appends each finalized phrase to the field's value. */
  onDictatedText: (text: string) => void;
}

/**
 * A Textarea with its own dictation mic docked inside the field itself
 * (bottom-end corner) instead of a separate button repeated next to every
 * field's label — one visual unit per field rather than a label row +
 * a textarea row. The live partial transcript floats above the mic as a
 * small caption while recording, so it doesn't shift layout or need its
 * own space in the label row.
 */
export const DictationTextarea = forwardRef<HTMLTextAreaElement, DictationTextareaProps>(
  ({ onDictatedText, className, ...props }, ref) => {
    const { status, partialText, errorMessage, start, stop } = useDictation({
      onFinalText: onDictatedText,
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
        <Textarea ref={ref} className={cn('pb-11', className)} {...props} />

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
DictationTextarea.displayName = 'DictationTextarea';
