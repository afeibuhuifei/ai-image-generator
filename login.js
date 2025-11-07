class LoginManager {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.checkExistingSession();
    }

    initializeElements() {
        this.loginForm = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.loginButton = this.loginForm.querySelector('.login-button');
        this.buttonText = this.loginButton.querySelector('.button-text');
        this.loadingIndicator = this.loginButton.querySelector('.loading-indicator');

        // 通知相关
        this.notification = document.getElementById('notification');
        this.notificationIcon = document.getElementById('notificationIcon');
        this.notificationText = document.getElementById('notificationText');
        this.notificationClose = document.getElementById('notificationClose');
    }

    bindEvents() {
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        this.notificationClose.addEventListener('click', () => {
            this.hideNotification();
        });

        // 快捷键支持
        this.passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleLogin();
            }
        });
    }

    checkExistingSession() {
        const currentUser = sessionStorage.getItem('currentUser');
        if (currentUser) {
            // 已登录用户，跳转到主页
            window.location.href = '/';
        }
    }

    async handleLogin() {
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();

        if (!username || !password) {
            this.showNotification('请输入用户名和密码', 'error');
            return;
        }

        this.setLoading(true);
        this.hideNotification();

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                // 登录成功，保存用户信息
                sessionStorage.setItem('currentUser', JSON.stringify(data.user));
                sessionStorage.setItem('token', data.token);

                this.showNotification('登录成功！正在跳转...', 'success');

                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                this.showNotification(data.error || '登录失败，请检查用户名和密码', 'error');
            }
        } catch (error) {
            console.error('登录错误:', error);
            this.showNotification('网络错误，请稍后重试', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.loginButton.disabled = true;
            this.buttonText.style.display = 'none';
            this.loadingIndicator.style.display = 'flex';
        } else {
            this.loginButton.disabled = false;
            this.buttonText.style.display = 'block';
            this.loadingIndicator.style.display = 'none';
        }
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();

    // 添加加载完成动画
    document.body.style.opacity = '0';
    document.body.style.animation = 'fadeIn 0.5s ease-out forwards';
});

// 错误处理
window.addEventListener('error', (e) => {
    console.error('页面错误:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise拒绝:', e.reason);
});