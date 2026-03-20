import * as fs from "fs";
import * as path from "path";

/**
 * 示例 0: 简单对话演示
 * 直接使用给定的 SSML 示例（女儿和父亲对话）
 */
async function main() {
    // 输出装饰框
    console.log("╔═══════════════════════════════════════════════╗");
    console.log("║  示例 0: 简单对话演示                        ║");
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

    // 给定的 SSML 示例：女儿和父亲对话
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

    // 显示完整的 SSML
    console.log("使用的 SSML:");
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
    const outputPath = path.join(outputDir, "00-简单对话演示.mp3");

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
