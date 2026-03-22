import type { Substitution } from "./DialogueTurn";

/**
 * Escape SSML special characters
 * Escape order: & first, then others to prevent double escaping
 */
export function escapeSSML(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/**
 * Replace matches in text sequentially (single pass, non-recursive)
 */
export function replaceText(text: string, substitutions: Substitution[]): string {
    let result = text;
    for (const sub of substitutions) {
        result = result.replace(new RegExp(sub.text, "g"), sub.alias);
    }
    return result;
}

/**
 * Officially supported 28 emotional styles by Microsoft Azure Speech Service
 */
const VALID_STYLES = [
    "advertisement_upbeat",
    "affectionate",
    "angry",
    "assistant",
    "calm",
    "chat",
    "cheerful",
    "customerservice",
    "depressed",
    "documentary-narration",
    "empathetic",
    "excited",
    "fearful",
    "friendly",
    "gentle",
    "hopeful",
    "lyrical",
    "narration-professional",
    "narration-relaxed",
    "newscast",
    "newscast-casual",
    "newscast-formal",
    "poetry-reading",
    "sad",
    "serious",
    "shouting",
    "sports_commentary",
    "sports_commentary_excited",
    "terrified",
    "unfriendly",
    "whispering",
] as const;

/**
 * Validate if style is a valid Microsoft official emotional style
 * Throws Error if invalid
 */
export function validateStyle(style: string): void {
    if (!VALID_STYLES.includes(style as any)) {
        throw new Error(`Invalid style "${style}". Valid styles: ${VALID_STYLES.join(", ")}`);
    }
}

/**
 * Validate styleDegree range (0.01-2.0)
 * Throws Error if invalid
 */
export function validateStyleDegree(degree: number): void {
    if (degree < 0.01 || degree > 2.0) {
        throw new Error("styleDegree must be between 0.01 and 2.0");
    }
}
