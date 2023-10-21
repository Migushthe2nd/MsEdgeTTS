import {MsEdgeTTS, OUTPUT_FORMAT} from "../dist";

(async () => {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
    const filePath = await tts.toFile("./example_audio_pitched.webm", "Hi, how are you?", {rate: 0.5, pitch: "+3st"});
    console.log("Done!", filePath);
})();