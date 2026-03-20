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
# 示例 1: 多说话人对话 - 链式调用
node example/01-多说话人对话 - 链式调用.ts

# 示例 2: 多说话人对话 - 函数式
node example/02-多说话人对话 - 函数式.ts

# 示例 3: 31 种情感风格演示
node example/03-31 种情感风格演示.ts

# 示例 4: 情感强度控制演示
node example/04-情感强度控制演示.ts

# 示例 5: 文本替换功能演示
node example/05-文本替换功能演示.ts
```

## 示例说明

### 示例 1: 多说话人对话 - 链式调用

使用 `DialogueBuilder` 类以链式调用方式构建对话。

**特点**:
- 链式调用语法
- 中英混合播客场景
- 4 个说话人轮次

**输出**: `example/output/01-播客对话 - 链式调用.mp3`

### 示例 2: 多说话人对话 - 函数式

使用 `buildDialogueSSML()` 函数直接构建对话。

**特点**:
- 函数式语法
- 多语言客服对话
- 4 个对话轮次

**输出**: `example/output/02-客服对话 - 函数式.mp3`

### 示例 3: 31 种情感风格演示

遍历所有 Microsoft Azure 支持的 31 种情感风格。

**特点**:
- 完整的 31 种风格列表
- 每种风格一句示例
- 表格形式展示

**输出**: `example/output/03-31 种情感风格演示.mp3`

### 示例 4: 情感强度控制演示

演示 `styleDegree` 参数（0.01-2.0 范围）。

**特点**:
- 0.5/1.0/2.0 三种强度对比
- 使用 `sad` 情感
- 同一语音不同强度

**输出**: `example/output/04-情感强度控制演示.mp3`

### 示例 5: 文本替换功能演示

演示 `substitutions` 参数替换专业术语。

**特点**:
- W3C → 万维网联盟
- HTTP → 超文本传输协议
- CEO → Chief Executive Officer

**输出**: `example/output/05-文本替换功能演示.mp3`

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

所有生成的音频文件保存在：
```
example/output/
├── 01-播客对话 - 链式调用.mp3
├── 02-客服对话 - 函数式.mp3
├── 03-31 种情感风格演示.mp3
├── 04-情感强度控制演示.mp3
└── 05-文本替换功能演示.mp3
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
