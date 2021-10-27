# MsEdgeTTS
[![npm version](https://badge.fury.io/js/msedge-tts.svg)](https://badge.fury.io/js/msedge-tts)

An Azure Speech Service module that uses the Microsoft Edge Read Aloud API.

Full support for SSML, however, the following is the default SSML object:

```xml

<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts"
       xml:lang="${this._voiceLang}">
    <voice name="${voiceName}">
        ${input}
    </voice>
</speak>
```

Documentation on the SSML
format [can be found here](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/speech-synthesis-markup)
. All supported audio formats [can be found here](./src/OUTPUT_FORMAT.ts).

## Example usage

### Write to Stream

```js
import {MsEdgeTTS} from "msedge-tts";

const tts = new MsEdgeTTS();
await tts.setMetadata("en-IE-ConnorNeural", MsEdgeTTS.OUTPUT_FORMATS.WEBM_24KHZ_16BIT_MONO_OPUS);
const readable = tts.toStream("Hi, how are you?");

readable.on("data", (data) => {
    console.log("DATA RECEIVED", data);
    // raw audio file data
});

readable.on("closed", () => {
    console.log("STREAM CLOSED");
});
```

### Write to File

```js
import {MsEdgeTTS} from "msedge-tts";

(async () => {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("en-US-AriaNeural", MsEdgeTTS.OUTPUT_FORMATS.WEBM_24KHZ_16BIT_MONO_OPUS);
    const filePath = await tts.toFile("./example_audio.webm", "Hi, how are you?");  
})
```

## API

This library only supports promises.

[API Documentation](https://migushthe2nd.github.io/MsEdgeTTS)
