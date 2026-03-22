import { buildDialogueSSML, type DialogueTurn } from "../src";
import * as fs from "fs";
import * as path from "path";

/**
 * 示例 5: 文本替换功能演示
 * 演示 substitutions 参数，展示专业术语替换（W3C, HTTP, CEO 等）
 */
async function main() {
    // 输出装饰框
    console.log("╔═══════════════════════════════════════════════╗");
    console.log("║  示例 5: 文本替换功能演示                    ║");
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

    // 输出 substitutions 说明
    console.log("📖 substitutions 参数说明:");
    console.log("┌──────────────────────────────────────────────┐");
    console.log("│ 格式：{ text: string, alias: string }        │");
    console.log("│ text: 原文中的词                             │");
    console.log("│ alias: 朗读时使用的别名                      │");
    console.log("│ SSML 生成 <sub alias=\"...\">text</sub> 标签   │");
    console.log("└──────────────────────────────────────────────┘");
    console.log();

    // 构建对话：演示专业术语替换
    const turns: DialogueTurn[] = [
        {
            voice: "zh-CN-XiaoxiaoNeural",
            text: "W3C 制定了 Web 标准，API 基于 HTTP 协议",
            substitutions: [
                { text: "W3C", alias: "万维网联盟" },
                { text: "Web", alias: "万维网" },
                { text: "HTTP", alias: "超文本传输协议" },
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

    // 显示替换前后的对比
    console.log("📝 替换前后对比:");
    console.log("┌──────────────────────────────────────────────┐");
    console.log("│ 【中文部分】                                 │");
    console.log("│ 原文：W3C 制定了 Web 标准，API 基于 HTTP 协议   │");
    console.log("│ 朗读：万维网联盟制定了万维网标准，API 基于超文本 │");
    console.log("│       传输协议                              │");
    console.log("├──────────────────────────────────────────────┤");
    console.log("│ 【英文部分】                                 │");
    console.log("│ 原文：The CEO said: innovation drives success │");
    console.log("│ 朗读：The Chief Executive Officer said:      │");
    console.log("│       innovation drives success             │");
    console.log("└──────────────────────────────────────────────┘");
    console.log();

    // 显示替换规则列表
    console.log("📋 替换规则列表:");
    console.log("┌──────────────────────────────────────────────┐");
    console.log("│ 中文部分替换规则：                           │");
    turns[0].substitutions?.forEach((sub) => {
        const line = `│   "${sub.text}" → "${sub.alias}"`.padEnd(47) + "│";
        console.log(line);
    });
    console.log("├──────────────────────────────────────────────┤");
    console.log("│ 英文部分替换规则：                           │");
    turns[1].substitutions?.forEach((sub) => {
        const line = `│   "${sub.text}" → "${sub.alias}"`.padEnd(47) + "│";
        console.log(line);
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
    const outputPath = path.join(outputDir, "05-文本替换功能演示.mp3");

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
        console.log("💡 提示：播放音频对比替换前后的朗读效果");
    } catch (error) {
        console.error("❌ 生成失败:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
