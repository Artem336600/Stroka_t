document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('description-form');
    const textarea = document.getElementById('description');
    const submitButton = document.getElementById('submit-btn');
    const charCounter = document.getElementById('char-counter');
    const progressContainer = document.getElementById('progress-container');
    const progressIndicator = document.getElementById('progress-indicator');
    const resultsSection = document.getElementById('results');
    const resultsContainer = document.getElementById('results-container');
    const addTagBtn = document.getElementById('add-tag-btn');
    const tagsModalOverlay = document.getElementById('tags-modal-overlay');
    const tagsMenu = document.getElementById('tags-menu');
    const tagsMenuClose = document.getElementById('tags-menu-close');
    const tagsMenuCancel = document.getElementById('tags-menu-cancel');
    const tagsMenuApply = document.getElementById('tags-menu-apply');
    const tagsSearch = document.getElementById('tags-search');
    const tagsMenuCategories = document.getElementById('tags-menu-categories');
    const usersContainer = document.getElementById('users-container');
    const MAX_CHARS = 1000;
    
    // Хранение существующих тегов и выбранных тегов
    let allAvailableTags = {};
    let selectedTags = new Set();
    let tempSelectedTags = new Set(); // Временное хранение для модального окна
    
    // Глобальные маппинги тегов и категорий
    window.tagsToCategoryMap = {}; // Маппинг тег -> категория
    window.categoryToColorMap = { // Стандартные цвета категорий
        'Технологии': '#4f46e5',
        'Дизайн': '#ec4899',
        'Маркетинг': '#f59e0b',
        'Бизнес': '#10b981',
        'Креатив': '#8b5cf6',
        'Образование': '#0ea5e9',
        'Наука': '#6366f1',
        'Социальное': '#ef4444',
        'Здоровье и спорт': '#14b8a6',
        'Путешествия и туризм': '#f97316'
    };
    
    // Загружаем пользователей при загрузке страницы
    loadUsers();
    
    // Обработка ввода текста и обновление счетчика
    textarea.addEventListener('input', function() {
        const length = this.value.length;
        charCounter.textContent = `${length}/${MAX_CHARS}`;
        
        // Изменение стиля счетчика в зависимости от количества символов
        if (length > MAX_CHARS * 0.8 && length <= MAX_CHARS) {
            charCounter.className = 'char-counter warning';
        } else if (length > MAX_CHARS) {
            charCounter.className = 'char-counter danger';
            submitButton.disabled = true;
        } else {
            charCounter.className = 'char-counter';
            submitButton.disabled = false;
        }
        
        // Автоматическое изменение высоты поля ввода
        this.style.height = 'auto';
        this.style.height = Math.min(150, this.scrollHeight) + 'px';
        
        // Активируем кнопку отправки только если есть текст
        submitButton.disabled = this.value.trim().length === 0 || length > MAX_CHARS;
    });
    
    // Обработка отправки формы
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const text = textarea.value.trim();
        if (!text || text.length > MAX_CHARS) return;
        
        // Показать прогресс-бар и изменить внешний вид кнопки
        progressContainer.style.display = 'block';
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        
        // Меняем иконку на спиннер при загрузке
        submitButton.querySelector('i').classList.remove('bi-send-fill');
        submitButton.querySelector('i').classList.add('bi-arrow-repeat');
        
        // Анимация прогресса с переменной скоростью
        let progress = 0;
        let increment = 2;
        const interval = setInterval(() => {
            // Замедляем прогресс по мере приближения к 90%
            if (progress > 80) {
                increment = 0.5;
            } else if (progress > 60) {
                increment = 1;
            }
            
            progress += increment;
            
            // Ограничиваем прогресс до 90% до получения результата
            if (progress >= 90) {
                progress = 90;
                clearInterval(interval);
            }
            
            progressIndicator.style.width = `${progress}%`;
        }, 100);
        
        // Отправка данных на сервер
        fetch('/extract_tags', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description: text })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при обработке запроса');
            }
            return response.json();
        })
        .then(data => {
            // Завершаем прогресс-бар плавно до 100%
            clearInterval(interval);
            progressIndicator.style.width = '100%';
            
            // Небольшая задержка перед скрытием прогресс-бара
            setTimeout(() => {
                progressContainer.style.display = 'none';
                progressIndicator.style.width = '0%';
                submitButton.classList.remove('loading');
                
                // Возвращаем оригинальную иконку
                submitButton.querySelector('i').classList.remove('bi-arrow-repeat');
                submitButton.querySelector('i').classList.add('bi-send-fill');
                
                // Добавляем эффект успешной отправки
                submitButton.classList.add('success');
                setTimeout(() => {
                    submitButton.classList.remove('success');
                }, 1000);
                
                // Сохраняем все доступные теги
                allAvailableTags = data.tags;
                
                // Отображение результатов
                displayResults(data.tags);
                
                // Показать секцию результатов с анимацией
                resultsSection.style.display = 'block';
                resultsSection.style.opacity = '0';
                resultsSection.style.transform = 'translateY(10px)';
                
                // Анимация появления результатов
                setTimeout(() => {
                    resultsSection.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    resultsSection.style.opacity = '1';
                    resultsSection.style.transform = 'translateY(0)';
                    
                    // После отображения тегов загружаем пользователей с теми же тегами
                    loadUsersByTags([...selectedTags]);
                }, 50);
                
                // Разблокировка кнопки
                submitButton.disabled = text.length === 0 || text.length > MAX_CHARS;
            }, 500);
        })
        .catch(error => {
            console.error('Ошибка:', error);
            
            // Очистка прогресс-бара
            clearInterval(interval);
            progressContainer.style.display = 'none';
            progressIndicator.style.width = '0%';
            submitButton.classList.remove('loading');
            
            // Возвращаем оригинальную иконку
            submitButton.querySelector('i').classList.remove('bi-arrow-repeat');
            submitButton.querySelector('i').classList.add('bi-send-fill');
            
            // Показываем сообщение об ошибке
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте снова.';
            form.appendChild(errorMessage);
            
            // Удаляем сообщение об ошибке через 3 секунды
            setTimeout(() => {
                form.removeChild(errorMessage);
            }, 3000);
            
            // Разблокировка кнопки
            submitButton.disabled = text.length === 0 || text.length > MAX_CHARS;
        });
    });
    
    // Функция для отображения результатов
    function displayResults(data) {
        resultsContainer.innerHTML = '';
        selectedTags.clear();
        
        // Если нет данных или объект пустой
        if (!data || Object.keys(data).length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'Не найдено подходящих тегов';
            resultsContainer.appendChild(noResults);
            return;
        }
        
        // Собираем все теги из всех категорий и обновляем маппинг тегов к категориям
        const allTags = [];
        
        // Обновляем маппинг тегов к категориям
        for (const category in data) {
            if (typeof data[category] === 'object' && !Array.isArray(data[category])) {
                // Категория с подкатегориями
                for (const subcategory in data[category]) {
                    const subcatTags = data[category][subcategory];
                    if (subcatTags && subcatTags.length > 0) {
                        subcatTags.forEach(tag => {
                            allTags.push(tag);
                            selectedTags.add(tag);
                            // Обновляем маппинг тегов к категориям
                            window.tagsToCategoryMap[tag] = category;
                        });
                    }
                }
            } else if (Array.isArray(data[category])) {
                // Категория с тегами без подкатегорий
                data[category].forEach(tag => {
                    allTags.push(tag);
                    selectedTags.add(tag);
                    // Обновляем маппинг тегов к категориям
                    window.tagsToCategoryMap[tag] = category;
                });
            }
        }
        
        // Отображаем теги
        allTags.forEach(tag => createTagElement(tag));
        
        // Подготовка меню тегов
        populateTagsMenu(data);
    }
    
    // Создание элемента тега с кнопкой удаления
    function createTagElement(tag) {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        
        // Определяем категорию тега
        let tagCategory = '';
        let tagColor = '#6366f1'; // цвет по умолчанию
        
        // Если у нас есть карта тегов к категориям, используем ее
        if (window.tagsToCategoryMap && window.tagsToCategoryMap[tag]) {
            tagCategory = window.tagsToCategoryMap[tag];
            tagColor = window.categoryToColorMap[tagCategory] || tagColor;
        } else {
            // Старый способ поиска категории, если карта не создана
            for (const category in allAvailableTags) {
                if (typeof allAvailableTags[category] === 'object' && !Array.isArray(allAvailableTags[category])) {
                    // Категория с подкатегориями
                    for (const subcategory in allAvailableTags[category]) {
                        if (allAvailableTags[category][subcategory].includes(tag)) {
                            tagCategory = category;
                            tagColor = window.categoryToColorMap[category] || tagColor;
                            break;
                        }
                    }
                }
                // Если нашли категорию, выходим из внешнего цикла
                if (tagCategory) break;
            }
        }
        
        // Обязательно сохраняем маппинг для дальнейшего использования
        if (tagCategory && !window.tagsToCategoryMap[tag]) {
            window.tagsToCategoryMap[tag] = tagCategory;
        }
        
        // Применяем цвет к тегу
        tagElement.style.backgroundColor = `${tagColor}1A`; // 10% прозрачности
        tagElement.style.color = tagColor;
        tagElement.style.borderColor = `${tagColor}33`; // 20% прозрачности
        
        // Добавляем кнопку удаления
        const removeBtn = document.createElement('span');
        removeBtn.className = 'tag-remove';
        removeBtn.innerHTML = '<i class="bi bi-x"></i>';
        removeBtn.style.color = tagColor;
        
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Предотвращаем всплытие события
            selectedTags.delete(tag);
            resultsContainer.removeChild(tagElement);
            
            // Если все теги удалены, показываем сообщение
            if (selectedTags.size === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'Не найдено подходящих тегов';
                resultsContainer.appendChild(noResults);
            }
            
            // Обновляем список пользователей при удалении тега
            loadUsersByTags([...selectedTags]);
        });
        
        // При клике на тег - копируем его
        tagElement.addEventListener('click', function() {
            copyToClipboard(tag);
        });
        
        tagElement.appendChild(removeBtn);
        resultsContainer.appendChild(tagElement);
    }
    
    // Подготовка меню выбора тегов
    function populateTagsMenu(data) {
        tagsMenuCategories.innerHTML = '';
        
        // Цвета для категорий
        const categoryColors = {
            'Технологии': '#4f46e5',
            'Дизайн': '#ec4899',
            'Маркетинг': '#f59e0b',
            'Бизнес': '#10b981',
            'Креатив': '#8b5cf6',
            'Образование': '#0ea5e9',
            'Наука': '#6366f1',
            'Социальное': '#ef4444',
            'Здоровье и спорт': '#14b8a6',
            'Путешествия и туризм': '#f97316'
        };

        // Счетчик для циклического назначения цветов для категорий без указанного цвета
        let colorIndex = 0;
        const defaultColors = [
            '#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', 
            '#0ea5e9', '#6366f1', '#ef4444', '#14b8a6', '#f97316'
        ];
        
        for (const category in data) {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'tags-menu-category';
            
            // Определяем цвет категории
            const categoryColor = categoryColors[category] || defaultColors[colorIndex % defaultColors.length];
            colorIndex++;
            
            const categoryTitle = document.createElement('div');
            categoryTitle.className = 'tags-menu-category-title';
            categoryTitle.textContent = formatCategoryName(category);
            categoryTitle.style.color = categoryColor;
            categoryElement.appendChild(categoryTitle);
            
            const tagsList = document.createElement('div');
            tagsList.className = 'tags-menu-list';
            
            const categoryTags = [];
            
            if (typeof data[category] === 'object' && !Array.isArray(data[category])) {
                // Категория с подкатегориями
                for (const subcategory in data[category]) {
                    const subcategoryTitle = document.createElement('div');
                    subcategoryTitle.className = 'tags-menu-subcategory-title';
                    subcategoryTitle.textContent = subcategory;
                    subcategoryTitle.style.borderLeftColor = categoryColor;
                    subcategoryTitle.style.color = categoryColor;
                    tagsList.appendChild(subcategoryTitle);
                    
                    const subcatTags = data[category][subcategory];
                    if (subcatTags && subcatTags.length > 0) {
                        subcatTags.forEach(tag => {
                            if (!categoryTags.includes(tag)) {
                                categoryTags.push(tag);
                                
                                const tagItem = document.createElement('div');
                                tagItem.className = 'tags-menu-item';
                                tagItem.textContent = tag;
                                tagItem.dataset.tag = tag;
                                tagItem.dataset.category = category;
                                
                                // Сохраняем маппинг тега к категории
                                window.tagsToCategoryMap[tag] = category;
                                
                                // Используем цвет категории для фона тегов с небольшой прозрачностью
                                const tagBgColor = `${categoryColor}1A`; // 10% прозрачности
                                tagItem.style.backgroundColor = tagBgColor;
                                tagItem.style.color = categoryColor;
                                tagItem.style.borderColor = `${categoryColor}33`; // 20% прозрачности
                                
                                // Если тег уже выбран, подсветим его
                                if (selectedTags.has(tag)) {
                                    tagItem.style.backgroundColor = categoryColor;
                                    tagItem.style.color = 'white';
                                }
                                
                                tagItem.addEventListener('click', function() {
                                    const tagValue = this.dataset.tag;
                                    
                                    // Переключаем состояние тега в временном наборе
                                    if (tempSelectedTags.has(tagValue)) {
                                        tempSelectedTags.delete(tagValue);
                                        this.style.backgroundColor = tagBgColor;
                                        this.style.color = categoryColor;
                                    } else {
                                        tempSelectedTags.add(tagValue);
                                        this.style.backgroundColor = categoryColor;
                                        this.style.color = 'white';
                                    }
                                });
                                
                                tagsList.appendChild(tagItem);
                            }
                        });
                    }
                }
            } else if (Array.isArray(data[category])) {
                // Категория с тегами без подкатегорий
                data[category].forEach(tag => {
                    if (!categoryTags.includes(tag)) {
                        categoryTags.push(tag);
                        
                        const tagItem = document.createElement('div');
                        tagItem.className = 'tags-menu-item';
                        tagItem.textContent = tag;
                        tagItem.dataset.tag = tag;
                        tagItem.dataset.category = category;
                        
                        // Сохраняем маппинг тега к категории
                        window.tagsToCategoryMap[tag] = category;
                        
                        // Используем цвет категории для фона тегов с небольшой прозрачностью
                        const tagBgColor = `${categoryColor}1A`; // 10% прозрачности
                        tagItem.style.backgroundColor = tagBgColor;
                        tagItem.style.color = categoryColor;
                        tagItem.style.borderColor = `${categoryColor}33`; // 20% прозрачности
                        
                        // Если тег уже выбран, подсветим его
                        if (selectedTags.has(tag)) {
                            tagItem.style.backgroundColor = categoryColor;
                            tagItem.style.color = 'white';
                        }
                        
                        tagItem.addEventListener('click', function() {
                            const tagValue = this.dataset.tag;
                            
                            // Переключаем состояние тега в временном наборе
                            if (tempSelectedTags.has(tagValue)) {
                                tempSelectedTags.delete(tagValue);
                                this.style.backgroundColor = tagBgColor;
                                this.style.color = categoryColor;
                            } else {
                                tempSelectedTags.add(tagValue);
                                this.style.backgroundColor = categoryColor;
                                this.style.color = 'white';
                            }
                        });
                        
                        tagsList.appendChild(tagItem);
                    }
                });
            }
            
            if (categoryTags.length > 0) {
                categoryElement.appendChild(tagsList);
                tagsMenuCategories.appendChild(categoryElement);
            }
        }
        
        // Сохраняем цвета категорий для использования в других местах
        window.categoryToColorMap = categoryColors;
    }
    
    // Форматирование названия категории
    function formatCategoryName(category) {
        switch (category) {
            case 'technology':
                return 'Технологии';
            case 'business':
                return 'Бизнес';
            case 'science':
                return 'Наука';
            case 'arts':
                return 'Искусство';
            case 'lifestyle':
                return 'Образ жизни';
            default:
                // Преобразование из camelCase или snake_case в читаемый текст с заглавной буквы
                return category
                    .replace(/_/g, ' ')
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase());
        }
    }
    
    // Поиск тегов в меню
    tagsSearch.addEventListener('input', function() {
        const searchValue = this.value.toLowerCase();
        const tagItems = tagsMenu.querySelectorAll('.tags-menu-item');
        
        tagItems.forEach(item => {
            const tagText = item.textContent.toLowerCase();
            if (tagText.includes(searchValue)) {
                item.style.display = 'inline-flex';
            } else {
                item.style.display = 'none';
            }
        });
        
        // Скрываем категории без видимых тегов
        const categories = tagsMenu.querySelectorAll('.tags-menu-category');
        categories.forEach(category => {
            const visibleTags = category.querySelectorAll('.tags-menu-item[style*="display: inline-flex"]');
            if (visibleTags.length === 0) {
                category.style.display = 'none';
            } else {
                category.style.display = 'block';
            }
        });
    });
    
    // Открытие модального окна тегов
    addTagBtn.addEventListener('click', function() {
        // Копируем текущие выбранные теги во временные
        tempSelectedTags = new Set([...selectedTags]);
        
        // Открываем модальное окно
        tagsModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Блокируем прокрутку страницы
        
        // Загружаем все доступные теги из tags_data.py
        fetch('/get_all_tags')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при получении тегов');
                }
                return response.json();
            })
            .then(data => {
                // Заполняем меню с категориями
                populateTagsCategoriesMenu(data.categories);
                
                // Обновляем состояние тегов в меню
                const tagItems = tagsMenu.querySelectorAll('.tags-menu-item');
                tagItems.forEach(item => {
                    const tagValue = item.dataset.tag;
                    const category = item.dataset.category;
                    const categoryColor = window.categoryToColorMap[category] || '#6366f1';
                    
                    if (selectedTags.has(tagValue)) {
                        item.style.backgroundColor = categoryColor;
                        item.style.color = 'white';
                    } else {
                        const tagBgColor = `${categoryColor}1A`; // 10% прозрачности
                        item.style.backgroundColor = tagBgColor;
                        item.style.color = categoryColor;
                        item.style.borderColor = `${categoryColor}33`; // 20% прозрачности
                    }
                });
                
                // Фокус на поиск
                setTimeout(() => {
                    tagsSearch.focus();
                }, 100);
            })
            .catch(error => {
                console.error('Ошибка:', error);
            });
    });
    
    // Функция для отображения всех категорий и тегов в модальном окне
    function populateTagsCategoriesMenu(categories) {
        tagsMenuCategories.innerHTML = '';
        
        // Цвета для категорий
        const categoryColors = {
            'Технологии': '#4f46e5',
            'Дизайн': '#ec4899',
            'Маркетинг': '#f59e0b',
            'Бизнес': '#10b981',
            'Креатив': '#8b5cf6',
            'Образование': '#0ea5e9',
            'Наука': '#6366f1',
            'Социальное': '#ef4444',
            'Здоровье и спорт': '#14b8a6',
            'Путешествия и туризм': '#f97316'
        };

        // Счетчик для циклического назначения цветов для категорий без указанного цвета
        let colorIndex = 0;
        const defaultColors = [
            '#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', 
            '#0ea5e9', '#6366f1', '#ef4444', '#14b8a6', '#f97316'
        ];
        
        for (const category in categories) {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'tags-menu-category';
            
            // Определяем цвет категории
            const categoryColor = categoryColors[category] || defaultColors[colorIndex % defaultColors.length];
            colorIndex++;
            
            const categoryTitle = document.createElement('div');
            categoryTitle.className = 'tags-menu-category-title';
            categoryTitle.textContent = category;
            categoryTitle.style.color = categoryColor;
            categoryElement.appendChild(categoryTitle);
            
            const tagsList = document.createElement('div');
            tagsList.className = 'tags-menu-list';
            
            // Перебираем подкатегории
            for (const subcategory in categories[category]) {
                // Создаем заголовок подкатегории, если есть больше одной подкатегории
                if (Object.keys(categories[category]).length > 1) {
                    const subcategoryTitle = document.createElement('div');
                    subcategoryTitle.className = 'tags-menu-subcategory-title';
                    subcategoryTitle.textContent = subcategory;
                    subcategoryTitle.style.borderLeftColor = categoryColor;
                    subcategoryTitle.style.color = categoryColor;
                    tagsList.appendChild(subcategoryTitle);
                }
                
                // Перебираем теги
                const tags = categories[category][subcategory];
                tags.forEach(tag => {
                    const tagItem = document.createElement('div');
                    tagItem.className = 'tags-menu-item';
                    tagItem.textContent = tag;
                    tagItem.dataset.tag = tag;
                    tagItem.dataset.category = category;
                    
                    // Используем цвет категории для фона тегов с небольшой прозрачностью
                    const tagBgColor = `${categoryColor}1A`; // 10% прозрачности
                    tagItem.style.backgroundColor = tagBgColor;
                    tagItem.style.color = categoryColor;
                    tagItem.style.borderColor = `${categoryColor}33`; // 20% прозрачности
                    
                    // Если тег уже выбран, подсветим его
                    if (selectedTags.has(tag)) {
                        tagItem.style.backgroundColor = categoryColor;
                        tagItem.style.color = 'white';
                    }
                    
                    tagItem.addEventListener('click', function() {
                        const tagValue = this.dataset.tag;
                        const catColor = categoryColors[this.dataset.category] || 
                                          defaultColors[Array.from(tagsMenuCategories.children)
                                          .findIndex(el => el.querySelector('.tags-menu-category-title').textContent === this.dataset.category) % defaultColors.length];
                        
                        // Переключаем состояние тега в временном наборе
                        if (tempSelectedTags.has(tagValue)) {
                            tempSelectedTags.delete(tagValue);
                            this.style.backgroundColor = tagBgColor;
                            this.style.color = catColor;
                        } else {
                            tempSelectedTags.add(tagValue);
                            this.style.backgroundColor = catColor;
                            this.style.color = 'white';
                        }
                    });
                    
                    tagsList.appendChild(tagItem);
                });
            }
            
            categoryElement.appendChild(tagsList);
            tagsMenuCategories.appendChild(categoryElement);
        }
        
        // Сохраняем сопоставление тегов к категориям и цветам для использования в других местах
        window.tagsToCategoryMap = {};
        window.categoryToColorMap = categoryColors;
        
        // Заполняем маппинг тегов к категориям
        for (const category in categories) {
            for (const subcategory in categories[category]) {
                const tags = categories[category][subcategory];
                tags.forEach(tag => {
                    window.tagsToCategoryMap[tag] = category;
                });
            }
        }
    }
    
    // Закрытие модального окна
    function closeModal() {
        tagsModalOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Разблокируем прокрутку страницы
        tagsSearch.value = ''; // Очищаем поле поиска
        
        // Сбрасываем фильтрацию
        const tagItems = tagsMenu.querySelectorAll('.tags-menu-item');
        tagItems.forEach(item => {
            item.style.display = 'inline-flex';
        });
        
        const categories = tagsMenu.querySelectorAll('.tags-menu-category');
        categories.forEach(category => {
            category.style.display = 'block';
        });
    }
    
    // Закрытие при клике на крестик
    tagsMenuClose.addEventListener('click', closeModal);
    
    // Закрытие при клике на кнопку "Отмена"
    tagsMenuCancel.addEventListener('click', closeModal);
    
    // Закрытие при клике на затемненную область
    tagsModalOverlay.addEventListener('click', function(e) {
        if (e.target === tagsModalOverlay) {
            closeModal();
        }
    });
    
    // Применение выбранных тегов
    tagsMenuApply.addEventListener('click', function() {
        // Очищаем текущие теги
        resultsContainer.innerHTML = '';
        selectedTags = new Set([...tempSelectedTags]);
        
        // Если теги не выбраны, показываем сообщение
        if (selectedTags.size === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'Не найдено подходящих тегов';
            resultsContainer.appendChild(noResults);
        } else {
            // Отображаем выбранные теги, используя созданный mapping для цветов
            selectedTags.forEach(tag => createTagElement(tag));
        }
        
        // Обновляем список пользователей в соответствии с новыми тегами
        loadUsersByTags([...selectedTags]);
        
        // Закрываем модальное окно
        closeModal();
    });
    
    // Предотвращение закрытия при клике на содержимое модального окна
    tagsMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Копирование в буфер обмена
    function copyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Не удалось скопировать текст: ', err);
        }
        
        document.body.removeChild(textArea);
    }
    
    // Установка Enter для отправки формы
    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!submitButton.disabled) {
                form.dispatchEvent(new Event('submit'));
            }
        }
    });
    
    // Закрытие модального окна по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && tagsModalOverlay.classList.contains('active')) {
            closeModal();
        }
    });

    // Функция для загрузки пользователей
    function loadUsers() {
        fetch('/get_users')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при получении данных пользователей');
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.users && data.users.length > 0) {
                    displayUsers(data.users);
                } else {
                    usersContainer.innerHTML = `
                        <div class="no-users">
                            <p>Нет зарегистрированных пользователей</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                usersContainer.innerHTML = `
                    <div class="no-users">
                        <p>Не удалось загрузить данные пользователей</p>
                    </div>
                `;
            });
    }
    
    // Функция для отображения пользователей
    function displayUsers(users) {
        usersContainer.innerHTML = '';
        
        // Перебираем всех пользователей и создаем карточки
        users.forEach(user => {
            // Создаем элемент карточки пользователя
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            
            // Получаем инициалы для аватара
            const initials = getInitials(user.first_name, user.last_name);
            
            // Получаем иконку для роли пользователя
            const roleIcon = getRoleIcon(user.user_role);
            
            // Преобразуем роль пользователя для отображения
            const roleName = getRoleName(user.user_role);
            
            // Создаем HTML содержимое карточки
            userCard.innerHTML = `
                <div class="user-card-header">
                    <div class="user-avatar">${initials}</div>
                    <div class="user-info">
                        <div class="user-name">${user.last_name} ${user.first_name} ${user.middle_name || ''}</div>
                        <div class="user-role">
                            <i class="bi ${roleIcon}"></i>
                            ${roleName}
                        </div>
                    </div>
                </div>
                <div class="user-details">
                    ${user.age ? `
                        <div class="user-detail">
                            <i class="bi bi-calendar3"></i>
                            <div class="user-detail-content">
                                <div class="user-detail-label">Возраст</div>
                                <div class="user-detail-value">${user.age} лет</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${user.university ? `
                        <div class="user-detail">
                            <i class="bi bi-mortarboard-fill"></i>
                            <div class="user-detail-content">
                                <div class="user-detail-label">Университет</div>
                                <div class="user-detail-value">${user.university}</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${user.faculty ? `
                        <div class="user-detail">
                            <i class="bi bi-book"></i>
                            <div class="user-detail-content">
                                <div class="user-detail-label">Факультет</div>
                                <div class="user-detail-value">${user.faculty}</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${user.course ? `
                        <div class="user-detail">
                            <i class="bi bi-123"></i>
                            <div class="user-detail-content">
                                <div class="user-detail-label">Курс</div>
                                <div class="user-detail-value">${user.course}</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${user.workplace ? `
                        <div class="user-detail">
                            <i class="bi bi-building"></i>
                            <div class="user-detail-content">
                                <div class="user-detail-label">Место работы</div>
                                <div class="user-detail-value">${user.workplace}</div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                ${user.about_me ? `
                    <div class="user-about">
                        <div class="user-about-label">О себе</div>
                        <div class="user-about-text">${user.about_me}</div>
                    </div>
                ` : ''}
                
                <div class="user-tags">
                    ${renderUserTags(user.tags)}
                </div>
                
                <button class="user-contact-btn" data-user-id="${user.id}">
                    <i class="bi bi-send"></i>
                    Отправить заявку на общение
                </button>
            `;
            
            // Добавляем карточку в контейнер
            usersContainer.appendChild(userCard);
            
            // Добавляем обработчик для кнопки "Отправить заявку на общение"
            const contactBtn = userCard.querySelector('.user-contact-btn');
            contactBtn.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                sendContactRequest(userId, user.last_name, user.first_name);
            });
        });
    }
    
    // Функция для отправки заявки на общение
    function sendContactRequest(userId, lastName, firstName) {
        // Проверяем, авторизован ли пользователь
        fetch('/check_auth')
            .then(response => response.json())
            .then(data => {
                if (data.authenticated) {
                    // Показываем уведомление об успешной отправке заявки
                    showNotification('success', `Заявка на общение с ${lastName} ${firstName} успешно отправлена!`);
                    
                    // Здесь можно добавить логику для отправки заявки на сервер
                    // fetch('/send_contact_request', {
                    //     method: 'POST',
                    //     headers: {
                    //         'Content-Type': 'application/json',
                    //     },
                    //     body: JSON.stringify({ user_id: userId })
                    // })
                } else {
                    // Показываем уведомление с предложением авторизоваться
                    showNotification('warning', 'Для отправки заявки необходимо авторизоваться');
                    
                    // Открываем модальное окно входа
                    document.getElementById('loginModal').classList.add('active');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showNotification('error', 'Произошла ошибка при обработке запроса');
            });
    }
    
    // Функция для отображения уведомлений
    function showNotification(type, message) {
        // Удаляем предыдущие уведомления
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            document.body.removeChild(notification);
        });
        
        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Устанавливаем иконку в зависимости от типа уведомления
        let icon = '';
        switch (type) {
            case 'success':
                icon = 'bi-check-circle-fill';
                break;
            case 'error':
                icon = 'bi-exclamation-circle-fill';
                break;
            case 'warning':
                icon = 'bi-exclamation-triangle-fill';
                break;
            default:
                icon = 'bi-info-circle-fill';
        }
        
        notification.innerHTML = `
            <i class="bi ${icon}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="bi bi-x"></i>
            </button>
        `;
        
        // Добавляем уведомление на страницу
        document.body.appendChild(notification);
        
        // Показываем уведомление
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Добавляем обработчик для закрытия уведомления
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        });
        
        // Автоматически скрываем уведомление через 5 секунд
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
    
    // Функция для получения инициалов из имени и фамилии
    function getInitials(firstName, lastName) {
        let initials = '';
        
        if (firstName && firstName.length > 0) {
            initials += firstName[0].toUpperCase();
        }
        
        if (lastName && lastName.length > 0) {
            initials += lastName[0].toUpperCase();
        }
        
        return initials || '?';
    }
    
    // Функция для получения иконки в зависимости от роли пользователя
    function getRoleIcon(role) {
        switch (role) {
            case 'student':
                return 'bi-mortarboard';
            case 'teacher':
                return 'bi-person-workspace';
            case 'employer':
                return 'bi-briefcase';
            default:
                return 'bi-person';
        }
    }
    
    // Функция для преобразования роли в читаемый вид
    function getRoleName(role) {
        switch (role) {
            case 'student':
                return 'Студент';
            case 'teacher':
                return 'Преподаватель';
            case 'employer':
                return 'Работодатель';
            default:
                return 'Пользователь';
        }
    }
    
    // Функция для отображения тегов пользователя
    function renderUserTags(tags) {
        if (!tags || tags.length === 0) {
            return 'Нет тегов';
        }
        
        // Ограничиваем количество отображаемых тегов до 10
        const maxTagsToShow = 10;
        const visibleTags = tags.slice(0, maxTagsToShow);
        const remainingTags = tags.length > maxTagsToShow ? tags.length - maxTagsToShow : 0;
        
        let tagsHtml = visibleTags.map(tag => {
            // Если tag это строка, используем её непосредственно
            const tagText = typeof tag === 'string' ? tag : tag.text || tag.name || '';
            return `<div class="user-tag">${tagText}</div>`;
        }).join('');
        
        // Добавляем индикатор оставшихся тегов
        if (remainingTags > 0) {
            tagsHtml += `<div class="user-tag">+${remainingTags}</div>`;
        }
        
        return tagsHtml;
    }

    // Функция для загрузки пользователей с совпадающими тегами
    function loadUsersByTags(tags) {
        // Показываем секцию пользователей
        document.getElementById('users-section').style.display = 'block';
        
        // Показываем индикатор загрузки в контейнере пользователей
        usersContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="bi bi-arrow-repeat"></i>
                <span>Поиск пользователей с похожими тегами...</span>
            </div>
        `;
        
        // Если нет тегов, показываем сообщение
        if (!tags || tags.length === 0) {
            usersContainer.innerHTML = `
                <div class="no-users">
                    <p>Нет тегов для поиска пользователей</p>
                </div>
            `;
            return;
        }
        
        // Отправляем запрос на сервер для получения пользователей по тегам
        fetch('/get_users_by_tags', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tags: tags })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при получении данных пользователей');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.users && data.users.length > 0) {
                displayUsers(data.users);
            } else {
                usersContainer.innerHTML = `
                    <div class="no-users">
                        <p>Не найдено пользователей с такими тегами</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            usersContainer.innerHTML = `
                <div class="no-users">
                    <p>Не удалось загрузить данные пользователей</p>
                </div>
            `;
        });
    }
}); 