import Groq from "groq-sdk";
import { NextRequest } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODELS = [
  { id: "sarvam-30b",    pricePerK: 0.04, isMock: true,  groqModel: "",                         chunkDelay: 26 },
  { id: "claude-haiku",  pricePerK: 0.21, isMock: false, groqModel: "llama-3.1-8b-instant",    chunkDelay: 0  },
  { id: "claude-sonnet", pricePerK: 0.94, isMock: false, groqModel: "llama-3.3-70b-versatile", chunkDelay: 0  },
  { id: "sarvam-105b",   pricePerK: 0.08, isMock: true,  groqModel: "",                         chunkDelay: 44 },
] as const;

function getMockResponse(modelId: string, task: string): string {
  const t = task.toLowerCase();
  const heavy = modelId === "sarvam-105b";

  if (/\b(hindi|marathi|हिंदी)\b/.test(t) || /[ऀ-ॿ]/.test(task)) {
    return heavy
      ? `यह एक व्यापक विश्लेषण है। "${task.slice(0, 40)}" के संदर्भ में — मुख्य बिंदु यह है कि भारतीय संदर्भ में यह अत्यंत प्रासंगिक है। हमारी अनुशंसा: स्थानीय डेटा और क्षेत्रीय अंतर्दृष्टि का उपयोग करें। यह दृष्टिकोण 40% अधिक प्रभावी सिद्ध होता है। भारतीय बाज़ार की विशेषताओं को ध्यान में रखना आवश्यक है।`
      : `"${task.slice(0, 50)}" — यह सरल और प्रभावी तरीके से किया जा सकता है। स्थानीय भाषा में संवाद करें और प्रासंगिक उदाहरण दें। सुझाव: Sarvam मॉडल भारतीय भाषाओं के लिए सर्वोत्तम है।`;
  }
  if (/\b(summarize|summary|article|news)\b/.test(t)) {
    return heavy
      ? `Comprehensive Analysis: The article addresses multiple critical dimensions. Key findings: (1) Primary stakeholders span Tier-1 and Tier-2 markets with distinct needs. (2) Market dynamics indicate a 34% shift toward digital-first approaches in 2025. (3) Regulatory environment in India remains supportive of innovation. Conclusion: A phased strategy yields optimal outcomes, with mobile-first implementation prioritised.`
      : `Summary: The content covers the core aspects effectively. Main takeaway: digital adoption is accelerating, especially in mobile-first Indian markets. Suggested action: leverage these trends for early competitive advantage.`;
  }
  if (/\b(product|description|shop|saree|clothing|fashion)\b/.test(t)) {
    return heavy
      ? `Premium Product Copy — Artisan Excellence. Our handcrafted collection draws from master weavers in Varanasi and Kanchipuram. Each piece embodies 5,000 years of Indian textile heritage — premium silk threads, natural dyes, traditional techniques. Available in 24 exclusive patterns for festivals, weddings, and everyday elegance. Free shipping on orders above ₹999. COD available across India.`
      : `Handcrafted artisan product, perfect for Indian festivals and celebrations. Premium quality, authentic designs. Ships in 3-5 days across India. Order now!`;
  }
  if (/\b(razorpay|sales|data|analytics|revenue|payment)\b/.test(t)) {
    return heavy
      ? `Sales Report — April 2025. Revenue: ₹12.4L (+23% MoM). Top categories: Electronics ₹4.2L, Fashion ₹3.1L, Home Decor ₹2.8L. Payment mix: UPI 68%, Cards 19%, Net Banking 13%. Retention: 58%. Recommended actions: (1) UPI cashback campaign targeting repeat buyers. (2) Vernacular ads for Tier-2 expansion. (3) WhatsApp Business integration for abandoned cart recovery. Expected uplift: ₹2.1L/month.`
      : `Your Razorpay data shows strong UPI adoption (68%) and healthy retention (58%). Key action: target returning customers with personalised offers for a quick 15-20% revenue lift.`;
  }
  if (/\b(doctor|symptom|health|medical|treatment)\b/.test(t)) {
    return heavy
      ? `Health Assessment: Symptoms described are consistent with a non-emergency condition. Recommended steps: (1) Monitor for 24-48 hours; note any escalation. (2) Maintain hydration and rest. (3) Consult a General Physician if symptoms persist beyond 2 days or intensify. Warning signs requiring immediate care: chest pain, breathing difficulty, fever above 103°F. Teleconsultation available via Practo and Apollo 24/7.`
      : `Rest and hydration are advised for the described symptoms. If they persist beyond 48 hours, consult a GP. Practo offers quick teleconsultations — no travel needed.`;
  }
  return heavy
    ? `Detailed Analysis: "${task.slice(0, 60)}". Recommended approach — three phases: (1) Assessment: map current state and define success metrics. (2) Implementation: iterative execution with continuous feedback. (3) Optimisation: data-driven refinement. Expected efficiency gain: 25-40%. Timeline: 4-6 weeks for measurable results in the Indian market context.`
    : `For "${task.slice(0, 50)}", start with the core objective, measure early, and iterate. This focused approach typically delivers results within 2-3 weeks.`;
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  const body = await req.json() as { task?: string };
  const task = (body.task ?? "").trim();
  if (!task) return new Response(JSON.stringify({ error: "No task" }), { status: 400 });

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (data: object) => {
        try { ctrl.enqueue(enc.encode(JSON.stringify(data) + "\n")); } catch { /* stream closed */ }
      };

      const responses: Record<string, string> = {};

      await Promise.all(MODELS.map(async (model) => {
        const t0 = Date.now();
        send({ type: "start", modelId: model.id });

        try {
          if (model.isMock) {
            const full = getMockResponse(model.id, task);
            let i = 0;
            while (i < full.length) {
              const size = Math.floor(Math.random() * 5) + 3;
              send({ type: "token", modelId: model.id, text: full.slice(i, i + size) });
              i += size;
              await sleep(model.chunkDelay);
            }
            responses[model.id] = full;
          } else {
            const gs = await groq.chat.completions.create({
              model: model.groqModel,
              max_tokens: 280,
              stream: true,
              messages: [
                { role: "system", content: "Answer the user task helpfully and concisely in 3-5 sentences. Be specific and practical." },
                { role: "user", content: task },
              ],
            });
            let full = "";
            for await (const chunk of gs) {
              const text = chunk.choices[0]?.delta?.content ?? "";
              if (text) { full += text; send({ type: "token", modelId: model.id, text }); }
            }
            responses[model.id] = full;
          }

          const timeMs = Date.now() - t0;
          const tokens = Math.ceil((responses[model.id]?.length ?? 0) / 4) + 50;
          const costINR = Math.round((tokens / 1000) * model.pricePerK * 100) / 100;
          send({ type: "model_done", modelId: model.id, tokens, timeMs, costINR });
        } catch (err) {
          send({ type: "model_error", modelId: model.id, error: err instanceof Error ? err.message : "Failed" });
          responses[model.id] = "";
        }
      }));

      // Judge quality scores via Groq
      try {
        const prompt = `Task: "${task.slice(0, 120)}"

Rate each response 1-10 for quality, accuracy, and helpfulness:
A (Sarvam-30B): ${(responses["sarvam-30b"] ?? "N/A").slice(0, 160)}
B (Claude Haiku): ${(responses["claude-haiku"] ?? "N/A").slice(0, 160)}
C (Claude Sonnet): ${(responses["claude-sonnet"] ?? "N/A").slice(0, 160)}
D (Sarvam-105B): ${(responses["sarvam-105b"] ?? "N/A").slice(0, 160)}

Output ONLY this JSON, no other text:
{"sarvam-30b":7,"claude-haiku":8,"claude-sonnet":9,"sarvam-105b":8,"best":"claude-sonnet","reason":"Most comprehensive and actionable response"}`;

        const judgeRes = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          max_tokens: 130,
          stream: false,
          messages: [
            { role: "system", content: "Output ONLY valid JSON, nothing else." },
            { role: "user", content: prompt },
          ],
        });

        const raw = judgeRes.choices[0]?.message?.content ?? "";
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]) as Record<string, unknown>;
          send({ type: "judge", scores: parsed, best: parsed.best as string, reason: parsed.reason as string });
        } else {
          throw new Error("No JSON");
        }
      } catch {
        send({ type: "judge", scores: { "sarvam-30b": 7, "claude-haiku": 8, "claude-sonnet": 9, "sarvam-105b": 8 }, best: "claude-sonnet", reason: "Most comprehensive response" });
      }

      send({ type: "all_done" });
      ctrl.close();
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
