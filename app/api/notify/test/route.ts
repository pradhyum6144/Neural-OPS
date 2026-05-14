import { NextResponse } from "next/server";
import { notifyPipelineComplete } from "@/lib/notify";

export async function GET() {
  try {
    await notifyPipelineComplete({
      command: "Research NVIDIA stock and summarize AI news",
      modelUsed: "Sarvam-30B",
      totalTokens: 5413,
      costINR: 0.22,
      savedINR: 4.87,
      timeTaken: 14697,
      summary:
        "NVIDIA shows strong momentum with AI chip demand driving 18% revenue growth. Sarvam AI launched India's first sovereign LLM with 105B parameters.",
      agents: {
        planner: 730,
        research: 2212,
        browser: 1067,
        finance: 4211,
        voice: 586,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Test notification sent to Slack",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
