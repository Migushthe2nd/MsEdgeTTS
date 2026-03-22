import { DialogueBuilder, buildDialogueSSML, type DialogueTurn } from "../src";
import * as fs from "fs";
import * as path from "path";

/**
 * 示例 1: 多说话人对话 - 链式调用
 * 使用 DialogueBuilder 构建中英混合播客对话
 */
async function main() {
    // 输出装饰框
    console.log("╔═══════════════════════════════════════════════╗");
    console.log("║  示例 1: 多说话人对话 - 链式调用             ║");
    console.log("╚═══════════════════════════════════════════════╝");
    console.log();

    // 读取配置
    const configPath = path.join(__dirname, "config.json");
    if (!fs.existsSync(configPath)) {
        console.error("❌ 错误：config.json 不存在");
        console.error("📝 请复制 config.example.json 为 config.json 并填写邮箱和密码");
        console.error(`📁 示例文件位置：${configPath}`);
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    // 构建对话：4 个说话人轮次（2 中文 + 2 英文）
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

    console.log(`生成的对话轮次：${dialogue.turns.length} 个`);
    console.log();

    // 生成 SSML
    const ssml = buildDialogueSSML(dialogue.turns);

    // SSML 预览
    console.log("SSML 预览:");
    console.log("┌──────────────────────────────────────────────┐");
    const ssmlLines = ssml.split("\n");
    for (const line of ssmlLines) {
        const truncated = line.length > 44 ? line.substring(0, 41) + "..." : line;
        console.log(`│ ${truncated.padEnd(44)} │`);
    }
    console.log("└──────────────────────────────────────────────┘");
    console.log();

    // 输出路径
    const outputDir = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, "01-播客对话 - 链式调用.mp3");

    // 调用 TTS API
    console.log("正在调用 TTS API...");
    
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
            throw new Error(`API 请求失败：${response.status} ${response.statusText}`);
        }

        // 保存文件
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(outputPath, buffer);

        // 计算文件大小
        const fileSizeKB = (buffer.length / 1024).toFixed(1);

        console.log("✅ 音频生成成功！");
        console.log(`📁 文件已保存：${outputPath}`);
        console.log(`📊 文件大小：${fileSizeKB} KB`);
    } catch (error) {
        console.error("❌ 生成失败:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
