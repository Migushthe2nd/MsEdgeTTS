# TTS Pro API Example Code

## Quick Start

### 1. Configure Account Information

Copy the configuration template and fill in your email and password:

```bash
cp config.example.json config.json
```

Edit `config.json`:
```json
{
  "user_email": "your-email@example.com",
  "user_pass": "your-password",
  "api_url": "https://ttspro.cn/getSpeek.php",
  "kbitrate": "audio-16khz-32kbitrate-mono-mp3",
  "output_format": "binary"
}
```

### 2. Build Project

```bash
pnpm run build
```

### 3. Run Examples

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
- W3C → World Wide Web Consortium
- HTTP → HyperText Transfer Protocol
- CEO → Chief Executive Officer

**Output**: `example/output/05-text-substitution-demo.mp3`

## API Parameters

| Parameter | Required | Description | Default |
|-----------|----------|-------------|---------|
| `user_email` | ✅ | User email | - |
| `user_pass` | ✅ | User password | - |
| `type` | ❌ | `getSpeek`/`getBig`/`setBig` | `getSpeek` |
| `ssml` | ✅ | SSML content | - |
| `kbitrate` | ❌ | Audio quality | `audio-16khz-32kbitrate-mono-mp3` |
| `output_format` | ❌ | Return type: `binary`/`url` | `binary` |

## Output Directory

All generated audio files are saved in:
```
example/output/
├── 01-multi-speaker-dialogue-chained.mp3
├── 02-multi-speaker-dialogue-functional.mp3
├── 03-31-emotional-styles-demo.mp3
├── 04-style-degree-control-demo.mp3
└── 05-text-substitution-demo.mp3
```

## Notes

1. **Account Security**: `config.json` is ignored by `.gitignore` and will not be committed to Git
2. **Network Connection**: Running examples requires network connection to call the API
3. **Build Requirement**: You must run `pnpm run build` before running examples
4. **Node Version**: Requires Node.js 18+ (supports `fetch` API)

## FAQ

### Q: It says "config.json does not exist"
A: Please copy `config.example.json` to `config.json` and fill in your email and password

### Q: Audio generation failed
A: Check network connection and verify that email and password are correct

### Q: How to change audio quality?
A: Edit the `kbitrate` field in `config.json`
