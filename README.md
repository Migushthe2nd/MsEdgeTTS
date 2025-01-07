# MsEdgeTTS
[![npm version](https://badge.fury.io/js/msedge-tts.svg)](https://badge.fury.io/js/msedge-tts)

A simple Azure Speech Service module that uses the Microsoft Edge Read Aloud API.

~~Full support for SSML~~ Only supports `speak`, `voice`, and `prosody` element types. The following is the default SSML object:

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts"
       xml:lang="${this._voiceLang}">
    <voice name="${voiceName}">
        <prosody rate="${rate}" pitch="${pitch}" volume="${volume}">
            ${input}
        </prosody>
    </voice>
</speak>
```

Documentation on the SSML
format [can be found here](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/speech-synthesis-markup)
. All supported audio formats [can be found here](./src/Output.ts).

## Example usage

Make sure to **escape/sanitize** your user's input!
Use a library like [xml-escape](https://www.npmjs.com/package/xml-escape).

### Write to stream

```js
import {MsEdgeTTS, OUTPUT_FORMAT} from "msedge-tts";

const tts = new MsEdgeTTS();
await tts.setMetadata("en-IE-ConnorNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
const {audioStream} = tts.toStream("Hi, how are you?");

audioStream.on("data", (data) => {
    console.log("DATA RECEIVED", data);
    // raw audio file data
});

audioStream.on("close", () => {
    console.log("STREAM CLOSED");
});
```

### Write to file

```js
import {MsEdgeTTS, OUTPUT_FORMAT} from "msedge-tts";

(async () => {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
    const {audioFilePath} = await tts.toFile("./tmpfolder", "Hi, how are you?");  
})();
```

### Change voice rate, pitch and volume
```js
import {MsEdgeTTS, OUTPUT_FORMAT} from "msedge-tts";

(async () => {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
    const {audioStream} = await tts.toStream("Hi, how are you?", {rate: 0.5, pitch: "+200Hz"});
})();
```

### Use an alternative HTTP Agent
Use a custom http.Agent implementation like [https-proxy-agent](https://github.com/TooTallNate/proxy-agents) or [socks-proxy-agent](https://github.com/TooTallNate/proxy-agents/tree/main/packages/socks-proxy-agent).

```js
import {MsEdgeTTS, OUTPUT_FORMAT} from "msedge-tts";
import {SocksProxyAgent} from 'socks-proxy-agent';

(async () => {
    const agent = new SocksProxyAgent("socks://your-name%40gmail.com:abcdef12345124@br41.nordvpn.com")
    const tts = new MsEdgeTTS(agent);
    await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
    const {audioStream} = await tts.toStream("Hi, how are you?");
})();
```

### Get sentence and word boundaries

```js
import {MsEdgeTTS, OUTPUT_FORMAT} from "msedge-tts";

(async () => {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS, {
        wordBoundaryEnabled: true,
        sentenceBoundaryEnabled: true
    });
    // as stream
    const {metadataStream} = await tts.toStream("Hi, how are you doing today hello hello hello?");
    /* ->
        {
          "Metadata": [
            {
              "Type": "SentenceBoundary",
              "Data": {
                "Offset": 1000000,
                "Duration": 35875000,
                "text": {
                  "Text": "Hi, how are you doing today hello hello hello?",
                  "Length": 46,
                  "BoundaryType": "SentenceBoundary"
                }
              }
            }
          ]
        }
     */
    // or as file
    const {metadataFilePath} = await tts.toFile("Hi, how are you?");
    /* ->
       {
          "Metadata": [
            <all metadata combined>
          ]
        }
     */
})();
```

## API

For the full documentation check out the [API Documentation](https://migushthe2nd.github.io/MsEdgeTTS).

This library only supports promises.
