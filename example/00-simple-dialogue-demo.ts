import * as fs from "fs";
import * as path from "path";

/**
 * Example 0: Simple Dialogue Demo
 * Directly use the given SSML example (daughter-father conversation)
 */
async function main() {
    // Output decorative box
    console.log("╔═══════════════════════════════════════════════╗");
    console.log("║  Example 0: Simple Dialogue Demo              ║");
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

    // Given SSML example: daughter-father conversation
    const ssml = `<speak version="1.0"
    xmlns="http://www.w3.org/2001/10/synthesis"
    xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
    <voice name="zh-CN-XiaomoNeural">
    女儿看见父亲走了进来，问道：
    <mstts:express-as role="YoungAdultFemale" style="calm">
    "您来的挺快的，怎么过来的？"
    </mstts:express-as>
    父亲放下手提包，说：
    <mstts:express-as role="OlderAdultMale" style="calm">
    "刚打车过来的，路上还挺顺畅。"
    </mstts:express-as>
    </voice>
</speak>`;

    // Display the complete SSML
    console.log("SSML Used:");
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
    const outputPath = path.join(outputDir, "00-simple-dialogue-demo.mp3");

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
