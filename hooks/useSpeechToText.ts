"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SR = typeof window extends undefined ? never : SpeechRecognition;

export function useSpeechToText(lang: "ko" | "en") {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText] = useState("");
  const recognitionRef = useRef<SR | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor = (window.SpeechRecognition || (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition);
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const recog = new Ctor();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = lang === "ko" ? "ko-KR" : "en-US";

    recog.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((res) => res[0]?.transcript ?? "")
        .join(" ");
      setLiveText(transcript.trim());
    };
    recog.onend = () => setListening(false);
    recognitionRef.current = recog as SR;

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, [lang]);

  const api = useMemo(() => ({
    supported,
    listening,
    liveText,
    start: () => {
      if (!recognitionRef.current || listening) return;
      setLiveText("");
      recognitionRef.current.start();
      setListening(true);
    },
    stop: () => {
      recognitionRef.current?.stop();
      setListening(false);
    }
  }), [supported, listening, liveText]);

  return api;
}
