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

---

## Complete API Reference

### Class: `MsEdgeTTS`

Main TTS class for speech synthesis via WebSocket.

#### Constructor

```ts
new MsEdgeTTS(options?: Options)
```

**Options:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agent` | `Agent` | `undefined` | Custom HTTP agent (proxy support, **not supported in browser**) |
| `enableLogger` | `boolean` | `false` | Enable built-in logger for connection status |

#### Methods

##### `getVoices(): Promise<Voice[]>`

Fetch the list of voices available in Microsoft Edge.

**Returns:** Array of voice objects with properties:
- `Name`: Full voice name
- `ShortName`: Short identifier (e.g., `"en-US-AriaNeural"`)
- `Gender`: `"Male"` or `"Female"`
- `Locale`: Voice locale (e.g., `"en-US"`)
- `SuggestedCodec`: Recommended codec
- `FriendlyName`: Display name
- `Status`: Voice status

**Example:**
```ts
const tts = new MsEdgeTTS();
const voices = await tts.getVoices();
console.log(voices.filter(v => v.Gender === "Female"));
```

---

##### `setMetadata(voiceName, outputFormat, metadataOptions?): Promise<void>`

Initialize speech synthesis parameters. **Must be called before `toStream` or `toFile`.**

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `voiceName` | `string` | ✅ | Voice ShortName (e.g., `"en-US-AriaNeural"`) |
| `outputFormat` | `OUTPUT_FORMAT` | ✅ | Audio output format |
| `metadataOptions` | `MetadataOptions` | ❌ | Boundary metadata options |

**MetadataOptions:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `voiceLocale` | `string` | Auto-inferred | Voice locale override |
| `sentenceBoundaryEnabled` | `boolean` | `false` | Enable sentence boundary metadata |
| `wordBoundaryEnabled` | `boolean` | `false` | Enable word boundary metadata |

**Example:**
```ts
await tts.setMetadata(
  "en-US-AriaNeural",
  OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS,
  { wordBoundaryEnabled: true, sentenceBoundaryEnabled: true }
);
```

---

##### `toStream(input, options?): { audioStream: Readable, metadataStream: Readable | null }`

Synthesize text to audio stream (real-time).

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | `string` | ✅ | Text or SSML to synthesize |
| `options` | `ProsodyOptions` | ❌ | Voice prosody settings |

**Returns:**
- `audioStream`: Node.js Readable stream with raw audio data
- `metadataStream`: Readable stream with boundary metadata (if enabled)

**Example:**
```ts
const { audioStream, metadataStream } = await tts.toStream("Hello world", {
  rate: RATE.FAST,
  pitch: "+10Hz",
  volume: VOLUME.LOUD
});

audioStream.on("data", (data) => {
  console.log("Audio chunk:", data);
});

metadataStream?.on("data", (chunk) => {
  const metadata = JSON.parse(chunk.toString());
  console.log("Metadata:", metadata);
});
```

---

##### `toFile(dirPath, input, options?): Promise<{ audioFilePath: string, metadataFilePath: string | null }>`

Synthesize text and save to file.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dirPath` | `string` | ✅ | Output directory path |
| `input` | `string` | ✅ | Text or SSML to synthesize |
| `options` | `ProsodyOptions` | ❌ | Voice prosody settings |

**Example:**
```ts
const { audioFilePath, metadataFilePath } = await tts.toFile(
  "./output",
  "Hello world",
  { rate: 0.8 }
);
console.log("Saved to:", audioFilePath);
```

---

##### `toStreamDialogue(dialogue): { audioStream: Readable, metadataStream: Readable | null }`

Synthesize multi-speaker dialogue to stream.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dialogue` | `Dialogue | DialogueTurn[]` | ✅ | Dialogue object or array of turns |

**Example:**
```ts
const dialogue = new DialogueBuilder()
  .addTurn({ voice: "zh-CN-XiaoxiaoNeural", text: "你好", style: "cheerful" })
  .addTurn({ voice: "en-US-AndrewNeural", text: "Hello", lang: "en-US" })
  .build();

const { audioStream } = await tts.toStreamDialogue(dialogue);
```

---

##### `toFileDialogue(dirPath, dialogue, options?): Promise<{ audioFilePath: string, metadataFilePath: string | null }>`

Synthesize multi-speaker dialogue and save to file.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dirPath` | `string` | ✅ | Output directory path |
| `dialogue` | `Dialogue | DialogueTurn[]` | ✅ | Dialogue object or array of turns |
| `options` | `ProsodyOptions` | ❌ | Global prosody settings |

---

##### `rawToStream(requestSSML): { audioStream: Readable, metadataStream: Readable | null }`

