/**
 * GitHub Gist 同步模块
 */

const GistSync = {
    STORAGE_TOKEN_KEY: 'github_pat',
    STORAGE_GIST_ID_KEY: 'github_gist_id',
    GIST_FILENAME: 'jp-travel-data.json',

    // 获取保存的 token
    getToken() {
        return localStorage.getItem(this.STORAGE_TOKEN_KEY);
    },

    // 保存 token
    setToken(token) {
        localStorage.setItem(this.STORAGE_TOKEN_KEY, token);
    },

    // 获取保存的 Gist ID
    getGistId() {
        return localStorage.getItem(this.STORAGE_GIST_ID_KEY);
    },

    // 保存 Gist ID
    setGistId(gistId) {
        localStorage.setItem(this.STORAGE_GIST_ID_KEY, gistId);
    },

    // 检查是否已配置
    isConfigured() {
        return !!(this.getToken() && this.getGistId());
    },

    // 清除配置
    clearConfig() {
        localStorage.removeItem(this.STORAGE_TOKEN_KEY);
        localStorage.removeItem(this.STORAGE_GIST_ID_KEY);
    },

    // 搜索用户已有的 Gist，查找 jp-travel-data.json 文件
    async findExistingGist() {
        const gists = await this.request('/gists');
        for (const gist of gists) {
            if (gist.files[this.GIST_FILENAME]) {
                return gist.id;
            }
        }
        return null;
    },

    // GitHub API 请求
    async request(endpoint, options = {}) {
        const token = this.getToken();
        if (!token) {
            throw new Error('未配置 GitHub Token');
        }

        const url = `https://api.github.com${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json',
                'X-GitHub-Api-Version': '2022-11-28',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `请求失败: ${response.status}`);
        }

        return response.json();
    },

    // 验证 Token 是否有效
    async validateToken(token) {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token 无效或已过期');
            }
            throw new Error(`验证失败: ${response.status}`);
        }

        return response.json();
    },

    // 首次连接：创建新的 Gist
    async createGist(data) {
        const gist = await this.request('/gists', {
            method: 'POST',
            body: JSON.stringify({
                description: '日本旅行计划数据',
                public: false,
                files: {
                    [this.GIST_FILENAME]: {
                        content: JSON.stringify(data, null, 2)
                    }
                }
            })
        });

        this.setGistId(gist.id);
        return gist;
    },

    // 读取 Gist 数据
    async loadFromGist() {
        const gistId = this.getGistId();
        if (!gistId) {
            throw new Error('未找到已保存的 Gist');
        }

        const gist = await this.request(`/gists/${gistId}`);
        const file = gist.files[this.GIST_FILENAME];

        if (!file) {
            throw new Error('Gist 中未找到数据文件');
        }

        return JSON.parse(file.content);
    },

    // 保存数据到 Gist
    async saveToGist(data) {
        const gistId = this.getGistId();
        const content = JSON.stringify(data, null, 2);

        if (!gistId) {
            // 首次保存，创建 Gist
            return await this.createGist(data);
        }

        // 更新现有 Gist
        return await this.request(`/gists/${gistId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                files: {
                    [this.GIST_FILENAME]: {
                        content
                    }
                }
            })
        });
    },

    // 完整的同步流程
    async sync(data) {
        try {
            await this.saveToGist(data);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // 完整的加载流程
    async load() {
        try {
            const data = await this.loadFromGist();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// 导出给全局使用
window.GistSync = GistSync;
