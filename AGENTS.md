# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-22
**Commit:** main branch
**Branch:** main

## OVERVIEW

Microsoft Edge TTS 文本转语音库 - 使用 Azure Speech Service (Microsoft Edge Read Aloud API) 的 Node.js/TypeScript 模块。支持语音合成、SSML、多说话人对话、情感风格控制、多种音频格式输出。

**核心栈**: TypeScript, WebSocket, Jest (测试), pnpm (包管理器)
**代码规模**: ~1010 行 TypeScript (src/ 目录)
**更新时间**: 2026-03-22

## STRUCTURE

```
./
├── src/                          # 全部源代码（9 个 TypeScript 文件）
│   ├── index.ts                  # 主入口点（barrel exports，6 个导出）
│   ├── MsEdgeTTS.ts              # 核心 TTS 类（~499 行，WebSocket 通信）
│   ├── MsEdgeTTS.spec.ts         # 单元测试
│   ├── Output.ts                 # 音频输出格式枚举 + 扩展名映射
│   ├── Prosody.ts                # 语速/音调/音量选项类
│   ├── DialogueTurn.ts           # 对话轮次类型定义
│   ├── DialogueBuilder.ts        # 对话构建器类 + SSML 构建函数
│   ├── SSMLUtils.ts              # SSML 工具函数（转义、验证）
│   └── utils.ts                  # 路径拼接工具
├── example/                      # 示例演示代码（6 个中文命名文件）
│   ├── 00-简单对话演示.ts
│   ├── 01-多说话人对话 - 链式调用.ts
│   ├── 02-多说话人对话 - 函数式.ts
│   ├── 03-31 种情感风格演示.ts
│   ├── 04-情感强度控制演示.ts
│   └── 05-文本替换功能演示.ts
├── .github/workflows/
│   └── deploy_docs.yml           # CI/CD：仅文档部署到 gh-pages
├── docs/                         # 手动编写的 SSML 文档
├── package.json                  # 依赖 + Jest 配置（内联）
├── tsconfig.json                 # TypeScript 编译配置
└── README.md                     # API 文档
```

## WHERE TO LOOK

| 任务 | 位置 | 说明 |
|------|------|------|
| 添加新功能 | `src/` | 直接在同级创建 `.ts` 文件 |
| 修改核心逻辑 | `src/MsEdgeTTS.ts` | WebSocket 通信、SSML 处理 |
| 添加音频格式 | `src/Output.ts` | `OUTPUT_FORMAT` 枚举 |
| 修改语音选项 | `src/Prosody.ts` | `ProsodyOptions` 类 |
| 添加测试 | `src/*.spec.ts` | 测试与源码同目录 |
| 修改 CI/CD | `.github/workflows/` | 仅文档部署流程 |
| 配置 Jest | `package.json` | Jest 配置内联在 package.json |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `MsEdgeTTS` | Class | `src/MsEdgeTTS.ts` | 主类：WebSocket 连接、语音合成 |
| `OUTPUT_FORMAT` | Enum | `src/Output.ts` | 支持的音频输出格式（MP3, WEBM） |
| `OUTPUT_EXTENSIONS` | Const | `src/Output.ts` | 格式到文件扩展名映射 |
| `ProsodyOptions` | Class | `src/Prosody.ts` | 语速/音调/音量配置选项 |
| `RATE` | Enum | `src/Prosody.ts` | 语速预设（x-slow 到 x-fast） |
| `PITCH` | Enum | `src/Prosody.ts` | 音调预设（x-low 到 x-high） |
| `VOLUME` | Enum | `src/Prosody.ts` | 音量预设（silent 到 x-LOUD） |
| `Voice` | Type | `src/MsEdgeTTS.ts` | 语音元数据结构 |
| `MetadataOptions` | Class | `src/MsEdgeTTS.ts` | 边界元数据选项（句子/单词） |
| `DialogueBuilder` | Class | `src/DialogueBuilder.ts` | 链式对话构建器 |
| `buildDialogueSSML` | Function | `src/DialogueBuilder.ts` | 函数式 SSML 生成 |
| `escapeSSML` | Function | `src/SSMLUtils.ts` | XML 转义（& < > " '） |
| `validateStyle` | Function | `src/SSMLUtils.ts` | 验证 28 种官方情感风格 |
| `validateStyleDegree` | Function | `src/SSMLUtils.ts` | 验证 styleDegree 范围（0.01-2.0） |
| `joinPath` | Function | `src/utils.ts` | 路径拼接工具 |

