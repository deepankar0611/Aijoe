"use server";

import { OpenAI } from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

if (!process.env.OPENAI_ASSISTANT_ID) {
  throw new Error("OPENAI_ASSISTANT_ID is not set in environment variables");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const assistantId = process.env.OPENAI_ASSISTANT_ID;

export async function generateChatResponse(messages: any[], threadId?: string) {
  try {
    let thread;
    
    // Always create a new thread if no threadId is provided or if it's invalid
    if (!threadId || !threadId.startsWith('thread_')) {
      thread = await openai.beta.threads.create();
    } else {
      try {
        thread = await openai.beta.threads.retrieve(threadId);
      } catch (error) {
        console.log("Thread retrieval failed, creating new thread");
        thread = await openai.beta.threads.create();
      }
    }

    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    if (!lastUserMessage) {
      throw new Error("No user message found.");
    }

    // Add the message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: lastUserMessage.content,
    });

    // Create a run
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (["queued", "in_progress"].includes(runStatus.status)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (runStatus.status === "completed") {
      const threadMessages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = threadMessages.data.find(m => m.role === "assistant");
      
      if (!lastMessage) {
        throw new Error("No assistant response found.");
      }

      const textContent = lastMessage.content.find(c => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No valid text response found.");
      }

      return {
        text: textContent.text.value,
        threadId: thread.id,
      };
    } else {
      throw new Error(`Run ended with status: ${runStatus.status}`);
    }
  } catch (err) {
    console.error("generateChatResponse error:", err);
    throw new Error(err instanceof Error ? err.message : "Failed to generate assistant response.");
  }
}
