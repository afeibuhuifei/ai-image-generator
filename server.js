const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

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

        console.log('生成图片请求:', prompt);

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