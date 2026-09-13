import { useCallback, useEffect, useRef, useState } from 'react';
import { env } from '@/lib/env/env';
import { downsampleTo16k, floatTo16BitPCM, VOSK_SAMPLE_RATE } from '@/lib/dictation/pcm';
import { expandDateTimeKeywords } from '@/lib/dictation/date-time-templates';

export type DictationStatus = 'idle' | 'connecting' | 'recording' | 'error';

interface VoskMessage {
  partial?: string;
  text?: string;
  alternatives?: { text?: string }[];
}

interface UseDictationOptions {
  /** Called with each finalized phrase as Vosk confirms it. */
  onFinalText: (text: string) => void;
}

interface UseDictationResult {
  status: DictationStatus;
  /** Live, not-yet-finalized text — for preview only, not appended on finish. */
  partialText: string;
  errorMessage: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * Streams microphone audio to the Vosk WebSocket server (vosk-model/
 * asr_server.py) and reports finalized phrases as they arrive. Mirrors
 * the capture pipeline from the old vosk-model/index.html prototype:
 * MediaStream -> AudioContext/ScriptProcessor -> 16 kHz PCM16 -> WebSocket.
 */
export function useDictation({ onFinalText }: UseDictationOptions): UseDictationResult {
  const [status, setStatus] = useState<DictationStatus>('idle');
  const [partialText, setPartialText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const remainderRef = useRef<Float32Array>(new Float32Array(0));
  const onFinalTextRef = useRef(onFinalText);
  onFinalTextRef.current = onFinalText;

  const cleanup = useCallback(() => {
    try {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      silentGainRef.current?.disconnect();
    } catch {
      // Nodes may already be disconnected; safe to ignore.
    }
    processorRef.current = null;
    sourceRef.current = null;
    silentGainRef.current = null;
    remainderRef.current = new Float32Array(0);

    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    const socket = socketRef.current;
    socketRef.current = null;
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      socket.close();
    }

    setPartialText('');
  }, []);

  const fail = useCallback(
    (message: string) => {
      cleanup();
      setStatus('error');
      setErrorMessage(message);
    },
    [cleanup],
  );

  const handleServerMessage = useCallback((raw: string) => {
    let data: VoskMessage;
    try {
      data = JSON.parse(raw) as VoskMessage;
    } catch {
      return;
    }

    if (typeof data.partial === 'string') {
      setPartialText(data.partial);
    }

    const finalText = data.text ?? data.alternatives?.[0]?.text;
    if (finalText) {
      const cleaned = finalText.trim();
      if (cleaned) {
        onFinalTextRef.current(expandDateTimeKeywords(cleaned));
      }
      setPartialText('');
    }
  }, []);

  const startAudioPipeline = useCallback(
    (stream: MediaStream, socket: WebSocket) => {
      const AudioContextCtor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextCtor();
      audioContextRef.current = audioContext;

      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceRef.current = sourceNode;

      const bufferSize = 4096;
      const processorNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processorNode;

      processorNode.onaudioprocess = (event) => {
        if (socket.readyState !== WebSocket.OPEN) return;

        const input = event.inputBuffer.getChannelData(0);
        const { output, remainder } = downsampleTo16k(
          input,
          audioContext.sampleRate,
          remainderRef.current,
        );
        remainderRef.current = remainder;

        const pcm = floatTo16BitPCM(output);
        socket.send(pcm.buffer.slice(0));
      };

      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      silentGainRef.current = silentGain;

      sourceNode.connect(processorNode);
      processorNode.connect(silentGain);
      silentGain.connect(audioContext.destination);

      return audioContext.resume();
    },
    [],
  );

  const start = useCallback(async () => {
    if (status === 'connecting' || status === 'recording') return;

    setErrorMessage(null);
    setStatus('connecting');

    if (!navigator.mediaDevices?.getUserMedia) {
      fail('المتصفح لا يدعم الوصول إلى الميكروفون. استخدم إصداراً حديثاً من Chrome أو Firefox.');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
    } catch (error) {
      const denied =
        error instanceof DOMException &&
        (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError');
      fail(
        denied
          ? 'تم رفض الوصول إلى الميكروفون. يرجى السماح بالصلاحية ثم المحاولة مرة أخرى.'
          : 'تعذّر فتح الميكروفون. تأكد من توصيله ومن عدم استخدامه في تطبيق آخر.',
      );
      return;
    }
    streamRef.current = stream;

    let socket: WebSocket;
    try {
      socket = new WebSocket(env.VITE_VOSK_WS_URL);
    } catch {
      fail('تعذّر إنشاء اتصال مع خادم التعرف على الصوت.');
      return;
    }
    socket.binaryType = 'arraybuffer';
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ config: { sample_rate: VOSK_SAMPLE_RATE } }));
      startAudioPipeline(stream, socket)
        .then(() => setStatus('recording'))
        .catch(() => fail('تعذّر بدء التقاط الصوت بعد الاتصال بالخادم.'));
    };

    socket.onmessage = (event) => {
      if (typeof event.data === 'string') {
        handleServerMessage(event.data);
      }
    };

    socket.onerror = () => {
      fail('فشل الاتصال بخادم التعرف على الصوت. تأكد من أن الخادم يعمل.');
    };

    socket.onclose = () => {
      if (socketRef.current === socket) {
        cleanup();
        setStatus('idle');
      }
    };
  }, [cleanup, fail, handleServerMessage, startAudioPipeline, status]);

  const stop = useCallback(() => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send('{"eof" : 1}');
    }
    cleanup();
    setStatus('idle');
  }, [cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return { status, partialText, errorMessage, start, stop };
}
