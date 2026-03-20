# src/ 目录知识库

**所属模块**: 核心 TTS 功能实现

---

## OVERVIEW

MsEdgeTTS 核心源代码目录 - 包含 WebSocket 通信、SSML 生成、音频输出控制等全部功能实现。

---

## WHERE TO LOOK

| 任务 | 文件 | 说明 |
|------|------|------|
| 修改 WebSocket 通信逻辑 | `MsEdgeTTS.ts` | 连接初始化、消息收发、边界元数据处理 |
| 添加新音频格式 | `Output.ts` | `OUTPUT_FORMAT` 枚举 + `OUTPUT_EXTENSIONS` 映射 |
| 修改语音选项 | `Prosody.ts` | `ProsodyOptions` 类（rate/pitch/volume） |
| 修改对话构建器 | `DialogueBuilder.ts` | 链式调用构建器 + `buildDialogueSSML()` 函数 |
| 添加 SSML 工具 | `SSMLUtils.ts` | 转义函数、情感风格验证 |
| 修改类型定义 | `DialogueTurn.ts` | `DialogueTurn`、`Dialogue`、`TextSegment`、`Substitution` |
| 添加单元测试 | `*.spec.ts` | 与源码同目录，Jest 配置在 package.json |

---

## FILE STRUCTURE

```
src/
├── index.ts              # Barrel export（6 个导出）
├── MsEdgeTTS.ts          # 核心类（457 行）
├── MsEdgeTTS.spec.ts     # 单元测试
├── Output.ts             # OUTPUT_FORMAT 枚举 + OUTPUT_EXTENSIONS
├── Prosody.ts            # ProsodyOptions 类 + RATE/PITCH/VOLUME 枚举
├── DialogueTurn.ts       # DialogueTurn/Dialogue/TextSegment/Substitution 类型
├── DialogueBuilder.ts    # DialogueBuilder 类 + buildDialogueSSML() 函数
├── SSMLUtils.ts          # escapeSSML/replaceText/validateStyle/validateStyleDegree
└── utils.ts              # joinPath() 路径拼接工具
```

---

## CODE MAP

| Symbol | Type | 文件 | 作用 |
|--------|------|------|------|
| `MsEdgeTTS` | Class | `MsEdgeTTS.ts` | 主类：WebSocket 连接、语音合成、流处理 |
| `OUTPUT_FORMAT` | Enum | `Output.ts` | 支持的音频格式（MP3/WEBM 多种比特率） |
| `OUTPUT_EXTENSIONS` | Const | `Output.ts` | 格式到文件扩展名映射（`.mp3`/`.webm`） |
| `ProsodyOptions` | Class | `Prosody.ts` | 语速/音调/音量配置选项 |
| `RATE` | Enum | `Prosody.ts` | 语速预设（x-slow 到 x-fast） |
| `PITCH` | Enum | `Prosody.ts` | 音调预设（x-low 到 x-high） |
| `VOLUME` | Enum | `Prosody.ts` | 音量预设（silent 到 x-LOUD） |
| `DialogueBuilder` | Class | `DialogueBuilder.ts` | 链式对话构建器 |
| `buildDialogueSSML` | Function | `DialogueBuilder.ts` | 函数式 SSML 生成 |
| `validateStyle` | Function | `SSMLUtils.ts` | 验证 28 种官方情感风格 |
| `escapeSSML` | Function | `SSMLUtils.ts` | XML 转义（& < > " '） |

---

## CONVENTIONS

**TypeScript 配置**:
- `module`: CommonJS（非 ESM，为兼容性）
- `target`: ESNext
- `skipLibCheck`: true
- 编译排除：`src/**/*.spec.ts`

**测试约定**:
- 测试文件与源码同目录：`*.spec.ts`
- Jest 配置内联在 `package.json`
- 测试超时：15000ms

**导出模式**:
- 使用 barrel export（`index.ts` 统一导出）
- 6 个公共 API：`MsEdgeTTS`, `OUTPUT_FORMAT`, `ProsodyOptions`, `DialogueTurn`, `DialogueBuilder`, `buildDialogueSSML`

**SSML 处理**:
- 仅支持 `speak`/`voice`/`prosody`/`mstts:express-as`/`lang`/`sub` 元素
- 不支持完整 SSML 规范

---

## ANTI-PATTERNS (SRC)

- ❌ **不要** 在浏览器中使用 - API 需要 Edge User-Agent（仅服务器端）
- ❌ **不要** 修改 `MsEdgeTTS.ts` 中的 Sec-MS-GEC 哈希算法 - 依赖 Azure 认证机制
- ❌ **不要** 删除 `isomorphic-ws` 依赖 - 实现跨环境兼容
- ❌ **不要** 使用回调 API - 仅支持 Promise

---

## UNIQUE STYLES

**WebSocket 通信**:
- Sec-MS-GEC 哈希认证（SHA-256 + Windows Tick 时间戳）
- 自定义 UUID 生成（非 `crypto.randomUUID`）
- 消息分隔符：`\r\n\r\n`

**日志系统**:
- 可选 logger（`enableLogger` 选项）
- 仅记录连接状态、消息收发

**多人对话支持**:
- `DialogueBuilder` 链式调用
- `buildDialogueSSML()` 函数式 API
- 支持 28 种情感风格 + 强度控制（0.01-2.0）
- 支持文本替换（`<sub alias>` 标签）
- 支持多语言混合（`<lang xml:lang>`）

---

## COMMANDS

```bash
# 编译 src/ 到 dist/
pnpm run build

# 运行测试（src/*.spec.ts）
pnpm test

# 测试监听模式
pnpm run test:watch

# 测试覆盖率
pnpm run test:cov
```

---

## NOTES

**关键限制**:
- 2025 年 12 月更新：API 需要 Edge User-Agent，**浏览器中无法使用**
- 语音列表需要可信客户端 Token（硬编码：`6A5AA1D4EAFF4E9FB37E23D68491D6F4`）

**已知问题**:
- `MsEdgeTTS.ts` 约 457 行 - 复杂度较高，建议拆分

**添加新功能流程**:
1. 在 `src/` 同级创建 `.ts` 文件
2. 在 `index.ts` 添加导出
3. 创建同名 `.spec.ts` 测试文件
4. 运行 `pnpm test` 验证
