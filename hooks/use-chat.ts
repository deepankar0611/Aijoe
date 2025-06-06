"use client";

import { useState, useCallback, useEffect } from "react";
import type { Message } from "ai";
import { v4 as uuidv4 } from "uuid";
import { generateChatResponse } from "@/app/actions/chat-actions"; // ✅ matches your file
import Cookies from "js-cookie";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | undefined>(() => {
    // Try to get threadId from cookies on initial load
    return Cookies.get("threadId") || undefined;
  });
  // ✅ memory per refresh
  const [isLoading, setIsLoading] = useState(false);
  const [lastCompletedAssistantMessage, setLastCompletedAssistantMessage] = useState<Message | null>(null);

  // Save threadId to cookies whenever it changes
  useEffect(() => {
    if (threadId) {
      Cookies.set("threadId", threadId, { expires: 7 }); // Expires in 7 days
    }
  }, [threadId]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
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
      const result = await generateChatResponse(updatedMessages, threadId || undefined);


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
      // Clear threadId on error to force new thread creation
      setThreadId(undefined);
      Cookies.remove("threadId");
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, threadId]);

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
