class DialPulseDialer {
    constructor() {
        this.audioContext = null;
        this.currentAudio = null;
        this.isPlaying = false;
        this.inputNumber = '';
        this.pulseMode = '10';
        this.sampleRate = 8000;
        
        // DTMF周波数テーブル
        this.dtmfFrequencies = {
            '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
            '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
            '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
            '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
        };
        
        this.init();
    }
    
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.updateStatus('待機中...');
    }
    
    setupElements() {
        this.numberInput = document.getElementById('numberInput');
        this.resetBtn = document.getElementById('resetBtn');
        this.playBtn = document.getElementById('playBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.statusText = document.getElementById('statusText');
        this.keyButtons = document.querySelectorAll('.key-btn');
        this.pulseModeRadios = document.querySelectorAll('input[name="pulseMode"]');
    }
    
    setupEventListeners() {
        this.keyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.addNumber(btn.dataset.number);
            });
        });
        
        this.resetBtn.addEventListener('click', () => {
            this.reset();
        });
        
        this.playBtn.addEventListener('click', () => {
            this.playDialPulse();
        });
        
        this.stopBtn.addEventListener('click', () => {
            this.stopPlayback();
        });
        
        this.pulseModeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.pulseMode = radio.value;
            });
        });
        
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }
    
    handleKeyPress(e) {
        const key = e.key;
        
        if (key >= '0' && key <= '9') {
            this.addNumber(key);
        } else if (key === '*') {
            this.addNumber('*');
        } else if (key === '#') {
            this.addNumber('#');
        } else if (key === 'Backspace') {
            this.removeLastNumber();
        } else if (key === 'Enter') {
            this.playDialPulse();
        } else if (key === 'Escape') {
            this.stopPlayback();
        } else if (key === 'Delete') {
            this.reset();
        }
    }
    
    addNumber(number) {
        if (this.inputNumber.length >= 128) return;
        
        this.inputNumber += number;
        this.numberInput.value = this.inputNumber;
        this.updateStatus(`番号入力: ${this.inputNumber}`);
    }
    
    removeLastNumber() {
        this.inputNumber = this.inputNumber.slice(0, -1);
        this.numberInput.value = this.inputNumber;
        this.updateStatus(this.inputNumber ? `番号入力: ${this.inputNumber}` : '待機中...');
    }
    
    reset() {
        this.inputNumber = '';
        this.numberInput.value = '';
        this.stopPlayback();
        this.updateStatus('待機中...');
    }
    
    async playDialPulse() {
        if (!this.inputNumber) {
            this.updateStatus('番号を入力してください');
            return;
        }
        
        if (this.isPlaying) {
            this.updateStatus('既に再生中です');
            return;
        }
        
        try {
            this.isPlaying = true;
            this.playBtn.disabled = true;
            this.updateStatus('音響再生開始準備中...');
            
            await this.initAudioContext();
            
            // 音の最初が切れるのを防ぐため1秒待機
            await this.delay(1000);
            
            this.updateStatus('ダイヤルパルス生成中...');
            await this.generateAndPlayDialSequence();
            
        } catch (error) {
            console.error('Audio playback error:', error);
            this.updateStatus('エラー: 音響再生に失敗しました');
        } finally {
            this.isPlaying = false;
            this.playBtn.disabled = false;
            this.updateStatus('再生完了');
        }
    }
    
    async initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        // ChromeのAudioContextの最初の音が切れる問題を回避するため、ダミー音を再生
        await this.playDummySound();
    }
    
    async playDummySound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 無音に近い音量でダミー音を再生
        oscillator.frequency.value = 440;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.001, this.audioContext.currentTime);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
        
        return new Promise(resolve => {
            oscillator.onended = resolve;
        });
    }
    
    async generateAndPlayDialSequence() {
        if (this.pulseMode === 'dtmf') {
            // DTMF方式の場合
            await this.generateDTMFSequence();
        } else {
            // パルス方式の場合
            const digits = [];
            for (let i = 0; i < this.inputNumber.length; i++) {
                const char = this.inputNumber[i];
                if (char >= '0' && char <= '9') {
                    digits.push(parseInt(char));
                } else if (char === '*' || char === '#') {
                    // 特殊文字の場合はDTMF音を生成
                    await this.generateSpecialTone(char);
                    if (i < this.inputNumber.length - 1) {
                        await this.delay(600); // 数字間間隔
                    }
                    continue;
                }
            }
            
            // ダイヤルパルス信号を生成
            const signal = this.generateDialSequence(digits);
            
            // 音声を再生
            await this.playAudioBuffer(signal);
        }
    }
    
    generateDialSequence(digits) {
        let fullSignal = [];
        
        for (let i = 0; i < digits.length; i++) {
            const digit = digits[i];
            this.updateStatus(`ダイヤル中: ${digit} (${i + 1}/${digits.length})`);
            
            const pulseSignal = this.generateClickPulse(digit);
            fullSignal = fullSignal.concat(pulseSignal);
        }
        
        return fullSignal;
    }
    
    generateClickPulse(digit) {
        // パルス数決定（10pps/20pps対応）
        const basePulseCount = digit === 0 ? 10 : digit;
        const pulseCount = this.pulseMode === '20' ? basePulseCount * 2 : basePulseCount;
        
        // タイミング設定
        const makeTime = 0.04;    // 40ms - 音の持続時間
        const breakTime = 0.06;   // 60ms - 無音時間
        const interDigit = 0.6;   // 600ms - 数字間間隔
        
        // 20ppsの場合は時間を半分にする
        const actualMakeTime = this.pulseMode === '20' ? makeTime / 2 : makeTime;
        const actualBreakTime = this.pulseMode === '20' ? breakTime / 2 : breakTime;
        
        let signal = [];
        
        for (let i = 0; i < pulseCount; i++) {
            // カーボンマイク対応の強い方形波クリック音を生成
            const clickSamples = Math.floor(this.sampleRate * actualMakeTime);
            let click = [];
            
            // 低周波数の方形波を生成（500Hz-1000Hz帯域）
            const frequency1 = 500;  // 基本周波数
            const frequency2 = 1000; // 倍音
            const amplitude = 0.4;   // 音量を大幅に増加
            
            for (let j = 0; j < clickSamples; j++) {
                const t = j / this.sampleRate;
                // 2つの方形波を合成
                const wave1 = Math.sign(Math.sin(2 * Math.PI * frequency1 * t)) * amplitude;
                const wave2 = Math.sign(Math.sin(2 * Math.PI * frequency2 * t)) * amplitude * 0.3;
                click.push(wave1 + wave2);
            }
            
            // 矩形波的エンベロープ（急激な立ち上がり・立ち下がり）
            const envelopeLength = Math.floor(clickSamples * 0.02); // 非常に短い立ち上がり
            
            // 立ち上がり（急激）
            for (let j = 0; j < envelopeLength; j++) {
                click[j] *= j / envelopeLength;
            }
            
            // 立ち下がり（急激）
            for (let j = 0; j < envelopeLength; j++) {
                const index = clickSamples - 1 - j;
                click[index] *= j / envelopeLength;
            }
            
            // クリック音を信号に追加
            signal = signal.concat(click);
            
            // 無音期間（最後のパルス以外）
            if (i < pulseCount - 1) {
                const silenceSamples = Math.floor(this.sampleRate * actualBreakTime);
                const silence = new Array(silenceSamples).fill(0);
                signal = signal.concat(silence);
            }
        }
        
        // 数字間間隔
        const interSamples = Math.floor(this.sampleRate * interDigit);
        const interSilence = new Array(interSamples).fill(0);
        signal = signal.concat(interSilence);
        
        return signal;
    }
    
    async playAudioBuffer(signal) {
        if (!this.audioContext || !this.isPlaying) return;
        
        // AudioBufferを作成
        const buffer = this.audioContext.createBuffer(1, signal.length, this.sampleRate);
        const channelData = buffer.getChannelData(0);
        
        // 信号データをコピー
        for (let i = 0; i < signal.length; i++) {
            channelData[i] = signal[i];
        }
        
        // AudioBufferSourceNodeを作成して再生
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        
        this.currentAudio = source;
        
        return new Promise((resolve) => {
            source.onended = resolve;
            source.start();
        });
    }
    
    async generateDTMFSequence() {
        for (let i = 0; i < this.inputNumber.length; i++) {
            if (!this.isPlaying) break;
            
            const char = this.inputNumber[i];
            this.updateStatus(`DTMF送信中: ${char} (${i + 1}/${this.inputNumber.length})`);
            
            if (this.dtmfFrequencies[char]) {
                await this.generateDTMFTone(char);
            }
            
            // 文字間間隔（150ms）
            if (i < this.inputNumber.length - 1) {
                await this.delay(150);
            }
        }
    }
    
    async generateDTMFTone(character) {
        const frequencies = this.dtmfFrequencies[character];
        if (!frequencies) return;
        
        const duration = 350; // 350msに延長（カーボンマイク対応）
        
        await this.playDualTone(frequencies[0], frequencies[1], duration);
    }
    
    async playDualTone(freq1, freq2, duration) {
        if (!this.audioContext || !this.isPlaying) return;
        
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator1.frequency.value = freq1;
        oscillator2.frequency.value = freq2;
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        
        // カーボンマイク対応の矩形波的エンベロープと高音量
        const startTime = this.audioContext.currentTime;
        const endTime = startTime + duration / 1000;
        const amplitude = 0.5; // 音量を大幅に増加
        
        // 矩形波的エンベロープ（急激な立ち上がり・立ち下がり）
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(amplitude, startTime + 0.01); // 10ms で急激に立ち上がり
        gainNode.gain.setValueAtTime(amplitude, endTime - 0.01); // 持続
        gainNode.gain.linearRampToValueAtTime(0, endTime); // 10ms で急激に立ち下がり
        
        oscillator1.start(startTime);
        oscillator2.start(startTime);
        oscillator1.stop(endTime);
        oscillator2.stop(endTime);
        
        this.currentAudio = oscillator1;
        
        return new Promise(resolve => {
            oscillator1.onended = resolve;
        });
    }
    
    async generateSpecialTone(character) {
        const frequency = character === '*' ? 1209 : 1633; // DTMF周波数
        const duration = 200;
        
        await this.playTone(frequency, duration);
    }
    
    async playTone(frequency, duration) {
        if (!this.audioContext || !this.isPlaying) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
        
        this.currentAudio = oscillator;
        
        return new Promise(resolve => {
            oscillator.onended = resolve;
        });
    }
    
    stopPlayback() {
        this.isPlaying = false;
        this.playBtn.disabled = false;
        
        if (this.currentAudio) {
            try {
                this.currentAudio.stop();
            } catch (e) {
                // Already stopped
            }
            this.currentAudio = null;
        }
        
        this.updateStatus('停止しました');
    }
    
    updateStatus(message) {
        this.statusText.textContent = message;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DialPulseDialer();
});