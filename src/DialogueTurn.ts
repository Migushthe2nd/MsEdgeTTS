/**
 * 文本替换接口，用于将文本中的特定字符串替换为别名
 */
export interface Substitution {
    text: string;
    alias: string;
}

/**
 * 文本片段接口，支持语言指定和文本替换
 */
export interface TextSegment {
    text: string;
    lang?: string;
    substitution?: string;
}

/**
 * 对话轮次接口，定义单个说话者的语音参数和文本内容
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
 * 对话类，包含多个对话轮次并可转换为 SSML
 */
export class Dialogue {
    turns: DialogueTurn[] = [];

    /**
     * 将对话转换为 SSML 格式
     * @returns SSML 字符串（占位实现，后续任务会完善）
     */
    toSSML(): string {
        return "";
    }
}
