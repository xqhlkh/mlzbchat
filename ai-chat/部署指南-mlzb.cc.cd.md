# 部署 AI Chat 到 mlzb.cc.cd/aichat

## 完整流程（一步步来）

### 第一步：SSH 连上服务器

```bash
ssh opc@<你的服务器公网IP>
```

### 第二步：克隆项目

```bash
cd /home/opc
git clone https://github.com/xghlkh/mlzb-chat.git ai-chat
cd ai-chat
```

### 第三步：安装 Node.js 20

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

验证：`node -v` 应显示 v20.x.x

### 第四步：安装依赖 + 构建

```bash
# 后端
cd server && npm install && npm run build && cd ..

# 前端（注意：vite.config.ts 里已经配了 base: '/aichat/'）
cd client && npm install && npm run build && cd ..
```

构建完成后，`client/dist/index.html` 里的资源路径会自动带上 `/aichat/` 前缀。

### 第五步：配置 API Key

```bash
cp server/.env.example server/.env
nano server/.env
```

填入你的 API Key，保存（Ctrl+X → Y → Enter）。

### 第六步：启动 Node.js 服务

先手动测试：

```bash
cd server && node dist/index.js
```

看到 `Server running at http://0.0.0.0:3000` 说明成功。Ctrl+C 停掉。

配置开机自启：

```bash
sudo tee /etc/systemd/system/ai-chat.service > /dev/null <<'EOF'
[Unit]
Description=AI Chat Server
After=network.target

[Service]
Type=simple
User=opc
WorkingDirectory=/home/opc/ai-chat/server
Environment="PORT=3000"
Environment="HOST=0.0.0.0"
ExecStart=/usr/bin/node /home/opc/ai-chat/server/dist/index.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start ai-chat
sudo systemctl enable ai-chat
sudo systemctl status ai-chat
```

### 第七步：配置 Nginx 反向代理

检查 Nginx 是否已安装：

```bash
nginx -v
```

如果没有：

```bash
sudo dnf install -y nginx
```

查看你现有的 Nginx 配置：

```bash
ls /etc/nginx/conf.d/
# 看看有没有已有的 .conf 文件
cat /etc/nginx/conf.d/*.conf
```

**情况 A：你已经有 mlzb.cc.cd 的 server 块**

直接在已有的 server 块里加上两个 location：

```nginx
# AI Chat 应用
location /aichat/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 86400s;
}

# AI Chat API
location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 86400s;
}
```

**情况 B：mlzb.cc.cd 还没有 server 块**

创建配置文件：

```bash
sudo nano /etc/nginx/conf.d/mlzb.conf
```

写入：

```nginx
server {
    listen 80;
    server_name mlzb.cc.cd;

    # AI Chat 应用
    location /aichat/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }

    # AI Chat API
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

保存后：

```bash
# 测试配置
sudo nginx -t

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 开放 80 端口
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload
```

### 第八步：Oracle Cloud 安全列表

登录 Oracle Cloud 控制台：

1. 左上角菜单 → **网络** → **虚拟云网络**
2. 点击你的 VCN
3. 点击子网 → **安全列表**
4. 点击默认安全列表 → **添加入站规则**
5. 添加一条：
   - 源 CIDR: `0.0.0.0/0`
   - 协议: **TCP**
   - 端口: **80**
6. 保存

### 第九步：DNS 确认

确认 `mlzb.cc.cd` 的 A 记录已经指向你的 Oracle Cloud 服务器公网 IP。

如果还没有，去你的域名管理面板（域名注册商或 DNS 服务商）添加：

| 类型 | 主机记录 | 记录值 |
|------|---------|--------|
| A | mlzb.cc.cd | 你的服务器公网IP |

### 第十步：测试访问

浏览器打开：**http://mlzb.cc.cd/aichat**

应该能看到 AI Chat 界面。点击右上角齿轮图标填入 API Key 即可使用。

---

## 后续更新

每次 push 新代码到 GitHub 后，在服务器上：

```bash
cd /home/opc/ai-chat
git pull
cd client && npm install && npm run build && cd ..
cd server && npm install && npm run build && cd ..
sudo systemctl restart ai-chat
```

或者用之前创建的 update.sh 脚本。

---

## 常见问题

**Q: 打开页面是空白或 404？**
- 检查 `client/dist/index.html` 是否存在
- 检查 Nginx 配置是否正确：`sudo nginx -t`
- 检查 Node.js 是否在运行：`sudo systemctl status ai-chat`

**Q: 页面能打开但 API 报错？**
- 检查 `/api/` 的 location 块是否加了
- 检查 Node.js 日志：`sudo journalctl -u ai-chat -n 50`

**Q: 流式输出卡住？**
- 确认 Nginx 配置了 `proxy_buffering off`
- 如果有 HTTPS，确认 SSL 也配了 `proxy_buffering off`

**Q: 想加 HTTPS？**
- 安装 certbot：`sudo dnf install certbot python3-certbot-nginx`
- 申请证书：`sudo certbot --nginx -d mlzb.cc.cd`
- 自动续期已配好，不需要手动操作
