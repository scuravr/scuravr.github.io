document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const statusDiv = document.getElementById('status');
    const downloadBtn = document.getElementById('downloadBtn');
    const targetSizeInput = document.getElementById('targetSize');
    const enableRenameCheckbox = document.getElementById('enableRename');
    const renameOptionsDiv = document.getElementById('renameOptions');
    const presetBtns = document.querySelectorAll('.preset-btn');
    // 画質設定用の要素を取得
    const qualityInput = document.getElementById('imageQuality');
    const qualityValueSpan = document.getElementById('qualityValue');

    let processedFiles = []; // ZIP作成用に保持

    // プリセットボタンのイベント設定
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            targetSizeInput.value = btn.getAttribute('data-size');
        });
    });

    // リネームオプションの表示切り替え
    enableRenameCheckbox.addEventListener('change', () => {
        renameOptionsDiv.style.display = enableRenameCheckbox.checked ? 'block' : 'none';
    });

    // 画質スライダーの数値表示更新イベントを追加
    qualityInput.addEventListener('input', () => {
        qualityValueSpan.textContent = qualityInput.value;
    });

    // ダウンロードボタンのイベント
    downloadBtn.addEventListener('click', downloadAll);

    // ドラッグ＆ドロップ関連イベント
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // ファイル処理のメイン関数
    async function handleFiles(files) {
        if (files.length === 0) return;

        // リセット
        processedFiles = [];
        downloadBtn.style.display = 'none';
        statusDiv.style.display = 'block';
        statusDiv.innerText = '処理中...';
        
        // 設定値取得
        const targetSize = parseInt(targetSizeInput.value) || 1920;
        const resizeMode = document.querySelector('input[name="resizeMode"]:checked').value; // 'long' or 'short'
        const format = document.getElementById('outputFormat').value; // 'image/webp'等
        
        // 画質設定を取得し、0.0〜1.0の範囲に変換
        const quality = parseInt(qualityInput.value) / 100;

        // リネーム設定
        const doRename = enableRenameCheckbox.checked;
        const prefix = document.getElementById('filenamePrefix').value || 'image';
        const separator = document.getElementById('filenameSeparator').value;
        const padding = parseInt(document.getElementById('digitPadding').value);

        let log = "";
        let count = 1;

        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;

            try {
                // processImageに画質設定(quality)を渡す
                const blob = await processImage(file, targetSize, resizeMode, format, quality);
                
                // ファイル名生成
                let finalName = "";
                // 拡張子の決定
                let ext = "";
                if (format === 'image/jpeg') ext = ".jpg";
                else if (format === 'image/png') ext = ".png";
                else ext = ".webp";

                if (doRename) {
                    // 連番処理 (桁あふれしても数値はそのまま表示)
                    const numStr = String(count).padStart(padding, '0');
                    finalName = `${prefix}${separator}${numStr}${ext}`;
                } else {
                    // 元の名前を使用（拡張子だけ変更）
                    const lastDotIndex = file.name.lastIndexOf('.');
                    const originalName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
                    finalName = `${originalName}${ext}`;
                }

                processedFiles.push({ name: finalName, data: blob });
                log += `〇 ${file.name} -> ${finalName}\n`;
                count++;
            } catch (err) {
                console.error(err);
                log += `× ${file.name}: エラー\n`;
            }
        }

        statusDiv.innerText = log + "\n完了！ダウンロードボタンを押してください。";
        if (processedFiles.length > 0) {
            downloadBtn.style.display = 'block';
        }
    }

    // 画像リサイズ＆変換処理
    // 引数に quality を追加
    function processImage(file, targetSize, resizeMode, format, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                
                let w = img.width;
                let h = img.height;
                let scale = 1;

                // リサイズ計算ロジック
                if (resizeMode === 'long') {
                    // 長辺基準
                    const maxDim = Math.max(w, h);
                    scale = targetSize / maxDim;
                } else {
                    // 短辺基準
                    const minDim = Math.min(w, h);
                    scale = targetSize / minDim;
                }

                // 拡大させたくない場合は次の行のコメントを解除
                // scale = Math.min(scale, 1);

                const newW = Math.round(w * scale);
                const newH = Math.round(h * scale);

                // Canvas描画
                const canvas = document.createElement('canvas');
                canvas.width = newW;
                canvas.height = newH;
                const ctx = canvas.getContext('2d');
                
                // 画質向上のための設定（縮小時のギザギザ軽減）
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // 背景を白で塗りつぶす（透過PNGをJPGにする場合などに背景が黒くなるのを防ぐ）
                if (format === 'image/jpeg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, newW, newH);
                }
                
                ctx.drawImage(img, 0, 0, newW, newH);

                // Blob変換 (ここで画質設定を適用)
                // PNGの場合、quality引数は無視されます。
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Conversion failed'));
                }, format, quality);
            };
            
            img.onerror = reject;
            img.src = url;
        });
    }

    // ZIPダウンロード処理
    async function downloadAll() {
        if (processedFiles.length === 0) return;

        const zip = new JSZip();
        processedFiles.forEach(file => {
            zip.file(file.name, file.data);
        });

        // ZIP生成
        const content = await zip.generateAsync({ type: "blob" });
        
        // ダウンロードリンク生成
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "resized_images.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // メモリ開放
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
    }
});