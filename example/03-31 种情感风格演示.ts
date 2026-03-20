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
    console.log("\n所有情感风格列表:");
    console.log("┌────┬─────────────────────────────────────┐");
    console.log("│ 序号 │ 风格名称                           │");
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
    console.log("║  示例 3: 31 种情感风格演示                   ║");
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
        console.error("错误：无法读取 config.json，请确保已创建配置文件");
        console.error("提示：复制 config.example.json 为 config.json 并填写邮箱密码");
        process.exit(1);
    }
    
    const tts = new MsEdgeTTS();
    const voiceName = "zh-CN-XiaoxiaoNeural";
    const outputFormat = OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3;
    
    console.log(`\n使用语音：${voiceName}`);
    console.log(`输出格式：MP3`);
    
    const turns: DialogueTurn[] = allStyles.map((style, index) => ({
        voice: voiceName,
        text: `这是第${index + 1}种情感风格，${style}。`,
        style: style
    }));
    
    const ssml = buildDialogueSSML(turns);
    console.log(`\n生成的 SSML 长度：${ssml.length} 字符`);
    
    try {
        await tts.setMetadata(voiceName, outputFormat);
        
        const outputDir = path.join(__dirname, "output");
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const outputPath = path.join(outputDir, "03-31 种情感风格演示.mp3");
        
        console.log(`\n正在生成音频...`);
        const { audioFilePath } = await tts.toFile(outputDir, ssml);
        
        fs.renameSync(audioFilePath, outputPath);
        
        console.log(`\n✅ 音频已保存到：${outputPath}`);
        console.log(`✅ 共生成 ${allStyles.length} 种情感风格演示`);
        
    } catch (error) {
        console.error("\n❌ 生成音频时出错:");
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error(error);
        }
        process.exit(1);
    }
}

main().catch(console.error);
