# src/ Directory Knowledge Base

**Module**: Core TTS Functionality Implementation

---

## OVERVIEW

MsEdgeTTS core source code directory - Contains all functionality implementations including WebSocket communication, SSML generation, audio output control, etc.

---

## WHERE TO LOOK

| Task | File | Description |
|------|------|------|
| Modify WebSocket communication logic | `MsEdgeTTS.ts` | Connection initialization, message exchange, boundary metadata processing |
| Add new audio format | `Output.ts` | `OUTPUT_FORMAT` enum + `OUTPUT_EXTENSIONS` mapping |
| Modify voice options | `Prosody.ts` | `ProsodyOptions` class (rate/pitch/volume) |
| Modify dialogue builder | `DialogueBuilder.ts` | Chained builder + `buildDialogueSSML()` function |
| Add SSML utilities | `SSMLUtils.ts` | Escape functions, emotional style validation |
| Modify type definitions | `DialogueTurn.ts` | `DialogueTurn`, `Dialogue`, `TextSegment`, `Substitution` |
| Add unit tests | `*.spec.ts` | Same directory as source, Jest config in package.json |

---

## FILE STRUCTURE

```
src/
├── index.ts              # Barrel export (6 exports)
├── MsEdgeTTS.ts          # Core class (457 lines)
├── MsEdgeTTS.spec.ts     # Unit tests
├── Output.ts             # OUTPUT_FORMAT enum + OUTPUT_EXTENSIONS
├── Prosody.ts            # ProsodyOptions class + RATE/PITCH/VOLUME enums
├── DialogueTurn.ts       # DialogueTurn/Dialogue/TextSegment/Substitution types
├── DialogueBuilder.ts    # DialogueBuilder class + buildDialogueSSML() function
├── SSMLUtils.ts          # escapeSSML/replaceText/validateStyle/validateStyleDegree
└── utils.ts              # joinPath() path joining utility
```

---

## CODE MAP

| Symbol | Type | File | Role |
|--------|------|------|------|
| `MsEdgeTTS` | Class | `MsEdgeTTS.ts` | Main class: WebSocket connection, speech synthesis, stream processing |
| `OUTPUT_FORMAT` | Enum | `Output.ts` | Supported audio formats (MP3/WEBM multiple bitrates) |
| `OUTPUT_EXTENSIONS` | Const | `Output.ts` | Format to file extension mapping (`.mp3`/`.webm`) |
| `ProsodyOptions` | Class | `Prosody.ts` | Rate/pitch/volume configuration options |
| `RATE` | Enum | `Prosody.ts` | Speaking rate presets (x-slow to x-fast) |
| `PITCH` | Enum | `Prosody.ts` | Pitch presets (x-low to x-high) |
| `VOLUME` | Enum | `Prosody.ts` | Volume presets (silent to x-LOUD) |
| `DialogueBuilder` | Class | `DialogueBuilder.ts` | Chained dialogue builder |
| `buildDialogueSSML` | Function | `DialogueBuilder.ts` | Functional SSML generation |
| `validateStyle` | Function | `SSMLUtils.ts` | Validate 28 official emotional styles |
| `escapeSSML` | Function | `SSMLUtils.ts` | XML escape (& < > " ') |

---

## CONVENTIONS

**TypeScript Configuration**:
- `module`: CommonJS (not ESM, for compatibility)
- `target`: ESNext
- `skipLibCheck`: true
- Compilation exclusion: `src/**/*.spec.ts`

**Testing Conventions**:
- Test files in same directory as source: `*.spec.ts`
- Jest config inline in `package.json`
- Test timeout: 15000ms

**Export Pattern**:
- Use barrel export (`index.ts` unified export)
- 6 public APIs: `MsEdgeTTS`, `OUTPUT_FORMAT`, `ProsodyOptions`, `DialogueTurn`, `DialogueBuilder`, `buildDialogueSSML`

**SSML Processing**:
- Only supports `speak`/`voice`/`prosody`/`mstts:express-as`/`lang`/`sub` elements
- Full SSML specification not supported

---

## ANTI-PATTERNS (SRC)

- ❌ **Do NOT** use in browser - API requires Edge User-Agent (server-side only)
- ❌ **Do NOT** modify Sec-MS-GEC hash algorithm in `MsEdgeTTS.ts` - depends on Azure authentication mechanism
- ❌ **Do NOT** remove `isomorphic-ws` dependency - enables cross-environment compatibility
- ❌ **Do NOT** use callback API - Promise only

---

## UNIQUE STYLES

**WebSocket Communication**:
- Sec-MS-GEC hash authentication (SHA-256 + Windows Tick timestamp)
- Custom UUID generation (not `crypto.randomUUID`)
- Message delimiter: `\r\n\r\n`

**Logging System**:
- Optional logger (`enableLogger` option)
- Only logs connection status, message exchange

**Multi-Speaker Dialogue Support**:
- `DialogueBuilder` chained calls
- `buildDialogueSSML()` functional API
- Supports 28 emotional styles + intensity control (0.01-2.0)
- Supports text substitution (`<sub alias>` tags)
- Supports multi-language mixing (`<lang xml:lang>`)

---

## COMMANDS

```bash
# Compile src/ to dist/
pnpm run build

# Run tests (src/*.spec.ts)
pnpm test

# Test watch mode
pnpm run test:watch

# Test coverage
pnpm run test:cov
```

---

## NOTES

**Key Limitations**:
- December 2025 update: API requires Edge User-Agent, **cannot be used in browsers**
- Voice list requires trusted client Token (hardcoded: `6A5AA1D4EAFF4E9FB37E23D68491D6F4`)

**Known Issues**:
- `MsEdgeTTS.ts` approximately 457 lines - high complexity, recommended to split

**Adding New Features Process**:
1. Create `.ts` file at same level in `src/`
2. Add export in `index.ts`
3. Create `.spec.ts` test file with same name
4. Run `pnpm test` to verify
