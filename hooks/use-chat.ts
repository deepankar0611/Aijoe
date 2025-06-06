"use client";

import { useState, useCallback, useEffect } from "react";
import type { Message } from "ai";
import { v4 as uuidv4 } from "uuid";
import { generateChatResponse } from "@/app/actions/chat-actions";
import Cookies from "js-cookie";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | undefined>(() => {
    const cookieThreadId = Cookies.get("threadId");
    if (
      !cookieThreadId ||
      cookieThreadId === "undefined" ||
      cookieThreadId === "null" ||
      cookieThreadId === ""
    ) {
      Cookies.remove("threadId");
      return undefined;
    }
    return cookieThreadId;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastCompletedAssistantMessage, setLastCompletedAssistantMessage] =
    useState<Message | null>(null);

  // Save valid threadId to cookies
  useEffect(() => {
    if (threadId) {
      Cookies.set("threadId", threadId, { expires: 7 });
    }
  }, [threadId]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim()) return;

      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content: input.trim(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      try {
        // ✅ Sanitize threadId before sending
        const safeThreadId =
          !threadId ||
          threadId === "undefined" ||
          threadId === "null" ||
          threadId === ""
            ? undefined
            : threadId;

        const result = await generateChatResponse(
          updatedMessages,
          safeThreadId
        );

        if (result?.text) {
          const assistantMessage: Message = {
            id: uuidv4(),
            role: "assistant",
            content: result.text,
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setLastCompletedAssistantMessage(assistantMessage);
        }

        if (result?.threadId) {
          setThreadId(result.threadId);
        }
      } catch (err) {
        console.error("Assistant error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            role: "assistant",
            content: "Something went wrong. Try again.",
          },
        ]);
        // Clear broken threadId
        setThreadId(undefined);
        Cookies.remove("threadId");
      } finally {
        setIsLoading(false);
      }
    },
    [input, messages, threadId]
  );

  const handleStop = useCallback(() => {
    setIsLoading(false);
  }, []);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    handleStop,
    isLoading,
    lastCompletedAssistantMessage,
    threadId,
  };
}
