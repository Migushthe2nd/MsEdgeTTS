/**
 * Example 3: 31 Emotional Styles Demo
 * 
 * Demonstrates all 31 emotional styles supported by Microsoft Azure Speech Service.
 * Each style is showcased with a sample sentence.
 */

import { MsEdgeTTS, OUTPUT_FORMAT, buildDialogueSSML, type DialogueTurn } from "../src";
import * as fs from "fs";
import * as path from "path";

const allStyles = [
    "advertisement_upbeat", "affectionate", "angry", "assistant",
    "calm", "chat", "cheerful", "customerservice",
    "depressed", "documentary-narration", "empathetic", "excited",
    "fearful", "friendly", "gentle", "hopeful",
    "lyrical", "narration-professional", "narration-relaxed", "newscast",
    "newscast-casual", "newscast-formal", "poetry-reading", "sad",
    "serious", "shouting", "sports_commentary", "sports_commentary_excited",
    "terrified", "unfriendly", "whispering"
];

function printStyleTable(styles: string[]): void {
    console.log("\nComplete Emotional Styles List:");
    console.log("┌────┬─────────────────────────────────────┐");
    console.log("│ No. │ Style Name                         │");
    console.log("├────┼─────────────────────────────────────┤");
    
    styles.forEach((style, index) => {
        const num = String(index + 1).padStart(2, ' ');
        const paddedStyle = style.padEnd(35, ' ');
        console.log(`│ ${num} │ ${paddedStyle}│`);
    });
    
    console.log("└────┴─────────────────────────────────────┘");
}

async function main(): Promise<void> {
    console.log("╔═══════════════════════════════════════════════╗");
    console.log("║  Example 3: 31 Emotional Styles Demo         ║");
    console.log("╚═══════════════════════════════════════════════╝");
    
    printStyleTable(allStyles);
    
    const configPath = path.join(__dirname, "config.json");
    let email: string;
    let password: string;
    
    try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        email = config.email;
        password = config.password;
    } catch (error) {
        console.error("Error: Unable to read config.json. Please ensure the config file exists.");
        console.error("Tip: Copy config.example.json to config.json and fill in your email and password.");
        process.exit(1);
    }
    
    const tts = new MsEdgeTTS();
    const voiceName = "zh-CN-XiaoxiaoNeural";
    const outputFormat = OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3;
    
    console.log(`\nUsing voice: ${voiceName}`);
    console.log(`Output format: MP3`);
    
    const turns: DialogueTurn[] = allStyles.map((style, index) => ({
        voice: voiceName,
        text: `This is style number ${index + 1}: ${style}.`,
        style: style
    }));
    
    const ssml = buildDialogueSSML(turns);
    console.log(`\nGenerated SSML length: ${ssml.length} characters`);
    
    try {
        await tts.setMetadata(voiceName, outputFormat);
        
        const outputDir = path.join(__dirname, "output");
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const outputPath = path.join(outputDir, "03-31-emotional-styles-demo.mp3");
        
        console.log(`\nGenerating audio...`);
        const { audioFilePath } = await tts.toFile(outputDir, ssml);
        
        fs.renameSync(audioFilePath, outputPath);
        
        console.log(`\n✅ Audio saved to: ${outputPath}`);
        console.log(`✅ Generated ${allStyles.length} emotional style demonstrations`);
        
    } catch (error) {
        console.error("\n❌ Error generating audio:");
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error(error);
        }
        process.exit(1);
    }
}

main().catch(console.error);
