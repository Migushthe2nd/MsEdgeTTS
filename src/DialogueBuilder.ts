import { Dialogue, type DialogueTurn } from "./DialogueTurn";
import { escapeSSML, replaceText, validateStyle, validateStyleDegree } from "./SSMLUtils";

/**
 * Dialogue builder class for chain-building multi-speaker dialogues
 */
export class DialogueBuilder {
    private turns: DialogueTurn[] = [];

    /**
     * Create a dialogue builder
     */
    constructor() {}

    /**
     * Add a dialogue turn (chained call)
     * @param turn - Dialogue turn object
     * @returns Current builder instance (supports chained calls)
     * @throws Throws an error when turn parameter is invalid
     */
    addTurn(turn: DialogueTurn): DialogueBuilder {
        // Strict mode validation
        if (!turn.voice || turn.voice.trim() === "") {
            throw new Error("voice name is required and cannot be empty");
        }

        if (turn.text !== undefined && turn.text !== null && turn.text.trim() === "") {
            throw new Error("text cannot be empty string");
        }

        if (turn.style !== undefined && turn.style !== null) {
            validateStyle(turn.style);
        }

        if (turn.styleDegree !== undefined && turn.styleDegree !== null) {
            validateStyleDegree(turn.styleDegree);
        }

        this.turns.push(turn);
        return this;
    }

    /**
     * Build a Dialogue object
     * @returns Dialogue object containing all added turns
     */
    build(): Dialogue {
        const dialogue = new Dialogue();
        dialogue.turns = [...this.turns];
        return dialogue;
    }

    /**
     * Reset builder state, clearing all added turns
     * @returns Current builder instance (supports chained calls)
     */
    reset(): DialogueBuilder {
        this.turns = [];
        return this;
    }
}

/**
 * Build SSML string for multi-speaker dialogue
 * @param turns - Array of dialogue turns
 * @returns Complete SSML string
 */
export function buildDialogueSSML(turns: DialogueTurn[]): string {
    const voiceElements: string[] = [];

    for (const turn of turns) {
        // Process text: apply substitutions first, then SSML escaping
        let processedText = turn.text || "";
        
        // Apply text substitution (generate <sub alias> tags)
        if (turn.substitutions && turn.substitutions.length > 0) {
            // Sort by text length descending to ensure longer words are replaced first
            const sortedSubs = [...turn.substitutions].sort((a, b) => b.text.length - a.text.length);
            const placeholders: Map<string, string> = new Map();
            
            for (let i = 0; i < sortedSubs.length; i++) {
                const sub = sortedSubs[i];
                // First escape alias and text for SSML
                const escapedAlias = escapeSSML(sub.alias);
                const escapedText = escapeSSML(sub.text);
                // Generate <sub alias="...">text</sub> tag
                const subTag = `<sub alias="${escapedAlias}">${escapedText}</sub>`;
                // Use unique placeholder
                const placeholder = `__SUB_PLACEHOLDER_${i}__`;
                placeholders.set(placeholder, subTag);
                // First replace with placeholder
                processedText = processedText.replace(
                    new RegExp(sub.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), 
                    placeholder
                );
            }
            
            // Apply SSML escaping
            processedText = escapeSSML(processedText);
            
            // Restore <sub> tags
            for (const [placeholder, subTag] of placeholders.entries()) {
                processedText = processedText.replace(placeholder, subTag);
            }
        } else {
            // When no substitutions, apply SSML escaping directly
            processedText = escapeSSML(processedText);
        }

        // Process children (if any)
        let childrenContent = "";
        if (turn.children && turn.children.length > 0) {
            childrenContent = turn.children
                .map((segment) => {
                    let segmentText = escapeSSML(segment.text);
                    if (segment.substitution) {
                        segmentText = segment.substitution;
                    }
                    if (segment.lang) {
                        return `<lang xml:lang="${segment.lang}">${segmentText}</lang>`;
                    }
                    return segmentText;
                })
                .join("");
        }

        // Build voice element content
        let voiceContent = childrenContent || processedText;

        // Apply lang (if any)
        if (turn.lang) {
            voiceContent = `<lang xml:lang="${turn.lang}">${voiceContent}</lang>`;
        }

        // Apply style and styleDegree (if any)
        if (turn.style) {
            const styleDegreeAttr = turn.styleDegree !== undefined && turn.styleDegree !== null 
                ? ` styledegree="${turn.styleDegree}"` 
                : "";
            voiceContent = `<mstts:express-as style="${turn.style}"${styleDegreeAttr}>${voiceContent}</mstts:express-as>`;
        }

        // Build complete voice element
        voiceElements.push(`<voice name="${turn.voice}">${voiceContent}</voice>`);
    }

    // Infer primary language (based on first voice name)
    const firstVoice = turns[0]?.voice || "zh-CN-XiaoxiaoNeural";
    const lang = firstVoice.split("-").slice(0, 2).join("-"); // Extract "zh-CN" or "en-US"

    // Build complete SSML
    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}">
${voiceElements.join("\n")}
</speak>`;
}
