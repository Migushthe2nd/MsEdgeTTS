import { Dialogue, type DialogueTurn } from "./DialogueTurn";
import { escapeSSML, replaceText, validateStyle, validateStyleDegree } from "./SSMLUtils";

/**
 * 对话构建器类，用于链式构建多说话人对话
 */
export class DialogueBuilder {
    private turns: DialogueTurn[] = [];

    /**
     * 创建对话构建器
     */
    constructor() {}

    /**
     * 添加一个对话回合（链式调用）
     * @param turn 对话回合对象
     * @returns 当前构建器实例（支持链式调用）
     * @throws 当 turn 参数无效时抛出异常
     */
    addTurn(turn: DialogueTurn): DialogueBuilder {
        // 严格模式验证
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
     * 构建 Dialogue 对象
     * @returns 包含所有添加回合的 Dialogue 对象
     */
    build(): Dialogue {
        const dialogue = new Dialogue();
        dialogue.turns = [...this.turns];
        return dialogue;
    }

    /**
     * 重置构建器状态，清空所有已添加的回合
     * @returns 当前构建器实例（支持链式调用）
     */
    reset(): DialogueBuilder {
        this.turns = [];
        return this;
    }
}

/**
 * 构建多说话人对话的 SSML 字符串
 * @param turns 对话回合数组
 * @returns 完整的 SSML 字符串
 */
export function buildDialogueSSML(turns: DialogueTurn[]): string {
    const voiceElements: string[] = [];

    for (const turn of turns) {
        // 处理文本：先应用替换，后应用 SSML 转义
        let processedText = turn.text || "";
        
        // 应用文本替换（生成 <sub alias> 标签）
        if (turn.substitutions && turn.substitutions.length > 0) {
            // 按文本长度降序处理，确保先替换长词
            const sortedSubs = [...turn.substitutions].sort((a, b) => b.text.length - a.text.length);
            const placeholders: Map<string, string> = new Map();
            
            for (let i = 0; i < sortedSubs.length; i++) {
                const sub = sortedSubs[i];
                // 先对 alias 和 text 进行 SSML 转义
                const escapedAlias = escapeSSML(sub.alias);
                const escapedText = escapeSSML(sub.text);
                // 生成 <sub alias="...">text</sub> 标签
                const subTag = `<sub alias="${escapedAlias}">${escapedText}</sub>`;
                // 使用唯一占位符
                const placeholder = `__SUB_PLACEHOLDER_${i}__`;
                placeholders.set(placeholder, subTag);
                // 先替换为占位符
                processedText = processedText.replace(
                    new RegExp(sub.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), 
                    placeholder
                );
            }
            
            // 应用 SSML 转义
            processedText = escapeSSML(processedText);
            
            // 恢复 <sub> 标签
            for (const [placeholder, subTag] of placeholders.entries()) {
                processedText = processedText.replace(placeholder, subTag);
            }
        } else {
            // 没有替换时，直接应用 SSML 转义
            processedText = escapeSSML(processedText);
        }

        // 处理 children（如果有）
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

        // 构建 voice 元素内容
        let voiceContent = childrenContent || processedText;

        // 应用 lang（如果有）
        if (turn.lang) {
            voiceContent = `<lang xml:lang="${turn.lang}">${voiceContent}</lang>`;
        }

        // 应用 style 和 styleDegree（如果有）
        if (turn.style) {
            const styleDegreeAttr = turn.styleDegree !== undefined && turn.styleDegree !== null 
                ? ` styledegree="${turn.styleDegree}"` 
                : "";
            voiceContent = `<mstts:express-as style="${turn.style}"${styleDegreeAttr}>${voiceContent}</mstts:express-as>`;
        }

        // 构建完整的 voice 元素
        voiceElements.push(`<voice name="${turn.voice}">${voiceContent}</voice>`);
    }

    // 推断主要语言（根据第一个 voice 名称）
    const firstVoice = turns[0]?.voice || "zh-CN-XiaoxiaoNeural";
    const lang = firstVoice.split("-").slice(0, 2).join("-"); // 提取 "zh-CN" 或 "en-US"

    // 构建完整的 SSML
    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}">
${voiceElements.join("\n")}
</speak>`;
}
