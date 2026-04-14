import { DialogueBuilder, buildDialogueSSML, type DialogueTurn } from "../src";
import * as fs from "fs";
import * as path from "path";

/**
 * Example 1: Multi-Speaker Dialogue - Chained Call
 * Build Chinese-English mixed podcast dialogue using DialogueBuilder
 */
async function main() {
    // Output decorative box
    console.log("╔═══════════════════════════════════════════════╗");
    console.log("║  Example 1: Multi-Speaker Dialogue - Chained ║");
    console.log("╚═══════════════════════════════════════════════╝");
    console.log();

    // Read configuration
    const configPath = path.join(__dirname, "config.json");
    if (!fs.existsSync(configPath)) {
        console.error("❌ Error: config.json does not exist");
        console.error("📝 Please copy config.example.json to config.json and fill in email and password");
        console.error(`📁 Example file location: ${configPath}`);
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    // Build dialogue: 4 speaker turns (2 Chinese + 2 English)
    const dialogue = new DialogueBuilder()
        .addTurn({
            voice: "zh-CN-XiaoxiaoNeural",
            text: "大家好！欢迎收听今天的科技播客。",
            style: "cheerful",
        })
        .addTurn({
            voice: "en-US-AndrewNeural",
            text: "Hello everyone! Welcome to today's tech podcast.",
            lang: "en-US",
            style: "friendly",
        })
        .addTurn({
            voice: "zh-CN-YunxiNeural",
            text: "今天我们将探讨人工智能的最新发展。",
            style: "documentary-narration",
        })
        .addTurn({
            voice: "en-US-AriaNeural",
            text: "That's right! AI is changing the world faster than ever.",
            lang: "en-US",
            style: "excited",
        })
        .build();

    console.log(`Generated dialogue turns: ${dialogue.turns.length}`);
    console.log();

    // Generate SSML
    const ssml = buildDialogueSSML(dialogue.turns);

    // SSML preview
    console.log("SSML Preview:");
    console.log("┌──────────────────────────────────────────────┐");
    const ssmlLines = ssml.split("\n");
    for (const line of ssmlLines) {
        const truncated = line.length > 44 ? line.substring(0, 41) + "..." : line;
        console.log(`│ ${truncated.padEnd(44)} │`);
    }
    console.log("└──────────────────────────────────────────────┘");
    console.log();

    // Output path
    const outputDir = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, "podcast-dialogue-chained.mp3");

    // Call TTS API
    console.log("Calling TTS API...");
    
    try {
        const response = await fetch(config.api_url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                user_email: config.user_email,
                user_pass: config.user_pass,
                ssml: ssml,
                kbitrate: config.kbitrate || "audio-16khz-32kbitrate-mono-mp3",
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        // Save file
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(outputPath, buffer);

        // Calculate file size
        const fileSizeKB = (buffer.length / 1024).toFixed(1);

        console.log("✅ Audio generation successful!");
        console.log(`📁 File saved: ${outputPath}`);
        console.log(`📊 File size: ${fileSizeKB} KB`);
    } catch (error) {
        console.error("❌ Generation failed:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
