let currentMode = 'width';
let sizes = [140, 300, 930];
let processedImages = [];

// モード切り替え
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
        });
    });

    // ドラッグ＆ドロップ
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

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
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Enter キーでカスタムサイズ追加
    document.getElementById('customSize').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCustomSize();
        }
    });
});

// カスタムサイズ追加
function addCustomSize() {
    const input = document.getElementById('customSize');
    const size = parseInt(input.value);
    
    if (size && size > 0 && !sizes.includes(size)) {
        sizes.push(size);
        updateSizeTags();
        input.value = '';
    }
}

// サイズ削除
function removeSize(size) {
    sizes = sizes.filter(s => s !== size);
    updateSizeTags();
}

// サイズタグ更新
function updateSizeTags() {
    const container = document.getElementById('sizeTags');
    container.innerHTML = '';
    
    sizes.forEach(size => {
        const tag = document.createElement('div');
        tag.className = 'size-tag';
        tag.dataset.size = size;
        tag.innerHTML = `${size}px <span class="remove" onclick="removeSize(${size})">×</span>`;
        container.appendChild(tag);
    });
}

// ファイル処理
async function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/') && 
        ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
    );

    if (validFiles.length === 0) {
        showMessage('サポートされていないファイル形式です。JPG、PNG、WEBPファイルを選択してください。', 'error');
        return;
    }

    processedImages = [];
    document.getElementById('results').innerHTML = '';
    showProgress(true);

    for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        updateProgress((i / validFiles.length) * 100);
        
        try {
            const results = await processImage(file);
            processedImages.push({
                originalName: file.name,
                results: results
            });
        } catch (error) {
            console.error('画像処理エラー:', error);
            showMessage(`${file.name}の処理中にエラーが発生しました。`, 'error');
        }
    }

    updateProgress(100);
    setTimeout(() => showProgress(false), 500);
    displayResults();
}

// 画像処理
async function processImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const results = [];
            
            sizes.forEach(targetSize => {
                let newWidth, newHeight;
                
                if (currentMode === 'width') {
                    newWidth = targetSize;
                    newHeight = (img.height * targetSize) / img.width;
                } else {
                    newHeight = targetSize;
                    newWidth = (img.width * targetSize) / img.height;
                }
                
                // 高品質リサイズ処理
                const resizedCanvas = resizeImageHighQuality(img, newWidth, newHeight);
                
                const dataURL = resizedCanvas.toDataURL(file.type, 0.92);
                const fileName = generateFileName(file.name, targetSize);
                
                results.push({
                    size: targetSize,
                    width: newWidth,
                    height: newHeight,
                    dataURL: dataURL,
                    fileName: fileName
                });
            });
            
            resolve(results);
        };
        
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// 高品質画像リサイズ関数
function resizeImageHighQuality(img, targetWidth, targetHeight) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    // 高品質設定
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // 大幅な縮小の場合は段階的にリサイズ
    const scaleX = targetWidth / img.width;
    const scaleY = targetHeight / img.height;
    const scale = Math.min(scaleX, scaleY);
    
    if (scale < 0.5) {
        // 段階的リサイズ（大幅な縮小時）
        return multiStepResize(img, targetWidth, targetHeight);
    } else {
        // 直接リサイズ（軽微な縮小時）
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        return canvas;
    }
}

