import { buildDialogueSSML, type DialogueTurn } from "../src";
import * as fs from "fs";
import * as path from "path";

/**
 * Example 5: Text Substitution Demo
 * Demonstrates the substitutions parameter with technical term replacements (W3C, HTTP, CEO, etc.)
 */
async function main() {
    // Output decorative box
    console.log("╔═══════════════════════════════════════════════╗");
    console.log("║  Example 5: Text Substitution Demo           ║");
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

    // Output substitutions explanation
    console.log("📖 substitutions Parameter Explanation:");
    console.log("┌──────────────────────────────────────────────┐");
    console.log("│ Format: { text: string, alias: string }      │");
    console.log("│ text: The word in the original text          │");
    console.log("│ alias: The alias used during reading         │");
    console.log("│ SSML generates <sub alias=\"...\">text</sub> tag│");
    console.log("└──────────────────────────────────────────────┘");
    console.log();

    // Build dialogue: demonstrate technical term substitution
    const turns: DialogueTurn[] = [
        {
            voice: "zh-CN-XiaoxiaoNeural",
            text: "W3C develops Web standards, API is based on HTTP protocol",
            substitutions: [
                { text: "W3C", alias: "World Wide Web Consortium" },
                { text: "Web", alias: "World Wide Web" },
                { text: "HTTP", alias: "Hypertext Transfer Protocol" },
            ],
            style: "narration-professional",
        },
        {
            voice: "en-US-AndrewNeural",
            text: "The CEO said: innovation drives success",
            substitutions: [
                { text: "CEO", alias: "Chief Executive Officer" },
            ],
            style: "newscast-formal",
            lang: "en-US",
        },
    ];

    // Display before/after substitution comparison
    console.log("📝 Before/After Substitution Comparison:");
    console.log("┌──────────────────────────────────────────────┐");
    console.log("│ [Chinese Part]                               │");
    console.log("│ Original: W3C develops Web standards, API is │");
    console.log("│           based on HTTP protocol             │");
    console.log("│ Reading: World Wide Web Consortium develops  │");
    console.log("│          World Wide Web standards, API is    │");
    console.log("│          based on Hypertext Transfer Protocol│");
    console.log("├──────────────────────────────────────────────┤");
    console.log("│ [English Part]                               │");
    console.log("│ Original: The CEO said: innovation drives    │");
    console.log("│           success                            │");
    console.log("│ Reading:  The Chief Executive Officer said:  │");
    console.log("│           innovation drives success          │");
    console.log("└──────────────────────────────────────────────┘");
    console.log();

    // Display substitution rules list
    console.log("📋 Substitution Rules List:");
    console.log("┌──────────────────────────────────────────────┐");
    console.log("│ Chinese Part Substitution Rules:             │");
    turns[0].substitutions?.forEach((sub) => {
        const line = `│   "${sub.text}" → "${sub.alias}"`.padEnd(47) + "│";
        console.log(line);
    });
    console.log("├──────────────────────────────────────────────┤");
    console.log("│ English Part Substitution Rules:             │");
    turns[1].substitutions?.forEach((sub) => {
        const line = `│   "${sub.text}" → "${sub.alias}"`.padEnd(47) + "│";
        console.log(line);
    });
    console.log("└──────────────────────────────────────────────┘");
    console.log();

    // Generate SSML
    const ssml = buildDialogueSSML(turns);

    // SSML Preview
    console.log("📄 SSML Preview:");
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
    const outputPath = path.join(outputDir, "05-text-substitution-demo.mp3");

    // Call TTS API
    console.log("🎙️  Calling TTS API...");
    
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
        console.log();
        console.log("💡 Tip: Play the audio to compare the reading effect before and after substitution");
    } catch (error) {
        console.error("❌ Generation failed:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
