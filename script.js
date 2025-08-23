document.addEventListener('DOMContentLoaded', () => {
    const convertBtn = document.getElementById('convert-btn');
    const lyricsInput = document.getElementById('lyrics-input');
    const lyricsOutput = document.getElementById('lyrics-output');

    let tokenizer = null;

    // 初始化 kuromoji.js
    kuromoji.builder({ dicPath: 'https://unpkg.com/kuromoji@0.1.2/dict/' }).build((err, kuromojiTokenizer) => {
        if (err) {
            console.error(err);
            lyricsOutput.textContent = '词典加载失败，请刷新页面重试。';
            return;
        }
        tokenizer = kuromojiTokenizer;
        convertBtn.disabled = false;
        convertBtn.textContent = '生成注音';
    });

    convertBtn.disabled = true;
    convertBtn.textContent = '词典加载中...';

    const convertToFurigana = (text) => {
        if (!tokenizer) return 'Tokenizer 未准备好。';

        const tokens = tokenizer.tokenize(text);
        
        return tokens.map(token => {
            const surface = token.surface_form;
            const reading = token.reading;
            
            let readingHiragana;
            if (reading === '*') {
                readingHiragana = isKatakana(surface) ? toHiragana(surface) : surface;
            } else {
                readingHiragana = toHiragana(reading);
            }

            // ★ 使用全新的智能注音函数生成HTML
            const wordHtml = generateAdvancedRuby(surface, readingHiragana);
            
            return `<span class="word">${wordHtml}</span>`;
        }).join('');
    };

    // 绑定点击事件
    convertBtn.addEventListener('click', () => {
        const inputText = lyricsInput.value;
        const lines = inputText.split('\n');
        
        const outputHtml = lines.map(line => 
            (line.trim() !== '') ? convertToFurigana(line) : ''
        ).join('<br>');

        lyricsOutput.innerHTML = outputHtml;
    });
    
    // --- ★★★ 全新的智能注音核心函数 ★★★ ---
    const generateAdvancedRuby = (surface, reading) => {
        // 如果表面和读音一样，则无需处理
        if (surface === reading) return surface;

        let commonSuffixLength = 0;
        const minLength = Math.min(surface.length, reading.length);

        // 1. 从后往前，计算共同的平假名词尾的长度
        for (let i = 1; i <= minLength; i++) {
            const surfaceChar = surface[surface.length - i];
            const readingChar = reading[reading.length - i];

            if (surfaceChar === readingChar && isHiragana(surfaceChar)) {
                commonSuffixLength++;
            } else {
                break;
            }
        }

        // 2. 根据有无共同词尾，进行不同处理
        if (commonSuffixLength === 0) {
            // 如果没有共同词尾（比如纯汉字或片假名），则对整体注音
            return `<ruby>${surface}<rt>${reading}</rt></ruby>`;
        } else {
            // 如果有共同词尾
            // 3. 分离出词根和词尾
            const surfaceBase = surface.substring(0, surface.length - commonSuffixLength);
            const commonSuffix = surface.substring(surface.length - commonSuffixLength);
            const readingBase = reading.substring(0, reading.length - commonSuffixLength);
            
            // 如果分离后词根为空，说明整个词都是平假名，无需注音
            if (!surfaceBase) {
                return surface;
            }

            // 4. 只对词根注音，然后拼接上共同的词尾
            return `<ruby>${surfaceBase}<rt>${readingBase}</rt></ruby>${commonSuffix}`;
        }
    };

    // --- 辅助函数 ---
    const isHiragana = (char) => /[\u3040-\u309f]/.test(char);

    const isKatakana = (text) => /^[\u30a0-\u30ff]+$/.test(text);
    
    const toHiragana = (text) => {
        if (!text) return '';
        return text.replace(/[\u30a0-\u30ff]/g, (match) => {
            if (match === 'ー') return 'ー';
            const charCode = match.charCodeAt(0) - 0x60;
            return String.fromCharCode(charCode);
        });
    };
});