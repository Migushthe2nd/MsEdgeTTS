# Speech Synthesis Markup Language (SSML) Document Structure and Events - Speech Service - Foundry Tools | Microsoft Learn

Speech Synthesis Markup Language (SSML), used together with input text, determines the structure, content, and other characteristics of text-to-speech output. For example, you can use SSML to define paragraphs, sentences, breaks/pauses, or silence. You can wrap text with event markers (such as bookmarks or visemes) that can be processed later by applications.

For more information on how to structure elements in an SSML document, see the following sections.

> **Note**
>
> In addition to Azure Neural (non-HD) voices in Foundry Tools, you can also use [Azure HD (High-Definition) Voices in Foundry Tools](high-definition-voices) and [Azure OpenAI Neural (HD and non-HD) Voices](openai-voices). HD voices provide higher quality for more diverse scenarios.

Certain voices do not support all [Speech Synthesis Markup Language (SSML)](speech-synthesis-markup-structure) tags. This includes Neural Text-to-Speech HD voices, Personal Voices, and Embedded Voices.

- For Azure HD voices, check SSML support [here](speech-synthesis-markup-voice).
- For Personal Voices, SSML support can be found [here](personal-voice-how-to-use#supported-and-unsupported-ssml-elements-for-personal-voice).
- For Embedded Voices, check SSML support [here](embedded-speech#embedded-voices-capabilities).

## Document Structure

The Speech Service implementation of SSML is based on the World Wide Web Consortium's [Speech Synthesis Markup Language Version 1.0](https://www.w3.org/TR/2004/REC-speech-synthesis-20040907/). The elements supported by Speech Service may differ from the W3C standard.

Each SSML document is created using SSML elements (or tags). These elements are used to adjust speech, style, syllables, prosody, volume, and more.

Below is a subset of the basic structure and syntax of an SSML document:

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="string">
    <mstts:backgroundaudio src="string" volume="string" fadein="string" fadeout="string"/>
    <mstts:voiceconversion url="string"/>
    <voice name="string" effect="string">
        <audio src="string"></audio>
        <bookmark mark="string"/>
        <break strength="string" time="string" />
        <emphasis level="value"></emphasis>
        <lang xml:lang="string"></lang>
        <lexicon uri="string"/>
        <math xmlns="http://www.w3.org/1998/Math/MathML"></math>
        <mstts:audioduration value="string"/>
        <mstts:ttsembedding speakerProfileId="string"></mstts:ttsembedding>
        <mstts:express-as style="string" styledegree="value" role="string"></mstts:express-as>
        <mstts:silence type="string" value="string"/>
        <mstts:viseme type="string"/>
        <p></p>
        <phoneme alphabet="string" ph="string"></phoneme>
        <prosody pitch="value" contour="value" range="value" rate="value" volume="value"></prosody>
        <s></s>
        <say-as interpret-as="string" format="string" detail="string"></say-as>
        <sub alias="string"></sub>
    </voice>
</speak>
```

The following list describes examples of some content allowed within each element:

- `audio`: If the audio file doesn't exist or can't be played, you can include speakable plain text or SSML tags in the body of the `audio` element. The `audio` element also contains text and the following elements: `audio`, `break`, `p`, `s`, `phoneme`, `prosody`, `say-as`, and `sub`.
- `bookmark`: This element cannot contain text or any other elements.
- `break`: This element cannot contain text or any other elements.
- `emphasis`: This element can contain text and the following elements: `audio`, `break`, `emphasis`, `lang`, `phoneme`, `prosody`, `say-as`, and `sub`.
- `lang`: This element can contain all other elements except `mstts:backgroundaudio`, `voice`, and `speak`.
- `lexicon`: This element cannot contain text or any other elements.
- `math`: This element can contain only text and MathML elements.
- `mstts:audioduration`: This element cannot contain text or any other elements.
- `mstts:backgroundaudio`: This element cannot contain text or any other elements.
- `<mstts:voiceconversion>`: This element cannot contain text or any other elements. It specifies the source audio URL for voice conversion.
- `mstts:embedding`: This element can contain text and the following elements: `audio`, `break`, `emphasis`, `lang`, `phoneme`, `prosody`, `say-as`, and `sub`.
- `mstts:express-as`: This element can contain text and the following elements: `audio`, `break`, `emphasis`, `lang`, `phoneme`, `prosody`, `say-as`, and `sub`.
- `mstts:silence`: This element cannot contain text or any other elements.
- `mstts:viseme`: This element cannot contain text or any other elements.
- `p`: This element can contain text and the following elements: `audio`, `break`, `phoneme`, `prosody`, `say-as`, `sub`, `mstts:express-as`, and `s`.
- `phoneme`: This element can contain only text and cannot contain any other elements.
- `prosody`: This element can contain text and the following elements: `audio`, `break`, `p`, `phoneme`, `prosody`, `say-as`, `sub`, and `s`.
- `s`: This element can contain text and the following elements: `audio`, `break`, `phoneme`, `prosody`, `say-as`, `mstts:express-as`, and `sub`.
- `say-as`: This element can contain only text and cannot contain any other elements.
- `sub`: This element can contain only text and cannot contain any other elements.
- `speak`: The root element of an SSML document. This element can contain the following elements: `mstts:backgroundaudio` and `voice`.
- `voice`: This element can contain all other elements except `mstts:backgroundaudio` and `speak`.

The Speech Service can automatically handle pauses appropriately (for example, pausing briefly after a period) or use the correct intonation for sentences ending with a question mark.

## Special Characters

To use the characters `&`, `<`, and `>` in the values or text of SSML elements, you must use entity formatting. Specifically, you must use `&amp;` instead of `&`, `&lt;` instead of `<`, and `&gt;` instead of `>`. Otherwise, the SSML will not be parsed correctly.

For example, specify `green &amp; yellow` instead of `green & yellow`. The following SSML will be parsed correctly:

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        My favorite colors are green &amp; yellow.
    </voice>
</speak>
```

Special characters such as quotation marks, apostrophes, and parentheses must be escaped. For more information, see [Extensible Markup Language (XML) 1.0: Appendix D](https://www.w3.org/TR/xml/#sec-entexpand).

Attribute values must be enclosed in double or single quotation marks. For example, `<prosody volume="90">` and `<prosody volume='90'>` are well-formed and valid elements, but `<prosody volume=90>` will not be recognized.

## Speak Root Element

The `speak` element contains information such as version, language, and markup vocabulary definitions. The `speak` element is the required root element for all SSML documents. You must specify the default language within the `speak` element, regardless of whether you adjust that language elsewhere, such as in the [`lang`](speech-synthesis-markup-voice#use-voice-elements) element.

Below is the syntax for the `speak` element:

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="string"></speak>
```

| Attribute | Description | Required or Optional |
| --- | --- | --- |
| `version` | Indicates the version of the SSML specification used to interpret the document markup. The current version is "1.0". | Required |
| `xml:lang` | The language of the root document. The value can contain a language code (such as `en` for English) or locale information such as `en-US` (English - United States). | Required |
| `xmlns` | The URI for the document that defines the markup vocabulary (element types and attribute names) of the SSML document. The current URI is "http://www.w3.org/2001/10/synthesis". | Required |

The `speak` element must contain at least one [voice element](speech-synthesis-markup-voice#use-voice-elements).

### Speak Examples

The following introduces the values supported by the `speak` element attributes.

#### Single Voice Example

This example uses the `en-US-Ava:DragonHDLatestNeural` voice. For more examples, see [Voice Examples](speech-synthesis-markup-voice#voice-examples).

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        This is the text that is spoken.
    </voice>
</speak>
```

## Adding Breaks

Use the `break` element to override the default break or pause behavior between words. Otherwise, the Speech Service will automatically insert pauses.

The following table describes the attribute usage for the `break` element.

| Attribute | Description | Required or Optional |
| --- | --- | --- |
| `strength` | The relative duration of the pause, using one of the following values:<br>- x-weak<br>- weak<br>- medium (default)<br>- strong<br>- x-strong | Optional |
| `time` | The absolute duration of the pause, in seconds (for example `2s`) or milliseconds (for example `500ms`). Valid values range from 0 to 20000 milliseconds. If the set value is greater than the supported maximum, the service will use `20000ms`. If the `time` attribute is set, the `strength` attribute is ignored. | Optional |

Below are more details about the `strength` attribute.

| Strength | Relative Duration |
| --- | --- |
| x-weak | 250 ms |
| weak | 500 ms |
| medium | 750 ms |
| strong | 1,000 ms |
| x-strong | 1,250 ms |

### Break Examples

The following introduces the values supported by the `break` element attributes. All three methods below add a 750ms break.

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        Welcome <break /> to text to speech.
        Welcome <break strength="medium" /> to text to speech.
        Welcome <break time="750ms" /> to text to speech.
    </voice>
</speak>
```

## Adding Silence

Use the `mstts:silence` element to add pauses before or after text, or between two adjacent sentences.

One difference between `mstts:silence` and `break` is that the `break` element can be inserted anywhere in the text. Silence applies only to the beginning or end of input text, or at the boundary between two adjacent sentences.

The silence setting applies to all input text within the `voice` element where it is located. To reset or change the silence setting again, you must use a new `voice` element containing the same or a different voice.

The following table describes the attribute usage for the `mstts:silence` element.

| Attribute | Description | Required or Optional |
| --- | --- | --- |
| `type` | Specifies where and how silence is added. The following silence types are supported:<br>- `Leading` – Additional silence at the beginning of text. The set value is added to the natural silence before the beginning of the text.<br>- `Leading-exact` – Silence at the beginning of text. The value is the absolute silence length.<br>- `Tailing` – Additional silence at the end of text. The set value is added to the natural silence after the last word.<br>- `Tailing-exact` – Silence at the end of text. The value is the absolute silence length.<br>- `Sentenceboundary` – Additional silence between adjacent sentences. The actual silence length for this type includes the natural silence after the last word of the previous sentence, the value set for this type, and the natural silence before the starting word of the next sentence.<br>- `Sentenceboundary-exact` – Silence between adjacent sentences. The value is the absolute silence length.<br>- `Comma-exact` – Silence at half-width or full-width commas. The value is the absolute silence length.<br>- `Semicolon-exact` – Silence at half-width or full-width semicolons. The value is the absolute silence length.<br>- `Enumerationcomma-exact` – Silence at full-width enumeration commas. The value is the absolute silence length.<br><br>Absolute silence types (with the `-exact` suffix) replace any other natural leading or trailing silence. Absolute silence types take precedence over their corresponding non-absolute types. For example, if both `Leading` and `Leading-exact` types are set, the `Leading-exact` type takes effect. [WordBoundary events](how-to-speech-synthesis#subscribe-to-synthesizer-events) take precedence over punctuation-related silence settings, including `Comma-exact`, `Semicolon-exact`, or `Enumerationcomma-exact`. When using both `WordBoundary` events and punctuation-related silence settings, the punctuation-related silence settings will not take effect. | Required |
| `value` | The pause duration, in seconds (for example `2s`) or milliseconds (for example `500ms`). Valid values range from 0 to 20000 milliseconds. If the set value is greater than the supported maximum, the service will use `20000ms`. | Required |

### MSTTS Silence Examples

The following introduces the values supported by the `mstts:silence` element attributes.

In this example, `mstts:silence` is used to add 200ms of silence between two sentences.

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
<voice name="en-US-Ava:DragonHDLatestNeural">
<mstts:silence  type="Sentenceboundary" value="200ms"/>
If we're home schooling, the best we can do is roll with what each day brings and try to have fun along the way.
A good place to start is by trying out the slew of educational apps that are helping children stay happy and smash their schooling at the same time.
</voice>
</speak>
```

In this example, `mstts:silence` is used to add 50ms of silence at commas, 100ms of silence at semicolons, and 150ms of silence at enumeration commas.

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="zh-CN">
<voice name="zh-CN-YunxiNeural">
<mstts:silence type="comma-exact" value="50ms"/><mstts:silence type="semicolon-exact" value="100ms"/><mstts:silence type="enumerationcomma-exact" value="150ms"/>你好呀，云希、晓晓；你好呀。
</voice>
</speak>
```

## Specifying Paragraphs and Sentences

The `p` and `s` elements are used to represent paragraphs and sentences, respectively. If these elements are missing, the Speech Service will automatically determine the structure of the SSML document.

### Paragraphs and Sentences Example

The following example defines two paragraphs, where each paragraph contains sentences. In the second paragraph, the Speech Service automatically determines the sentence structure because they are not explicitly defined in the SSML document.

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        <p>
            <s>Introducing the sentence element.</s>
            <s>Used to mark individual sentences.</s>
        </p>
        <p>
            Another simple paragraph.
            Sentence structure in this paragraph is not explicitly marked.
        </p>
    </voice>
</speak>
```

## Bookmark Element

You can use the `bookmark` element in SSML to reference specific positions in text or a sequence of tags. Then use the Speech SDK and subscribe to the `BookmarkReached` event to get the offset of each bookmark in the audio stream. The `bookmark` element is not spoken aloud. For more information, see [Subscribe to Synthesizer Events](how-to-speech-synthesis#subscribe-to-synthesizer-events).

The following table describes the attribute usage for the `bookmark` element.

| Attribute | Description | Required or Optional |
| --- | --- | --- |
| `mark` | The reference text for the `bookmark` element. | Required |

### Bookmark Example

The following introduces the values supported by the `bookmark` element attributes.

You might want to know the time offset of each flower-related word in the following code snippet:

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AvaNeural">
        We are selling <bookmark mark='flower_1'/>roses and <bookmark mark='flower_2'/>daisies.
    </voice>
</speak>
```

---

*This documentation is adapted from Microsoft Azure Speech Service official documentation. All SSML specifications and element descriptions are based on Microsoft's technical documentation.*
