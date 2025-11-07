const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 用户数据存储（生产环境应使用数据库）
const users = {
    '123': {
        username: '123',
        password: '123', // 实际应用中应该存储加密后的密码
        dailyLimit: 10
    }
};

// 用户使用记录（生产环境应使用数据库）
const userUsage = {};

// 获取今日日期字符串
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

// 获取或初始化用户使用记录
function getUserUsage(userId) {
    const today = getTodayString();
    if (!userUsage[userId]) {
        userUsage[userId] = {};
    }
    if (!userUsage[userId][today]) {
        userUsage[userId][today] = 0;
    }
    return userUsage[userId][today];
}

// 增加用户使用次数
function incrementUserUsage(userId) {
    const today = getTodayString();
    if (!userUsage[userId]) {
        userUsage[userId] = {};
    }
    if (!userUsage[userId][today]) {
        userUsage[userId][today] = 0;
    }
    userUsage[userId][today]++;
    return userUsage[userId][today];
}

// 检查用户是否可以使用
function canUserUse(userId, dailyLimit) {
    const usage = getUserUsage(userId);
    return usage < dailyLimit;
}

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 生成简单的token
function generateToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 登录API
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: '请输入用户名和密码'
            });
        }

        // 验证用户
        const user = users[username];
        if (!user || user.password !== password) {
            return res.status(401).json({
                success: false,
                error: '用户名或密码错误'
            });
        }

        // 生成token
        const token = generateToken();

        // 返回用户信息（不包含密码）
        const userResponse = {
            username: user.username,
            dailyLimit: user.dailyLimit
        };

        res.json({
            success: true,
            user: userResponse,
            token: token
        });

    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误'
        });
    }
});

// 获取用户使用情况API
app.get('/api/usage', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const username = req.query.username;

        if (!username) {
            return res.status(400).json({
                success: false,
                error: '缺少用户名'
            });
        }

        const user = users[username];
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            });
        }

        const usage = getUserUsage(username);
        const remaining = user.dailyLimit - usage;

        res.json({
            success: true,
            usage: usage,
            limit: user.dailyLimit,
            remaining: remaining,
            canUse: remaining > 0
        });

    } catch (error) {
        console.error('获取使用情况错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误'
        });
    }
});

// 图片生成API
app.post('/api/generate', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({
                success: false,
                error: '请输入图片描述'
            });
        }

        // 检查用户权限
        let username = null;
        let dailyLimit = 1; // 默认未登录用户限制

        // 尝试从session获取用户信息（简化处理）
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            // 这里应该验证token，简化处理直接从请求中获取用户名
            username = req.headers['x-username'];
        }

        if (username && users[username]) {
            dailyLimit = users[username].dailyLimit;
        }

        // 检查使用权限
        if (!canUserUse(username || 'anonymous', dailyLimit)) {
            const usage = getUserUsage(username || 'anonymous');
            const remaining = dailyLimit - usage;

            if (username) {
                return res.status(429).json({
                    success: false,
                    error: `今日使用次数已用完(${dailyLimit}次)，请明天再试`,
                    usage: usage,
                    limit: dailyLimit,
                    remaining: remaining,
                    requireLogin: false
                });
            } else {
                return res.status(429).json({
                    success: false,
                    error: `未登录用户每日只能使用1次，请登录以获得更多权限`,
                    usage: usage,
                    limit: dailyLimit,
                    remaining: remaining,
                    requireLogin: true
                });
            }
        }

        // 增加使用次数
        incrementUserUsage(username || 'anonymous');
        console.log('生成图片请求:', prompt, '用户:', username || 'anonymous');

        const url = 'https://open.bigmodel.cn/api/paas/v4/images/generations';
        const options = {
            method: 'POST',
            headers: {
                Authorization: 'Bearer 71900077ef354082a217e1a88a0319e9.FVEUVzVJJNRMymHf',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "cogview-4-250304",
                prompt: prompt,
                size: "1024x1024",
                quality: "standard"
            })
        };

        // 添加超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            const imageUrl = data.data[0].url;
            console.log('图片生成成功:', imageUrl);

            res.json({
                success: true,
                imageUrl: imageUrl
            });
        } else {
            console.error('生成图片失败:', data);
            res.status(500).json({
                success: false,
                error: '生成图片失败，请稍后重试'
            });
        }

    } catch (error) {
        console.error('服务器错误:', error);

        if (error.name === 'AbortError') {
            res.status(408).json({
                success: false,
                error: '请求超时，请稍后重试'
            });
        } else {
            res.status(500).json({
                success: false,
                error: '服务器错误，请稍后重试'
            });
        }
    }
});

// 提供下载功能的API（可选）
app.get('/api/download', async (req, res) => {
    try {
        const { imageUrl, filename } = req.query;

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                error: '缺少图片URL'
            });
        }

        const https = require('https');
        const http = require('http');
        const protocol = imageUrl.startsWith('https:') ? https : http;

        protocol.get(imageUrl, (response) => {
            if (response.statusCode !== 200) {
                return res.status(400).json({
                    success: false,
                    error: '无法下载图片'
                });
            }

            // 设置响应头
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', `attachment; filename="${filename || 'generated-image.png'}"`);

            // 将图片流传输给客户端
            response.pipe(res);
        }).on('error', (error) => {
            console.error('下载错误:', error);
            res.status(500).json({
                success: false,
                error: '下载失败'
            });
        });

    } catch (error) {
        console.error('下载服务错误:', error);
        res.status(500).json({
            success: false,
            error: '下载服务错误'
        });
    }
});

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('未处理的错误:', err);
    res.status(500).json({
        success: false,
        error: '服务器内部错误'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`\n🚀 AI图片生成器服务已启动!`);
    console.log(`📍 访问地址: http://localhost:${PORT}`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
    console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n按 Ctrl+C 停止服务器\n`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 正在关闭服务器...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 正在关闭服务器...');
    process.exit(0);
});