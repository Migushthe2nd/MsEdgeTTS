import type { Substitution } from "./DialogueTurn";

/**
 * 转义 SSML 特殊字符
 * 转义顺序：先 & 后其他，防止重复转义
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
 * 按顺序替换文本中的匹配项（单次遍历，非递归）
 */
export function replaceText(text: string, substitutions: Substitution[]): string {
    let result = text;
    for (const sub of substitutions) {
        result = result.replace(new RegExp(sub.text, "g"), sub.alias);
    }
    return result;
}

/**
 * Microsoft Azure Speech Service 官方支持的 28 种情感风格
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
 * 验证 style 是否为有效的 Microsoft 官方情感风格
 * 无效时抛出 Error
 */
export function validateStyle(style: string): void {
    if (!VALID_STYLES.includes(style as any)) {
        throw new Error(`Invalid style "${style}". Valid styles: ${VALID_STYLES.join(", ")}`);
    }
}

/**
 * 验证 styleDegree 范围（0.01-2.0）
 * 无效时抛出 Error
 */
export function validateStyleDegree(degree: number): void {
    if (degree < 0.01 || degree > 2.0) {
        throw new Error("styleDegree must be between 0.01 and 2.0");
    }
}