Synthesize custom SSML to stream (no template applied).

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `requestSSML` | `string` | ✅ | Complete SSML string |

**Example:**
```ts
const customSSML = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="en-US-AriaNeural">
    <prosody rate="1.2" pitch="+10Hz">
      Hello world
    </prosody>
  </voice>
</speak>`;

const { audioStream } = await tts.rawToStream(customSSML);
```

---

##### `rawToFile(dirPath, requestSSML): Promise<{ audioFilePath: string, metadataFilePath: string | null }>`

Synthesize custom SSML and save to file.

---

##### `close(): void`

Close the WebSocket connection.

---

### Enum: `OUTPUT_FORMAT`

Supported audio output formats.

| Format | Codec | Bitrate | Extension | Use Case |
|--------|-------|---------|-----------|----------|
| `AUDIO_24KHZ_48KBITRATE_MONO_MP3` | MP3 | 48 kbps | `.mp3` | Standard quality |
| `AUDIO_24KHZ_96KBITRATE_MONO_MP3` | MP3 | 96 kbps | `.mp3` | High quality |
| `WEBM_24KHZ_16BIT_MONO_OPUS` | OPUS | ~64 kbps | `.webm` | Web streaming |

**Usage:**
```ts
import { OUTPUT_FORMAT } from "msedge-tts";

await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
```

---

### Class: `ProsodyOptions`

Voice prosody configuration.

```ts
class ProsodyOptions {
  pitch?: PITCH | string = "+0Hz"
  rate?: RATE | string | number = 1.0
  volume?: VOLUME | string | number = 100.0
}
```

#### Properties

##### `pitch`

Baseline pitch for the voice.

**Accepted values:**
- `PITCH` enum: `X_LOW`, `LOW`, `MEDIUM`, `HIGH`, `X_HIGH`, `DEFAULT`
- Relative frequency: `"+50Hz"`, `"-20Hz"`
- Relative semitones: `"+2st"`, `"-3st"`
- Relative percentage: `"+50%"`, `"-25%"`

**Default:** `"+0Hz"`

---

##### `rate`

Speaking rate for the voice.

**Accepted values:**
- `RATE` enum: `X_SLOW`, `SLOW`, `MEDIUM`, `FAST`, `X_FAST`, `DEFAULT`
- Relative number: `0.5` (50%), `2.0` (200%)
- Relative percentage string: `"+50%"`, `"-25%"`

**Default:** `1.0` (normal speed)

---

##### `volume`

Volume level for the voice.

**Accepted values:**
- `VOLUME` enum: `SILENT`, `X_SOFT`, `SOFT`, `MEDIUM`, `LOUD`, `X_LOUD`, `DEFAULT`
- Absolute number: `0` to `100`
- Relative number: `"+10"`, `"-20"`
- Relative percentage: `"+50%"`, `"-30%"`

**Default:** `100.0`

---

### Enum: `RATE`

Speaking rate presets.

| Value | Description |
|-------|-------------|
| `X_SLOW` | Extra slow (0.3x) |
| `SLOW` | Slow (0.5x) |
| `MEDIUM` | Medium (0.8x) |
| `DEFAULT` | Normal (1.0x) |
| `FAST` | Fast (1.5x) |
| `X_FAST` | Extra fast (2.0x) |

---

### Enum: `PITCH`

Pitch presets.

| Value | Description |
|-------|-------------|
| `X_LOW` | Extra low |
| `LOW` | Low |
| `MEDIUM` | Medium |
| `DEFAULT` | Normal |
| `HIGH` | High |
| `X_HIGH` | Extra high |

---

### Enum: `VOLUME`

Volume presets.

| Value | Description |
|-------|-------------|
| `SILENT` | Silent |
| `X_SOFT` | Extra soft |
| `SOFT` | Soft |
| `MEDIUM` | Medium |
| `LOUD` | Loud |
| `X_LOUD` | Extra loud |

---

### Interface: `DialogueTurn`

Single speaker turn in a multi-speaker dialogue.

```ts
interface DialogueTurn {
  speaker?: string           // Optional speaker name
  voice: string              // Voice ShortName (required)
  text?: string              // Text content
  children?: TextSegment[]   // Child text segments
  style?: string             // Emotional style
  styleDegree?: number       // Style intensity (0.01-2.0)
  lang?: string              // Language override (e.g., "en-US")
  substitutions?: Substitution[]  // Text replacements
}
```

---

### Interface: `TextSegment`

Text segment with language or substitution.

```ts
interface TextSegment {
  text: string
  lang?: string            // Language for this segment
  substitution?: string    // Custom SSML substitution
}
```

---

### Interface: `Substitution`

Text substitution for pronunciation.

```ts
interface Substitution {
  text: string     // Text to replace
  alias: string    // Replacement text (or pronunciation)
}
```

**Example:**
```ts
{
  text: "W3C",
  alias: "World Wide Web Consortium"
}
```

---

### Class: `DialogueBuilder`

Chainable builder for multi-speaker dialogues.

```ts
class DialogueBuilder {
  constructor()
  addTurn(turn: DialogueTurn): DialogueBuilder
  build(): Dialogue
  reset(): DialogueBuilder
}
```

**Example:**
```ts
const dialogue = new DialogueBuilder()
  .addTurn({ voice: "zh-CN-XiaoxiaoNeural", text: "你好", style: "friendly" })
  .addTurn({ voice: "en-US-AndrewNeural", text: "Hello", lang: "en-US" })
  .build();
