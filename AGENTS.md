# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-22
**Commit:** main branch
**Branch:** main

## OVERVIEW

Microsoft Edge TTS Text-to-Speech Library - A Node.js/TypeScript module using Azure Speech Service (Microsoft Edge Read Aloud API). Supports speech synthesis, SSML, multi-speaker dialogue, emotional style control, and multiple audio format output.

**Core Stack**: TypeScript, WebSocket, Jest (testing), pnpm (package manager)
**Code Size**: ~1010 lines of TypeScript (src/ directory)
**Last Updated**: 2026-03-22

## STRUCTURE

```
./
├── src/                          # All source code (9 TypeScript files)
│   ├── index.ts                  # Main entry point (barrel exports, 6 exports)
│   ├── MsEdgeTTS.ts              # Core TTS class (~499 lines, WebSocket communication)
│   ├── MsEdgeTTS.spec.ts         # Unit tests
│   ├── Output.ts                 # Audio output format enum + extension mapping
│   ├── Prosody.ts                # Rate/pitch/volume options class
│   ├── DialogueTurn.ts           # Dialogue turn type definition
│   ├── DialogueBuilder.ts        # Dialogue builder class + SSML builder function
│   ├── SSMLUtils.ts              # SSML utility functions (escape, validate)
│   └── utils.ts                  # Path joining utility
├── example/                      # Example demo code (6 Chinese-named files)
│   ├── 00-简单对话演示.ts
│   ├── 01-多说话人对话 - 链式调用.ts
│   ├── 02-多说话人对话 - 函数式.ts
│   ├── 03-31 种情感风格演示.ts
│   ├── 04-情感强度控制演示.ts
│   └── 05-文本替换功能演示.ts
├── .github/workflows/
│   └── deploy_docs.yml           # CI/CD: Documentation deployment to gh-pages only
├── docs/                         # Manually written SSML documentation
├── package.json                  # Dependencies + Jest config (inline)
├── tsconfig.json                 # TypeScript compilation configuration
└── README.md                     # API documentation
```

## WHERE TO LOOK

