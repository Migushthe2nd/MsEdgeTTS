# Pronunciation in Speech Synthesis Markup Language (SSML) - Speech Service - Foundry Tools | Microsoft Learn

Speech Synthesis Markup Language (SSML) can be used with text-to-speech to specify how speech should be pronounced. For example, SSML can be used with phonemes and custom dictionaries to improve pronunciation.

## Phoneme Element

The `phoneme` element is used for pronunciation in SSML documents. Always provide human-readable speech as a fallback.

| Attribute | Description | Required or Optional |
| --- | --- | --- |
| `alphabet` | Phonetic alphabet. Supported: `ipa`, `sapi`, `ups`, `x-sampa`. | Optional |
| `ph` | Phoneme string containing the pronunciation of the word. | Required |

### Phoneme Examples

Using the IPA alphabet:

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AvaNeural">
        <phoneme alphabet="ipa" ph="tə.ˈmeɪ.toʊ"> tomato </phoneme>
    </voice>
</speak>
```

Using the SAPI alphabet:

```xml
<speak version="1.0" xmlns="https://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AvaNeural">
        <phoneme alphabet="sapi" ph="iy eh n y uw eh s"> en-US </phoneme>
    </voice>
</speak>
```

Using the x-sampa alphabet:

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
     <voice name="en-US-AvaNeural">
        <phoneme alphabet='x-sampa' ph='he."lou'>hello</phoneme>
    </voice>
</speak>
```

## Custom Dictionary

Use the `lexicon` element to reference a custom dictionary XML file to define pronunciations for multiple entities.

| Attribute | Description | Required or Optional |
| --- | --- | --- |
| `uri` | URI of the custom dictionary XML file (`.xml` or `.pls`). | Required |

### Custom Dictionary Example

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
          xmlns:mstts="http://www.w3.org/2001/mstts"
          xml:lang="en-US">
    <voice name="en-US-AvaNeural">
        <lexicon uri="https://www.example.com/customlexicon.xml"/>
        BTW, we will be there probably at 8:00 tomorrow morning.
    </voice>
</speak>
```

### Custom Dictionary File Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<lexicon version="1.0"
      xmlns="http://www.w3.org/2005/01/pronunciation-lexicon"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      alphabet="ipa" xml:lang="en-US">
    <lexeme>
        <grapheme>BTW</grapheme>
        <alias>By the way</alias>
    </lexeme>
    <lexeme>
        <grapheme>Benigni</grapheme>
        <phoneme>bɛˈniːnji</phoneme>
    </lexeme>
    <lexeme>
        <grapheme>😀</grapheme>
        <alias>test emoji</alias>
    </lexeme>
</lexicon>
```

**Limitations**:
- Maximum file size: 100 KB
- Dictionary cache refreshes every 15 minutes
- One locale per dictionary

## Say-as Element

Indicates the content type of the element text (such as numbers, dates, etc.).

| Attribute | Description | Required or Optional |
| --- | --- | --- |
| `interpret-as` | Content type. Supported: `characters`, `cardinal`, `ordinal`, `date`, `time`, `currency`, `telephone`, etc. | Required |
| `format` | Exact format (such as `mdy`, `hms12`, etc.). | Optional |
| `detail` | Level of detail for reading. | Optional |

### Say-as Examples

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        <p>
        Your <say-as interpret-as="ordinal"> 1st </say-as> request was for <say-as interpret-as="cardinal"> 1 </say-as> room
        on <say-as interpret-as="date" format="mdy"> 10/19/2010 </say-as>, 
        with early arrival at <say-as interpret-as="time" format="hms12"> 12:35pm </say-as>.
        </p>
    </voice>
</speak>
```

### Supported interpret-as Values

| interpret-as | Description |
| --- | --- |
| `characters`, `spell-out` | Spell out letter by letter |
| `alphanumeric` | Alphanumeric mixed spelling |
| `cardinal`, `number` | Cardinal numbers |
| `ordinal` | Ordinal numbers |
| `number_digit` | Sequence of individual digits |
| `fraction` | Fractions |
| `date` | Dates |
| `time` | Time |
| `duration` | Duration |
| `telephone` | Phone numbers |
| `currency` | Currency |
| `unit` | Units of measurement |
| `address` | Addresses |
| `name` | Personal names |

## Sub Element

Use the `sub` element to specify alias text to replace the original element text.

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        <sub alias="World Wide Web Consortium">W3C</sub>
    </voice>
</speak>
```

## Reading Mathematical Expressions

### Method 1: Plain Text Mathematical Expressions

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
    <voice name="en-US-AvaMultilingualNeural">
       <mstts:prompt domain="Math" />
       x = (-b ± √(b² - 4ac)) / 2a
    </voice>
</speak>
```

Read out parentheses:

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
    <voice name="en-US-AvaMultilingualNeural">
       <mstts:prompt domain="Math" /><mstts:mathspeechverbosity level="verbose" />
       x = (-b ± √(b² - 4ac)) / 2a
    </voice>
</speak>
```

### Method 2: Using MathML

```xml
<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'>
    <voice name='en-US-JennyNeural'>
        <math xmlns='http://www.w3.org/1998/Math/MathML'>
            <msup>
                <mi>a</mi>
                <mn>2</mn>
            </msup>
            <mo>+</mo>
            <msup>
                <mi>b</mi>
                <mn>2</mn>
            </msup>
            <mo>=</mo>
            <msup>
                <mi>c</mi>
                <mn>2</mn>
            </msup>
        </math>
    </voice>
</speak>
```

Output: "a squared plus b squared equals c squared"

---

**Note**: This documentation is based on Microsoft's official SSML documentation. For the most up-to-date information, please refer to the [Microsoft Azure Speech Service documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/speech-synthesis-markup-pronunciation).

© Microsoft Corporation. All rights reserved.
