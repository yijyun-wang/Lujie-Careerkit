"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { speechRecognitionErrorMessage } from "@/lib/speech-input";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0?: { transcript?: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = { error: string };

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function useSpeechRecognition(onFinalTranscript: (transcript: string) => void) {
  const callbackRef = useRef(onFinalTranscript);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const manuallyStoppedRef = useRef(false);
  const heardSpeechRef = useRef(false);
  const failedRef = useRef(false);
  const isSupported = useSyncExternalStore(
    subscribeToSpeechSupport,
    () => Boolean(getSpeechRecognitionConstructor() && canRequestMicrophone()),
    () => false,
  );
  const [isListening, setIsListening] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    callbackRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    manuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    } else {
      setIsPreparing(false);
      setIsListening(false);
      setStatusMessage("");
    }
  }, []);

  const start = useCallback(() => {
    if (isListening || isPreparing) return;

    const Constructor = getSpeechRecognitionConstructor();
    if (!Constructor) {
      setError("當前瀏覽器不支援語音輸入，請使用最新版 Chrome 或 Edge。");
      return;
    }
    if (!canRequestMicrophone()) {
      setError("當前瀏覽器無法訪問麥克風，請使用最新版 Chrome 或 Edge 並確認頁面為 localhost 或 HTTPS。");
      return;
    }

    void (async () => {
      recognitionRef.current?.abort();
      manuallyStoppedRef.current = false;
      heardSpeechRef.current = false;
      failedRef.current = false;
      setError("");
      setInterimText("");
      setStatusMessage("正在連線麥克風...");
      setIsPreparing(true);

      try {
        await checkMicrophoneAccess();
      } catch (reason) {
        setIsPreparing(false);
        setStatusMessage("");
        setError(microphoneAccessErrorMessage(reason));
        return;
      }
      if (manuallyStoppedRef.current) {
        setIsPreparing(false);
        setStatusMessage("");
        return;
      }

      const recognition = new Constructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "zh-TW";
      recognition.onstart = () => {
        setIsPreparing(false);
        setIsListening(true);
        setStatusMessage("正在聆聽，完成後點選停止。");
      };
      recognition.onresult = (event) => {
        let finalTranscript = "";
        let nextInterimText = "";

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result?.[0]?.transcript?.trim() ?? "";
          if (!transcript) continue;

          heardSpeechRef.current = true;
          if (result.isFinal) finalTranscript += `${transcript} `;
          else nextInterimText += `${transcript} `;
        }

        setInterimText(nextInterimText.trim());
        if (finalTranscript.trim()) callbackRef.current(finalTranscript.trim());
      };
      recognition.onerror = (event) => {
        setIsPreparing(false);
        setIsListening(false);
        setInterimText("");
        if (event.error !== "aborted") {
          failedRef.current = true;
          setError(speechRecognitionErrorMessage(event.error));
          setStatusMessage("");
        }
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        setIsPreparing(false);
        setIsListening(false);
        setInterimText("");
        setStatusMessage("");
        if (!manuallyStoppedRef.current && !heardSpeechRef.current && !failedRef.current) {
          setError("沒有識別到語音，請靠近麥克風後重試。");
        }
      };

      try {
        recognitionRef.current = recognition;
        setStatusMessage("麥克風已連線，正在啟動語音識別...");
        recognition.start();
      } catch {
        recognitionRef.current = null;
        setIsPreparing(false);
        setIsListening(false);
        setStatusMessage("");
        setError("語音輸入啟動失敗，請重新整理頁面或檢查瀏覽器麥克風許可權。");
      }
    })();
  }, [isListening, isPreparing]);

  return {
    error,
    interimText,
    isListening,
    isPreparing,
    isSupported,
    isTranscribing: false,
    start,
    statusMessage,
    stop,
  };
}

function subscribeToSpeechSupport() {
  return () => undefined;
}

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return null;
  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function canRequestMicrophone() {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

async function checkMicrophoneAccess() {
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } finally {
    for (const track of stream?.getTracks() ?? []) {
      track.stop();
    }
  }
}

function microphoneAccessErrorMessage(reason: unknown) {
  if (reason instanceof DOMException) {
    if (reason.name === "NotAllowedError" || reason.name === "PermissionDeniedError") {
      return "無法使用麥克風許可權，請在瀏覽器設定中允許後重試。";
    }
    if (reason.name === "NotFoundError" || reason.name === "DevicesNotFoundError") {
      return "沒有檢測到可用麥克風，請確認系統已接入麥克風並允許瀏覽器使用。";
    }
    if (reason.name === "NotReadableError" || reason.name === "TrackStartError") {
      return "麥克風可能正被其他應用佔用，請關閉佔用麥克風的軟體後重試。";
    }
    if (reason.name === "SecurityError") {
      return "當前頁面無法訪問麥克風，請確認使用 localhost 或 HTTPS。";
    }
  }
  return reason instanceof Error ? reason.message : "麥克風啟動失敗，請稍後重試。";
}
