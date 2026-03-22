# TTS Pro API 示例代码

## 快速开始

### 1. 配置账户信息

复制配置模板并填写你的邮箱和密码：

```bash
cp config.example.json config.json
```

编辑 `config.json`：
```json
{
  "user_email": "your-email@example.com",
  "user_pass": "your-password",
  "api_url": "https://ttspro.cn/getSpeek.php",
  "kbitrate": "audio-16khz-32kbitrate-mono-mp3",
  "output_format": "binary"
}
```

### 2. 编译项目

```bash
pnpm run build
```

### 3. 运行示例

```bash
# Example 1: Multi-Speaker Dialogue (Chained)
node example/01-multi-speaker-dialogue-chained.ts

# Example 2: Multi-Speaker Dialogue (Functional)
node example/02-multi-speaker-dialogue-functional.ts

# Example 3: 31 Emotional Styles Demo
node example/03-31-emotional-styles-demo.ts

# Example 4: Style Degree Control Demo
node example/04-style-degree-control-demo.ts

# Example 5: Text Substitution Demo
node example/05-text-substitution-demo.ts
```

## Example Descriptions

### Example 1: Multi-Speaker Dialogue (Chained)

Build dialogue using the `DialogueBuilder` class with chained calls.

**Features**:
- Chained call syntax
- Chinese-English mixed podcast scenario
- 4 speaker turns

**Output**: `example/output/01-multi-speaker-dialogue-chained.mp3`

### Example 2: Multi-Speaker Dialogue (Functional)

Build dialogue using the `buildDialogueSSML()` function.

**Features**:
- Functional syntax
- Multi-language customer service dialogue
- 4 dialogue turns

**Output**: `example/output/02-multi-speaker-dialogue-functional.mp3`

### Example 3: 31 Emotional Styles Demo

Demonstrate all 31 emotional styles supported by Microsoft Azure.

**Features**:
- Complete list of 31 styles
- One example sentence per style
- Table format presentation

**Output**: `example/output/03-31-emotional-styles-demo.mp3`

### Example 4: Style Degree Control Demo

Demonstrate the `styleDegree` parameter (range: 0.01-2.0).

**Features**:
- Three intensity levels: 0.5/1.0/2.0
- Uses `sad` emotional style
- Same voice with different intensities

**Output**: `example/output/04-style-degree-control-demo.mp3`

### Example 5: Text Substitution Demo

Demonstrate the `substitutions` parameter for replacing technical terms.

**Features**:
- W3C → 万维网联盟
- HTTP → 超文本传输协议
- CEO → Chief Executive Officer

**Output**: `example/output/05-text-substitution-demo.mp3`

## API 参数说明

| 参数名 | 必填 | 说明 | 默认值 |
|--------|------|------|--------|
| `user_email` | ✅ | 用户邮箱 | - |
| `user_pass` | ✅ | 用户密码 | - |
| `type` | ❌ | `getSpeek`/`getBig`/`setBig` | `getSpeek` |
| `ssml` | ✅ | SSML 内容 | - |
| `kbitrate` | ❌ | 音频质量 | `audio-16khz-32kbitrate-mono-mp3` |
| `output_format` | ❌ | 返回类型：`二进制`/`url` | `二进制` |

## 输出目录

All generated audio files are saved in:
```
example/output/
├── 01-multi-speaker-dialogue-chained.mp3
├── 02-multi-speaker-dialogue-functional.mp3
├── 03-31-emotional-styles-demo.mp3
├── 04-style-degree-control-demo.mp3
└── 05-text-substitution-demo.mp3
```

## 注意事项

1. **账户安全**: `config.json` 已被 `.gitignore` 忽略，不会提交到 Git
2. **网络连接**: 运行示例需要网络连接以调用 API
3. **编译要求**: 运行前必须先执行 `pnpm run build`
4. **Node 版本**: 需要 Node.js 18+（支持 `fetch` API）

## 常见问题

### Q: 提示 "config.json 不存在"
A: 请复制 `config.example.json` 为 `config.json` 并填写邮箱和密码

### Q: 音频生成失败
A: 检查网络连接，确认邮箱和密码正确

### Q: 如何修改音频质量？
A: 编辑 `config.json` 中的 `kbitrate` 字段
