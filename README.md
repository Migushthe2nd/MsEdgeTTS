# MsEdgeTTS

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

const tts = new MsEdgeTTS();
await tts.setMetadata("en-US-AriaNeural", MsEdgeTTS.OUTPUT_FORMATS.WEBM_24KHZ_16BIT_MONO_OPUS);
const filePath = await tts.toFile("./example_audio.webm", "Hi, how are you?");
```

## API

This library only supports promises.

### Constructors

#### MsEdgeTTS(enableLogger: boolean = false)

Create a new `MsEdgeTTS` instance.  
**enableLogger** - whether to enable the built-in logger. This logs connections inits, disconnects, and incoming data to
the console.

### Methods

#### setMetadata(voiceName: string, outputFormat: OUTPUT_FORMAT, voiceLocale?: string)

Sets the required information for the speech to be synthesised and inits a new WebSocket connection. Must be called at
least once before text can be synthesised. Saved in this instance. Can be called at any time times to update the
metadata.

#### toFile(path: string, input: string): Promise<string>

Writes raw audio synthesised from text to a file. Uses a basic SML template.

#### toStream(input): stream.Readable

Writes raw audio synthesised from text in real-time to a `stream.Readable`. Uses a basic SML template.

#### rawToFile(path: string, requestSSML: string): Promise<string>

Writes raw audio synthesised from text to a file. Has no SSML template. Basic SSML should be provided in the request.

#### rawToStream(requestSSML): stream.Readable

Writes raw audio synthesised from a request in real-time to a `stream.Readable`. Has no SSML template. Basic SSML
should be provided in the request.

### Functions

#### MsEdgeTTS.getVoices()

Fetch the list of voices available in Microsoft Edge. These, however, are not all. The complete list of voices supported
by this
module [can be found here](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support) (
neural, standard, and preview).