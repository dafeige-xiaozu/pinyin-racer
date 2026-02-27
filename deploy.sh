#!/bin/bash
# 拼音赛车部署脚本

set -e

APP_DIR="/var/www/pinyin-racer"
PORT=3000

echo "🚀 开始部署拼音赛车..."

# 1. 安装 Node.js（如果没有）
if ! command -v node &> /dev/null; then
    echo "📦 安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi
echo "✅ Node.js: $(node -v)"

# 2. 安装 pm2（如果没有）
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 pm2..."
    npm install -g pm2
fi
echo "✅ pm2: $(pm2 -v)"

# 3. 创建应用目录
echo "📁 创建应用目录..."
mkdir -p $APP_DIR
cd $APP_DIR

# 4. 安装依赖
echo "📦 安装依赖..."
npm install express@^5.2.1

# 5. 启动应用
echo "🎮 启动应用..."
pm2 delete pinyin-racer 2>/dev/null || true
pm2 start server.js --name pinyin-racer
pm2 save
pm2 startup 2>/dev/null || true

# 6. 获取服务器IP
IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo ""
echo "✨ 部署完成！"
echo "🌐 访问地址: http://$IP:$PORT"
echo ""
