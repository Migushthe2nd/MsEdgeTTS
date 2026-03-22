import { buildDialogueSSML, type DialogueTurn } from "../src";
import * as fs from "fs";
import * as path from "path";

/**
 * Example 4: Style Degree Control Demo
 * Demonstrates the effect of styleDegree parameter (range 0.01-2.0) on emotional expression
 */
async function main() {
    // Output decorative box
    console.log("╔═══════════════════════════════════════════════╗");
    console.log("║  Example 4: Style Degree Control Demo        ║");
    console.log("╚═══════════════════════════════════════════════╝");
    console.log();

    // Read configuration
    const configPath = path.join(__dirname, "config.json");
    if (!fs.existsSync(configPath)) {
        console.error("❌ Error: config.json does not exist");
        console.error("📝 Please copy config.example.json to config.json and fill in your email and password");
        console.error(`📁 Example file location: ${configPath}`);
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    // Output styleDegree explanation
    console.log("📖 styleDegree Parameter Explanation:");
    console.log("┌──────────────────────────────────────────────┐");
    console.log("│ Range: 0.01 - 2.0                            │");
    console.log("│ 0.5: Weaker emotional expression             │");
    console.log("│ 1.0: Normal emotional expression (default)   │");
    console.log("│ 2.0: Strongest emotional expression          │");
    console.log("└──────────────────────────────────────────────┘");
    console.log();

    // Build dialogue: same sentence, three different intensities
    const turns: DialogueTurn[] = [
        {
            voice: "zh-CN-XiaomoNeural",
            text: "This is normal",
            style: "sad",
            styleDegree: 0.5,  // Weaker
        },
        {
            voice: "zh-CN-XiaomoNeural",
            text: "This is really sad",
            style: "sad",
            styleDegree: 1.0,  // Normal
        },
        {
            voice: "zh-CN-XiaomoNeural",
            text: "This is absolutely heartbreaking!",
            style: "sad",
            styleDegree: 2.0,  // Strongest
        },
    ];

    // Display dialogue content
    console.log("📝 Dialogue Content:");
    console.log("┌──────────────────────────────────────────────┐");
    turns.forEach((turn, index) => {
        const intensity = turn.styleDegree === 0.5 ? "Weaker" : turn.styleDegree === 1.0 ? "Normal" : "Strongest";
        console.log(`│ ${index + 1}. [Intensity: ${intensity}] ${turn.text.padEnd(25)} │`);
    });
    console.log("└──────────────────────────────────────────────┘");
    console.log();

    // Generate SSML
    const ssml = buildDialogueSSML(turns);

    // SSML preview
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
    const outputPath = path.join(outputDir, "04-style-degree-control-demo.mp3");

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
        console.log("💡 Tip: Play the audio to compare the differences between the three emotional intensities");
    } catch (error) {
        console.error("❌ Generation failed:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
