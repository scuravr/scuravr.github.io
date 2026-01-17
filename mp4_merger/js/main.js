// FFmpeg.wasmのライブラリをCDNからインポート
import { FFmpeg } from 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js';
import { fetchFile, toBlobURL } from 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js';

const ffmpeg = new FFmpeg();
let filesArray = []; // 選択されたファイルを保持する配列

const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const fileCount = document.getElementById('fileCount');
const mergeBtn = document.getElementById('mergeBtn');
const message = document.getElementById('message');
const outputVideo = document.getElementById('outputVideo');
const downloadLink = document.getElementById('downloadLink');
const videoContainer = document.getElementById('videoContainer');

// 初期化処理
const init = async () => {
    message.innerText = 'FFmpegをロード中...';
    try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        message.innerText = '準備完了。ファイルを選択してください。';
    } catch (e) {
        console.error(e);
        message.innerText = 'エラー: FFmpegのロードに失敗しました。ページをリロードしてください。';
    }
};

init();

// ファイル選択時の処理
fileInput.addEventListener('change', (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;

    // ファイル配列に追加
    filesArray = [...newFiles];

    // デフォルトでファイル名の降順にソート
    filesArray.sort((a, b) => b.name.localeCompare(a.name));

    updateUI();
});

// UIの更新（リスト描画）
const updateUI = () => {
    fileList.innerHTML = '';
    fileCount.innerText = `${filesArray.length} ファイル選択中`;

    filesArray.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        
        // HTML生成
        item.innerHTML = `
            <span class="file-name">${index + 1}. ${file.name}</span>
            <div class="controls">
                <button onclick="moveUp(${index})">↑</button>
                <button onclick="moveDown(${index})">↓</button>
                <button onclick="removeFile(${index})" style="color:red;">×</button>
            </div>
        `;
        fileList.appendChild(item);
    });

    mergeBtn.disabled = filesArray.length < 2;
};

// グローバルスコープに関数を公開（HTMLのonclickから呼ぶため）
window.moveUp = (index) => {
    if (index === 0) return;
    [filesArray[index - 1], filesArray[index]] = [filesArray[index], filesArray[index - 1]];
    updateUI();
};

window.moveDown = (index) => {
    if (index === filesArray.length - 1) return;
    [filesArray[index + 1], filesArray[index]] = [filesArray[index], filesArray[index + 1]];
    updateUI();
};

window.removeFile = (index) => {
    filesArray.splice(index, 1);
    updateUI();
};

// 結合ボタンクリック
mergeBtn.addEventListener('click', async () => {
    if (filesArray.length < 2) return;
    
    mergeBtn.disabled = true;
    message.innerText = '結合処理を開始します...\n(ファイルサイズによって時間がかかります)';
    videoContainer.style.display = 'none';

    try {
        const inputNames = [];

        // 1. ファイルをFFmpegの仮想ファイルシステムに書き込む
        for (let i = 0; i < filesArray.length; i++) {
            const file = filesArray[i];
            // ファイル名からスペースなどを除去して安全な名前にする
            const safeName = `input${i}.mp4`; 
            await ffmpeg.writeFile(safeName, await fetchFile(file));
            inputNames.push(safeName);
            message.innerText = `読み込み中: ${Math.round(((i + 1) / filesArray.length) * 100)}%`;
        }

        // 2. 結合用のリストファイル(concat demuxer format)を作成
        // file 'input0.mp4'
        // file 'input1.mp4'
        const listContent = inputNames.map(name => `file '${name}'`).join('\n');
        await ffmpeg.writeFile('list.txt', listContent);

        // 3. FFmpegコマンド実行 (再エンコードなしで結合: -c copy)
        message.innerText = '結合中...';
        
        // -f concat -safe 0 -i list.txt -c copy output.mp4
        await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'output.mp4']);

        // 4. 出力ファイルの読み込み
        const data = await ffmpeg.readFile('output.mp4');
        
        // 5. Blob URLの生成と表示
        const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(videoBlob);
        
        outputVideo.src = videoUrl;
        downloadLink.href = videoUrl;
        downloadLink.download = 'merged_video.mp4';
        
        videoContainer.style.display = 'block';
        message.innerText = '完了しました！';

        // 後始末（メモリ解放のため仮想ファイルを削除）
        await ffmpeg.deleteFile('list.txt');
        await ffmpeg.deleteFile('output.mp4');
        for (const name of inputNames) {
            await ffmpeg.deleteFile(name);
        }

    } catch (error) {
        console.error(error);
        message.innerText = 'エラーが発生しました。\nコーデックが異なる動画同士は結合できない場合があります。';
    } finally {
        mergeBtn.disabled = false;
    }
});