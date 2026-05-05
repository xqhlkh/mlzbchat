#!/bin/bash
# =============================================
# AI Chat 部署脚本 - Oracle Linux
# =============================================
set -e

echo "=========================================="
echo "  AI Chat - Oracle Linux 部署脚本"
echo "=========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}[!] 检测到以 root 运行，建议使用普通用户 + sudo${NC}"
fi

echo -e "\n${GREEN}[1/6] 检查 Node.js 环境...${NC}"
if ! command -v node &> /dev/null; then
    echo "安装 Node.js 20 LTS..."
    if command -v dnf &> /dev/null; then
        sudo dnf install -y nodejs npm || {
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo dnf install -y nodejs
        }
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    fi
fi
echo "Node.js $(node -v), npm $(npm -v)"

echo -e "\n${GREEN}[2/6] 安装项目依赖...${NC}"
cd "$(dirname "$0")"
echo "安装后端依赖..."
cd server && npm install --production && cd ..
echo "安装前端依赖并构建..."
cd client && npm install && npm run build && cd ..

echo -e "\n${GREEN}[3/6] 配置环境变量...${NC}"
if [ ! -f server/.env ]; then
    cp server/.env.example server/.env
    echo -e "${YELLOW}[!] 请编辑 server/.env 填入你的 API Key${NC}"
fi

echo -e "\n${GREEN}[4/6] 配置防火墙...${NC}"
PORT=${PORT:-3000}
if command -v firewall-cmd &> /dev/null && systemctl is-active --quiet firewalld 2>/dev/null; then
    sudo firewall-cmd --permanent --add-port=${PORT}/tcp 2>/dev/null || true
    sudo firewall-cmd --reload 2>/dev/null || true
    echo "防火墙已放行端口 ${PORT}"
fi
echo -e "${YELLOW}[!] 如果使用 Oracle Cloud，请在控制台的「安全列表」中开放 TCP ${PORT} 端口${NC}"

echo -e "\n${GREEN}[5/6] 配置 systemd 服务...${NC}"
SERVICE_NAME="ai-chat"
WORKING_DIR="$(pwd)"
CURRENT_USER="$(whoami)"

read -p "是否创建 systemd 服务实现开机自启和后台运行? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
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

NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ReadWritePaths=/tmp

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable ${SERVICE_NAME}
    sudo systemctl start ${SERVICE_NAME}
    echo -e "${GREEN}systemd 服务已创建并启动${NC}"
    echo ""
    echo "管理命令："
    echo "  sudo systemctl status ${SERVICE_NAME}   # 查看状态"
    echo "  sudo systemctl restart ${SERVICE_NAME}  # 重启"
    echo "  sudo systemctl stop ${SERVICE_NAME}     # 停止"
    echo "  sudo journalctl -u ${SERVICE_NAME} -f  # 查看日志"
else
    echo "跳过 systemd 配置，你可以手动启动："
    echo "  cd server && npm start"
fi

echo -e "\n${GREEN}[6/6] 部署完成！${NC}"
echo ""
echo "=========================================="
echo "  访问地址: http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_SERVER_IP'):${PORT}"
echo "=========================================="
echo ""
echo "下一步："
echo "  1. 编辑 server/.env 配置你的 API Key"
echo "  2. 在 Oracle Cloud 控制台安全列表中开放 TCP ${PORT} 端口"
echo "  3. 在浏览器中打开上述地址，点击右上角齿轮图标填入你的 API Key"
echo ""
