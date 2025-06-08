document.addEventListener('DOMContentLoaded', function() {
    const markdownInput = document.getElementById('markdown-input');
    const htmlOutput = document.getElementById('html-output');
    const convertButton = document.getElementById('convert-button');
    const copyButton = document.getElementById('copy-button');
    const clearButton = document.getElementById('clear-button');

    // マークダウンからHTMLへの変換処理
    function convertMarkdownToHTML() {
        const markdown = markdownInput.value;
        
        // markedの設定
        marked.use({
            renderer: createCustomRenderer(),
            gfm: true,
            breaks: true,
        });
        
        let html = marked.parse(markdown);
        
        // 各タグで囲われている範囲ごとに空改行を入れる処理
        html = addLineBreaksBetweenTags(html);
        
        // HTMLエスケープして表示
        htmlOutput.textContent = html;
    }

    // カスタムレンダラーの作成
    function createCustomRenderer() {
        const renderer = new marked.Renderer();
        
        // リストアイテムのインデント処理
        renderer.listitem = function(text) {
            return '    <li>' + text + '</li>\n';
        };
        
        // 段落の処理
        renderer.paragraph = function(text) {
            return '<p>' + text + '</p>';
        };
        
        // 見出しの処理
        renderer.heading = function(text, level) {
            return '<h' + level + '>' + text + '</h' + level + '>';
        };
        
        // リストの処理（ulとolはインデントしない）
        renderer.list = function(body, ordered, start) {
            const type = ordered ? 'ol' : 'ul';
            const startAttr = (ordered && start !== 1) ? (' start="' + start + '"') : '';
            return '<' + type + startAttr + '>\n' + body + '</' + type + '>';
        };
        
        return renderer;
    }

    // タグ間に空改行を追加する処理
    function addLineBreaksBetweenTags(html) {
        // 主要なブロックレベルタグの後に改行を追加
        const blockTags = ['</p>', '</h1>', '</h2>', '</h3>', '</h4>', '</h5>', '</h6>', '</ul>', '</ol>', '</blockquote>', '</pre>', '</table>'];
        
        blockTags.forEach(tag => {
            html = html.replace(new RegExp(tag, 'g'), tag + '\n\n');
        });
        
        // 余分な改行を削除
        html = html.replace(/\n{3,}/g, '\n\n');
        
        return html.trim();
    }

    // ボタンイベントの設定
    convertButton.addEventListener('click', convertMarkdownToHTML);
    
    copyButton.addEventListener('click', function() {
        const textToCopy = htmlOutput.textContent;
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => {
                        copyButton.textContent = 'Copy';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy to clipboard:', err);
                });
        }
    });
    
    clearButton.addEventListener('click', function() {
        markdownInput.value = '';
        htmlOutput.textContent = '';
    });
    
    // Sample Markdown for initial display
    markdownInput.value = `# Markdown Sample

This is a paragraph. You can use **bold** and *italic* text.

## Heading 2

- List item 1
- List item 2
  - Nested item

1. Numbered list item 1
2. Numbered list item 2

> This is a blockquote.
`;
});