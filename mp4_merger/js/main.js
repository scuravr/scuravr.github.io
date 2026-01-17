// 1. import 文を削除し、HTMLで読み込んだライブラリから変数を取り出す
// import { FFmpeg } from ... (削除)
// import { fetchFile, toBlobURL } ... (削除)

const { FFmpeg } = FFmpegWASM;
const { fetchFile, toBlobURL } = FFmpegUtil;

const ffmpeg = new FFmpeg();
let filesArray = [];

const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const fileCount = document.getElementById('fileCount');
const mergeBtn = document.getElementById('mergeBtn');
const message = document.getElementById('message');
const outputVideo = document.getElementById('outputVideo');
const downloadLink = document.getElementById('downloadLink');
const videoContainer = document.getElementById('videoContainer');

const init = async () => {
    message.innerText = 'FFmpegをロード中...';
    try {
        // CDNではなく、ローカルのjsフォルダからCoreを読み込む設定
        // 注意: jsフォルダ内のファイルを指すため、パスは "./js/..." ではなく
        // HTML(ルート)から見たパス、または相対パスを指定します。
        
        await ffmpeg.load({
            coreURL: await toBlobURL('js/ffmpeg-core.js', 'text/javascript'),
            wasmURL: await toBlobURL('js/ffmpeg-core.wasm', 'application/wasm'),
        });

        message.innerText = '準備完了。ファイルを選択してください。';
        console.log("FFmpeg loaded successfully");
    } catch (e) {
        console.error(e);
        // エラー内容を画面にも表示
        message.innerText = `エラーが発生しました:\n${e.message}\n(詳細はコンソールを確認してください)`;
    }
};

init();

// --- 以下、以前のコードと同じロジック ---

fileInput.addEventListener('change', (e) => {
    // ... (以前と同じ) ...
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;
    filesArray = [...newFiles];
    filesArray.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    updateUI();
});

const updateUI = () => {
    // ... (以前と同じ) ...
    fileList.innerHTML = '';
    fileCount.innerText = `${filesArray.length} ファイル選択中`;

    filesArray.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
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

// グローバル関数への紐付け
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

mergeBtn.addEventListener('click', async () => {
    if (filesArray.length < 2) return;
    
    mergeBtn.disabled = true;
    message.innerText = '結合処理を開始します...';
    videoContainer.style.display = 'none';

    try {
        const inputNames = [];
        // 1. 書き込み
        for (let i = 0; i < filesArray.length; i++) {
            const file = filesArray[i];
            const safeName = `input${i}.mp4`; 
            await ffmpeg.writeFile(safeName, await fetchFile(file));
            inputNames.push(safeName);
            message.innerText = `読み込み中: ${Math.round(((i + 1) / filesArray.length) * 100)}%`;
        }

        // 2. リスト作成
        const listContent = inputNames.map(name => `file '${name}'`).join('\n');
        await ffmpeg.writeFile('list.txt', listContent);

        // 3. 結合実行
        message.innerText = '結合中...';
        await ffmpeg.exec([
            '-f', 'concat',
            '-safe', '0',
            '-i', 'list.txt',
            '-c', 'copy', 
            '-ignore_unknown',      // ←重要: GPSなど不明なデータトラックによる尺のズレを防ぐ
            '-map_metadata', '-1',  // ←重要: 全体の長さをおかしくするメタデータを削除
            'output.mp4'
        ]);

        // 4. 読み込みと表示
        const data = await ffmpeg.readFile('output.mp4');
        const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(videoBlob);
        
        outputVideo.src = videoUrl;
        downloadLink.href = videoUrl;
        downloadLink.download = 'merged_video.mp4';
        
        videoContainer.style.display = 'block';
        message.innerText = '完了しました！';

        // クリーンアップ
        await ffmpeg.deleteFile('list.txt');
        await ffmpeg.deleteFile('output.mp4');
        for (const name of inputNames) {
            await ffmpeg.deleteFile(name);
        }

    } catch (error) {
        console.error(error);
        message.innerText = 'エラーが発生しました。コンソールを確認してください。';
    } finally {
        mergeBtn.disabled = false;
    }
});