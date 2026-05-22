#!/bin/bash
set -e
echo "=========================================="
echo "  AI Chat - Oracle Linux 部署脚本"
echo "=========================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${GREEN}[1/6] 检查 Node.js 环境...${NC}"
if ! command -v node &> /dev/null; then
    echo "安装 Node.js 20 LTS..."
    if command -v dnf &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo dnf install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    fi
fi
echo "Node.js $(node -v), npm $(npm -v)"

echo -e "\n${GREEN}[2/6] 安装项目依赖...${NC}"
cd "$(dirname "$0")"
cd server && npm install --production && cd ..
cd client && npm install && npm run build && cd ..

echo -e "\n${GREEN}[3/6] 配置环境变量...${NC}"
if [ ! -f server/.env ]; then
    cp server/.env.example server/.env
    echo -e "${YELLOW}[!] 请编辑 server/.env 填入你的 API Key${NC}"
fi

echo -e "\n${GREEN}[4/6] 编译后端 TypeScript...${NC}"
cd server && npm run build && cd ..

echo -e "\n${GREEN}[5/6] 配置防火墙...${NC}"
PORT=${PORT:-3000}
if command -v firewall-cmd &> /dev/null && systemctl is-active --quiet firewalld 2>/dev/null; then
    sudo firewall-cmd --permanent --add-port=${PORT}/tcp 2>/dev/null || true
    sudo firewall-cmd --reload 2>/dev/null || true
    echo "防火墙已放行端口 ${PORT}"
fi
echo -e "${YELLOW}[!] 请在 Oracle Cloud 控制台安全列表中开放 TCP ${PORT} 端口${NC}"

echo -e "\n${GREEN}[6/6] 配置 systemd 服务...${NC}"
SERVICE_NAME="ai-chat"
WORKING_DIR="$(pwd)"
CURRENT_USER="$(whoami)"

sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=AI Chat Server
After=network.target

[Service]
Type=simple
User=${CURRENT_USER}
WorkingDirectory=${WORKING_DIR}/server
Environment="PORT=${PORT}"
Environment="HOST=0.0.0.0"
ExecStart=$(which node) dist/index.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}
sudo systemctl start ${SERVICE_NAME}

echo ""
echo "=========================================="
echo "  部署完成！访问地址: http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_IP'):${PORT}"
echo "=========================================="
echo ""
echo "管理命令："
echo "  sudo systemctl status ai-chat    # 查看状态"
echo "  sudo systemctl restart ai-chat   # 重启"
echo "  sudo systemctl stop ai-chat      # 停止"
echo "  sudo journalctl -u ai-chat -f    # 查看日志"
echo ""
