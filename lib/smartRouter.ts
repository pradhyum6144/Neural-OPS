// Smart LLM Router — language detection, complexity scoring, cost estimation.
// This module is pure computation. It never calls any API.

export type ModelKey =
  | "Sarvam-30B"
  | "Sarvam-105B"
  | "Claude Haiku"
  | "Claude Sonnet"
  | "Claude Opus"
  | "smallest.ai TTS"
  | "Gnani Vachana";

export interface ModelConfig {
  label: string;
  provider: string;
  pricePerK: number;    // ₹ per 1,000 tokens
  description: string;
}

export const MODEL_CONFIGS: Record<ModelKey, ModelConfig> = {
  "Sarvam-30B":       { label: "Sarvam-30B",       provider: "sarvam.ai",     pricePerK: 0.04,  description: "Fast Indian language model" },
  "Sarvam-105B":      { label: "Sarvam-105B",       provider: "sarvam.ai",     pricePerK: 0.08,  description: "Powerful Indian language model" },
  "Claude Haiku":     { label: "Claude Haiku",      provider: "Anthropic",     pricePerK: 0.21,  description: "Fast, cost-efficient tasks" },
  "Claude Sonnet":    { label: "Claude Sonnet",     provider: "Anthropic",     pricePerK: 0.94,  description: "Balanced research and analysis" },
  "Claude Opus":      { label: "Claude Opus",       provider: "Anthropic",     pricePerK: 4.69,  description: "Complex reasoning and documents" },
  "smallest.ai TTS":  { label: "smallest.ai TTS",   provider: "smallest.ai",   pricePerK: 0.12,  description: "Voice output synthesis" },
  "Gnani Vachana":    { label: "Gnani Vachana",     provider: "Gnani.ai",      pricePerK: 0.10,  description: "Indian language voice synthesis" },
};

export const DEFAULT_MODEL: ModelKey = "Claude Sonnet";

export interface RouterResult {
  model: ModelKey;
  estimatedTokens: number;
  estimatedCostINR: number;
  savingsINR: number;
  reason: string;
  isIndianLanguage: boolean;
  detectedLanguage: string | null;
  complexity: "simple" | "medium" | "complex";
  needsVoice: boolean;
}

// ── Language detection ────────────────────────────────────────────────────────

const INDIAN_LANGUAGE_RANGES: { name: string; regex: RegExp }[] = [
  { name: "Hindi/Marathi",  regex: /[ऀ-ॿ]/ },
  { name: "Bengali",        regex: /[ঀ-৿]/ },
  { name: "Gujarati",       regex: /[઀-૿]/ },
  { name: "Punjabi",        regex: /[਀-੿]/ },
  { name: "Oriya",          regex: /[଀-୿]/ },
  { name: "Tamil",          regex: /[஀-௿]/ },
  { name: "Telugu",         regex: /[ఀ-౿]/ },
  { name: "Kannada",        regex: /[ಀ-೿]/ },
  { name: "Malayalam",      regex: /[ഀ-ൿ]/ },
];

// Also detect transliterated Indian language requests (common patterns)
const TRANSLITERATED_PATTERNS = [
  /\b(hindi mein|hindi me|mujhe|kya|kaisa|batao|likho|samjhao|in hindi)\b/i,
  /\b(tamil|telugu|bengali|marathi|gujarati|punjabi|malayalam|kannada)\s+(mein|me|in|language|bhasha)\b/i,
  /\b(apni bhasha|local language|regional language)\b/i,
];

function detectIndianLanguage(text: string): string | null {
  for (const lang of INDIAN_LANGUAGE_RANGES) {
    if (lang.regex.test(text)) return lang.name;
  }
  for (const pattern of TRANSLITERATED_PATTERNS) {
    if (pattern.test(text)) return "Hindi (transliterated)";
  }
  // Explicit language keywords in English
  const lowerText = text.toLowerCase();
  if (/\bin hindi\b/.test(lowerText))   return "Hindi";
  if (/\bin tamil\b/.test(lowerText))   return "Tamil";
  if (/\bin telugu\b/.test(lowerText))  return "Telugu";
  if (/\bin bengali\b/.test(lowerText)) return "Bengali";
  if (/\bin marathi\b/.test(lowerText)) return "Marathi";
  if (/\bin gujarati\b/.test(lowerText))return "Gujarati";
  if (/\bin kannada\b/.test(lowerText)) return "Kannada";
  if (/\bin malayalam\b/.test(lowerText))return "Malayalam";
  if (/\bin punjabi\b/.test(lowerText)) return "Punjabi";
  return null;
}

// ── Complexity detection ──────────────────────────────────────────────────────

const COMPLEX_KEYWORDS = [
  /\b(legal|contract|clause|liability|indemnity|compliance|regulation|statute|judgment|litigation|arbitration)\b/i,
  /\b(medical|diagnosis|symptom|treatment|clinical|pharmaceutical|dosage|prescription|pathology)\b/i,
  /\b(audit|financial statement|balance sheet|due diligence|valuation|ipo|sebi|rbi compliance)\b/i,
  /\b(comprehensive|detailed analysis|in depth|exhaustive|full report|complete breakdown)\b/i,
  /\b(multiple documents|upload|summarize this document|attached|pdf|entire file)\b/i,
];

