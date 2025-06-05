class KanjiConverter {
    constructor() {
        this.conversions = {
            '特に': 'とくに',
            '例えば': 'たとえば',
            '次に': 'つぎに',
            '一つ': 'ひとつ',
            '実は': 'じつは',
            '確かに': 'たしかに',
            '一方': 'いっぽう',
            '出来': 'でき',
            '良い': 'よい',
            '更に': 'さらに',
            '是非': 'ぜひ',
            '時々': 'ときどき',
            '何も': 'なにも',
            'する上で': 'するうえで',
            '色々': 'いろいろ',
            '様々': 'さまざま',
            '共に': 'ともに',
            '時': 'とき',
            '時には': 'ときには',
            'る時': 'るとき',
            'する時': 'するとき',
            'た時': 'たとき',
            'した時': 'したとき',
            'こんな時': 'こんなとき',
            'そんな時': 'そんなとき',
            'あんな時': 'あんなとき',
            'どんな時': 'どんなとき',
            'この時': 'このとき',
            'その時': 'そのとき',
            'あの時': 'あのとき',
            'どの時': 'どのとき'
        };
        
        this.init();
    }
    
    init() {
        this.inputText = document.getElementById('inputText');
        this.outputText = document.getElementById('outputText');
        this.convertBtn = document.getElementById('convertBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.selectAllBtn = document.getElementById('selectAll');
        this.deselectAllBtn = document.getElementById('deselectAll');
        this.selectNonTimeBtn = document.getElementById('selectNonTime');
        this.checkboxes = document.querySelectorAll('.checkbox-grid input[type="checkbox"]');
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.convertBtn.addEventListener('click', () => this.convert());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.selectAllBtn.addEventListener('click', () => this.selectAll());
        this.deselectAllBtn.addEventListener('click', () => this.deselectAll());
        this.selectNonTimeBtn.addEventListener('click', () => this.selectNonTime());
        
        this.inputText.addEventListener('input', () => this.updateCopyButtonState());
        this.updateCopyButtonState();
    }
    
    convert() {
        const inputValue = this.inputText.value;
        if (!inputValue.trim()) {
            alert('変換するテキストを入力してください。');
            return;
        }
        
        let result = inputValue;
        const enabledConversions = this.getEnabledConversions();
        
        for (const [kanji, hiragana] of enabledConversions) {
            const regex = new RegExp(this.escapeRegExp(kanji), 'g');
            result = result.replace(regex, hiragana);
        }
        
        this.outputText.value = result;
        this.updateCopyButtonState();
    }
    
    getEnabledConversions() {
        const enabled = [];
        this.checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const kanji = checkbox.value;
                const hiragana = this.conversions[kanji];
                if (hiragana) {
                    enabled.push([kanji, hiragana]);
                }
            }
        });
        
        enabled.sort((a, b) => b[0].length - a[0].length);
        return enabled;
    }
    
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    selectAll() {
        this.checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }
    
    deselectAll() {
        this.checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    selectNonTime() {
        const timeRelatedValues = ['時', '時には', 'る時', 'する時', 'た時', 'した時', 'こんな時', 'そんな時', 'あんな時', 'どんな時', 'この時', 'その時', 'あの時', 'どの時'];
        
        this.checkboxes.forEach(checkbox => {
            if (timeRelatedValues.includes(checkbox.value)) {
                checkbox.checked = false;
            } else {
                checkbox.checked = true;
            }
        });
    }
    
    async copyToClipboard() {
        if (!this.outputText.value.trim()) {
            alert('コピーする内容がありません。');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(this.outputText.value);
            
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = 'コピーしました！';
            this.copyBtn.style.backgroundColor = '#27ae60';
            
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
                this.copyBtn.style.backgroundColor = '';
            }, 2000);
            
        } catch (err) {
            this.outputText.select();
            document.execCommand('copy');
            
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = 'コピーしました！';
            
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
            }, 2000);
        }
    }
    
    updateCopyButtonState() {
        const hasOutput = this.outputText.value.trim().length > 0;
        this.copyBtn.disabled = !hasOutput;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new KanjiConverter();
});