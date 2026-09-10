import { useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useDictation } from '@/hooks/shared/use-dictation';
import { notify } from '@/lib/notifications/toast';

interface DictationButtonProps {
  /** Appends each finalized phrase to the target field's value. */
  onText: (text: string) => void;
  className?: string;
}

/**
 * Microphone toggle that streams audio to the Vosk speech-recognition
 * server and appends finalized phrases via onText. Only one dictation
 * session may run at a time in the browser (one microphone stream), so
 * this is meant to be placed next to a single active field at a time.
 */
export function DictationButton({ onText, className }: DictationButtonProps) {
  const { status, partialText, errorMessage, start, stop } = useDictation({ onFinalText: onText });
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
    <div className={cn('flex items-center gap-2', className)}>
      {isRecording && partialText && (
        <span className="max-w-[16rem] truncate text-xs text-muted-foreground" aria-live="polite">
          {partialText}
        </span>
      )}
      <Button
        type="button"
        size="sm"
        variant={isRecording ? 'destructive' : 'outline'}
        disabled={isConnecting}
        onClick={() => void (isRecording ? stop() : start())}
        aria-pressed={isRecording}
        aria-label={isRecording ? 'إيقاف الإملاء الصوتي' : 'بدء الإملاء الصوتي'}
      >
        {isRecording ? <Square className="size-3.5" /> : <Mic className="size-3.5" />}
        {isConnecting ? 'جارٍ الاتصال…' : isRecording ? 'إيقاف' : 'إملاء صوتي'}
      </Button>
    </div>
  );
}