const MEDIUM_KEYWORDS = [
  /\b(research|analyze|analysis|compare|comparison|summarize|summarise|report|brief|overview)\b/i,
  /\b(market|competitor|trend|strategy|plan|forecast|projection|investment|portfolio)\b/i,
  /\b(explain|understand|how does|what is the difference|pros and cons|advantages|disadvantages)\b/i,
  /\b(multiple|several|various|list of|top \d+|best \d+|compare \d+)\b/i,
];

const VOICE_KEYWORDS = [
  /\b(read aloud|speak|narrate|voice|audio|listen|podcast|speech|say it|tell me)\b/i,
  /\b(bol|sunao|padhkar|awaaz|sunaiye)\b/i,
];

function detectComplexity(text: string): "simple" | "medium" | "complex" {
  const wordCount = text.trim().split(/\s+/).length;

  if (COMPLEX_KEYWORDS.some((r) => r.test(text))) return "complex";
  if (wordCount > 80) return "complex";

  if (MEDIUM_KEYWORDS.some((r) => r.test(text))) return "medium";
  if (wordCount > 30) return "medium";

  return "simple";
}

function detectVoiceNeed(text: string): boolean {
  return VOICE_KEYWORDS.some((r) => r.test(text));
}

// ── Token estimation ──────────────────────────────────────────────────────────
// Rough heuristic: 1 token ≈ 4 characters for English, 3 for Indian scripts.
// Multiply by 6 to account for context + response tokens across all 5 agents.

function estimateTokens(command: string, context = ""): number {
  const combined = command + " " + context;
  const hasIndianScript = INDIAN_LANGUAGE_RANGES.some(({ regex }) => regex.test(combined));
  const charsPerToken = hasIndianScript ? 3 : 4;
  const inputTokens = Math.ceil(combined.length / charsPerToken);
  // 6 agents each generate a response; estimate 200 output tokens per agent
  const outputTokens = 6 * 200;
  return inputTokens + outputTokens;
}

// ── Cost calculation ──────────────────────────────────────────────────────────

function costINR(tokens: number, model: ModelKey): number {
  const config = MODEL_CONFIGS[model];
  return Math.round((tokens / 1000) * config.pricePerK * 100) / 100;
}

// ── Main selector ─────────────────────────────────────────────────────────────

export function selectModel(command: string, context = ""): RouterResult {
  const detectedLanguage  = detectIndianLanguage(command + " " + context);
  const isIndianLanguage  = detectedLanguage !== null;
  const complexity        = detectComplexity(command);
  const needsVoice        = detectVoiceNeed(command);
  const estimatedTokens   = estimateTokens(command, context);

  let model: ModelKey;
  let reason: string;

  if (needsVoice && isIndianLanguage) {
    model  = "Gnani Vachana";
    reason = `Voice output requested in ${detectedLanguage} — using Gnani Vachana for natural Indian speech`;
  } else if (needsVoice) {
    model  = "smallest.ai TTS";
    reason = "Voice output requested — using smallest.ai for fast speech synthesis";
  } else if (isIndianLanguage && complexity === "complex") {
    model  = "Sarvam-105B";
    reason = `Complex task in ${detectedLanguage} — Sarvam-105B handles nuanced Indian language reasoning`;
  } else if (isIndianLanguage) {
    model  = "Sarvam-30B";
    reason = `${detectedLanguage} detected — Sarvam-30B is optimised for Indian languages at a fraction of the cost`;
  } else if (complexity === "complex") {
    model  = "Claude Opus";
    reason = "Complex document or domain-specific task detected — Claude Opus for deep reasoning";
  } else if (complexity === "medium") {
    model  = "Claude Sonnet";
    reason = "Research or multi-step analysis — Claude Sonnet balances quality and cost";
  } else {
    model  = "Claude Haiku";
    reason = "Simple, short task — Claude Haiku is fast and cost-efficient";
  }

  const estimatedCostINR  = costINR(estimatedTokens, model);
  const defaultCostINR    = costINR(estimatedTokens, DEFAULT_MODEL);
  const savingsINR        = Math.max(0, Math.round((defaultCostINR - estimatedCostINR) * 100) / 100);

  return {
    model,
    estimatedTokens,
    estimatedCostINR,
    savingsINR,
    reason,
    isIndianLanguage,
    detectedLanguage,
    complexity,
    needsVoice,
  };
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export function formatCostINR(amount: number): string {
  if (amount < 1) return `₹${amount.toFixed(2)}`;
  return `₹${amount.toFixed(2)}`;
}

export function allModelKeys(): ModelKey[] {
  return Object.keys(MODEL_CONFIGS) as ModelKey[];
}
