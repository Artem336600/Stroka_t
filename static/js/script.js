document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const textInput = document.getElementById('text-input');
    const clearBtn = document.getElementById('clear-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const charCount = document.getElementById('char-count');
    const progressBar = document.querySelector('.progress-indicator');
    const resultsContainer = document.getElementById('results-container');
    const noResults = document.querySelector('.no-results');

    // Слушатели событий
    textInput.addEventListener('input', updateCharCount);
    clearBtn.addEventListener('click', clearText);
    analyzeBtn.addEventListener('click', analyzeText);

    // Обновление счетчика символов
    function updateCharCount() {
        const count = textInput.value.length;
        charCount.textContent = count;
        
        // Включение/отключение кнопки анализа
        if (count > 0) {
            analyzeBtn.disabled = false;
        } else {
            analyzeBtn.disabled = true;
        }
    }

    // Очистка текста
    function clearText() {
        textInput.value = '';
        updateCharCount();
        resultsContainer.innerHTML = '';
        noResults.style.display = 'block';
    }

    // Анализ текста
    function analyzeText() {
        const text = textInput.value.trim();
        
        if (!text) {
            return;
        }
        
        // Показываем прогресс
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                displayResults(text);
            }
        }, 50);

        noResults.style.display = 'none';
    }

    // Отображение результатов
    function displayResults(text) {
        // Вычисление статистики
        const stats = calculateStatistics(text);
        
        // Создание HTML для результатов
        let resultsHTML = `
            <div class="result-card">
                <div class="card-header">
                    <span>Общая статистика</span>
                    <button class="copy-btn" data-section="statistics">Копировать</button>
                </div>
                <div class="card-body">
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${stats.charCount}</div>
                            <div class="stat-label">Символов</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.charCountNoSpaces}</div>
                            <div class="stat-label">Без пробелов</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.wordCount}</div>
                            <div class="stat-label">Слов</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.sentenceCount}</div>
                            <div class="stat-label">Предложений</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.paragraphCount}</div>
                            <div class="stat-label">Абзацев</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.avgWordLength.toFixed(1)}</div>
                            <div class="stat-label">Средняя длина слова</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.readingTime}</div>
                            <div class="stat-label">Время чтения (мин)</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.uniqueWordCount}</div>
                            <div class="stat-label">Уникальных слов</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Частотность слов
        resultsHTML += `
            <div class="result-card">
                <div class="card-header">
                    <span>Частотность слов (топ 10)</span>
                    <button class="copy-btn" data-section="word-freq">Копировать</button>
                </div>
                <div class="card-body">
                    <div class="word-freq-list">
                        ${generateWordFrequencyHTML(stats.wordFrequency)}
                    </div>
                </div>
            </div>
        `;

        // Самые длинные и короткие предложения
        resultsHTML += `
            <div class="result-card">
                <div class="card-header">
                    <span>Самые длинные предложения</span>
                    <button class="copy-btn" data-section="long-sentences">Копировать</button>
                </div>
                <div class="card-body">
                    <div class="sentences-list">
                        ${generateSentencesHTML(stats.longestSentences)}
                    </div>
                </div>
            </div>
            <div class="result-card">
                <div class="card-header">
                    <span>Самые короткие предложения</span>
                    <button class="copy-btn" data-section="short-sentences">Копировать</button>
                </div>
                <div class="card-body">
                    <div class="sentences-list">
                        ${generateSentencesHTML(stats.shortestSentences)}
                    </div>
                </div>
            </div>
        `;

        // Отображение результатов
        resultsContainer.innerHTML = resultsHTML;
        
        // Добавление обработчиков для кнопок копирования
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const section = this.getAttribute('data-section');
                let textToCopy = '';
                
                switch(section) {
                    case 'statistics':
                        textToCopy = `Общая статистика:\nСимволов: ${stats.charCount}\nБез пробелов: ${stats.charCountNoSpaces}\nСлов: ${stats.wordCount}\nПредложений: ${stats.sentenceCount}\nАбзацев: ${stats.paragraphCount}\nСредняя длина слова: ${stats.avgWordLength.toFixed(1)}\nВремя чтения: ${stats.readingTime} мин\nУникальных слов: ${stats.uniqueWordCount}`;
                        break;
                    case 'word-freq':
                        textToCopy = 'Частотность слов (топ 10):\n';
                        stats.wordFrequency.slice(0, 10).forEach(item => {
                            textToCopy += `${item.word}: ${item.count}\n`;
                        });
                        break;
                    case 'long-sentences':
                        textToCopy = 'Самые длинные предложения:\n';
                        stats.longestSentences.forEach((sentence, index) => {
                            textToCopy += `${index + 1}. ${sentence}\n`;
                        });
                        break;
                    case 'short-sentences':
                        textToCopy = 'Самые короткие предложения:\n';
                        stats.shortestSentences.forEach((sentence, index) => {
                            textToCopy += `${index + 1}. ${sentence}\n`;
                        });
                        break;
                }
                
                navigator.clipboard.writeText(textToCopy)
                    .then(() => showCopySuccess(btn))
                    .catch(err => console.error('Ошибка при копировании: ', err));
            });
        });
        
        // Сброс прогресса
        setTimeout(() => {
            progressBar.style.width = '0';
        }, 500);
    }

    // Показать успешное копирование
    function showCopySuccess(button) {
        const originalText = button.textContent;
        button.textContent = 'Скопировано!';
        
        setTimeout(() => {
            button.textContent = originalText;
        }, 1500);
    }

    // Генерация HTML для частотности слов
    function generateWordFrequencyHTML(wordFreq) {
        let html = '';
        const topWords = wordFreq.slice(0, 10);
        
        topWords.forEach(item => {
            html += `
                <div class="word-freq-item">
                    <span>${item.word}</span>
                    <span class="word-badge">${item.count}</span>
                </div>
            `;
        });
        
        return html;
    }

    // Генерация HTML для предложений
    function generateSentencesHTML(sentences) {
        let html = '';
        
        sentences.forEach(sentence => {
            html += `<div class="sentence-item">${sentence}</div>`;
        });
        
        return html;
    }

    // Расчет статистики текста
    function calculateStatistics(text) {
        // Базовые метрики
        const charCount = text.length;
        const charCountNoSpaces = text.replace(/\s/g, '').length;
        const words = text.match(/\b\S+\b/g) || [];
        const wordCount = words.length;
        
        // Предложения (с учетом ... и других знаков препинания)
        const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
        const sentenceCount = sentences.length;
        
        // Абзацы
        const paragraphs = text.split(/\n+/).filter(p => p.trim() !== '');
        const paragraphCount = paragraphs.length;
        
        // Средняя длина слова
        const totalCharacters = words.reduce((sum, word) => sum + word.length, 0);
        const avgWordLength = wordCount > 0 ? totalCharacters / wordCount : 0;
        
        // Время чтения (средняя скорость чтения: 200 слов в минуту)
        const readingTime = Math.ceil(wordCount / 200);
        
        // Частотность слов
        const wordFrequency = calculateWordFrequency(words);
        const uniqueWordCount = wordFrequency.length;
        
        // Самые длинные и короткие предложения
        const longestSentences = [...sentences]
            .sort((a, b) => b.length - a.length)
            .slice(0, 3)
            .map(s => s.trim());
            
        const shortestSentences = [...sentences]
            .filter(s => s.trim().split(/\s+/).length > 1) // Исключаем одиночные слова
            .sort((a, b) => a.length - b.length)
            .slice(0, 3)
            .map(s => s.trim());
        
        return {
            charCount,
            charCountNoSpaces,
            wordCount,
            sentenceCount,
            paragraphCount,
            avgWordLength,
            readingTime,
            uniqueWordCount,
            wordFrequency,
            longestSentences,
            shortestSentences
        };
    }

    // Расчет частотности слов
    function calculateWordFrequency(words) {
        const frequency = {};
        
        // Нормализация слов и подсчет частотности
        words.forEach(word => {
            // Приводим к нижнему регистру и удаляем знаки препинания
            const normalizedWord = word.toLowerCase().replace(/[^\wа-яА-ЯёЁ]/g, '');
            
            if (normalizedWord && normalizedWord.length > 1) { // Игнорируем короткие слова
                frequency[normalizedWord] = (frequency[normalizedWord] || 0) + 1;
            }
        });
        
        // Конвертация в массив и сортировка
        return Object.entries(frequency)
            .map(([word, count]) => ({ word, count }))
            .sort((a, b) => b.count - a.count);
    }

    // Инициализация
    updateCharCount();
}); 