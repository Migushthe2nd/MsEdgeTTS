export class ProsodyOptions {
    /**
     * The pitch to use.
     * Can be any {@link PITCH}, or a relative frequency in Hz (+50Hz), a relative semitone (+2st), or a relative percentage (+50%).
     * [SSML documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#:~:text=Optional-,pitch,-Indicates%20the%20baseline)
     */
    pitch?: PITCH | string = "+0Hz"
    /**
     * The rate to use.
     * Can be any {@link RATE}, or a relative number (0.5), or string with a relative percentage (+50%).
     * [SSML documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#:~:text=Optional-,rate,-Indicates%20the%20speaking)
     */
    rate?: RATE | string | number = 1.0
    /**
     * The volume to use.
     * Can be any {@link VOLUME}, or an absolute number (0, 100), a string with a relative number (+50), or a relative percentage (+50%).
     * [SSML documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#:~:text=Optional-,volume,-Indicates%20the%20volume)
     */
    volume?: VOLUME | string | number = 100.0
}

/**
 * https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#:~:text=Optional-,rate,-Indicates%20the%20speaking
 */
export enum RATE {
    X_SLOW = "x-slow",
    SLOW = "slow",
    MEDIUM = "medium",
    FAST = "fast",
    X_FAST = "x-fast",
    DEFAULT = "default",
}

/**
 * https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#:~:text=Optional-,pitch,-Indicates%20the%20baseline
 */
export enum PITCH {
    X_LOW = "x-low",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    X_HIGH = "x-high",
    DEFAULT = "default",
}

/**
 * https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#:~:text=Optional-,volume,-Indicates%20the%20volume
 */
export enum VOLUME {
    SILENT = "silent",
    X_SOFT = "x-soft",
    SOFT = "soft",
    MEDIUM = "medium",
    LOUD = "loud",
    X_LOUD = "x-LOUD",
    DEFAULT = "default",
}