```

---

### Function: `buildDialogueSSML(turns: DialogueTurn[]): string`

Functional API to build SSML from dialogue turns.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `turns` | `DialogueTurn[]` | Array of dialogue turns |

**Returns:** Complete SSML string

**Example:**
```ts
const ssml = buildDialogueSSML([
  { voice: "zh-CN-XiaoxiaoNeural", text: "你好" },
  { voice: "en-US-AndrewNeural", text: "Hello", lang: "en-US" }
]);
```

---

### Function: `escapeSSML(text: string): string`

Escape special XML characters in text.

**Escapes:**
- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&apos;`

**Example:**
```ts
escapeSSML("Tom & Jerry <Cat>") 
// Returns: "Tom &amp; Jerry &lt;Cat&gt;"
```

---

### Function: `validateStyle(style: string): void`

Validate emotional style name. Throws `Error` if invalid.

**Valid styles:** All 28 Microsoft official styles (see table above)

---

### Function: `validateStyleDegree(degree: number): void`

Validate style intensity range. Throws `Error` if outside 0.01-2.0.

---

## Error Handling

### Common Errors

#### 1. Metadata Not Configured

```ts
// ❌ Wrong: Calling toStream without setMetadata
const { audioStream } = await tts.toStream("Hello");
// Throws: "Speech synthesis not configured yet..."

// ✅ Correct:
await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
const { audioStream } = await tts.toStream("Hello");
```

---

#### 2. Invalid Voice Name

```ts
// ❌ Wrong: Invalid voice name
await tts.setMetadata("invalid-voice", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
// May throw: "Could not infer voiceLocale from voiceName..."

// ✅ Correct: Use valid ShortName from getVoices()
const voices = await tts.getVoices();
const validVoice = voices[0].ShortName;
await tts.setMetadata(validVoice, OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
```

---

#### 3. Invalid Style Name

```ts
import { buildDialogueSSML } from "msedge-tts";

// ❌ Wrong: Invalid style
const ssml = buildDialogueSSML([
  { voice: "zh-CN-XiaoxiaoNeural", text: "Hello", style: "invalid-style" }
]);
// Throws: 'Invalid style "invalid-style". Valid styles: ...'

// ✅ Correct: Use valid style
const ssml = buildDialogueSSML([
  { voice: "zh-CN-XiaoxiaoNeural", text: "Hello", style: "cheerful" }
]);
```

---

#### 4. Invalid styleDegree Range

```ts
// ❌ Wrong: Out of range
const ssml = buildDialogueSSML([
  { voice: "zh-CN-XiaoxiaoNeural", text: "Hello", style: "sad", styleDegree: 5.0 }
]);
// Throws: 'styleDegree must be between 0.01 and 2.0'

// ✅ Correct: Within range 0.01-2.0
const ssml = buildDialogueSSML([
  { voice: "zh-CN-XiaoxiaoNeural", text: "Hello", style: "sad", styleDegree: 1.5 }
]);
```

---

#### 5. No Audio Data Received

```ts
// May occur if:
// - Network connection lost
// - Invalid SSML syntax
// - Voice service unavailable

try {
  await tts.toFile("./output", "Hello");
} catch (error) {
  console.error("Generation failed:", error.message);
  // Handle: "No audio data received"
}
```

---

## Performance Optimization

### 1. Reuse MsEdgeTTS Instance

```ts
// ❌ Inefficient: Create new instance for each request
for (const text of texts) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, format);
  await tts.toFile(`./output/${i}.mp3`, text);
}

// ✅ Efficient: Reuse instance
const tts = new MsEdgeTTS();
await tts.setMetadata(voice, format);
for (const text of texts) {
  await tts.toFile(`./output/${i}.mp3`, text);
}
```

---

### 2. Batch Dialogue Turns