## CONVENTIONS

**TypeScript 配置**:
- `target`: ESNext
- `module`: CommonJS
- `outDir`: dist/
- 跳过库检查（skipLibCheck: true）

**测试约定**:
- 测试文件：`*.spec.ts` 与源码同目录
- Jest 配置内联在 `package.json`
- 测试超时：15 秒

**包管理器**:
- 强制使用 `pnpm`（preinstall 钩子）
- 版本锁定：pnpm-lock.yaml

**错误处理约定**:
- 验证失败时抛出明确 Error（见 SSMLUtils.ts）
- 无效输入立即抛出，不调用 fallback

**日志约定**:
- 可选 logger 通过 `enableLogger` 选项启用
- 使用私有 `_log()` 方法记录
- 仅记录连接状态、消息收发

**SSML 处理约定**:
- 转义顺序先 & 后其他，防止重复转义
- 仅支持 `speak`, `voice`, `prosody` 元素

## ANTI-PATTERNS (THIS PROJECT)

- ❌ **不要** 使用 npm/yarn - 项目强制使用 pnpm
- ❌ **不要** 将测试移至独立目录 - 保持 `*.spec.ts` 与源码同级
- ❌ **不要** 修改 tsconfig 的 module/moduleResolution - 依赖 CommonJS
- ❌ **不要** 修改 Sec-MS-GEC 哈希算法 - 依赖 Azure 认证机制
- ❌ **不要** 删除 `isomorphic-ws` 依赖 - 实现跨环境兼容
- ❌ **不要** 使用回调 API - 仅支持 Promise
- ❌ **不要** 在浏览器中使用 - API 需要 Edge User-Agent（仅服务器端）
- ❌ **不要** 删除 `dist/` 外的文件 - 发布仅包含 dist 目录

## ERROR HANDLING

**抛出 Error 的场景**:
- 未配置 metadata：`"Speech synthesis not configured yet..."`
- 无效 voiceLocale：`"Could not infer voiceLocale from voiceName..."`
- 无效 style：`'Invalid style "xxx". Valid styles: ...'`
- styleDegree 越界：`"styleDegree must be between 0.01 and 2.0"`
- 空 voice 名称：`"voice name is required and cannot be empty"`
- 空文本：`"text cannot be empty string"`

## UNIQUE STYLES

**SSML 模板**:
- 默认模板：`<speak>` → `<voice>` → `<prosody>`
- 仅支持 `speak`, `voice`, `prosody` 元素
- 不支持完整 SSML

**WebSocket 通信**:
- 使用 `isomorphic-ws` 实现浏览器/Node 兼容
- 自定义 UUID 生成（非 crypto.randomUUID）
- Sec-MS-GEC 哈希认证机制

**日志系统**:
- 可选 logger（enableLogger 选项）
- 仅记录连接状态、消息收发

## COMMANDS

```bash
# 安装依赖
pnpm install

# 开发（构建 + 运行测试）
pnpm run dev

# 编译 TypeScript
pnpm run build

# 运行测试
pnpm test

# 测试（监听模式）
pnpm run test:watch

# 测试（覆盖率）
pnpm run test:cov

# 发布到 npm
pnpm run publish
```

## NOTES

**关键限制**:
- 2025 年 12 月更新：API 需要 Edge User-Agent，**浏览器中无法使用**
- 仅支持 Promise API，不支持回调
- 语音列表需要可信客户端 Token（硬编码在源码中）

**已知问题**:
- package.json 中的 `src/test/test.ts` 和 `src/test/jest-e2e.json` 不存在（遗留配置）
- 测试覆盖率不足：仅 1 个测试文件（MsEdgeTTS.spec.ts），覆盖率 11%
- utils.ts 过于简化（仅 6 行代码），可考虑合并
- example/ 目录混合非 TS 文件（config.json, run.sh 等）

**发布流程**:
1. `pnpm run build` 编译到 dist/
2. `pnpm publish --access=public`
3. 文档自动部署到 gh-pages（通过 GitHub Actions）
