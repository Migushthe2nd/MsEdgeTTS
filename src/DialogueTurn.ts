/**
 * Text substitution interface for replacing specific strings in text with aliases
 */
export interface Substitution {
    text: string;
    alias: string;
}

/**
 * Text segment interface supporting language specification and text substitution
 */
export interface TextSegment {
    text: string;
    lang?: string;
    substitution?: string;
}

/**
 * Dialogue turn interface defining voice parameters and text content for a single speaker
 */
export interface DialogueTurn {
    speaker?: string;
    voice: string;
    text?: string;
    children?: TextSegment[];
    style?: string;
    styleDegree?: number;
    lang?: string;
    substitutions?: Substitution[];
}

/**
 * Dialogue class containing multiple dialogue turns and convertible to SSML
 */
export class Dialogue {
    turns: DialogueTurn[] = [];

    /**
     * Convert dialogue to SSML format
     * @returns SSML string (placeholder implementation, will be completed in subsequent tasks)
     */
    toSSML(): string {
        return "";
    }
}
