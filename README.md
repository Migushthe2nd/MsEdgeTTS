# MsEdgeTTS
[![npm version](https://badge.fury.io/js/msedge-tts.svg)](https://badge.fury.io/js/msedge-tts)

**[Update Dec 2025]**  
The Read Aloud API now requires a user agent matching the Microsoft Edge browser, and thus will not work in browsers other than Microsoft Edge.
It will of course still work in any server-side runtime.

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

### Connection and synthesis deadlines

```js
const tts = new MsEdgeTTS({
    connectionTimeoutMs: 10000,
    synthesisTimeoutMs: 60000,
});
```

These are the defaults in milliseconds; set either to `0` to disable it. Values must be integers between `0` and `2147483647`.
The connection deadline bounds the WebSocket handshake, including any clock-correction retry, and rejects `setMetadata()` or a pending synthesis request if it expires.
The synthesis deadline applies separately to each request: it starts when SSML is sent and resets when that request receives activity, so it does not limit the total audio duration.
A synthesis timeout emits an `error` on its audio stream (handle it with `audioStream.on("error", ...)`), closes its metadata stream, and rejects `toFile()`/`rawToFile()`; other requests can continue on the same connection.

In Node.js, a handshake rejected with HTTP 403 and a valid server `Date` is retried once using the server's time for authentication. The correction is shared across instances and does not change the machine's clock. Browsers cannot expose these handshake headers, so automatic clock correction is unavailable there.

### Write to file

```js
import {MsEdgeTTS, OUTPUT_FORMAT} from "msedge-tts";

(async () => {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
    const {audioFilePath} = await tts.toFile("./tmpfolder", "Hi, how are you?");  
})();
```

The directory passed to `toFile()` must already exist. The audio is always saved as `audio.<extension>` (for example `audio.webm`), plus `metadata.json` when sentence or word boundaries are enabled, so calling `toFile()` again with the same directory overwrites the previous files. To choose your own file name, use `toStream()` and pipe `audioStream` to a file instead.

### Change voice rate, pitch and volume
```js
import {MsEdgeTTS, OUTPUT_FORMAT} from "msedge-tts";

(async () => {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
    const {audioStream} = await tts.toStream("Hi, how are you?", {rate: 0.5, pitch: "+200Hz"});
})();
```

Prosody options are passed per request as the second argument to `toStream()` or the third argument to `toFile()`. `setMetadata()` only accepts `MetadataOptions`, so rate, pitch or volume values passed to it are ignored.

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
    const {metadataFilePath} = await tts.toFile("./tmpfolder", "Hi, how are you?");
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
