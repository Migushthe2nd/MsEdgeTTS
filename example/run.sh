#!/bin/bash
# Example run script
# Solve ts-node's inability to properly handle Chinese filenames

# Check configuration file
if [ ! -f "config.json" ]; then
    echo "❌ Error: config.json does not exist"
    echo "📝 Please copy config.example.json to config.json and fill in email and password"
    exit 1
fi

# Build project
echo "🔨 Building project..."
pnpm run build

# Copy config.json to dist/example
echo "📋 Copying configuration file to output directory..."
cp config.json ../dist/example/

# Switch to dist/example directory to run examples
cd ../dist/example

    # Run example
    case "$1" in
        0)
            echo "🎙️  Running Example 0: Simple Dialogue Demo"
            node "00-简单对话演示.js"
            ;;
        1)
            echo "🎙️  Running Example 1: Multi-Speaker Dialogue - Chained"
            node "01-多说话人对话 - 链式调用.js"
            ;;
    2)
        echo "🎙️  Running Example 2: Multi-Speaker Dialogue - Functional"
        node "02-多说话人对话 - 函数式.js"
        ;;
    3)
        echo "🎙️  Running Example 3: 31 Emotional Styles Demo"
        node "03-31 种情感风格演示.js"
        ;;
    4)
        echo "🎙️  Running Example 4: Style Degree Control Demo"
        node "04-情感强度控制演示.js"
        ;;
    5)
        echo "🎙️  Running Example 5: Text Substitution Demo"
        node "05-文本替换功能演示.js"
        ;;
    *)
        echo "Usage: ./run.sh <example-number>"
        echo ""
        echo "Available examples:"
        echo "  0 - Simple Dialogue Demo"
        echo "  1 - Multi-Speaker Dialogue - Chained"
        echo "  2 - Multi-Speaker Dialogue - Functional"
        echo "  3 - 31 Emotional Styles Demo"
        echo "  4 - Style Degree Control Demo"
        echo "  5 - Text Substitution Demo"
        exit 1
        ;;
esac
