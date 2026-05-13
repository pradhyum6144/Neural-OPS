import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json() as { type: "instagram" | "video_script"; content: string };
  const { type, content } = body;

  if (!content?.trim()) return NextResponse.json({ error: "No content" }, { status: 400 });

  if (type === "instagram") {
    const prompt = `You are a social media content creator for an AI company targeting Indian professionals and entrepreneurs.
Convert the following AI analysis into an Instagram post.
Output ONLY valid JSON, exactly this shape:
{
  "caption": "3-line punchy caption with emojis that hooks the reader immediately",
  "hashtags": ["#NeuralOPS","#AIIndia","#IndianStartup","#ArtificialIntelligence","#TechIndia","#MakeInIndia","#AITools","#ProductivityAI","#StartupIndia","#FutureOfWork"],
  "cta": "One punchy call-to-action line"
}

Analysis content:
${content.slice(0, 1200)}`;

    try {
      const res = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        max_tokens: 400,
        stream: false,
        messages: [
          { role: "system", content: "Output ONLY valid JSON. No explanation, no markdown, no code fences." },
          { role: "user", content: prompt },
        ],
      });
      const raw = res.choices[0]?.message?.content ?? "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      const parsed = JSON.parse(match[0]) as { caption: string; hashtags: string[]; cta: string };
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        caption: "Just ran a full AI pipeline in seconds. 🤖✨\nFrom research to finance to voice — all automated.\nThis is what the future of work looks like.",
        hashtags: ["#NeuralOPS","#AIIndia","#IndianStartup","#ArtificialIntelligence","#TechIndia","#MakeInIndia","#AITools","#ProductivityAI","#StartupIndia","#FutureOfWork"],
        cta: "Try Neural OPS free — link in bio. 🚀",
      });
    }
  }

  if (type === "video_script") {
    const prompt = `You are a professional video script writer. Convert this AI analysis into a short-form video script (about 2 minutes).
Output ONLY valid JSON, exactly this shape:
{
  "hook": "First 5-second grabber line (spoken directly to camera, punchy)",
  "points": [
    { "timestamp": "0:05 - 0:35", "title": "Point 1 title", "script": "30-second spoken script for this point" },
    { "timestamp": "0:35 - 1:05", "title": "Point 2 title", "script": "30-second spoken script for this point" },
    { "timestamp": "1:05 - 1:35", "title": "Point 3 title", "script": "30-second spoken script for this point" }
  ],
  "cta": "Final 10-second call-to-action (spoken, energetic)"
}

Analysis content:
${content.slice(0, 1200)}`;

    try {
      const res = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        max_tokens: 700,
        stream: false,
        messages: [
          { role: "system", content: "Output ONLY valid JSON. No explanation, no markdown, no code fences." },
          { role: "user", content: prompt },
        ],
      });
      const raw = res.choices[0]?.message?.content ?? "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      const parsed = JSON.parse(match[0]) as { hook: string; points: { timestamp: string; title: string; script: string }[]; cta: string };
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        hook: "What if your entire research pipeline ran in under 30 seconds? Let me show you.",
        points: [
          { timestamp: "0:05 - 0:35", title: "The Problem", script: "Every day, professionals waste hours on research, analysis, and reporting. You're manually pulling data, writing summaries, and trying to make sense of it all. There has to be a better way." },
          { timestamp: "0:35 - 1:05", title: "The Solution", script: "Neural OPS runs five specialized AI agents simultaneously — planner, research, browser, finance, and voice — all coordinated to deliver a complete analysis in seconds. No more copy-pasting. No more tab-switching." },
          { timestamp: "1:05 - 1:35", title: "The Results", script: "Our pipeline just ran a complete analysis. The AI identified key insights, ran financial projections, and even prepared a voice summary — all automatically. This is the future of intelligent automation." },
        ],
        cta: "Try Neural OPS free today. The link is in the description. Your time is too valuable to waste on manual research.",
      });
    }
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
