"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface VoiceLanguage {
  label: string;
  bcp47: string;
}

export const VOICE_LANGUAGES: VoiceLanguage[] = [
  { label: "Hindi",     bcp47: "hi-IN" },
  { label: "Tamil",     bcp47: "ta-IN" },
  { label: "Telugu",    bcp47: "te-IN" },
  { label: "Bengali",   bcp47: "bn-IN" },
  { label: "Marathi",   bcp47: "mr-IN" },
  { label: "Gujarati",  bcp47: "gu-IN" },
  { label: "Kannada",   bcp47: "kn-IN" },
  { label: "Malayalam", bcp47: "ml-IN" },
  { label: "Punjabi",   bcp47: "pa-IN" },
  { label: "English",   bcp47: "en-IN" },
];

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording]       = useState(false);
  const [selectedLang, setSelectedLang]     = useState<VoiceLanguage>(VOICE_LANGUAGES[9]); // English
  const [errorMsg, setErrorMsg]             = useState<string | null>(null);
  const [waveHeights, setWaveHeights]       = useState([4, 4, 4, 4, 4]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef   = useRef<any>(null);
  const silenceTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef           = useRef<number | null>(null);
  const isRecordingRef   = useRef(false);

  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  // Waveform animation — RAF-driven while recording
  useEffect(() => {
    if (!isRecording) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setWaveHeights([4, 4, 4, 4, 4]);
      return;
    }
    const animate = () => {
      setWaveHeights([
        4  + Math.random() * 16,
        6  + Math.random() * 20,
        8  + Math.random() * 24,
        6  + Math.random() * 20,
        4  + Math.random() * 16,
      ]);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SR) {
      setErrorMsg("Voice not supported in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SR();
    recognition.lang            = selectedLang.bcp47;
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.maxAlternatives = 1;

    const resetSilenceTimer = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      // Auto-stop after 3 s of no new speech
      silenceTimerRef.current = setTimeout(() => recognition.stop(), 3000);
    };

    recognition.onstart = () => {
      setIsRecording(true);
      setErrorMsg(null);
      resetSilenceTimer();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      resetSilenceTimer();
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      if (text) onTranscript(text);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      setErrorMsg(
        event.error === "not-allowed"
          ? "Microphone access denied. Allow mic in browser settings."
          : "Voice not supported in this browser. Try Chrome or Edge."
      );
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setErrorMsg("Could not start recording. Is another tab using the mic?");
    }
  }, [selectedLang.bcp47, onTranscript]);

  const toggleRecording = useCallback(() => {
    if (isRecordingRef.current) stopRecording();
    else startRecording();
  }, [startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    isRecording,
    selectedLang,
    setSelectedLang,
    toggleRecording,
    stopRecording,
    waveHeights,
    errorMsg,
    clearError: () => setErrorMsg(null),
  };
}

export type VoiceInputHandle = ReturnType<typeof useVoiceInput>;