// 段階的リサイズ関数（大幅な縮小時の画質向上）
function multiStepResize(img, targetWidth, targetHeight) {
    let currentWidth = img.width;
    let currentHeight = img.height;
    let currentCanvas = document.createElement('canvas');
    let currentCtx = currentCanvas.getContext('2d');
    
    // 最初のキャンバスに元画像を描画
    currentCanvas.width = currentWidth;
    currentCanvas.height = currentHeight;
    currentCtx.imageSmoothingEnabled = true;
    currentCtx.imageSmoothingQuality = 'high';
    currentCtx.drawImage(img, 0, 0);
    
    // 50%ずつ縮小していく
    while (currentWidth > targetWidth * 2 || currentHeight > targetHeight * 2) {
        const nextWidth = Math.max(Math.floor(currentWidth * 0.5), targetWidth);
        const nextHeight = Math.max(Math.floor(currentHeight * 0.5), targetHeight);
        
        const nextCanvas = document.createElement('canvas');
        const nextCtx = nextCanvas.getContext('2d');
        
        nextCanvas.width = nextWidth;
        nextCanvas.height = nextHeight;
        
        // 高品質設定
        nextCtx.imageSmoothingEnabled = true;
        nextCtx.imageSmoothingQuality = 'high';
        
        // シャープネス向上のための設定
        nextCtx.globalCompositeOperation = 'source-over';
        
        nextCtx.drawImage(currentCanvas, 0, 0, nextWidth, nextHeight);
        
        currentCanvas = nextCanvas;
        currentCtx = nextCtx;
        currentWidth = nextWidth;
        currentHeight = nextHeight;
    }
    
    // 最終的な目標サイズにリサイズ
    if (currentWidth !== targetWidth || currentHeight !== targetHeight) {
        const finalCanvas = document.createElement('canvas');
        const finalCtx = finalCanvas.getContext('2d');
        
        finalCanvas.width = targetWidth;
        finalCanvas.height = targetHeight;
        
        // 最終段階での高品質設定
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = 'high';
        
        // 軽微なシャープネス調整
        finalCtx.filter = 'contrast(1.1) brightness(1.02)';
        
        finalCtx.drawImage(currentCanvas, 0, 0, targetWidth, targetHeight);
        
        return finalCanvas;
    }
    
    return currentCanvas;
}

// ファイル名生成
function generateFileName(originalName, size) {
    const dotIndex = originalName.lastIndexOf('.');
    const name = originalName.substring(0, dotIndex);
    const ext = originalName.substring(dotIndex);
    return `${name}_${size}${ext}`;
}

// 結果表示
function displayResults() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    if (processedImages.length > 1) {
        const bulkDownloadDiv = document.createElement('div');
        bulkDownloadDiv.className = 'bulk-download-section';
        bulkDownloadDiv.innerHTML = `
            <div class="bulk-download-header">
                <h3>一括ダウンロード</h3>
                <button class="bulk-download-btn" onclick="downloadAllImagesAsZip()">
                    すべての画像を一つのZIPでダウンロード
                </button>
            </div>
        `;
        resultsContainer.appendChild(bulkDownloadDiv);
    }

    processedImages.forEach(imageData => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-item';
        
        resultDiv.innerHTML = `
            <div class="result-header">
                <div class="result-title">${imageData.originalName}</div>
                <button class="download-all-btn" onclick="downloadAllSizes('${imageData.originalName}')">
                    すべてダウンロード
                </button>
            </div>
            <div class="result-grid">
                ${imageData.results.map(result => `
                    <div class="result-card">
                        <img src="${result.dataURL}" alt="${result.fileName}" class="result-image">
                        <div class="result-info">
                            ${result.width}×${result.height}px<br>
                            ${result.fileName}
                        </div>
                        <button class="download-btn" onclick="downloadImage('${result.dataURL}', '${result.fileName}')">
                            ダウンロード
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        
        resultsContainer.appendChild(resultDiv);
    });
}

// 単一画像ダウンロード
function downloadImage(dataURL, fileName) {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataURL;
    link.click();
}

// 全サイズダウンロード
async function downloadAllSizes(originalName) {
    const imageData = processedImages.find(img => img.originalName === originalName);
    if (!imageData) return;

    const zip = new JSZip();
    
    imageData.results.forEach(result => {
        const base64Data = result.dataURL.split(',')[1];
        zip.file(result.fileName, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${originalName.split('.')[0]}_resized.zip`;
    link.click();
}

// 全ての画像を一つのZIPでダウンロード
async function downloadAllImagesAsZip() {
    if (processedImages.length === 0) return;

    const zip = new JSZip();
    
    processedImages.forEach(imageData => {
        imageData.results.forEach(result => {
            const base64Data = result.dataURL.split(',')[1];
            zip.file(result.fileName, base64Data, { base64: true });
        });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'all_resized_images.zip';
    link.click();
}

// プログレス表示
function showProgress(show) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.display = show ? 'block' : 'none';
    if (!show) {
        document.getElementById('progressFill').style.width = '0%';
    }
}

function updateProgress(percent) {
    document.getElementById('progressFill').style.width = `${percent}%`;
}

// メッセージ表示
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
    messageDiv.textContent = message;
    
    document.querySelector('.container').appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}