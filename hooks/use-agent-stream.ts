"use client";

import { useState, useCallback, useRef } from "react";

interface StreamOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (full: string) => void;
  onError?: (error: Error) => void;
}

export function useAgentStream(url: string, options: StreamOptions = {}) {
  const [output, setOutput] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(
    async (body?: Record<string, unknown>) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setOutput([]);
      setIsStreaming(true);

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
          signal: abortRef.current.signal,
        });

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let full = "";

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          options.onChunk?.(chunk);
          setOutput((prev) => [...prev, chunk]);
        }

        options.onComplete?.(full);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          options.onError?.(err as Error);
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [url, options]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { output, isStreaming, start, stop };
}
