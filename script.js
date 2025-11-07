class ModernImageGenerator {
    constructor() {
        this.currentUser = null;
        this.usageInfo = null;
        this.initializeElements();
        this.bindEvents();
        this.autoResizeTextarea();
        this.checkUserSession();
        this.loadUsageInfo();
    }

    initializeElements() {
        // 用户信息相关
        this.userInfo = document.getElementById('userInfo');
        this.userName = document.getElementById('userName');
        this.usageCount = document.getElementById('usageCount');
        this.logoutBtn = document.getElementById('logoutBtn');

        // 权限横幅
        this.usageBanner = document.getElementById('usageBanner');
        this.usageBannerText = document.getElementById('usageBannerText');
        this.upgradeBtn = document.getElementById('upgradeBtn');

        // 输入相关元素
        this.promptTextarea = document.getElementById('prompt');
        this.exampleBtn = document.getElementById('exampleBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.exampleSection = document.getElementById('exampleSection');

        // 生成按钮相关
        this.generateBtn = document.getElementById('generateBtn');
        this.buttonContent = this.generateBtn.querySelector('.button-content');
        this.loadingIndicator = this.generateBtn.querySelector('.loading-indicator');

        // 结果显示相关
        this.resultSection = document.getElementById('resultSection');
        this.generatedImage = document.getElementById('generatedImage');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.newImageBtn = document.getElementById('newImageBtn');

        // 通知相关
        this.notification = document.getElementById('notification');
        this.notificationIcon = document.getElementById('notificationIcon');
        this.notificationText = document.getElementById('notificationText');
        this.notificationClose = document.getElementById('notificationClose');

        // 示例项
        this.exampleItems = document.querySelectorAll('.example-item');
    }

    bindEvents() {
        // 主要功能按钮
        this.generateBtn.addEventListener('click', () => this.generateImage());
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.newImageBtn.addEventListener('click', () => this.resetForNewImage());

        // 用户功能按钮
        this.logoutBtn.addEventListener('click', () => this.logout());

        // 输入辅助按钮
        this.exampleBtn.addEventListener('click', () => this.toggleExamples());
        this.clearBtn.addEventListener('click', () => this.clearPrompt());

        // 示例项点击
        this.exampleItems.forEach(item => {
            item.addEventListener('click', () => {
                const prompt = item.dataset.prompt;
                this.setPrompt(prompt);
                this.hideExamples();
            });
        });

        // 通知关闭
        this.notificationClose.addEventListener('click', () => this.hideNotification());

        // 快捷键支持
        this.promptTextarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.generateImage();
            }
            if (e.key === 'Escape') {
                this.hideExamples();
            }
        });

        // 输入框自动调整高度
        this.promptTextarea.addEventListener('input', () => this.autoResizeTextarea());

        // 图片加载事件
        this.generatedImage.addEventListener('load', () => {
            this.showNotification('图片生成成功！', 'success');
            this.loadUsageInfo(); // 重新加载使用情况
        });

        this.generatedImage.addEventListener('error', () => {
            this.showNotification('图片加载失败', 'error');
        });

        // 点击外部关闭示例
        document.addEventListener('click', (e) => {
            if (!this.exampleSection.contains(e.target) &&
                !this.exampleBtn.contains(e.target)) {
                this.hideExamples();
            }
        });
    }

    autoResizeTextarea() {
        this.promptTextarea.style.height = 'auto';
        this.promptTextarea.style.height = this.promptTextarea.scrollHeight + 'px';
    }

    setPrompt(text) {
        this.promptTextarea.value = text;
        this.autoResizeTextarea();
        this.promptTextarea.focus();

        // 添加动画效果
        this.promptTextarea.style.animation = 'pulse 0.3s ease-out';
        setTimeout(() => {
            this.promptTextarea.style.animation = '';
        }, 300);
    }

    clearPrompt() {
        this.promptTextarea.value = '';
        this.autoResizeTextarea();
        this.promptTextarea.focus();
        this.showNotification('已清空输入', 'info');
    }

    toggleExamples() {
        if (this.exampleSection.style.display === 'none') {
            this.showExamples();
        } else {
            this.hideExamples();
        }
    }

    showExamples() {
        this.exampleSection.style.display = 'block';
        this.exampleSection.style.animation = 'fadeIn 0.3s ease-out';
    }

    hideExamples() {
        this.exampleSection.style.display = 'none';
    }

    checkUserSession() {
        const userData = sessionStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUserDisplay();
        }
    }

    updateUserDisplay() {
        if (this.currentUser) {
            this.userInfo.style.display = 'flex';
            this.userName.textContent = this.currentUser.username;
        } else {
            this.userInfo.style.display = 'none';
        }
    }

    async loadUsageInfo() {
        try {
            const username = this.currentUser?.username;
            const url = username ? `/api/usage?username=${username}` : '/api/usage?username=anonymous';

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                this.usageInfo = data;
                this.updateUsageDisplay();
            }
        } catch (error) {
            console.error('获取使用情况失败:', error);
        }
    }

    updateUsageDisplay() {
        if (this.usageInfo) {
            const { usage, limit, remaining, canUse } = this.usageInfo;

            if (this.currentUser) {
                this.usageCount.textContent = `剩余次数: ${remaining}/${limit}`;
            } else {
                this.usageCount.textContent = `剩余次数: ${remaining}/${limit}`;
            }

            // 显示或隐藏权限横幅
            if (!canUse) {
                this.showUsageBanner();
            } else {
                this.hideUsageBanner();
            }
        }
    }

    showUsageBanner() {
        if (this.currentUser) {
            this.usageBannerText.textContent = `今日使用次数已用完(${this.usageInfo.limit}次)，请明天再试`;
            this.upgradeBtn.style.display = 'none';
        } else {
            this.usageBannerText.textContent = `未登录用户每日只能使用1次，登录可获得10次权限`;
            this.upgradeBtn.style.display = 'inline-block';
        }
        this.usageBanner.style.display = 'flex';
    }

    hideUsageBanner() {
        this.usageBanner.style.display = 'none';
    }

    logout() {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('token');
        this.currentUser = null;
        this.usageInfo = null;
        this.updateUserDisplay();
        this.hideUsageBanner();
        this.loadUsageInfo();
        this.showNotification('已退出登录', 'info');
    }

    async generateImage() {
        const prompt = this.promptTextarea.value.trim();

        if (!prompt) {
            this.showNotification('请输入图片描述', 'error');
            this.promptTextarea.focus();
            return;
        }

        // 检查使用权限
        if (this.usageInfo && !this.usageInfo.canUse) {
            if (this.currentUser) {
                this.showNotification(`今日使用次数已用完(${this.usageInfo.limit}次)，请明天再试`, 'error');
            } else {
                this.showNotification('未登录用户每日只能使用1次，请登录以获得更多权限', 'error');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            }
            return;
        }

        this.setLoading(true);
        this.hideExamples();
        this.hideNotification();

        try {
            this.showNotification('正在生成图片，请稍候...', 'info');

            const headers = {
                'Content-Type': 'application/json',
            };

            // 如果用户已登录，添加认证信息
            if (this.currentUser) {
                const token = sessionStorage.getItem('token');
                headers['Authorization'] = `Bearer ${token}`;
                headers['X-Username'] = this.currentUser.username;
            }

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ prompt })
            });

            const data = await response.json();

            if (data.success) {
                this.displayImage(data.imageUrl);
            } else {
                if (data.requireLogin) {
                    this.showNotification(data.error, 'error');
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 2000);
                } else {
                    this.showNotification(data.error || '生成图片失败，请重试', 'error');
                }
            }
        } catch (error) {
            console.error('生成图片错误:', error);
            this.showNotification('网络错误，请检查连接后重试', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.generateBtn.disabled = true;
            this.buttonContent.style.display = 'none';
            this.loadingIndicator.style.display = 'flex';
            this.generateBtn.style.cursor = 'not-allowed';
        } else {
            this.generateBtn.disabled = false;
            this.buttonContent.style.display = 'flex';
            this.loadingIndicator.style.display = 'none';
            this.generateBtn.style.cursor = 'pointer';
        }
    }

    displayImage(imageUrl) {
        this.generatedImage.src = imageUrl;
        this.resultSection.style.display = 'block';

        // 滚动到结果区域
        setTimeout(() => {
            this.resultSection.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }, 100);
    }

    async downloadImage() {
        try {
            // 创建临时链接下载图片
            const link = document.createElement('a');
            link.href = this.generatedImage.src;

            // 生成文件名
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `ai-image-${timestamp}.png`;

            link.download = filename;
            link.target = '_blank';

            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showNotification('图片已保存到本地', 'success');

        } catch (error) {
            console.error('保存图片错误:', error);
            this.showNotification('保存失败，请右键图片另存为', 'error');
        }
    }

    resetForNewImage() {
        this.resultSection.style.display = 'none';
        this.clearPrompt();
        this.hideNotification();

        // 滚动到顶部
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    showNotification(message, type = 'info') {
        this.notificationText.textContent = message;

        // 设置图标和样式
        this.notification.className = 'notification';
        this.notification.classList.add(type);

        switch (type) {
            case 'success':
                this.notificationIcon.textContent = '✅';
                break;
            case 'error':
                this.notificationIcon.textContent = '❌';
                break;
            case 'info':
            default:
                this.notificationIcon.textContent = 'ℹ️';
                break;
        }

        this.notification.style.display = 'flex';

        // 自动隐藏
        if (this.notification.hideTimeout) {
            clearTimeout(this.notification.hideTimeout);
        }

        this.notification.hideTimeout = setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }

    hideNotification() {
        this.notification.style.display = 'none';
        if (this.notification.hideTimeout) {
            clearTimeout(this.notification.hideTimeout);
        }
    }
}

// 添加额外的动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new ModernImageGenerator();

    // 添加加载完成动画
    document.body.style.opacity = '0';
    document.body.style.animation = 'fadeIn 0.5s ease-out forwards';
});

// 页面可见性改变时的处理
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // 页面重新可见时，隐藏通知
        const notification = document.getElementById('notification');
        if (notification && notification.style.display === 'flex') {
            setTimeout(() => {
                notification.style.display = 'none';
            }, 2000);
        }
    }
});

// 错误处理
window.addEventListener('error', (e) => {
    console.error('页面错误:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise拒绝:', e.reason);
});