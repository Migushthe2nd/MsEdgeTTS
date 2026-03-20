#!/bin/bash
# 示例运行脚本
# 解决 ts-node 无法正确处理中文文件名的问题

# 检查配置文件
if [ ! -f "config.json" ]; then
    echo "❌ 错误：config.json 不存在"
    echo "📝 请复制 config.example.json 为 config.json 并填写邮箱和密码"
    exit 1
fi

# 编译项目
echo "🔨 正在编译项目..."
pnpm run build

# 复制 config.json 到 dist/example
echo "📋 复制配置文件到输出目录..."
cp config.json ../dist/example/

# 切换到 dist/example 目录运行示例
cd ../dist/example

    # 运行示例
    case "$1" in
        0)
            echo "🎙️  运行示例 0: 简单对话演示"
            node "00-简单对话演示.js"
            ;;
        1)
            echo "🎙️  运行示例 1: 多说话人对话 - 链式调用"
            node "01-多说话人对话 - 链式调用.js"
            ;;
    2)
        echo "🎙️  运行示例 2: 多说话人对话 - 函数式"
        node "02-多说话人对话 - 函数式.js"
        ;;
    3)
        echo "🎙️  运行示例 3: 31 种情感风格演示"
        node "03-31 种情感风格演示.js"
        ;;
    4)
        echo "🎙️  运行示例 4: 情感强度控制演示"
        node "04-情感强度控制演示.js"
        ;;
    5)
        echo "🎙️  运行示例 5: 文本替换功能演示"
        node "05-文本替换功能演示.js"
        ;;
    *)
        echo "用法：./run.sh <示例编号>"
        echo ""
        echo "可用示例:"
        echo "  0 - 简单对话演示"
        echo "  1 - 多说话人对话 - 链式调用"
        echo "  2 - 多说话人对话 - 函数式"
        echo "  3 - 31 种情感风格演示"
        echo "  4 - 情感强度控制演示"
        echo "  5 - 文本替换功能演示"
        exit 1
        ;;
esac
