// Основные элементы интерфейса
document.addEventListener('DOMContentLoaded', () => {
    // Получаем ссылки на элементы DOM
    const analyzeForm = document.getElementById('analyze-form');
    const textInput = document.getElementById('text-input');
    const charCounter = document.getElementById('char-counter');
    const clearBtn = document.getElementById('clear-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressIndicator = document.getElementById('progress-indicator');
    const resultsContainer = document.getElementById('results-container');

    // Минимальное количество символов для анализа
    const MIN_CHARS = 10;
    
    // Инициализируем обработчики событий
    setupEventListeners();
    
    // Настраиваем обработчики событий
    function setupEventListeners() {
        // Обработка ввода текста
        textInput.addEventListener('input', handleTextInput);
        
        // Обработка нажатия кнопки "Очистить"
        clearBtn.addEventListener('click', clearTextInput);
        
        // Обработка отправки формы
        analyzeForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Обработка ввода текста
    function handleTextInput() {
        const textLength = textInput.value.length;
        charCounter.textContent = `${textLength} символов`;
        
        // Активация/деактивация кнопки анализа
        if (textLength >= MIN_CHARS) {
            analyzeBtn.disabled = false;
        } else {
            analyzeBtn.disabled = true;
        }
    }
    
    // Очистка поля ввода
    function clearTextInput(e) {
        e.preventDefault();
        textInput.value = '';
        charCounter.textContent = '0 символов';
        analyzeBtn.disabled = true;
        hideResults();
    }
    
    // Скрываем результаты
    function hideResults() {
        resultsContainer.innerHTML = '<div class="no-results">Здесь будут отображены результаты анализа текста</div>';
    }
    
    // Обработка отправки формы
    function handleFormSubmit(e) {
        e.preventDefault();
        const text = textInput.value.trim();
        
        if (text.length < MIN_CHARS) {
            showToast('Текст слишком короткий для анализа', 'error');
            return;
        }
        
        // Показываем прогресс
        progressBar.style.display = 'block';
        simulateProgress();
        
        // Анализируем текст
        setTimeout(() => {
            const results = analyzeText(text);
            displayResults(results);
            progressBar.style.display = 'none';
        }, 1500);
    }
    
    // Функция для симуляции прогресса
    function simulateProgress() {
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
            } else {
                width += 5;
                progressIndicator.style.width = width + '%';
            }
        }, 75);
    }
    
    // Анализ текста
    function analyzeText(text) {
        // Базовая статистика
        const charCount = text.length;
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        const sentenceCount = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
        const paragraphCount = text.split(/\n+/).filter(para => para.trim().length > 0).length;
        
        // Слова
        const words = text.toLowerCase()
            .replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 0);
        
        // Частота слов
        const wordFrequency = {};
        words.forEach(word => {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        });
        
        // Сортировка слов по частоте
        const sortedWords = Object.entries(wordFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);  // Топ-20 слов
        
        // Средняя длина слова
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        
        // Получение предложений
        const sentences = text.split(/[.!?]+/)
            .filter(sentence => sentence.trim().length > 0)
            .map(sentence => sentence.trim());
        
        // Средняя длина предложения (в словах)
        const avgSentenceLength = sentences.reduce((sum, sentence) => {
            return sum + sentence.split(/\s+/).filter(word => word.length > 0).length;
        }, 0) / sentences.length;
        
        // Самое длинное и короткое предложение
        const sentenceLengths = sentences.map(sentence => ({
            text: sentence,
            length: sentence.split(/\s+/).filter(word => word.length > 0).length
        }));
        
        sentenceLengths.sort((a, b) => a.length - b.length);
        const shortestSentence = sentenceLengths[0];
        const longestSentence = sentenceLengths[sentenceLengths.length - 1];
        
        return {
            basicStats: {
                charCount,
                wordCount,
                sentenceCount,
                paragraphCount,
                avgWordLength: avgWordLength.toFixed(1),
                avgSentenceLength: avgSentenceLength.toFixed(1)
            },
            wordFrequency: sortedWords,
            sentences: {
                shortest: shortestSentence,
                longest: longestSentence
            }
        };
    }
    
    // Отображение результатов
    function displayResults(results) {
        // Очищаем контейнер результатов
        resultsContainer.innerHTML = '';
        
        // Базовая статистика
        const statsCard = document.createElement('div');
        statsCard.className = 'result-card';
        
        const statsHeader = document.createElement('div');
        statsHeader.className = 'result-header';
        
        const statsTitle = document.createElement('h3');
        statsTitle.className = 'result-title';
        statsTitle.textContent = 'Общая статистика';
        statsHeader.appendChild(statsTitle);
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Копировать';
        copyBtn.addEventListener('click', () => {
            copyToClipboard(JSON.stringify(results.basicStats, null, 2));
        });
        statsHeader.appendChild(copyBtn);
        
        statsCard.appendChild(statsHeader);
        
        const statsGrid = document.createElement('div');
        statsGrid.className = 'stats-grid';
        
        // Добавляем статистические показатели
        const stats = [
            { label: 'Символов', value: results.basicStats.charCount },
            { label: 'Слов', value: results.basicStats.wordCount },
            { label: 'Предложений', value: results.basicStats.sentenceCount },
            { label: 'Абзацев', value: results.basicStats.paragraphCount },
            { label: 'Средняя длина слова', value: results.basicStats.avgWordLength },
            { label: 'Средняя длина предложения', value: results.basicStats.avgSentenceLength }
        ];
        
        stats.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            
            const statValue = document.createElement('div');
            statValue.className = 'stat-value';
            statValue.textContent = stat.value;
            statItem.appendChild(statValue);
            
            const statLabel = document.createElement('div');
            statLabel.className = 'stat-label';
            statLabel.textContent = stat.label;
            statItem.appendChild(statLabel);
            
            statsGrid.appendChild(statItem);
        });
        
        statsCard.appendChild(statsGrid);
        resultsContainer.appendChild(statsCard);
        
        // Частотность слов
        const wordsCard = document.createElement('div');
        wordsCard.className = 'result-card';
        
        const wordsHeader = document.createElement('div');
        wordsHeader.className = 'result-header';
        
        const wordsTitle = document.createElement('h3');
        wordsTitle.className = 'result-title';
        wordsTitle.textContent = 'Частотность слов';
        wordsHeader.appendChild(wordsTitle);
        
        const wordsCopyBtn = document.createElement('button');
        wordsCopyBtn.className = 'copy-btn';
        wordsCopyBtn.textContent = 'Копировать';
        wordsCopyBtn.addEventListener('click', () => {
            copyToClipboard(JSON.stringify(results.wordFrequency, null, 2));
        });
        wordsHeader.appendChild(wordsCopyBtn);
        
        wordsCard.appendChild(wordsHeader);
        
        const wordList = document.createElement('div');
        wordList.className = 'word-list';
        
        results.wordFrequency.forEach(([word, frequency]) => {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';
            
            const wordText = document.createElement('span');
            wordText.className = 'word-text';
            wordText.textContent = word;
            wordItem.appendChild(wordText);
            
            const wordFreq = document.createElement('span');
            wordFreq.className = 'word-frequency';
            wordFreq.textContent = frequency;
            wordItem.appendChild(wordFreq);
            
            wordList.appendChild(wordItem);
        });
        
        wordsCard.appendChild(wordList);
        resultsContainer.appendChild(wordsCard);
        
        // Предложения
        const sentencesCard = document.createElement('div');
        sentencesCard.className = 'result-card';
        
        const sentencesHeader = document.createElement('div');
        sentencesHeader.className = 'result-header';
        
        const sentencesTitle = document.createElement('h3');
        sentencesTitle.className = 'result-title';
        sentencesTitle.textContent = 'Анализ предложений';
        sentencesHeader.appendChild(sentencesTitle);
        
        sentencesCard.appendChild(sentencesHeader);
        
        // Самое короткое предложение
        const shortestTitle = document.createElement('h4');
        shortestTitle.textContent = 'Самое короткое предложение';
        shortestTitle.style.marginTop = '1rem';
        shortestTitle.style.color = 'var(--primary-color)';
        sentencesCard.appendChild(shortestTitle);
        
        const shortestText = document.createElement('p');
        shortestText.textContent = results.sentences.shortest.text;
        shortestText.style.backgroundColor = 'var(--secondary-color)';
        shortestText.style.padding = '0.8rem';
        shortestText.style.borderRadius = '4px';
        shortestText.style.marginBottom = '1rem';
        sentencesCard.appendChild(shortestText);
        
        // Самое длинное предложение
        const longestTitle = document.createElement('h4');
        longestTitle.textContent = 'Самое длинное предложение';
        longestTitle.style.marginTop = '1rem';
        longestTitle.style.color = 'var(--primary-color)';
        sentencesCard.appendChild(longestTitle);
        
        const longestText = document.createElement('p');
        longestText.textContent = results.sentences.longest.text;
        longestText.style.backgroundColor = 'var(--secondary-color)';
        longestText.style.padding = '0.8rem';
        longestText.style.borderRadius = '4px';
        sentencesCard.appendChild(longestText);
        
        resultsContainer.appendChild(sentencesCard);
    }
    
    // Копирование в буфер обмена
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Скопировано в буфер обмена');
        });
    }
    
    // Показываем всплывающее уведомление
    function showToast(message, type = 'success') {
        // Проверяем, существует ли уже уведомление
        let toast = document.querySelector('.toast');
        
        if (!toast) {
            // Создаем новое уведомление
            toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            document.body.appendChild(toast);
        } else {
            toast.className = `toast toast-${type}`;
        }
        
        // Устанавливаем сообщение
        toast.textContent = message;
        
        // Показываем уведомление
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Скрываем уведомление через 3 секунды
        setTimeout(() => {
            toast.classList.remove('show');
            
            // Удаляем элемент после завершения анимации
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}); 