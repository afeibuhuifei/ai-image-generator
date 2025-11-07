class ImageGenerator {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.promptInput = document.getElementById('prompt');
        this.generateBtn = document.getElementById('generateBtn');
        this.btnText = this.generateBtn.querySelector('.btn-text');
        this.loadingSpinner = this.generateBtn.querySelector('.loading-spinner');
        this.resultSection = document.getElementById('resultSection');
        this.generatedImage = document.getElementById('generatedImage');
        this.saveBtn = document.getElementById('saveBtn');
        this.newImageBtn = document.getElementById('newImageBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.imageOverlay = document.getElementById('imageOverlay');
    }

    bindEvents() {
        this.generateBtn.addEventListener('click', () => this.generateImage());
        this.saveBtn.addEventListener('click', () => this.saveImage());
        this.newImageBtn.addEventListener('click', () => this.resetForNewImage());

        // Enter键触发生成
        this.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.generateImage();
            }
        });

        // 图片加载完成时显示保存按钮
        this.generatedImage.addEventListener('load', () => {
            this.imageOverlay.style.display = 'flex';
        });
    }

    async generateImage() {
        const prompt = this.promptInput.value.trim();

        if (!prompt) {
            this.showError('请输入图片描述');
            return;
        }

        this.setLoading(true);
        this.hideError();

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt })
            });

            const data = await response.json();

            if (data.success) {
                this.displayImage(data.imageUrl);
            } else {
                this.showError(data.error || '生成图片失败，请重试');
            }
        } catch (error) {
            console.error('生成图片错误:', error);
            this.showError('网络错误，请检查连接后重试');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.generateBtn.disabled = true;
            this.btnText.style.opacity = '0';
            this.loadingSpinner.style.display = 'block';
        } else {
            this.generateBtn.disabled = false;
            this.btnText.style.opacity = '1';
            this.loadingSpinner.style.display = 'none';
        }
    }

    displayImage(imageUrl) {
        this.generatedImage.src = imageUrl;
        this.resultSection.style.display = 'block';
        this.imageOverlay.style.display = 'none'; // 先隐藏，图片加载完成后再显示

        // 滚动到图片位置
        setTimeout(() => {
            this.resultSection.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }, 100);
    }

    async saveImage() {
        try {
            // 创建一个临时链接来下载图片
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

            // 显示保存成功提示
            this.showSuccessMessage('图片已保存到本地');

        } catch (error) {
            console.error('保存图片错误:', error);
            this.showError('保存失败，请右键图片另存为');
        }
    }

    resetForNewImage() {
        this.resultSection.style.display = 'none';
        this.promptInput.value = '';
        this.promptInput.focus();
        this.hideError();
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'flex';

        // 3秒后自动隐藏错误消息
        setTimeout(() => {
            this.hideError();
        }, 3000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    showSuccessMessage(message) {
        // 创建成功提示元素
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <span class="success-icon">✅</span>
            <span class="success-text">${message}</span>
        `;

        // 添加成功样式
        successDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 16px;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 12px;
            color: #16a34a;
            margin-top: 20px;
            animation: fadeIn 0.3s ease-out;
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        `;

        document.body.appendChild(successDiv);

        // 2秒后移除成功提示
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 2000);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new ImageGenerator();
});

// 添加一些增强用户体验的功能
document.addEventListener('DOMContentLoaded', () => {
    // 自动调整输入框高度
    const promptInput = document.getElementById('prompt');

    function autoResize() {
        promptInput.style.height = 'auto';
        promptInput.style.height = promptInput.scrollHeight + 'px';
    }

    promptInput.addEventListener('input', autoResize);

    // 添加一些示例提示词
    const examplePrompts = [
        '一只可爱的猫咪坐在舒适的沙发上',
        '美丽的山景，日出时分的金色光芒',
        '未来科技城市，霓虹灯闪烁',
        '温馨的咖啡厅，温暖的灯光',
        '抽象艺术，色彩斑斓的几何图形'
    ];

    // 为输入框添加placeholder随机示例
    let placeholderIndex = 0;
    function updatePlaceholder() {
        promptInput.placeholder = `例如：${examplePrompts[placeholderIndex]}`;
        placeholderIndex = (placeholderIndex + 1) % examplePrompts.length;
    }

    updatePlaceholder();
    setInterval(updatePlaceholder, 5000);
});