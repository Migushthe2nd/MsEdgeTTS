# 语音合成标记语言 (SSML) 的语音和声音 - 语音服务 - Foundry Tools | Microsoft Learn

可以使用语音合成标记语言 (SSML) 为语音输出指定文本转语音的声音、语言、名称、风格和角色。 还可以在单个 SSML 文档中使用多种语音，并调整重音、语速、音调和音量。 此外，SSML 还能够插入预先录制的音频，例如音效或音符。

本文介绍了如何使用 SSML 元素来指定语音和声音。 有关 SSML 语法的详细信息，请参阅 [SSML 文档结构和事件](speech-synthesis-markup-structure)。

## 使用语音元素

必须在每个 SSML `voice` 元素中至少指定一个  元素。 此元素可确定用于文本转语音的声音。

可以在单个 SSML 文档中包含多个 `voice` 元素。 每个 `voice` 元素可以指定不同的语音。 还可以通过不同的设置多次使用同一语音，例如，当 [更改句子之间的静音持续时间](speech-synthesis-markup-structure#add-silence) 时。

下表介绍 `voice` 元素的属性的用法：

| Attribute | 说明 | 必需还是可选 |
| --- | --- | --- |
| `name` | 用于文本转语音输出的声音。 有关支持的标准语音的完整列表，请参阅 [语言支持](language-support?tabs=tts)。 | 必选 |
| `effect` | 音频效果处理器，用于在设备上针对特定方案优化合成语音输出的质量。 对于生产环境中的某些方案，听觉体验可能会因某些设备上的播放失真而降级。 例如，由于扬声器响应、房间混响和背景噪音等环境因素，来自汽车扬声器的合成语音可能会听起来迟钝而低沉。 乘客可能必须调高音量才能听得更清楚。 为了避免在这种情况下进行手动操作，音频效果处理器可以通过补偿播放失真来让声音更清晰。支持以下值：<br>- `eq_car` - 在汽车、公共汽车和其他封闭车辆中提供高保真语音时，优化听觉体验。<br>- `eq_telecomhp8k` - 优化电信或电话方案中窄带语音的听觉体验。 应使用 8 kHz 的采样率。 如果采样率不是 8 kHz，则不会优化输出语音的听觉质量。<br><br>如果值缺失或无效，则会忽略此属性，而不会应用任何效果。 | 可选 |

### 语音示例

#### 单一声音示例

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        This is the text that is spoken.
    </voice>
</speak>
```

#### 多个语音的示例

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

#### 音频效果示例

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AvaMultilingualNeural" effect="eq_car">
        This is the text that is spoken.
    </voice>
</speak>
```

#### 多讲话人语音示例

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

## 使用说话风格和角色

默认情况下，神经网络声音采用中性讲话风格。 可在句子层面调整讲话风格、风格强度和角色。

下表介绍 `mstts:express-as` 元素的属性的用法：

| Attribute | 说明 | 必需还是可选 |
| --- | --- | --- |
| `style` | 特定声音的说话风格。 可以表达快乐、同情和平静等情绪。 | 必选 |
| `styledegree` | 讲话风格的强度。 可接受值的范围为：`0.01` 到 `2`（含）。 默认值为 `1`。 | 可选 |
| `role` | 说话时的角色扮演。 声音可以模仿不同的年龄和性别。 | 可选 |

### 支持的风格 (Style)

| Style | 说明 |
| --- | --- |
| `advertisement_upbeat` | 用兴奋和精力充沛的语气推广产品或服务。 |
| `affectionate` | 以较高的音调和音量表达温暖而亲切的语气。 |
| `angry` | 表达生气和厌恶的语气。 |
| `assistant` | 以温暖且轻松的语气说话，用于数字助手。 |
| `calm` | 以沉着冷静的态度说话。 |
| `chat` | 表达轻松随意的语气。 |
| `cheerful` | 表达积极愉快的语气。 |
| `customerservice` | 以友好热情的语气为客户提供支持。 |
| `depressed` | 调低音调和音量来表达忧郁、沮丧的语气。 |
| `documentary-narration` | 用轻松、感兴趣和信息丰富的风格讲述纪录片。 |
| `empathetic` | 表达关心和理解。 |
| `excited` | 表达乐观和充满希望的语气。 |
| `fearful` | 以较高的音调、较高的音量和较快的语速来表达恐惧。 |
| `friendly` | 表达一种愉快、怡人且温暖的语气。 |
| `gentle` | 以较低的音调和音量表达温和、礼貌和愉快的语气。 |
| `hopeful` | 以温暖和向往的语气说话。 |
| `lyrical` | 以优美又带感伤的方式表达情感。 |
| `narration-professional` | 以专业、客观的语气朗读内容。 |
| `narration-relaxed` | 以舒缓且悦耳的语气说话，用于内容朗读。 |
| `newscast` | 以正式专业的语气叙述新闻。 |
| `newscast-casual` | 以通用、随意的语气发布一般新闻。 |
| `newscast-formal` | 以正式、自信和权威的语气发布新闻。 |
| `poetry-reading` | 在读诗时表达出带情感和节奏的语气。 |
| `sad` | 表达悲伤语气。 |
| `serious` | 表达严肃和命令的语气。 |
| `shouting` | 以一种听起来好像语音在远处或在另一个位置说话。 |
| `sports_commentary` | 表达一种既轻松又感兴趣的语气，用于播报体育赛事。 |
| `sports_commentary_excited` | 用快速且充满活力的语气播报体育赛事精彩瞬间。 |
| `whispering` | 以试图发出轻柔、温和声音的柔和语气说话。 |
| `terrified` | 表达一种害怕的语气，语速快且声音颤抖。 |
| `unfriendly` | 表达一种冷淡无情的语气。 |

### 支持的角色 (Role)

| 角色 | 说明 |
| --- | --- |
| `Girl` | 声音模仿女孩。 |
| `Boy` | 声音模仿男孩。 |
| `YoungAdultFemale` | 声音模仿年轻的成年女性。 |
| `YoungAdultMale` | 声音模仿年轻的成年男性。 |
| `OlderAdultFemale` | 声音模仿年长的成年女性。 |
| `OlderAdultMale` | 声音模仿年长的成年男性。 |
| `SeniorFemale` | 声音模仿年老女性。 |
| `SeniorMale` | 声音模仿年老男性。 |

### 风格和程度示例

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
    <voice name="zh-CN-XiaomoNeural">
        <mstts:express-as style="sad" styledegree="2">
            快走吧，路上一定要注意安全，早去早回。
        </mstts:express-as>
    </voice>
</speak>
```

### 角色示例

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
    <voice name="zh-CN-XiaomoNeural">
        女儿看见父亲走了进来，问道：
        <mstts:express-as role="YoungAdultFemale" style="calm">
            "您来的挺快的，怎么过来的？"
        </mstts:express-as>
        父亲放下手提包，说：
        <mstts:express-as role="OlderAdultMale" style="calm">
            "刚打车过来的，路上还挺顺畅。"
        </mstts:express-as>
    </voice>
</speak>
```

## 调整讲话语言

使用 `<lang xml:lang>` 元素调整多语言语音的说话语言。

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        <lang xml:lang="de-DE">
            Wir freuen uns auf die Zusammenarbeit mit Ihnen!
        </lang>
    </voice>
</speak>
```

## 调整韵律

使用 `prosody` 元素指定音高、语调、范围、速率和音量的变化。

| Attribute | 说明 |
| --- | --- |
| `contour` | 升降曲线表示音高的变化。 |
| `pitch` | 基线音节。 可用值：`x-low`, `low`, `medium`, `high`, `x-high`, 或相对值（如 `+20Hz`, `-2st`）。 |
| `range` | 音节范围。 |
| `rate` | 语速。 可用值：`x-slow`, `slow`, `medium`, `fast`, `x-fast`, 或相对值（如 `+30%`）。 |
| `volume` | 音量。 可用值：`silent`, `x-soft`, `soft`, `medium`, `loud`, `x-loud`, 或相对值（如 `+20`）。 |

### 韵律示例

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-Ava:DragonHDLatestNeural">
        <prosody rate="+30.00%">
            Enjoy using text to speech.
        </prosody>
    </voice>
</speak>
```

## 添加录制的音频

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AvaMultilingualNeural">
        <audio src="https://contoso.com/opinionprompt.wav"/>
        Thanks for offering your opinion.
    </voice>
</speak>
```

## 添加背景音频

```xml
<speak version="1.0" xml:lang="en-US" xmlns:mstts="http://www.w3.org/2001/mstts">
    <mstts:backgroundaudio src="https://contoso.com/sample.wav" volume="0.7" fadein="3000" fadeout="4000"/>
    <voice name="en-US-AvaMultilingualNeural">
        The text provided in this document are spoken over the background audio.
    </voice>
</speak>
```

## 语音转换元素

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
    <voice xml:lang="en-US" xml:gender="Female" name="en-US-AvaMultilingualNeural">
        <mstts:voiceconversion url="https://your.blob.core.windows.net/sourceaudio.wav"/>
    </voice>
</speak>
```
