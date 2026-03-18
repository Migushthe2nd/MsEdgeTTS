# 语音合成标记语言 (SSML) 的发音 - 语音服务 - Foundry Tools | Microsoft Learn

可以将语音合成标记语言 (SSML) 与 text to speech 一起使用，以指定语音的发音方式。 例如，可以将 SSML 与音素和自定义词典配合使用来改进发音。

## 音素元素

`phoneme` 元素用于 SSML 文档中的发音。 始终提供人类可读的语音作为备用方案。

| Attribute | 说明 | 必需还是可选 |
| --- | --- | --- |
| `alphabet` | 音标字母表。 支持：`ipa`, `sapi`, `ups`, `x-sampa`。 | 可选 |
| `ph` | 包含用于指定单词发音的音素字符串。 | 必选 |

### 音素示例

使用 IPA 字母表：

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AvaNeural">
        <phoneme alphabet="ipa" ph="tə.ˈmeɪ.toʊ"> tomato </phoneme>
    </voice>
</speak>
```

使用 SAPI 字母表：

```xml
<speak version="1.0" xmlns="https://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AvaNeural">
        <phoneme alphabet="sapi" ph="iy eh n y uw eh s"> en-US </phoneme>
    </voice>
</speak>
```

使用 x-sampa 字母表：

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
     <voice name="en-US-AvaNeural">
        <phoneme alphabet='x-sampa' ph='he."lou'>hello</phoneme>
    </voice>
</speak>
```

## 自定义词典

使用 `lexicon` 元素引用自定义词典 XML 文件来定义多个实体的发音。

| Attribute | 说明 | 必需还是可选 |
| --- | --- | --- |
| `uri` | 自定义词典 XML 文件的 URI（`.xml` 或 `.pls`）。 | 必选 |

### 自定义词典示例

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

### 自定义词典文件格式

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

**限制**:
- 文件大小最大 100 KB
- 词典缓存 15 分钟刷新
- 一个词典仅限一种区域设置

## Say-as 元素

指示元素文本的内容类型（如数字、日期等）。

| Attribute | 说明 | 必需还是可选 |
| --- | --- | --- |
| `interpret-as` | 内容类型。 支持：`characters`, `cardinal`, `ordinal`, `date`, `time`, `currency`, `telephone` 等。 | 必选 |
| `format` | 精确格式（如 `mdy`, `hms12` 等）。 | 可选 |
| `detail` | 朗读细节层次。 | 可选 |

### Say-as 示例

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

### 支持的 interpret-as 值

| interpret-as | 说明 |
| --- | --- |
| `characters`, `spell-out` | 逐字母拼写 |
| `alphanumeric` | 字母数字混合拼写 |
| `cardinal`, `number` | 基数 |
| `ordinal` | 序数 |
| `number_digit` | 单个数字序列 |
| `fraction` | 分数 |
| `date` | 日期 |
| `time` | 时间 |
| `duration` | 持续时间 |
| `telephone` | 电话号码 |
| `currency` | 货币 |
| `unit` | 单位 |
| `address` | 地址 |
| `name` | 人名 |

## Sub 元素

使用 `sub` 元素指定别名文本代替原元素文本。

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        <sub alias="World Wide Web Consortium">W3C</sub>
    </voice>
</speak>
```

## 数学表达式的阅读

### 方法 1：纯文本数学表达式

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
    <voice name="en-US-AvaMultilingualNeural">
       <mstts:prompt domain="Math" />
       x = (-b ± √(b² - 4ac)) / 2a
    </voice>
</speak>
```

读出括号：

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
    <voice name="en-US-AvaMultilingualNeural">
       <mstts:prompt domain="Math" /><mstts:mathspeechverbosity level="verbose" />
       x = (-b ± √(b² - 4ac)) / 2a
    </voice>
</speak>
```

### 方法 2：使用 MathML

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

输出："a squared 加 b squared 等于 c squared"
