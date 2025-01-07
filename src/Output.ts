/**
 * Only a few of the [possible formats](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/rest-text-to-speech#audio-outputs) are accepted.
 */
export enum OUTPUT_FORMAT {
    // Streaming =============================
    // AMR_WB_16000HZ = "amr-wb-16000hz",
    // AUDIO_16KHZ_16BIT_32KBPS_MONO_OPUS = "audio-16khz-16bit-32kbps-mono-opus",
    // AUDIO_16KHZ_32KBITRATE_MONO_MP3 = "audio-16khz-32kbitrate-mono-mp3",
    // AUDIO_16KHZ_64KBITRATE_MONO_MP3 = "audio-16khz-64kbitrate-mono-mp3",
    // AUDIO_16KHZ_128KBITRATE_MONO_MP3 = "audio-16khz-128kbitrate-mono-mp3",
    // AUDIO_24KHZ_16BIT_24KBPS_MONO_OPUS = "audio-24khz-16bit-24kbps-mono-opus",
    // AUDIO_24KHZ_16BIT_48KBPS_MONO_OPUS = "audio-24khz-16bit-48kbps-mono-opus",
    AUDIO_24KHZ_48KBITRATE_MONO_MP3 = "audio-24khz-48kbitrate-mono-mp3",
    AUDIO_24KHZ_96KBITRATE_MONO_MP3 = "audio-24khz-96kbitrate-mono-mp3",
    // AUDIO_24KHZ_160KBITRATE_MONO_MP3 = "audio-24khz-160kbitrate-mono-mp3",
    // AUDIO_48KHZ_96KBITRATE_MONO_MP3 = "audio-48khz-96kbitrate-mono-mp3",
    // AUDIO_48KHZ_192KBITRATE_MONO_MP3 = "audio-48khz-192kbitrate-mono-mp3",
    // OGG_16KHZ_16BIT_MONO_OPUS = "ogg-16khz-16bit-mono-opus",
    // OGG_24KHZ_16BIT_MONO_OPUS = "ogg-24khz-16bit-mono-opus",
    // OGG_48KHZ_16BIT_MONO_OPUS = "ogg-48khz-16bit-mono-opus",
    // RAW_8KHZ_8BIT_MONO_ALAW = "raw-8khz-8bit-mono-alaw",
    // RAW_8KHZ_8BIT_MONO_MULAW = "raw-8khz-8bit-mono-mulaw",
    // RAW_8KHZ_16BIT_MONO_PCM = "raw-8khz-16bit-mono-pcm",
    // RAW_16KHZ_16BIT_MONO_PCM = "raw-16khz-16bit-mono-pcm",
    // RAW_16KHZ_16BIT_MONO_TRUESILK = "raw-16khz-16bit-mono-truesilk",
    // RAW_22050HZ_16BIT_MONO_PCM = "raw-22050hz-16bit-mono-pcm",
    // RAW_24KHZ_16BIT_MONO_PCM = "raw-24khz-16bit-mono-pcm",
    // RAW_24KHZ_16BIT_MONO_TRUESILK = "raw-24khz-16bit-mono-truesilk",
    // RAW_44100HZ_16BIT_MONO_PCM = "raw-44100hz-16bit-mono-pcm",
    // RAW_48KHZ_16BIT_MONO_PCM = "raw-48khz-16bit-mono-pcm",
    // WEBM_16KHZ_16BIT_MONO_OPUS = "webm-16khz-16bit-mono-opus",
    // WEBM_24KHZ_16BIT_24KBPS_MONO_OPUS = "webm-24khz-16bit-24kbps-mono-opus",
    WEBM_24KHZ_16BIT_MONO_OPUS = "webm-24khz-16bit-mono-opus",
    // Non-streaming =============================
    // RIFF_8KHZ_8BIT_MONO_ALAW = "riff-8khz-8bit-mono-alaw",
    // RIFF_8KHZ_8BIT_MONO_MULAW = "riff-8khz-8bit-mono-mulaw",
    // RIFF_8KHZ_16BIT_MONO_PCM = "riff-8khz-16bit-mono-pcm",
    // RIFF_22050HZ_16BIT_MONO_PCM = "riff-22050hz-16bit-mono-pcm",
    // RIFF_24KHZ_16BIT_MONO_PCM = "riff-24khz-16bit-mono-pcm",
    // RIFF_44100HZ_16BIT_MONO_PCM = "riff-44100hz-16bit-mono-pcm",
    // RIFF_48KHZ_16BIT_MONO_PCM = "riff-48khz-16bit-mono-pcm",
}

export const OUTPUT_EXTENSIONS = {
    [OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3]: "mp3",
    [OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3]: "mp3",
    [OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS]: "webm",
}