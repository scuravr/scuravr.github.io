document.addEventListener('DOMContentLoaded', () => {
  const bannerTextInput = document.getElementById('banner-text');
  const imageUpload = document.getElementById('image-upload');
  const cropSection = document.getElementById('crop-section');
  const cropArea = document.getElementById('crop-area');
  const cropImage = document.getElementById('crop-image');
  const cropConfirm = document.getElementById('crop-confirm');
  const cropCancel = document.getElementById('crop-cancel');
  const centerImageBtn = document.getElementById('center-image');
  const imageScale = document.getElementById('image-scale');
  const scaleValue = document.getElementById('scale-value');
  const textSizeSmall = document.getElementById('text-size-small');
  const textSizeLarge = document.getElementById('text-size-large');
  const textSizeSmallValue = document.getElementById('text-size-small-value');
  const textSizeLargeValue = document.getElementById('text-size-large-value');
  const imagePositionRadios = document.querySelectorAll('input[name="image-position"]');
  
  // 88x31px用の設定
  const borderWidthSmall = document.getElementById('border-width-small');
  const borderWidthSmallValue = document.getElementById('border-width-small-value');
  
  // 234x60px用の設定
  const borderWidthLarge = document.getElementById('border-width-large');
  const borderWidthLargeValue = document.getElementById('border-width-large-value');
  
  // 共通設定
  const bgColorPicker = document.getElementById('bg-color');
  const bgRgbValue = document.getElementById('bg-rgb-value');
  const borderColorPicker = document.getElementById('border-color');
  const borderRgbValue = document.getElementById('border-rgb-value');
  const textColorPicker = document.getElementById('text-color');
  const textRgbValue = document.getElementById('text-rgb-value');
  const bannerPreviewSmall = document.getElementById('banner-preview-small');
  const bannerPreviewLarge = document.getElementById('banner-preview-large');
  const downloadSmallBtn = document.getElementById('download-small');
  const downloadLargeBtn = document.getElementById('download-large');
  const errorMessage = document.getElementById('error-message');
  
  let currentImage = null;
  let croppedImage = null;
  let cropPosition = { x: 0, y: 0 };
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let baseImageSize = { width: 0, height: 0 };
  let currentScale = 1;
  
  // テキストサイズスライダーの処理
  textSizeSmall.addEventListener('input', (e) => {
    textSizeSmallValue.textContent = e.target.value;
    updatePreview();
  });
  
  textSizeLarge.addEventListener('input', (e) => {
    textSizeLargeValue.textContent = e.target.value;
    updatePreview();
  });
  
  // 画像配置位置の処理
  imagePositionRadios.forEach(radio => {
    radio.addEventListener('change', updatePreview);
  });
  
  // 画像拡大縮小スライダーの処理
  imageScale.addEventListener('input', (e) => {
    const scalePercent = e.target.value;
    scaleValue.textContent = scalePercent;
    currentScale = scalePercent / 100;
    updateImageScale();
  });
  
  // 88x31px用囲み線の太さスライダーの処理
  borderWidthSmall.addEventListener('input', (e) => {
    borderWidthSmallValue.textContent = e.target.value;
    updatePreview();
  });
  
  // 234x60px用囲み線の太さスライダーの処理
  borderWidthLarge.addEventListener('input', (e) => {
    borderWidthLargeValue.textContent = e.target.value;
    updatePreview();
  });
  
  // 背景色のカラーピッカー
  bgColorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    updateBgRGBValue(color);
    updatePreview();
  });
  
  // 囲み線色のカラーピッカー
  borderColorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    updateBorderRGBValue(color);
    updatePreview();
  });
  
  // 文字色のカラーピッカー
  textColorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    updateTextRGBValue(color);
    updatePreview();
  });
  
  // 背景色のRGB値を更新
  function updateBgRGBValue(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    bgRgbValue.textContent = `${r}, ${g}, ${b}`;
  }
  
  // 囲み線色のRGB値を更新
  function updateBorderRGBValue(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    borderRgbValue.textContent = `${r}, ${g}, ${b}`;
  }
  
  // 文字色のRGB値を更新
  function updateTextRGBValue(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    textRgbValue.textContent = `${r}, ${g}, ${b}`;
  }
  
  
  // 画像アップロード処理
  imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        currentImage = e.target.result;
        showCropSection();
      };
      reader.readAsDataURL(file);
    }
  });
  
  // 切り抜きセクションを表示
  function showCropSection() {
    cropImage.src = currentImage;
    cropSection.classList.remove('hidden');
    
    // スケールスライダーを初期化
    imageScale.value = 100;
    scaleValue.textContent = '100';
    currentScale = 1;
    
    cropImage.onload = () => {
      const imgWidth = cropImage.naturalWidth;
      const imgHeight = cropImage.naturalHeight;
      const containerSize = 300;
      
      // ベースサイズを計算（最小サイズでエリア全体をカバー）
      const baseScale = Math.max(containerSize / imgWidth, containerSize / imgHeight);
      baseImageSize.width = imgWidth * baseScale;
      baseImageSize.height = imgHeight * baseScale;
      
      // 初期スケールを適用
      updateImageScale();
      
      // 初期位置を中央に
      centerImage();
    };
  }
  
  // 切り抜き画像の位置を更新
  function updateCropImagePosition() {
    cropImage.style.left = `${cropPosition.x}px`;
    cropImage.style.top = `${cropPosition.y}px`;
  }
  
  // 画像のスケールを更新
  function updateImageScale() {
    const scaledWidth = baseImageSize.width * currentScale;
    const scaledHeight = baseImageSize.height * currentScale;
    
    cropImage.style.width = `${scaledWidth}px`;
    cropImage.style.height = `${scaledHeight}px`;
    
    updateCropImagePosition();
  }
  
  // 画像を中央に配置
  function centerImage() {
    const containerSize = 300;
    const scaledWidth = baseImageSize.width * currentScale;
    const scaledHeight = baseImageSize.height * currentScale;
    
    cropPosition.x = (containerSize - scaledWidth) / 2;
    cropPosition.y = (containerSize - scaledHeight) / 2;
    updateCropImagePosition();
  }
  
  // 切り抜きエリアでのドラッグ処理
  cropArea.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStart.x = e.clientX - cropPosition.x;
    dragStart.y = e.clientY - cropPosition.y;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      cropPosition.x = e.clientX - dragStart.x;
      cropPosition.y = e.clientY - dragStart.y;
      updateCropImagePosition();
    }
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  // 切り抜き確定
  cropConfirm.addEventListener('click', () => {
    cropImageToSquare();
  });
  
  // 切り抜きキャンセル
  cropCancel.addEventListener('click', () => {
    cropSection.classList.add('hidden');
    currentImage = null;
    croppedImage = null;
    imageUpload.value = '';
  });
  
  // 画像を中央配置
  centerImageBtn.addEventListener('click', () => {
    centerImage();
  });
  
  // 画像を正方形に切り抜く
  function cropImageToSquare() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 200;
    
    canvas.width = size;
    canvas.height = size;
    
    const img = new Image();
    img.onload = () => {
      const containerSize = 300;
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      
      // ベースサイズを計算
      const baseScale = Math.max(containerSize / imgWidth, containerSize / imgHeight);
      // 現在のスケールを適用したサイズ
      const actualScale = baseScale * currentScale;
      
      // 切り抜き位置を計算（元画像での座標に変換）
      const sourceX = -cropPosition.x / actualScale;
      const sourceY = -cropPosition.y / actualScale;
      const sourceSize = containerSize / actualScale;
      
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceSize, sourceSize,
        0, 0, size, size
      );
      
      croppedImage = canvas.toDataURL();
      cropSection.classList.add('hidden');
      updatePreview();
    };
    img.src = currentImage;
  }
  
  // テキスト入力時のプレビュー更新
  bannerTextInput.addEventListener('input', updatePreview);
  
  // プレビュー更新
  function updatePreview() {
    const text = bannerTextInput.value || 'サンプルテキスト';
    const bgColor = bgColorPicker.value;
    const borderColor = borderColorPicker.value;
    const textColor = textColorPicker.value;
    const smallTextSize = textSizeSmall.value;
    const largeTextSize = textSizeLarge.value;
    const imagePosition = document.querySelector('input[name="image-position"]:checked').value;
    
    // 各サイズ別の設定を取得
    const smallBorderWidth = parseInt(borderWidthSmall.value);
    const largeBorderWidth = parseInt(borderWidthLarge.value);
    
    // 88x31px個別プレビュー更新
    bannerPreviewSmall.innerHTML = generateBannerHTML(text, smallBorderWidth, borderColor, bgColor, textColor, 'small', smallTextSize, imagePosition);
    
    // 234x60px個別プレビュー更新
    bannerPreviewLarge.innerHTML = generateBannerHTML(text, largeBorderWidth, borderColor, bgColor, textColor, 'large', largeTextSize, imagePosition);
  }
  
  // バナーHTML生成
  function generateBannerHTML(text, borderWidthPx, borderColor, bgColor, textColor, size, fontSize, imagePosition) {
    const contentClass = imagePosition === 'right' ? 'banner-content banner-content-right' : 'banner-content';
    const borderStyle = borderWidthPx > 0 ? `border: ${borderWidthPx}px solid ${borderColor};` : 'border: none;';
    
    if (croppedImage) {
      // 画像ありのレイアウト
      const bannerHeight = size === 'small' ? 31 : 60;
      const imageSize = bannerHeight; // バナーの高さと同じサイズ（囲み線ギリギリまで）
      
      return `
        <div class="banner-${size}" style="${borderStyle} background-color: ${bgColor};">
          <div class="${contentClass}" style="padding: 0;">
            <img src="${croppedImage}" class="banner-image-${size}" style="width: ${imageSize}px; height: ${imageSize}px; display: block;" alt="バナー画像">
            <div class="banner-text-${size}" style="font-size: ${fontSize}px; color: ${textColor};">${text}</div>
          </div>
        </div>
      `;
    } else {
      // 画像なしのレイアウト
      return `
        <div class="banner-text-only-${size}" style="${borderStyle} background-color: ${bgColor}; font-size: ${fontSize}px; color: ${textColor};">
          ${text}
        </div>
      `;
    }
  }
  
  // 88x31pxバナーをダウンロード
  downloadSmallBtn.addEventListener('click', () => {
    downloadBanner(88, 31, 'small', 'website-banner-88x31.png');
  });
  
  // 234x60pxバナーをダウンロード
  downloadLargeBtn.addEventListener('click', () => {
    downloadBanner(234, 60, 'large', 'website-banner-234x60.png');
  });
  
  // バナーをダウンロード
  function downloadBanner(width, height, size, filename) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const text = bannerTextInput.value || 'サンプルテキスト';
    const bgColor = bgColorPicker.value;
    const borderColor = borderColorPicker.value;
    const textColor = textColorPicker.value;
    const fontSize = size === 'small' ? parseInt(textSizeSmall.value) : parseInt(textSizeLarge.value);
    const imagePosition = document.querySelector('input[name="image-position"]:checked').value;
    
    // サイズ別の囲み線設定を取得
    const borderWidthPx = size === 'small' ? parseInt(borderWidthSmall.value) : parseInt(borderWidthLarge.value);
    
    canvas.width = width;
    canvas.height = height;
    
    // 背景色を設定
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (croppedImage) {
      // 画像ありのバナー
      const img = new Image();
      img.onload = () => {
        // 画像を正方形で描画（囲み線の下に）
        const imageSize = height; // バナーの高さと同じサイズ
        let imageX, textX;
        
        if (imagePosition === 'right') {
          // 画像を右端に配置
          imageX = width - imageSize;
          textX = (width - imageSize) / 2;
        } else {
          // 画像を左端に配置（デフォルト）
          imageX = 0;
          textX = imageSize + (width - imageSize) / 2;
        }
        
        // 画像を正方形として描画
        ctx.drawImage(img, imageX, 0, imageSize, imageSize);
        
        // テキストを描画
        ctx.fillStyle = textColor;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // テキスト領域の中央
        const textY = height / 2;
        
        // テキストを複数行に分割して表示
        const maxWidth = width - imageSize - 8;
        const lines = wrapText(ctx, text, maxWidth);
        const lineHeight = fontSize + 2;
        const startY = textY - (lines.length - 1) * lineHeight / 2;
        
        lines.forEach((line, index) => {
          ctx.fillText(line, textX, startY + index * lineHeight);
        });
        
        // 囲み線を描画（画像とテキストより上に表示）
        if (borderWidthPx > 0) {
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = borderWidthPx;
          const offset = borderWidthPx / 2;
          ctx.strokeRect(offset, offset, canvas.width - borderWidthPx, canvas.height - borderWidthPx);
        }
        
        downloadCanvasAsPNG(canvas, filename);
      };
      img.src = croppedImage;
    } else {
      // 画像なしのバナー
      // テキストを先に描画
      ctx.fillStyle = textColor;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // テキストを複数行に分割
      const maxWidth = width - 8;
      const lines = wrapText(ctx, text, maxWidth);
      const lineHeight = fontSize + 2;
      const startY = height / 2 - (lines.length - 1) * lineHeight / 2;
      
      lines.forEach((line, index) => {
        ctx.fillText(line, width / 2, startY + index * lineHeight);
      });
      
      // 囲み線を描画（テキストより上に表示）
      if (borderWidthPx > 0) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidthPx;
        const offset = borderWidthPx / 2;
        ctx.strokeRect(offset, offset, canvas.width - borderWidthPx, canvas.height - borderWidthPx);
      }
      
      downloadCanvasAsPNG(canvas, filename);
    }
  }
  
  // テキストを指定幅で折り返す
  function wrapText(ctx, text, maxWidth) {
    const words = text.split('');
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    return lines;
  }
  
  // CanvasをPNG形式でダウンロード
  function downloadCanvasAsPNG(canvas, filename) {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }
  
  // エラーメッセージを表示
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
      errorMessage.classList.add('hidden');
    }, 5000);
  }
  
  // 初期化
  updateBgRGBValue('#ffffff');
  updateBorderRGBValue('#4CAF50');
  updateTextRGBValue('#000000');
  updatePreview();
});