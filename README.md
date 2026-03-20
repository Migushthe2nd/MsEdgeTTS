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

## Multi-Speaker Dialogue

Supports multi-speaker dialogue synthesis, making it easy to create audio content containing multiple voice characters.

### Simple Example (Functional)

Quickly build dialogue using the `buildDialogueSSML()` utility function:

```js
import {MsEdgeTTS, OUTPUT_FORMAT, buildDialogueSSML} from "msedge-tts";

(async () => {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("zh-CN-XiaoxiaoNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
    
    const ssml = buildDialogueSSML([
        { voice: "zh-CN-XiaoxiaoNeural", text: "Hello", style: "cheerful" },
        { voice: "en-US-AndrewNeural", text: "Hello", lang: "en-US" }
    ]);
    
    const {audioStream} = await tts.toStream(ssml);
    
    audioStream.on("data", (data) => {
        console.log("DATA RECEIVED", data);
    });
})();
```

### Chained Call Example

Build dialogue in a chained manner using the `DialogueBuilder` class:

```js
import {MsEdgeTTS, OUTPUT_FORMAT, DialogueBuilder} from "msedge-tts";

(async () => {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("zh-CN-XiaoxiaoNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
    
    const dialogue = new DialogueBuilder()
        .addTurn({ voice: "zh-CN-XiaoxiaoNeural", text: "Hello everyone!" })
        .addTurn({ voice: "en-US-AndrewNeural", text: "Hi everyone!" })
        .build();
    
    const {audioStream} = await tts.toStreamDialogue(dialogue);
    
    audioStream.on("data", (data) => {
        console.log("DATA RECEIVED", data);
    });
})();
```

### Chinese-English Mixed Example

Supports mixing multiple languages within the same dialogue:

```js
import {MsEdgeTTS, OUTPUT_FORMAT, buildDialogueSSML} from "msedge-tts";

(async () => {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("zh-CN-XiaoxiaoNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
    
    const ssml = buildDialogueSSML([
        { 
            voice: "zh-CN-XiaoxiaoNeural", 
            text: "Welcome to our meeting",
            style: "friendly"
        },
        { 
            voice: "en-US-AndrewNeural", 
            text: "Welcome to our conference",
            style: "friendly",
            lang: "en-US"
        },
        {
            voice: "zh-CN-YunxiNeural",
            text: "Today we will discuss the future of artificial intelligence",
            style: "documentary-narration"
        }
    ]);
    
    const {audioStream} = await tts.toStream(ssml);
    
    audioStream.on("data", (data) => {
        console.log("DATA RECEIVED", data);
    });
})();
```

### Supported Emotional Styles

Microsoft Azure Speech Service officially supports the following 28 emotional styles:

| Style | Description |
| --- | --- |
| `advertisement_upbeat` | Promote products or services with an excited and energetic tone |
| `affectionate` | Express warm and affectionate tone with higher pitch and volume |
| `angry` | Express angry and disgusted tone |
| `assistant` | Speak in a warm and relaxed tone, used for digital assistants |
| `calm` | Speak with composure and calmness |
| `chat` | Express a relaxed and casual tone |
| `cheerful` | Express a positive and pleasant tone |
| `customerservice` | Provide support to customers with a friendly and enthusiastic tone |
| `depressed` | Express melancholy and depressed tone with lower pitch and volume |
| `documentary-narration` | Narrate documentaries in a relaxed, interested, and informative style |
| `empathetic` | Express care and understanding |
| `excited` | Express an optimistic and hopeful tone |
| `fearful` | Express fear with higher pitch, higher volume, and faster speech rate |
| `friendly` | Express a pleasant, charming, and warm tone |
| `gentle` | Express a mild, polite, and pleasant tone with lower pitch and volume |
| `hopeful` | Speak in a warm and longing tone |
| `lyrical` | Express emotions in a graceful and slightly sentimental way |
| `narration-professional` | Read content in a professional and objective tone |
| `narration-relaxed` | Speak in a soothing and pleasant tone, used for content narration |
| `newscast` | Narrate news in a formal and professional tone |
| `newscast-casual` | Deliver general news in a common, casual tone |
| `newscast-formal` | Deliver news in a formal, confident, and authoritative tone |
| `poetry-reading` | Express emotional and rhythmic tone when reading poetry |
| `sad` | Express a sorrowful tone |
| `serious` | Express a serious and commanding tone |
| `shouting` | Sound as if speaking from a distance or in another location |
| `sports_commentary` | Express a relaxed yet interested tone for broadcasting sports events |
| `sports_commentary_excited` | Broadcast sports event highlights with a fast and energetic tone |
| `terrified` | Express a fearful tone with fast speech rate and trembling voice |
| `unfriendly` | Express a cold and indifferent tone |
| `whispering` | Speak in a soft tone trying to produce a gentle and mild sound |

### Using Style Degree

You can adjust the emotional intensity through the `styleDegree` parameter (range: 0.01 to 2.0, default is 1):

```js
const ssml = buildDialogueSSML([
    { 
        voice: "zh-CN-XiaomoNeural", 
        text: "Hurry up, be careful on the road",
        style: "sad",
        styleDegree: 2.0  // Stronger sadness emotion
    }
]);
```

For more detailed information, please refer to the [Microsoft official documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/speech-synthesis-markup-voice).
