class OGImageGenerator {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.textInput = document.getElementById('text-input');
        this.bgColorPicker = document.getElementById('bg-color-picker');
        this.textColorPicker = document.getElementById('text-color-picker');
        this.generateBtn = document.getElementById('generate-btn');
        this.downloadBtn = document.getElementById('download-btn');
        this.colorPresets = document.querySelectorAll('.color-preset');
        this.textColorPresets = document.querySelectorAll('.text-color-preset');
        this.decorationBtns = document.querySelectorAll('.decoration-btn');
        this.urlInput = document.getElementById('url-input');
        this.fetchBtn = document.getElementById('fetch-btn');
        this.urlStatus = document.getElementById('url-status');
        this.langBtns = document.querySelectorAll('.lang-btn');
        
        this.currentStyle = 'solid';
        this.currentBgColor = '#BAE1FF';
        this.currentTextColor = '#333333';
        this.currentLang = this.detectLanguage();
        
        this.translations = {
            ja: {
                title: 'OGイメージジェネレーター',
                subtitle: 'ソーシャルメディア用のカスタムOGイメージを作成',
                pageTitle: 'OGイメージジェネレーター | 無料でソーシャルメディア用画像を作成',
                metaDescription: '無料のOGイメージジェネレーター。TwitterやFacebook用のカスタム画像を簡単作成。URL入力で自動取得、多彩な装飾スタイル、ダウンロード機能付き。',
                textLabel: 'テキスト',
                textPlaceholder: 'ここにテキストを入力してください...',
                urlLabel: 'URL入力（自動取得）※一部サイトはCORSエラーで取得できない場合があります',
                urlPlaceholder: 'https://example.com',
                fetchBtn: '取得',
                bgColorLabel: '背景色',
                textColorLabel: '文字色',
                customColor: 'カスタム色',
                decorationLabel: '装飾スタイル',
                decorationSolid: '単色',
                decorationStripe: 'ストライプ',
                decorationPattern: 'パターン',
                decorationFrame: 'フレーム',
                generateBtn: '生成',
                downloadBtn: '画像を保存',
                sampleText: 'サンプルテキスト',
                urlRequired: 'URLを入力してください',
                urlInvalid: '有効なURLを入力してください',
                fetching: '取得中...',
                fetchSuccess: '取得完了',
                fetchError: 'URL取得に失敗しました。CORSエラーまたはネットワークエラーの可能性があります',
                noData: 'タイトルを取得できませんでした'
            },
            en: {
                title: 'OG Image Generator',
                subtitle: 'Create custom OG images for social media',
                pageTitle: 'OG Image Generator | Free Social Media Image Creator',
                metaDescription: 'Free OG image generator for Twitter and Facebook. Easy custom image creation with URL auto-fetch, multiple decoration styles, and download functionality.',
                textLabel: 'Text',
                textPlaceholder: 'Enter your text here...',
                urlLabel: 'URL Input (Auto-fetch) *Some sites may not be accessible due to CORS errors',
                urlPlaceholder: 'https://example.com',
                fetchBtn: 'Fetch',
                bgColorLabel: 'Background Color',
                textColorLabel: 'Text Color',
                customColor: 'Custom Color',
                decorationLabel: 'Decoration Style',
                decorationSolid: 'Solid',
                decorationStripe: 'Stripe',
                decorationPattern: 'Pattern',
                decorationFrame: 'Frame',
                generateBtn: 'Generate',
                downloadBtn: 'Save Image',
                sampleText: 'Sample Text',
                urlRequired: 'Please enter a URL',
                urlInvalid: 'Please enter a valid URL',
                fetching: 'Fetching...',
                fetchSuccess: 'Fetch completed',
                fetchError: 'Failed to fetch URL. Possible CORS error or network error',
                noData: 'Could not retrieve title'
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateLanguage();
        this.generatePreview();
    }

    setupEventListeners() {
        this.generateBtn.addEventListener('click', () => this.generatePreview());
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.textInput.addEventListener('input', () => this.generatePreview());
        this.bgColorPicker.addEventListener('change', (e) => {
            this.currentBgColor = e.target.value;
            this.generatePreview();
        });
        this.textColorPicker.addEventListener('change', (e) => {
            this.currentTextColor = e.target.value;
            this.generatePreview();
        });

        this.colorPresets.forEach(preset => {
            preset.addEventListener('click', (e) => {
                this.colorPresets.forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                this.currentBgColor = e.target.dataset.color;
                this.bgColorPicker.value = this.currentBgColor;
                this.generatePreview();
            });
        });

        this.textColorPresets.forEach(preset => {
            preset.addEventListener('click', (e) => {
                this.textColorPresets.forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTextColor = e.target.dataset.color;
                this.textColorPicker.value = this.currentTextColor;
                this.generatePreview();
            });
        });

        this.decorationBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.decorationBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentStyle = e.target.dataset.style;
                this.generatePreview();
            });
        });

        this.fetchBtn.addEventListener('click', () => this.fetchUrlData());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.fetchUrlData();
            }
        });

        this.langBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.langBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentLang = e.target.dataset.lang;
                localStorage.setItem('oggen-lang', this.currentLang);
                this.updateLanguage();
            });
        });
    }

    generatePreview() {
        const text = this.textInput.value || this.translations[this.currentLang].sampleText;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
        this.drawText(text);
        
        this.downloadBtn.style.display = 'block';
    }

    drawBackground() {
        switch(this.currentStyle) {
            case 'solid':
                this.drawSolidBackground();
                break;
            case 'stripe':
                this.drawStripeBackground();
                break;
            case 'pattern':
                this.drawPatternBackground();
                break;
            case 'frame':
                this.drawFrameBackground();
                break;
        }
    }

    drawSolidBackground() {
        this.ctx.fillStyle = this.currentBgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawStripeBackground() {
        this.ctx.fillStyle = this.currentBgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = this.adjustOpacity(this.currentTextColor, 0.15);
        const stripeWidth = 30;
        const angle = Math.PI / 4; // 45度
        
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.rotate(angle);
        
        const diagonal = Math.sqrt(this.canvas.width * this.canvas.width + this.canvas.height * this.canvas.height);
        const startX = -diagonal;
        const endX = diagonal;
        
        for (let x = startX; x < endX; x += stripeWidth * 2) {
            this.ctx.fillRect(x, -diagonal, stripeWidth, diagonal * 2);
        }
        
        this.ctx.restore();
    }

    drawPatternBackground() {
        this.ctx.fillStyle = this.currentBgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = this.adjustOpacity(this.currentTextColor, 0.1);
        const dotSize = 4;
        const spacing = 40;
        
        for (let x = 0; x < this.canvas.width; x += spacing) {
            for (let y = 0; y < this.canvas.height; y += spacing) {
                this.ctx.beginPath();
                this.ctx.arc(x + spacing/2, y + spacing/2, dotSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    drawFrameBackground() {
        this.ctx.fillStyle = this.currentBgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const frameWidth = 60;
        const cornerRadius = 30;
        const innerX = frameWidth;
        const innerY = frameWidth;
        const innerWidth = this.canvas.width - frameWidth * 2;
        const innerHeight = this.canvas.height - frameWidth * 2;
        
        this.ctx.fillStyle = '#ffffff';
        this.drawRoundedRect(innerX, innerY, innerWidth, innerHeight, cornerRadius);
    }
    
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
        
    }

    drawText(text) {
        this.ctx.fillStyle = this.currentTextColor;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const horizontalMargin = this.currentStyle === 'frame' ? 200 : 100;
        const maxWidth = this.canvas.width - horizontalMargin;
        const x = this.canvas.width / 2;
        const y = this.canvas.height / 2;
        
        const lines = this.wrapText(text, maxWidth);
        const fontSize = this.calculateFontSize(lines, maxWidth);
        this.ctx.font = `bold ${fontSize}px 'Hiragino Sans', 'ヒラギノ角ゴ ProN W3', 'Yu Gothic', '游ゴシック', 'Meiryo', 'メイリオ', sans-serif`;
        
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const startY = y - totalHeight / 2 + lineHeight / 2;
        
        lines.forEach((line, index) => {
            const currentY = startY + index * lineHeight;
            
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            
            this.ctx.fillText(line, x, currentY);
            
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        });
    }

    wrapText(text, maxWidth) {
        this.ctx.font = '60px sans-serif';
        
        // まず改行文字で分割
        const paragraphs = text.split('\n');
        const allLines = [];
        
        paragraphs.forEach((paragraph, paragraphIndex) => {
            if (paragraph.trim() === '') {
                // 空行の場合
                allLines.push('');
                return;
            }
            
            // 各段落を文字単位で折り返し処理
            const characters = paragraph.split('');
            let currentLine = '';
            
            for (let i = 0; i < characters.length; i++) {
                const testLine = currentLine + characters[i];
                const metrics = this.ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && currentLine !== '') {
                    allLines.push(currentLine);
                    currentLine = characters[i];
                } else {
                    currentLine = testLine;
                }
            }
            
            if (currentLine !== '') {
                allLines.push(currentLine);
            }
        });
        
        return allLines.length > 0 ? allLines : [text];
    }

    calculateFontSize(lines, maxWidth) {
        let fontSize = 120;
        const maxLines = 4;
        
        if (lines.length > maxLines) {
            fontSize = Math.max(40, 120 - (lines.length - maxLines) * 15);
        }
        
        this.ctx.font = `bold ${fontSize}px sans-serif`;
        const longestLine = lines.reduce((a, b) => a.length > b.length ? a : b);
        
        while (fontSize > 20) {
            this.ctx.font = `bold ${fontSize}px sans-serif`;
            if (this.ctx.measureText(longestLine).width <= maxWidth) {
                break;
            }
            fontSize -= 5;
        }
        
        return Math.max(fontSize, 20);
    }

    adjustBrightness(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    adjustOpacity(hex, opacity) {
        const num = parseInt(hex.replace('#', ''), 16);
        const R = num >> 16;
        const G = num >> 8 & 0x00FF;
        const B = num & 0x0000FF;
        
        return `rgba(${R}, ${G}, ${B}, ${opacity})`;
    }

    downloadImage() {
        const link = document.createElement('a');
        link.download = 'og-image.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }

    async fetchUrlData() {
        const url = this.urlInput.value.trim();
        
        if (!url) {
            this.showStatus(this.translations[this.currentLang].urlRequired, 'error');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showStatus(this.translations[this.currentLang].urlInvalid, 'error');
            return;
        }

        this.fetchBtn.disabled = true;
        this.showStatus(this.translations[this.currentLang].fetching, 'loading');

        try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error('ネットワークエラーが発生しました');
            }

            const data = await response.json();
            const htmlContent = data.contents;
            
            const { title } = this.parseHtmlMeta(htmlContent);
            
            if (!title) {
                this.showStatus(this.translations[this.currentLang].noData, 'error');
                return;
            }

            const truncatedTitle = this.truncateText(title, 100);
            
            this.textInput.value = truncatedTitle;
            this.generatePreview();
            
            this.showStatus(this.translations[this.currentLang].fetchSuccess, 'success');
            
        } catch (error) {
            console.error('URL取得エラー:', error);
            this.showStatus(this.translations[this.currentLang].fetchError, 'error');
        } finally {
            this.fetchBtn.disabled = false;
        }
    }

    parseHtmlMeta(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const title = doc.querySelector('title')?.textContent || 
                     doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
        
        return { title: title.trim() };
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    showStatus(message, type) {
        this.urlStatus.textContent = message;
        this.urlStatus.className = `url-status ${type}`;
        
        if (type === 'success') {
            setTimeout(() => {
                this.urlStatus.textContent = '';
                this.urlStatus.className = 'url-status';
            }, 3000);
        }
    }

    detectLanguage() {
        const saved = localStorage.getItem('oggen-lang');
        if (saved && (saved === 'ja' || saved === 'en')) {
            return saved;
        }
        
        const browserLang = navigator.language || navigator.userLanguage;
        return browserLang.startsWith('ja') ? 'ja' : 'en';
    }

    updateLanguage() {
        const t = this.translations[this.currentLang];
        
        this.langBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
        });
        
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.dataset.i18n;
            if (t[key]) {
                element.textContent = t[key];
            }
        });
        
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.dataset.i18nPlaceholder;
            if (t[key]) {
                element.placeholder = t[key];
            }
        });
        
        document.documentElement.lang = this.currentLang;
        
        // Update page title
        const titleElement = document.querySelector('title');
        if (titleElement && t.pageTitle) {
            titleElement.textContent = t.pageTitle;
        }
        
        // Update meta description
        const metaDescElement = document.querySelector('meta[name="description"]');
        if (metaDescElement && t.metaDescription) {
            metaDescElement.setAttribute('content', t.metaDescription);
        }
        
        // Update language meta tag
        const languageElement = document.querySelector('meta[name="language"]');
        if (languageElement) {
            languageElement.setAttribute('content', this.currentLang);
        }
        
        // Update Open Graph tags
        const ogTitleElement = document.querySelector('meta[property="og:title"]');
        if (ogTitleElement && t.pageTitle) {
            ogTitleElement.setAttribute('content', t.pageTitle);
        }
        
        const ogDescElement = document.querySelector('meta[property="og:description"]');
        if (ogDescElement && t.metaDescription) {
            ogDescElement.setAttribute('content', t.metaDescription);
        }
        
        const ogLocaleElement = document.querySelector('meta[property="og:locale"]');
        if (ogLocaleElement) {
            const locale = this.currentLang === 'ja' ? 'ja_JP' : 'en_US';
            ogLocaleElement.setAttribute('content', locale);
        }
        
        // Update Twitter Card tags
        const twitterTitleElement = document.querySelector('meta[name="twitter:title"]');
        if (twitterTitleElement && t.pageTitle) {
            twitterTitleElement.setAttribute('content', t.pageTitle);
        }
        
        const twitterDescElement = document.querySelector('meta[name="twitter:description"]');
        if (twitterDescElement && t.metaDescription) {
            twitterDescElement.setAttribute('content', t.metaDescription);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new OGImageGenerator();
});