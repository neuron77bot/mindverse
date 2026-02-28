import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authHeaders, authHeadersOnly } from '../../../services/authHeaders';
import type { RecordingState, InputMode } from '../editor/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export function useStoryboardCreator() {
  const navigate = useNavigate();

  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcription, setTranscription] = useState('');
  const [textInput, setTextInput] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Recording ──────────────────────────────────────────────────────────

  const processRecording = async () => {
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');

      const res = await fetch(`${API_BASE}/transcription`, {
        method: 'POST',
        headers: authHeadersOnly(),
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error en transcripción');
      }
      const data = await res.json();
      setTranscription(data.text || '');
      setRecordingState('idle');
    } catch (err: any) {
      setError('Error al transcribir: ' + err.message);
      setRecordingState('idle');
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'Tu navegador no soporta grabación de audio. Necesitas usar HTTPS o un navegador compatible.'
        );
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      timerRef.current = 0;
      setDuration(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        await processRecording();
      };

      mediaRecorder.start();
      setRecordingState('recording');
      intervalRef.current = setInterval(() => {
        timerRef.current += 1;
        setDuration(timerRef.current);
      }, 1000);
    } catch (err: any) {
      setError('Error al acceder al micrófono: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecordingState('processing');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      intervalRef.current = setInterval(() => {
        timerRef.current += 1;
        setDuration(timerRef.current);
      }, 1000);
    }
  };

  const newRecording = () => {
    setTranscription('');
    setTextInput('');
    setDuration(0);
    setError(null);
    chunksRef.current = [];
    timerRef.current = 0;
  };

  // ── Generate and Save (Automatic) ──────────────────────────────────────

  const generateAndSave = async (inputMode: InputMode) => {
    const textToAnalyze = inputMode === 'voice' ? transcription : textInput;
    if (!textToAnalyze.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Step 1: Analyze with AI to get frames
      const analyzeRes = await fetch(`${API_BASE}/transcription/analyze`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ text: textToAnalyze }),
      });
      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Error en análisis');
      }
      const analyzeData = await analyzeRes.json();
      const frames = analyzeData.frames || [];
      const mermaidDiagram = analyzeData.mermaid || null;
      const title = analyzeData.title || 'Storyboard sin título';

      // Step 2: Save immediately
      const saveRes = await fetch(`${API_BASE}/storyboards`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title,
          originalText: textToAnalyze,
          inputMode,
          frames,
          mermaidDiagram,
        }),
      });
      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Error guardando storyboard');
      }
      const saveData = await saveRes.json();
      const storyboardId = saveData.storyboard?._id;

      // Step 3: Redirect to detail page
      if (storyboardId) {
        navigate(`/storyboard/detail/${storyboardId}`);
      } else {
        throw new Error('No se recibió ID del storyboard');
      }
    } catch (err: any) {
      setError('Error: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Reset State ────────────────────────────────────────────────────────

  const resetState = () => {
    setTranscription('');
    setTextInput('');
    setDuration(0);
    setError(null);
    chunksRef.current = [];
    timerRef.current = 0;
  };

  // ── Misc ───────────────────────────────────────────────────────────────

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isSecureContext = window.isSecureContext;
  const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const hasContent = transcription || textInput;

  return {
    recordingState,
    transcription,
    textInput,
    setTextInput,
    duration,
    error,
    isAnalyzing,

    isSecureContext,
    hasMediaDevices,
    hasContent,

    formatDuration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    newRecording,
    generateAndSave,
    resetState,
  };
}

export type StoryboardCreatorHook = ReturnType<typeof useStoryboardCreator>;