| Task | Location | Description |
|------|------|------|
| Add new feature | `src/` | Create `.ts` file at same level |
| Modify core logic | `src/MsEdgeTTS.ts` | WebSocket communication, SSML processing |
| Add audio format | `src/Output.ts` | `OUTPUT_FORMAT` enum |
| Modify voice options | `src/Prosody.ts` | `ProsodyOptions` class |
| Add tests | `src/*.spec.ts` | Tests in same directory as source |
| Modify CI/CD | `.github/workflows/` | Documentation deployment flow only |
| Configure Jest | `package.json` | Jest config inline in package.json |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `MsEdgeTTS` | Class | `src/MsEdgeTTS.ts` | Main class: WebSocket connection, speech synthesis |
| `OUTPUT_FORMAT` | Enum | `src/Output.ts` | Supported audio output formats (MP3, WEBM) |
| `OUTPUT_EXTENSIONS` | Const | `src/Output.ts` | Format to file extension mapping |
| `ProsodyOptions` | Class | `src/Prosody.ts` | Rate/pitch/volume configuration options |
| `RATE` | Enum | `src/Prosody.ts` | Speaking rate presets (x-slow to x-fast) |
| `PITCH` | Enum | `src/Prosody.ts` | Pitch presets (x-low to x-high) |
| `VOLUME` | Enum | `src/Prosody.ts` | Volume presets (silent to x-LOUD) |
| `Voice` | Type | `src/MsEdgeTTS.ts` | Voice metadata structure |
| `MetadataOptions` | Class | `src/MsEdgeTTS.ts` | Boundary metadata options (sentence/word) |
| `DialogueBuilder` | Class | `src/DialogueBuilder.ts` | Chained dialogue builder |
| `buildDialogueSSML` | Function | `src/DialogueBuilder.ts` | Functional SSML generation |
| `escapeSSML` | Function | `src/SSMLUtils.ts` | XML escape (& < > " ') |
| `validateStyle` | Function | `src/SSMLUtils.ts` | Validate 28 official emotional styles |
| `validateStyleDegree` | Function | `src/SSMLUtils.ts` | Validate styleDegree range (0.01-2.0) |
| `joinPath` | Function | `src/utils.ts` | Path joining utility |

## CONVENTIONS

**TypeScript Configuration**:
- `target`: ESNext
- `module`: CommonJS
- `outDir`: dist/
- Skip library check (skipLibCheck: true)

**Testing Conventions**:
- Test files: `*.spec.ts` in same directory as source
- Jest config inline in `package.json`
- Test timeout: 15 seconds

**Package Manager**:
- pnpm required (preinstall hook)
- Version lock: pnpm-lock.yaml

**Error Handling Conventions**:
- Throw clear Error on validation failure (see SSMLUtils.ts)
- Invalid input throws immediately, no fallback

**Logging Conventions**:
- Optional logger via `enableLogger` option
- Private `_log()` method for logging
- Log only connection status, message exchange

**SSML Processing Conventions**:
- Escape & first, then others, to prevent double escaping
- Only `speak`, `voice`, `prosody` elements supported

## ANTI-PATTERNS (THIS PROJECT)

- ❌ **Do NOT** use npm/yarn - project requires pnpm
- ❌ **Do NOT** move tests to separate directory - keep `*.spec.ts` alongside source
- ❌ **Do NOT** modify tsconfig module/moduleResolution - depends on CommonJS
- ❌ **Do NOT** modify Sec-MS-GEC hash algorithm - depends on Azure authentication
- ❌ **Do NOT** remove `isomorphic-ws` dependency - enables cross-environment compatibility
- ❌ **Do NOT** use callback API - Promise only
- ❌ **Do NOT** use in browser - API requires Edge User-Agent (server-side only)
- ❌ **Do NOT** delete files outside `dist/` - publish includes only dist directory

## ERROR HANDLING

**Error Throwing Scenarios**:
- Metadata not configured: `"Speech synthesis not configured yet..."`
- Invalid voiceLocale: `"Could not infer voiceLocale from voiceName..."`
- Invalid style: `'Invalid style "xxx". Valid styles: ...'`
- styleDegree out of range: `"styleDegree must be between 0.01 and 2.0"`
- Empty voice name: `"voice name is required and cannot be empty"`
- Empty text: `"text cannot be empty string"`

## UNIQUE STYLES

**SSML Template**:
- Default template: `<speak>` → `<voice>` → `<prosody>`
- Only `speak`, `voice`, `prosody` elements supported
- Full SSML not supported

**WebSocket Communication**:
- Uses `isomorphic-ws` for browser/Node compatibility
- Custom UUID generation (not crypto.randomUUID)
- Sec-MS-GEC hash authentication mechanism

**Logging System**:
- Optional logger (enableLogger option)
- Logs only connection status, message exchange

## COMMANDS

```bash
# Install dependencies
pnpm install

# Development (build + run tests)
pnpm run dev

# Compile TypeScript
pnpm run build

# Run tests
pnpm test

# Tests (watch mode)
pnpm run test:watch

# Tests (coverage)
pnpm run test:cov

# Publish to npm
pnpm run publish
```

## NOTES

**Key Limitations**:
- December 2025 update: API requires Edge User-Agent, **cannot be used in browsers**
- Promise API only, no callback support
- Voice list requires trusted client Token (hardcoded in source)

**Known Issues**:
- `src/test/test.ts` and `src/test/jest-e2e.json` in package.json do not exist (legacy config)
- Insufficient test coverage: only 1 test file (MsEdgeTTS.spec.ts), 11% coverage
- utils.ts is too simplified (only 6 lines), could be merged
- example/ directory mixes non-TS files (config.json, run.sh, etc.)

**Publish Flow**:
1. `pnpm run build` compiles to dist/
2. `pnpm publish --access=public`
3. Documentation auto-deploys to gh-pages (via GitHub Actions)
