# AI图片生成器

一个基于智谱AI API的现代化图片生成Web应用，支持中文输入，界面美观优雅。

## 功能特点

- 🎨 **智能图片生成** - 基于智谱AI的cogview-4模型
- 🌏 **中文支持** - 完美支持中文提示词输入
- 💎 **现代界面** - 美观优雅的渐变设计风格
- 📱 **响应式设计** - 完美适配桌面和移动设备
- ⚡ **实时预览** - 即时生成和预览图片
- 💾 **一键保存** - 支持图片下载到本地
- 🚀 **高性能** - 基于Express.js的快速后端

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (ES6+)
- **后端**: Node.js + Express.js
- **API**: 智谱AI cogview-4 图片生成API
- **样式**: 现代CSS渐变 + 动画效果
- **部署**: Vercel + 自定义域名

## 快速开始

### 本地运行

1. 克隆项目
```bash
git clone https://github.com/yourusername/ai-image-generator.git
cd ai-image-generator
```

2. 安装依赖
```bash
npm install
```

3. 启动服务
```bash
npm start
```

4. 访问应用
打开浏览器访问 http://localhost:3000

### 在线体验

🌐 [planet-industry.space](https://planet-industry.space)

## 使用说明

1. 在输入框中输入你想要生成的图片描述（支持中文）
2. 点击"生成图片"按钮
3. 等待几秒钟，即可看到生成的精美图片
4. 点击图片上方的"保存图片"按钮下载到本地
5. 点击"生成新图片"可以创建新的作品

## 项目结构

```
ai-image-generator/
├── index.html          # 主页面
├── style.css           # 样式文件
├── script.js           # 前端逻辑
├── server.js           # 后端服务
├── package.json        # 项目配置
├── README.md           # 项目说明
└── .gitignore         # Git忽略文件
```

## API配置

项目使用智谱AI的cogview-4模型进行图片生成。如需使用自己的API密钥，请修改 `server.js` 中的Authorization头：

```javascript
Authorization: 'Bearer YOUR_API_KEY'
```

## 开发命令

```bash
npm start       # 启动生产服务器
npm run dev     # 启动开发服务器（需要安装nodemon）
npm test        # 运行测试
```

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License

---

🎨 用AI创造无限可能