```ts
// ❌ Inefficient: Separate requests
await tts.toFile("./output/1.mp3", buildDialogueSSML([turn1]));
await tts.toFile("./output/2.mp3", buildDialogueSSML([turn2]));

// ✅ Efficient: Single request
await tts.toFile("./output/combined.mp3", buildDialogueSSML([turn1, turn2, turn3]));
```

---

### 3. Use Appropriate Bitrate

| Use Case | Recommended Format |
|----------|-------------------|
| Podcast/Audiobook | `AUDIO_24KHZ_96KBITRATE_MONO_MP3` |
| Voice Assistant | `AUDIO_24KHZ_48KBITRATE_MONO_MP3` |
| Web Streaming | `WEBM_24KHZ_16BIT_MONO_OPUS` |

---

### 4. Enable Logger for Debugging

```ts
const tts = new MsEdgeTTS({ enableLogger: true });
// Logs: connection status, message exchange, disconnection
```

---

## FAQ

### Q: Can I use this library in the browser?

**A:** No. As of December 2025, the API requires a Microsoft Edge User-Agent, which browsers other than Edge cannot provide. Use this library in server-side Node.js environments only.

---

### Q: How do I get a list of all available voices?

**A:** Use the `getVoices()` method:

```ts
const tts = new MsEdgeTTS();
const voices = await tts.getVoices();
console.log(voices.map(v => ({ name: v.ShortName, gender: v.Gender, locale: v.Locale })));
```

---

### Q: Can I mix multiple languages in one dialogue?

**A:** Yes! Use the `lang` property in `DialogueTurn`:

```ts
const ssml = buildDialogueSSML([
  { voice: "zh-CN-XiaoxiaoNeural", text: "Welcome to our meeting", style: "friendly" },
  { voice: "zh-CN-XiaoxiaoNeural", text: "欢迎参加我们的会议", lang: "zh-CN" },
  { voice: "en-US-AndrewNeural", text: "Today we will discuss AI", lang: "en-US" }
]);
```

---

### Q: How do I change the speaking speed?

**A:** Use the `rate` option:

```ts
// Using preset
await tts.toStream("Hello", { rate: RATE.FAST });

// Using custom value (0.5 = 50% speed, 2.0 = 200% speed)
await tts.toStream("Hello", { rate: 0.75 });

// Using percentage string
await tts.toStream("Hello", { rate: "+50%" }); // 150% speed
```

---

### Q: What is the maximum text length for synthesis?

**A:** Microsoft Azure Speech Service has a limit of approximately 1000 characters per request. For longer texts:
1. Split into multiple requests
2. Use `DialogueBuilder` to chain segments
3. Concatenate audio files post-synthesis

---

### Q: How do I use a proxy?

**A:** Pass a custom HTTP agent:

```ts
import { SocksProxyAgent } from 'socks-proxy-agent';
import { MsEdgeTTS } from "msedge-tts";

const agent = new SocksProxyAgent("socks://user:pass@proxy-host:port");
const tts = new MsEdgeTTS({ agent });
await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
```

---

### Q: Why am I getting "No audio data received"?

**A:** Common causes:
1. **Network issues**: Check internet connection
2. **Invalid SSML**: Verify SSML syntax
3. **Voice service down**: Try a different voice
4. **Rate limiting**: Wait and retry

---

## Changelog

### Version 2.0.4 (Current)

**Features:**
- ✅ Multi-speaker dialogue support (`DialogueBuilder`, `buildDialogueSSML`)
- ✅ 28 emotional styles with intensity control (0.01-2.0)
- ✅ Text substitution (`<sub alias>` tags)
- ✅ Multi-language mixing (`<lang xml:lang>` tags)
- ✅ Sentence/word boundary metadata
- ✅ Proxy support via custom HTTP agent
- ✅ 3 audio output formats (MP3 48/96 kbps, WEBM OPUS)

**Breaking Changes:**
- ⚠️ December 2025: API now requires Edge User-Agent (browser support dropped)

**Dependencies:**
- `axios`: ^1.11.0
- `isomorphic-ws`: ^5.0.0
- `ws`: ^8.14.1
- `buffer`: ^6.0.3
- `stream-browserify`: ^3.0.0

---

## Related Projects

- [Azure Speech Service Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/)
- [SSML Specification](https://www.w3.org/TR/speech-synthesis11/)
- [Microsoft Edge Read Aloud API](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/rest-text-to-speech)

---

## License

MIT License - See LICENSE file for details.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/Migushthe2nd/MsEdgeTTS/issues)
- **npm**: [msedge-tts](https://www.npmjs.com/package/msedge-tts)
- **Documentation**: [API Docs](https://migushthe2nd.github.io/MsEdgeTTS)
