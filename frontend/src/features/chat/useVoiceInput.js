import { useCallback, useEffect, useRef, useState } from "react";

// Browser SpeechRecognition — zero backend, zero API cost, per the explicit
// "use free resources" call. Chrome/Edge only (Safari/Firefox don't expose
// this API); callers should feature-detect via `isSupported` and just hide
// the mic button when unavailable rather than showing a broken control.

const getRecognitionCtor = () =>
  (typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;

/**
 * onFinalTranscript is called once per completed utterance with the
 * recognized text — callers decide how to merge it (append vs replace).
 */
export const useVoiceInput = (onFinalTranscript) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const isSupported = Boolean(getRecognitionCtor());

  // Always call the latest callback (it closes over `message`, which
  // changes every keystroke) without needing to recreate the recognition
  // instance whenever the caller's callback identity changes.
  const callbackRef = useRef(onFinalTranscript);
  callbackRef.current = onFinalTranscript;

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return undefined;

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ")
        .trim();
      if (transcript) callbackRef.current(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  return { isSupported, isListening, toggleListening };
};
