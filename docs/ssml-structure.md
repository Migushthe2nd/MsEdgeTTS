# 语音合成标记语言 (SSML) 文档结构和事件 - 语音服务 - Foundry Tools | Microsoft Learn

语音合成标记语言（SSML）连同输入文本一起，决定了文本转语音输出的结构、内容和其他特征。 例如，可以使用 SSML 来定义段落、句子、中断/暂停或静音。 可以使用事件标记（例如书签或视素）来包装文本，这些标记可以稍后由应用程序处理。

有关如何在 SSML 文档中构建元素的详细信息，请参阅以下部分。

注意

除了 Foundry Tools 中的 Azure 语音神经（非高清）语音外，你还可以使用 [Foundry Tools 中的 Azure 语音高清 (HD) 语音](high-definition-voices)和 [Azure OpenAI 神经（高清和非高清）语音](openai-voices)。 HD 语音为更多样化的场景提供更高的质量。

某些语音不支持所有 [语音合成标记语言 (SSML)](speech-synthesis-markup-structure) 标记。 这包括神经网络文本转语音高清语音、个性化语音和嵌入语音。

- 对于 Azure 高清（HD）语音，请检查此处的 SSML 支持。
- 对于个人语音，可以在 [此处](personal-voice-how-to-use#supported-and-unsupported-ssml-elements-for-personal-voice) 找到 SSML 支持。
- 有关嵌入式声音，请在 [此处](embedded-speech#embedded-voices-capabilities) 查看 SSML 支持。

## 文档结构

SSML 的语音服务实现基于万维网联合会的 [语音合成标记语言版本 1.0](https://www.w3.org/TR/2004/REC-speech-synthesis-20040907/)。 语音服务支持的元素可能与 W3C 标准不同。

每个 SSML 文档是使用 SSML 元素（或标记）创建的。 这些元素用于调整语音、风格、音节、韵律、音量等。

下面是 SSML 文档的基本结构和语法的子集：

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

以下列表描述了每个元素中允许的一些内容示例：

- `audio`：如果音频文件不存在或无法播放，可在 `audio` 元素的正文中包含可讲述的纯文本或 SSML 标记。 `audio` 元素还包含文本和以下元素：`audio`、`break`、`p`、`s`、`phoneme`、`prosody`、`say-as` 和 `sub`。
- `bookmark`：此元素不能包含文本或任何其他元素。
- `break`：此元素不能包含文本或任何其他元素。
- `emphasis`：此元素可包含文本和以下元素：`audio`、`break`、`emphasis`、`lang`、`phoneme`、`prosody`、`say-as` 和 `sub`。
- `lang`：此元素可包含除 `mstts:backgroundaudio`、`voice` 和 `speak` 以外的所有其他元素。
- `lexicon`：此元素不能包含文本或任何其他元素。
- `math`：此元素只能包含文本和 MathML 元素。
- `mstts:audioduration`：此元素不能包含文本或任何其他元素。
- `mstts:backgroundaudio`：此元素不能包含文本或任何其他元素。
- `<mstts:voiceconversion>`：此元素不能包含文本或任何其他元素。 它指定语音转换的源音频 URL。
- `mstts:embedding`：此元素可包含文本和以下元素：`audio`、`break`、`emphasis`、`lang`、`phoneme`、`prosody`、`say-as` 和 `sub`。
- `mstts:express-as`：此元素可包含文本和以下元素：`audio`、`break`、`emphasis`、`lang`、`phoneme`、`prosody`、`say-as` 和 `sub`。
- `mstts:silence`：此元素不能包含文本或任何其他元素。
- `mstts:viseme`：此元素不能包含文本或任何其他元素。
- `p`：此元素可包含文本和以下元素：`audio`、`break`、`phoneme`、`prosody`、`say-as`、`sub`、`mstts:express-as` 和 `s`。
- `phoneme`：此元素只能包含文本，不能包含任何其他元素。
- `prosody`：此元素可包含文本和以下元素：`audio`、`break`、`p`、`phoneme`、`prosody`、`say-as`、`sub` 和 `s`。
- `s`：此元素可包含文本和以下元素：`audio`、`break`、`phoneme`、`prosody`、`say-as`、`mstts:express-as` 和 `sub`。
- `say-as`：此元素只能包含文本，不能包含任何其他元素。
- `sub`：此元素只能包含文本，不能包含任何其他元素。
- `speak`：SSML 文档的根元素。 此元素可包含以下元素：`mstts:backgroundaudio` 和 `voice`。
- `voice`：此元素可包含除 `mstts:backgroundaudio` 和 `speak` 以外的所有其他元素。

语音服务可自动适当处理停顿（例如，在句号后面暂停片刻），或者在以问号结尾的句子中使用正确的音调。

## 特殊字符

若要在 SSML 元素的值或文本中使用字符 `&`、`<` 和 `>`，则必须使用实体格式。 具体而言，必须使用 `&amp;` 而不是 `&`，使用 `&lt;` 而不是 `<`，使用 `&gt;` 而不是 `>`。 否则，无法正确分析 SSML。

例如，请指定 `green &amp; yellow` 而不是 `green & yellow`。 系统会正确分析以下 SSML：

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        My favorite colors are green &amp; yellow.
    </voice>
</speak>
```

特殊字符（例如引号、撇号和括号）必须经过转义。 有关详细信息，请参阅 [可扩展标记语言 (XML) 1.0：附录 D](https://www.w3.org/TR/xml/#sec-entexpand)。

属性值必须用双引号或单引号括起来。 例如，`<prosody volume="90">` 和 `<prosody volume='90'>` 是格式正确的有效元素，但无法识别 `<prosody volume=90>`。

## Speak 根元素

`speak` 元素包含版本、语言和标记词汇定义等信息。 `speak` 元素是所有 SSML 文档必需的根元素。 你必须在 `speak` 元素内指定默认语言，无论是否在其他地方调整该语言，例如在 [`lang`](speech-synthesis-markup-voice#use-voice-elements) 元素中。

下面是 `speak` 元素的语法：

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="string"></speak>
```

| Attribute | 说明 | 必需还是可选 |
| --- | --- | --- |
| `version` | 指示用于解释文档标记的 SSML 规范的版本。 当前版本为"1.0"。 | 必选 |
| `xml:lang` | 根文档的语言。 该值可以包含语言代码（如 `en` （英语））或本地化信息，如 `en-US` （英语 - 美国）。 | 必选 |
| `xmlns` | 用于定义 SSML 文档的标记词汇（元素类型和属性名称）的文档的 URI。 当前 URI 为 "http://www.w3.org/2001/10/synthesis"。 | 必选 |

`speak` 元素必须至少包含一个 [语音元素](speech-synthesis-markup-voice#use-voice-elements)。

### 演讲示例

`speak`介绍了  元素属性支持的值。

#### 单一声音示例

本示例使用 `en-US-Ava:DragonHDLatestNeural` 语音。 有关更多示例，请参阅 [语音示例](speech-synthesis-markup-voice#voice-examples)。

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        This is the text that is spoken.
    </voice>
</speak>
```

## 添加停顿

使用 `break` 元素替代单词之间的默认中断或暂停行为。 否则，语音服务会自动插入暂停。

下表描述了 `break` 元素的属性用法。

| Attribute | 说明 | 必需还是可选 |
| --- | --- | --- |
| `strength` | 暂停的相对持续时间，使用以下值之一：<br>- x-weak<br>- weak<br>- medium（默认值）<br>- strong<br>- x-strong | 可选 |
| `time` | 暂停的绝对持续时间，以秒为单位（例如 `2s`）或以毫秒为单位（例如 `500ms`）。 有效值的范围为 0 到 20000 毫秒。 如果设置的值大于支持的最大值，则服务将使用 `20000ms`。 如果设置了 `time` 属性，则会忽略 `strength` 属性。 | 可选 |

下面是有关该 `strength` 属性的更多详细信息。

| Strength | 相对持续时间 |
| --- | --- |
| X-weak | 250 毫秒 |
| Weak | 500 毫秒 |
| 中型 | 750 毫秒 |
| 非常 | 1,000 毫秒 |
| X-strong | 1,250 毫秒 |

### 停顿示例

`break`介绍了  元素属性支持的值。 以下三种方式都会增加 750 毫秒的中断。

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        Welcome <break /> to text to speech.
        Welcome <break strength="medium" /> to text to speech.
        Welcome <break time="750ms" /> to text to speech.
    </voice>
</speak>
```

## 添加静音

使用 `mstts:silence` 元素在文本前后，或者在两个相邻句子之间添加暂停。

`mstts:silence` 和 `break` 之间的差别之一是，`break` 元素可以插入到文本中的任意位置。 静音仅适用于输入文本的开头或结尾，或者两个相邻句子的分界处。

静默设置应用于其所在 `voice` 元素内的所有输入文本。 若要再次重置或更改静音设置，必须使用包含相同或不同语音的新 `voice` 元素。

下表描述了 `mstts:silence` 元素的属性用法。

| Attribute | 说明 | 必需还是可选 |
| --- | --- | --- |
| `type` | 指定添加静音的位置和方式。 支持以下静音类型：<br>- `Leading` – 文本开头的附加静音。 设置的值添加到文本开头前的自然静音。<br>- `Leading-exact` – 文本开头的静音。 该值是绝对静音长度。<br>- `Tailing` – 文本末尾的附加静音。 设置的值添加到最后一个单词后的自然静音中。<br>- `Tailing-exact` – 文本末尾的静音。 该值是绝对静音长度。<br>- `Sentenceboundary` – 相邻句子之间的附加静音。 此类型的实际静音长度包括上一个句子中最后一个单词后的自然静音、为此类型设置的值，以及下一个句子中起始单词之前的自然静音。<br>- `Sentenceboundary-exact` - 相邻句子之间的静音。 该值是绝对静音长度。<br>- `Comma-exact` - 半角或全角格式的逗号处的静音。 该值是绝对静音长度。<br>- `Semicolon-exact` - 半角或全角格式的分号处的静音。 该值是绝对静音长度。<br>- `Enumerationcomma-exact` - 全角格式的枚举逗号处的静音。 该值是绝对静音长度。<br><br>绝对静音类型（带有 `-exact` 后缀）会替换任何其他自然的前导或尾随静音。 绝对静音类型优先于相应的非绝对类型。 例如，如果同时设置了 `Leading` 和 `Leading-exact` 类型，则 `Leading-exact` 类型将生效。 [WordBoundary 事件](how-to-speech-synthesis#subscribe-to-synthesizer-events) 优先于标点符号相关的静音设置，包括 `Comma-exact`、`Semicolon-exact` 或 `Enumerationcomma-exact`。 同时使用 `WordBoundary` 事件和与标点符号相关的静音设置时，与标点符号相关的静音设置不会生效。 | 必选 |
| `value` | 暂停持续时间，以秒为单位（例如 `2s`）或以毫秒为单位（例如 `500ms`）。 有效值的范围为 0 到 20000 毫秒。 如果设置的值大于支持的最大值，则服务将使用 `20000ms`。 | 必选 |

### MSTTS 静音示例

`mstts:silence`介绍了  元素属性支持的值。

在本例中，`mstts:silence` 用于在两个句子之间添加 200 毫秒的静音。

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
<voice name="en-US-Ava:DragonHDLatestNeural">
<mstts:silence  type="Sentenceboundary" value="200ms"/>
If we're home schooling, the best we can do is roll with what each day brings and try to have fun along the way.
A good place to start is by trying out the slew of educational apps that are helping children stay happy and smash their schooling at the same time.
</voice>
</speak>
```

在此示例中，`mstts:silence` 用于在逗号处添加 50 毫秒的静音，在分号处添加 100 毫秒的静音，在枚举逗号处添加 150 毫秒的静音。

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="zh-CN">
<voice name="zh-CN-YunxiNeural">
<mstts:silence type="comma-exact" value="50ms"/><mstts:silence type="semicolon-exact" value="100ms"/><mstts:silence type="enumerationcomma-exact" value="150ms"/>你好呀，云希、晓晓；你好呀。
</voice>
</speak>
```

## 指定段落和句子

`p` 和 `s` 元素分别用于表示段落和句子。 如果缺少这些元素，则语音服务会自动确定 SSML 文档的结构。

### 段落和句子示例

以下示例定义了两个段落，其中每个段落包含句子。 在第二个段落中，语音服务会自动确定句子结构，因为它们未在 SSML 文档中定义。

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

## Bookmark 元素

可以使用 SSML 中的 `bookmark` 元素来引用文本或标签序列中的特定位置。 然后使用语音 SDK 并订阅 `BookmarkReached` 事件以获取音频流中每个标记的偏移量。 `bookmark` 元素没有被读出。 有关详细信息，请参阅 [订阅合成器事件](how-to-speech-synthesis#subscribe-to-synthesizer-events)。

下表描述了 `bookmark` 元素的属性用法。

| Attribute | 说明 | 必需还是可选 |
| --- | --- | --- |
| `mark` | `bookmark` 元素的引用文本。 | 必选 |

### Bookmark 示例

`bookmark`介绍了  元素属性支持的值。

你可能想知道以下代码片断中每个与花相关的词的时间偏移量：

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AvaNeural">
        We are selling <bookmark mark='flower_1'/>roses and <bookmark mark='flower_2'/>daisies.
    </voice>
</speak>
```
