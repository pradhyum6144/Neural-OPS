import Groq from "groq-sdk";
import { NextRequest } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPTS: Record<string, string> = {
  planner: `You are the Planner agent in a multi-agent AI orchestration system.
Your job is to analyze user queries and create a concise execution plan.
Break down the task into 3-4 clear steps. Be brief and structured.
Output format: list each step with a number. End with "Plan ready."`,

  research: `You are the Research agent in a multi-agent AI orchestration system.
Your job is to synthesize information and provide factual analysis on the given topic.
Be concise (3-4 sentences max). Focus on key data points and insights.
End with "Research complete."`,

  browser: `You are the Browser agent in a multi-agent AI orchestration system.
Your job is to simulate web navigation and data extraction for the given task.
Describe what URLs you'd visit and what data you'd extract. Be brief (2-3 sentences).
End with "Browser task done."`,

  finance: `You are the Finance agent in a multi-agent AI orchestration system.
Your job is to analyze financial data, metrics, and provide quantitative insights.
Provide key numbers and analysis in 3-4 sentences. Use realistic data.
End with "Financial analysis complete."`,

  voice: `You are the Voice agent in a multi-agent AI orchestration system.
Your job is to prepare a concise spoken summary of the findings so far.
Write a 2-3 sentence voice-ready summary. No markdown, plain speech.
End with "Voice synthesis ready."`,

  summary: `You are the Summary agent in a multi-agent AI orchestration system.
Your job is to produce a final structured report from all previous agent outputs.
Create a JSON object with keys: "title", "keyFindings" (array of 3 strings), "recommendation", "confidence" (0-100).
Output ONLY valid JSON, nothing else.`,
};

export async function POST(req: NextRequest) {
  const { agentType, task, context } = await req.json();

  const systemPrompt = SYSTEM_PROMPTS[agentType] ?? SYSTEM_PROMPTS.research;

  const userMessage = context
    ? `Task: ${task}\n\nContext from previous agents:\n${context}`
    : `Task: ${task}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const groqStream = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          max_tokens: 800,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        });

        let fullContent = "";

        for await (const chunk of groqStream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            fullContent += text;
            const tokenChunk = JSON.stringify({ type: "token", text }) + "\n";
            controller.enqueue(encoder.encode(tokenChunk));
          }
        }

        const doneChunk = JSON.stringify({
          type: "done",
          content: fullContent,
          usage: { input_tokens: 0, output_tokens: fullContent.length },
        }) + "\n";
        controller.enqueue(encoder.encode(doneChunk));
        controller.close();
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        const errChunk = JSON.stringify({ type: "error", error }) + "\n";
        controller.enqueue(encoder.encode(errChunk));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
