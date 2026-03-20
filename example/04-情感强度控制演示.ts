import { buildDialogueSSML, type DialogueTurn } from "../src";
import * as fs from "fs";
import * as path from "path";

/**
 * 示例 4: 情感强度控制演示
 * 演示 styleDegree 参数（范围 0.01-2.0）对情感表达的影响
 */
async function main() {
    // 输出装饰框
    console.log("╔═══════════════════════════════════════════════╗");
    console.log("║  示例 4: 情感强度控制演示                    ║");
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

    // 输出 styleDegree 说明
    console.log("📖 styleDegree 参数说明:");
    console.log("┌──────────────────────────────────────────────┐");
    console.log("│ 范围：0.01 - 2.0                             │");
    console.log("│ 0.5: 较弱的情感表达                          │");
    console.log("│ 1.0: 正常情感表达（默认）                    │");
    console.log("│ 2.0: 最强情感表达                            │");
    console.log("└──────────────────────────────────────────────┘");
    console.log();

    // 构建对话：同一句话，三种不同强度
    const turns: DialogueTurn[] = [
        {
            voice: "zh-CN-XiaomoNeural",
            text: "这很正常",
            style: "sad",
            styleDegree: 0.5,  // 较弱
        },
        {
            voice: "zh-CN-XiaomoNeural",
            text: "这真的很令人难过",
            style: "sad",
            styleDegree: 1.0,  // 正常
        },
        {
            voice: "zh-CN-XiaomoNeural",
            text: "这简直太让人心碎了！",
            style: "sad",
            styleDegree: 2.0,  // 最强
        },
    ];

    // 显示对话内容
    console.log("📝 对话内容:");
    console.log("┌──────────────────────────────────────────────┐");
    turns.forEach((turn, index) => {
        const intensity = turn.styleDegree === 0.5 ? "较弱" : turn.styleDegree === 1.0 ? "正常" : "最强";
        console.log(`│ ${index + 1}. [强度${intensity}] ${turn.text.padEnd(25)} │`);
    });
    console.log("└──────────────────────────────────────────────┘");
    console.log();

    // 生成 SSML
    const ssml = buildDialogueSSML(turns);

    // SSML 预览
    console.log("📄 SSML 预览:");
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
    const outputPath = path.join(outputDir, "04-情感强度控制演示.mp3");

    // 调用 TTS API
    console.log("🎙️  正在调用 TTS API...");
    
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
        console.log();
        console.log("💡 提示：播放音频对比三种情感强度的差异");
    } catch (error) {
        console.error("❌ 生成失败:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
