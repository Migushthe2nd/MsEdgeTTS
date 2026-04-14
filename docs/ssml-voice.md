# Voice and Sounds in Speech Synthesis Markup Language (SSML) - Speech Service - Foundry Tools | Microsoft Learn

You can use Speech Synthesis Markup Language (SSML) to specify the voice, language, name, style, and role for text-to-speech output. You can also use multiple voices in a single SSML document and adjust stress, speech rate, pitch, and volume. Additionally, SSML allows insertion of pre-recorded audio, such as sound effects or musical notes.

This article describes how to use SSML elements to specify voice and sounds. For more information about SSML syntax, see [SSML document structure and events](speech-synthesis-markup-structure).

## Using the voice element

You must specify at least one `name` attribute in each SSML `voice` element. This attribute determines the voice used for text-to-speech.

You can include multiple `voice` elements in a single SSML document. Each `voice` element can specify a different voice. You can also use the same voice multiple times with different settings, for example, when [changing the duration of silence between sentences](speech-synthesis-markup-structure#add-silence).

The following table describes the usage of `voice` element attributes:

| Attribute | Description | Required or Optional |
| --- | --- | --- |
| `name` | The voice used for text-to-speech output. For a complete list of supported standard voices, see [Language support](language-support?tabs=tts). | Required |
| `effect` | Audio effect processor used to optimize the quality of synthesized speech output on devices for specific scenarios. In certain production scenarios, the listening experience may be degraded due to playback distortion on certain devices. For example, synthesized speech from car speakers may sound dull and muffled due to environmental factors such as speaker response, room reverberation, and background noise. Passengers may have to turn up the volume to hear more clearly. To avoid manual operation in this situation, the audio effect processor can make the voice clearer by compensating for playback distortion. The following values are supported:<br>- `eq_car` - Optimizes the listening experience when delivering high-fidelity speech in cars, buses, and other enclosed vehicles.<br>- `eq_telecomhp8k` - Optimizes the listening experience for narrowband speech in telecommunications or telephony scenarios. A sample rate of 8 kHz should be used. If the sample rate is not 8 kHz, the listening quality of the output speech will not be optimized.<br><br>If the value is missing or invalid, this attribute is ignored and no effect is applied. | Optional |

### Voice examples

#### Single voice example

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        This is the text that is spoken.
    </voice>
</speak>
```

#### Multiple voices example

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        Good morning!
    </voice>
    <voice name="en-US-Andrew:DragonHDLatestNeural">
        Good morning to you too Ava!
    </voice>
</speak>
```

#### Audio effect example

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AvaMultilingualNeural" effect="eq_car">
        This is the text that is spoken.
    </voice>
</speak>
```

#### Multi-speaker voice example

```xml
<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='en-US'>
    <voice name='en-US-MultiTalker-Ava-Andrew:DragonHDLatestNeural'>
        <mstts:dialog>
            <mstts:turn speaker="ava">Hello, Andrew! How's your day going?</mstts:turn>
            <mstts:turn speaker="andrew">Hey Ava! It's been great, just exploring some AI advancements in communication.</mstts:turn>
        </mstts:dialog>
    </voice>
</speak>
```

## Using speaking styles and roles

By default, neural voices use a neutral speaking style. You can adjust the speaking style, style intensity, and role at the sentence level.

The following table describes the usage of `mstts:express-as` element attributes:

| Attribute | Description | Required or Optional |
| --- | --- | --- |
| `style` | The speaking style for a specific voice. Can express emotions such as happiness, sympathy, and calmness. | Required |
| `styledegree` | The intensity of the speaking style. Acceptable values range from `0.01` to `2` (inclusive). Default value is `1`. | Optional |
| `role` | Role-playing when speaking. Voices can imitate different ages and genders. | Optional |

### Supported styles

| Style | Description |
| --- | --- |
| `advertisement_upbeat` | Promote products or services with an excited and energetic tone. |
| `affectionate` | Express warm and affectionate tone with higher pitch and volume. |
| `angry` | Express angry and disgusted tone. |
| `assistant` | Speak in a warm and relaxed tone, used for digital assistants. |
| `calm` | Speak with composure and calmness. |
| `chat` | Express a relaxed and casual tone. |
| `cheerful` | Express a positive and pleasant tone. |
| `customerservice` | Provide support to customers with a friendly and enthusiastic tone. |
| `depressed` | Express melancholy and depressed tone with lower pitch and volume. |
| `documentary-narration` | Narrate documentaries in a relaxed, interested, and informative style. |
| `empathetic` | Express care and understanding. |
| `excited` | Express an optimistic and hopeful tone. |
| `fearful` | Express fear with higher pitch, higher volume, and faster speech rate. |
| `friendly` | Express a pleasant, charming, and warm tone. |
| `gentle` | Express a mild, polite, and pleasant tone with lower pitch and volume. |
| `hopeful` | Speak in a warm and longing tone. |
| `lyrical` | Express emotions in a graceful and slightly sentimental way. |
| `narration-professional` | Read content in a professional and objective tone. |
| `narration-relaxed` | Speak in a soothing and pleasant tone, used for content narration. |
| `newscast` | Narrate news in a formal and professional tone. |
| `newscast-casual` | Deliver general news in a common, casual tone. |
| `newscast-formal` | Deliver news in a formal, confident, and authoritative tone. |
| `poetry-reading` | Express emotional and rhythmic tone when reading poetry. |
| `sad` | Express a sorrowful tone. |
| `serious` | Express a serious and commanding tone. |
| `shouting` | Sound as if speaking from a distance or in another location. |
| `sports_commentary` | Express a relaxed yet interested tone for broadcasting sports events. |
| `sports_commentary_excited` | Broadcast sports event highlights with a fast and energetic tone. |
| `terrified` | Express a fearful tone with fast speech rate and trembling voice. |
| `unfriendly` | Express a cold and indifferent tone. |
| `whispering` | Speak in a soft tone trying to produce a gentle and mild sound. |

### Supported roles

| Role | Description |
| --- | --- |
| `Girl` | Voice imitates a girl. |
| `Boy` | Voice imitates a boy. |
| `YoungAdultFemale` | Voice imitates a young adult female. |
| `YoungAdultMale` | Voice imitates a young adult male. |
| `OlderAdultFemale` | Voice imitates an older adult female. |
| `OlderAdultMale` | Voice imitates an older adult male. |
| `SeniorFemale` | Voice imitates an elderly female. |
| `SeniorMale` | Voice imitates an elderly male. |

### Style and style degree examples

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
    <voice name="zh-CN-XiaomoNeural">
        <mstts:express-as style="sad" styledegree="2">
            Hurry up, be careful on the road, and come back early.
        </mstts:express-as>
    </voice>
</speak>
```

### Role examples

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
    <voice name="zh-CN-XiaomoNeural">
        The daughter saw her father walk in and asked:
        <mstts:express-as role="YoungAdultFemale" style="calm">
            "You came pretty fast, how did you get here?"
        </mstts:express-as>
        The father put down his bag and said:
        <mstts:express-as role="OlderAdultMale" style="calm">
            "I just took a taxi, the traffic was smooth."
        </mstts:express-as>
    </voice>
</speak>
```

## Adjusting speaking language

Use the `<lang xml:lang>` element to adjust the speaking language for multilingual voices.

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        <lang xml:lang="de-DE">
            Wir freuen uns auf die Zusammenarbeit mit Ihnen!
        </lang>
    </voice>
</speak>
```

## Adjusting prosody

Use the `prosody` element to specify variations in pitch, intonation, range, speech rate, and volume.

| Attribute | Description |
| --- | --- |
| `contour` | Contour curve representing pitch variations. |
| `pitch` | Baseline pitch. Available values: `x-low`, `low`, `medium`, `high`, `x-high`, or relative values (e.g., `+20Hz`, `-2st`). |
| `range` | Pitch range. |
| `rate` | Speech rate. Available values: `x-slow`, `slow`, `medium`, `fast`, `x-fast`, or relative values (e.g., `+30%`). |
| `volume` | Volume level. Available values: `silent`, `x-soft`, `soft`, `medium`, `loud`, `x-loud`, or relative values (e.g., `+20`). |

### Prosody example

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        <prosody rate="+30.00%">
            Enjoy using text to speech.
        </prosody>
    </voice>
</speak>
```

## Adding recorded audio

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AvaMultilingualNeural">
        <audio src="https://contoso.com/opinionprompt.wav"/>
        Thanks for offering your opinion.
    </voice>
</speak>
```

## Adding background audio

```xml
<speak version="1.0" xml:lang="en-US" xmlns:mstts="http://www.w3.org/2001/mstts">
    <mstts:backgroundaudio src="https://contoso.com/sample.wav" volume="0.7" fadein="3000" fadeout="4000"/>
    <voice name="en-US-AvaMultilingualNeural">
        The text provided in this document are spoken over the background audio.
    </voice>
</speak>
```

## Voice conversion element

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
    <voice xml:lang="en-US" xml:gender="Female" name="en-US-AvaMultilingualNeural">
        <mstts:voiceconversion url="https://your.blob.core.windows.net/sourceaudio.wav"/>
    </voice>
</speak>
```

---

## Related Links

- [Microsoft Azure Speech Service Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/)
- [SSML Specification](https://www.w3.org/TR/speech-synthesis11/)
- [Language Support for Text-to-Speech](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support?tabs=tts)

---

*This documentation is translated from Microsoft official documentation. All rights reserved to Microsoft.*
