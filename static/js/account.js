document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализация скрипта...');
    
    // Получаем элементы формы
    const accountForm = document.getElementById('account-form');
    const saveBtn = document.getElementById('save-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Элементы для работы с тегами
    const extractTagsBtn = document.getElementById('extract-tags-btn');
    const addTagBtn = document.getElementById('add-tag-btn');
    const tagsContainer = document.getElementById('user-tags');
    
    // Максимальное количество тегов, которое можно выбрать
    const MAX_TAGS_COUNT = 10;
    
    // Элементы модального окна с тегами
    const tagsModalOverlay = document.getElementById('tags-modal-overlay');
    const tagsMenu = document.getElementById('tags-menu');
    const tagsMenuClose = document.getElementById('tags-menu-close');
    const tagsMenuCancel = document.getElementById('tags-menu-cancel');
    const tagsMenuApply = document.getElementById('tags-menu-apply');
    const tagsSearch = document.getElementById('tags-search');
    const tagsMenuCategories = document.getElementById('tags-menu-categories');
    
    // Проверка, что все элементы DOM найдены
    console.log('Проверка элементов DOM:');
    console.log('- addTagBtn:', addTagBtn ? 'найден' : 'не найден');
    console.log('- tagsModalOverlay:', tagsModalOverlay ? 'найден' : 'не найден');
    console.log('- tagsMenu:', tagsMenu ? 'найден' : 'не найден');
    console.log('- tagsMenuCategories:', tagsMenuCategories ? 'найден' : 'не найден');
    
    // Хранение всех доступных тегов и выбранных тегов
    let allAvailableTags = {};
    let userTags = new Set();
    let tempSelectedTags = new Set();
    
    // Глобальные маппинги тегов и категорий
    window.tagsToCategoryMap = {}; // Маппинг тег -> категория
    window.categoryToColorMap = {  // Стандартные цвета категорий
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
    
    // Инициализация текущих тегов пользователя
    initUserTags();
    
    // Инициализация приложения: загрузка тегов и настройка обработчиков
    initializeApp();
    
    // Функция инициализации приложения
    function initializeApp() {
        console.log('Инициализация приложения...');
        
        // Получаем все доступные теги с сервера
        fetchAllTags()
            .then(() => {
                console.log('Теги загружены, приложение готово');
                
                // Инициализация обработчиков событий
                initEventHandlers();
            })
            .catch(error => {
                console.error('Ошибка при инициализации приложения:', error);
                showNotification('Произошла ошибка при загрузке данных', 'error');
            });
    }
    
    // Инициализация обработчиков событий
    function initEventHandlers() {
        console.log('Инициализация обработчиков событий...');
        
        // Обработка кнопки добавления тега
        if (addTagBtn) {
            console.log('Инициализация кнопки добавления тега');
            addTagBtn.addEventListener('click', function() {
                console.log('Клик по кнопке добавления тега');
                openTagsModal();
            });
        } else {
            console.error('Кнопка добавления тега не найдена');
        }
        
        // Обработка кнопки извлечения тегов
        if (extractTagsBtn) {
            extractTagsBtn.addEventListener('click', function() {
                const aboutMe = document.getElementById('about-me').value.trim();
                
                if (!aboutMe) {
                    showNotification('Пожалуйста, заполните поле "О себе" перед извлечением тегов', 'warning');
                    return;
                }
                
                // Меняем состояние кнопки
                extractTagsBtn.disabled = true;
                extractTagsBtn.classList.add('loading');
                extractTagsBtn.innerHTML = '<i class="bi bi-arrow-repeat me-2"></i> Извлечение...';
                
                // Отправляем запрос на сервер
                fetch('/extract_tags', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ description: aboutMe })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Ошибка при обработке запроса');
                    }
                    return response.json();
                })
                .then(data => {
                    // Добавляем найденные теги
                    addExtractedTags(data.tags);
                    showNotification('Теги успешно извлечены', 'success');
                })
                .catch(error => {
                    console.error('Ошибка при извлечении тегов:', error);
                    showNotification('Произошла ошибка при извлечении тегов', 'error');
                })
                .finally(() => {
                    // Восстанавливаем кнопку
                    extractTagsBtn.disabled = false;
                    extractTagsBtn.classList.remove('loading');
                    extractTagsBtn.innerHTML = '<i class="bi bi-lightning-charge me-2"></i> Извлечь теги';
                });
            });
        }

        // Обработка отправки формы
        if (accountForm) {
            accountForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Проверяем количество тегов
                if (userTags.size > MAX_TAGS_COUNT) {
                    showNotification(`Вы выбрали ${userTags.size} тегов. Максимально допустимое количество: ${MAX_TAGS_COUNT}`, 'error');
                    return;
                }
                
                // Деактивируем кнопку сохранения
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i> Сохранение...';
                
                // Собираем данные формы
                const formData = new FormData(accountForm);
                const userData = {};
                
                // Преобразуем FormData в объект
                for (const [key, value] of formData.entries()) {
                    userData[key] = value;
                }
                
                // Добавляем теги пользователя
                userData.tags = Array.from(userTags);
                
                // Преобразуем числовые значения
                if (userData.age) userData.age = parseInt(userData.age) || null;
                if (userData.course) userData.course = parseInt(userData.course) || null;
                
                // Отправляем запрос на сервер
                fetch('/update_account', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showNotification('Данные успешно сохранены', 'success');
                    } else {
                        showNotification(data.error || 'Не удалось сохранить данные', 'error');
                    }
                })
                .catch(error => {
                    console.error('Ошибка при сохранении данных:', error);
                    showNotification('Произошла ошибка при сохранении данных', 'error');
                })
                .finally(() => {
                    // Восстанавливаем кнопку сохранения
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i> Сохранить изменения';
                });
            });
        }

        // Обработка выхода из системы
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                fetch('/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showNotification('Выход выполнен успешно', 'success');
                        // Перенаправляем на главную страницу после короткой задержки
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 1000);
                    } else {
                        showNotification(data.error || 'Не удалось выйти из системы', 'error');
                    }
                })
                .catch(error => {
                    console.error('Ошибка при выходе из системы:', error);
                    showNotification('Произошла ошибка при выходе из системы', 'error');
                });
            });
        }

        // Валидация полей формы
        const ageInput = document.getElementById('user-age');
        if (ageInput) {
            ageInput.addEventListener('input', function() {
                const age = parseInt(this.value);
                if (isNaN(age) || age < 14 || age > 100) {
                    this.classList.add('is-invalid');
                    
                    // Проверяем, существует ли уже сообщение об ошибке
                    let feedback = this.parentNode.querySelector('.invalid-feedback');
                    if (!feedback) {
                        feedback = document.createElement('div');
                        feedback.classList.add('invalid-feedback');
                        this.parentNode.appendChild(feedback);
                    }
                    
                    feedback.textContent = 'Укажите корректный возраст от 14 до 100 лет';
                    saveBtn.disabled = true;
                } else {
                    this.classList.remove('is-invalid');
                    const feedback = this.parentNode.querySelector('.invalid-feedback');
                    if (feedback) {
                        feedback.remove();
                    }
                    saveBtn.disabled = false;
                }
            });
        }
        
        const courseInput = document.getElementById('course');
        if (courseInput) {
            courseInput.addEventListener('input', function() {
                const course = parseInt(this.value);
                if (this.value && (isNaN(course) || course < 1 || course > 6)) {
                    this.classList.add('is-invalid');
                    
                    let feedback = this.parentNode.querySelector('.invalid-feedback');
                    if (!feedback) {
                        feedback = document.createElement('div');
                        feedback.classList.add('invalid-feedback');
                        this.parentNode.appendChild(feedback);
                    }
                    
                    feedback.textContent = 'Укажите корректный курс от 1 до 6';
                    saveBtn.disabled = true;
                } else {
                    this.classList.remove('is-invalid');
                    const feedback = this.parentNode.querySelector('.invalid-feedback');
                    if (feedback) {
                        feedback.remove();
                    }
                    saveBtn.disabled = false;
                }
            });
        }

        // Обработчики модального окна с тегами
        if (tagsMenuClose) {
            tagsMenuClose.addEventListener('click', closeTagsModal);
        } else {
            console.error('Элемент tagsMenuClose не найден');
        }
        
        if (tagsMenuCancel) {
            tagsMenuCancel.addEventListener('click', closeTagsModal);
        } else {
            console.error('Элемент tagsMenuCancel не найден');
        }

        // Обработчик поиска по тегам
        if (tagsSearch) {
            tagsSearch.addEventListener('input', function() {
                const searchText = this.value.toLowerCase().trim();
                
                // Если поле поиска пустое, показываем все теги
                if (!searchText) {
                    const allTags = tagsMenuCategories.querySelectorAll('.tags-menu-tag');
                    allTags.forEach(tag => {
                        tag.style.display = 'inline-flex';
                    });
                    
                    // Показываем все категории
                    const allCategories = tagsMenuCategories.querySelectorAll('.tags-category');
                    allCategories.forEach(category => {
                        category.style.display = 'block';
                    });
                    
                    return;
                }
                
                // Фильтруем теги по тексту поиска
                const allTags = tagsMenuCategories.querySelectorAll('.tags-menu-tag');
                allTags.forEach(tag => {
                    const tagText = tag.textContent.toLowerCase();
                    if (tagText.includes(searchText)) {
                        tag.style.display = 'inline-flex';
                    } else {
                        tag.style.display = 'none';
                    }
                });
                
                // Скрываем категории, у которых все теги скрыты
                const allCategories = tagsMenuCategories.querySelectorAll('.tags-category');
                allCategories.forEach(category => {
                    const visibleTags = category.querySelectorAll('.tags-menu-tag[style="display: inline-flex;"]');
                    if (visibleTags.length === 0) {
                        category.style.display = 'none';
                    } else {
                        category.style.display = 'block';
                    }
                });
            });
        }

        // Обработчик применения выбранных тегов
        if (tagsMenuApply) {
            tagsMenuApply.addEventListener('click', function() {
                // Обновляем пользовательские теги
                console.log('Применение выбранных тегов:', Array.from(tempSelectedTags));
                
                // Проверяем количество тегов
                if (tempSelectedTags.size > MAX_TAGS_COUNT) {
                    showNotification(`Вы выбрали ${tempSelectedTags.size} тегов. Максимально допустимое количество: ${MAX_TAGS_COUNT}`, 'error');
                    return;
                }
                
                // Очищаем существующие теги
                tagsContainer.innerHTML = '';
                
                // Обновляем набор тегов пользователя
                userTags = new Set(tempSelectedTags);
                
                // Если нет выбранных тегов, показываем сообщение
                if (userTags.size === 0) {
                    const noTags = document.createElement('div');
                    noTags.className = 'no-tags';
                    noTags.textContent = 'Пока нет добавленных тегов';
                    tagsContainer.appendChild(noTags);
                } else {
                    // Добавляем теги в контейнер
                    userTags.forEach(tag => {
                        const category = window.tagsToCategoryMap[tag] || 'Другое';
                        const color = window.categoryToColorMap[category] || '#6366f1';
                        createTagElement(tag, color);
                    });
                }
                
                // Закрываем модальное окно
                overlay.remove();
            });
        } else {
            console.error('Элемент tagsMenuApply не найден');
        }
        
        console.log('Все обработчики событий инициализированы');
    }
    
    // Получаем все доступные теги с сервера
    function fetchAllTags() {
        console.log('Загрузка всех доступных тегов...');
        
        return fetch('/get_all_tags')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при загрузке тегов');
                }
                return response.json();
            })
            .then(data => {
                console.log('Получены теги с сервера');
                
                if (data.categories) {
                    allAvailableTags = data.categories;
                    
                    // Заполняем маппинг тегов к категориям
                    for (const category in allAvailableTags) {
                        // Обрабатываем теги с подкатегориями
                        for (const subcategory in allAvailableTags[category]) {
                            allAvailableTags[category][subcategory].forEach(tag => {
                                window.tagsToCategoryMap[tag] = category;
                            });
                        }
                    }
                    
                    console.log('Маппинг тегов к категориям создан');
                    logTagsStatistics();
                    
                    return allAvailableTags;
                }
                
                console.error('Неожиданный формат ответа от сервера:', data);
                return {};
            });
    }
    
    // Инициализация тегов пользователя
    function initUserTags() {
        // Сначала очищаем контейнер
        if (!tagsContainer) return;
        
        console.log('Инициализация тегов пользователя...');
        
        // Загрузим все теги для определения категорий
        fetchAllTags().then(() => {
            // Получаем все теги из DOM
            const tagElements = tagsContainer.querySelectorAll('.tag');
            tagElements.forEach(tag => {
                const tagText = tag.querySelector('.tag-text').textContent.trim();
                userTags.add(tagText);
                
                // Определяем категорию тега и его цвет
                const category = window.tagsToCategoryMap[tagText];
                const tagColor = window.categoryToColorMap[category] || '#6366f1';
                
                // Устанавливаем цвет тега в соответствии с категорией
                tag.style.backgroundColor = tagColor;
                tag.style.color = 'white';
                tag.style.borderColor = tagColor;
                
                console.log(`Тег "${tagText}" (категория: ${category || 'неизвестно'}) установлен с цветом ${tagColor}`);
                
                // Добавляем обработчик для удаления тега
                const removeBtn = tag.querySelector('.remove-tag');
                if (removeBtn) {
                    removeBtn.addEventListener('click', function() {
                        userTags.delete(tagText);
                        tag.remove();
                        
                        // Проверяем, остались ли теги
                        if (userTags.size === 0) {
                            const noTags = document.createElement('div');
                            noTags.className = 'no-tags';
                            noTags.textContent = 'Пока нет добавленных тегов';
                            tagsContainer.appendChild(noTags);
                        }
                    });
                }
            });
        });
    }
    
    // Функция для добавления извлеченных тегов
    function addExtractedTags(tags) {
        if (!tagsContainer) return;
        
        // Удаляем сообщение об отсутствии тегов, если оно есть
        const noTags = tagsContainer.querySelector('.no-tags');
        if (noTags) {
            noTags.remove();
        }
        
        // Количество тегов, которые можно добавить
        const remainingTagsCount = MAX_TAGS_COUNT - userTags.size;
        if (remainingTagsCount <= 0) {
            showMaxTagsLimitNotification();
            return;
        }
        
        // Категории и их цвета
        const categoryColors = window.categoryToColorMap;
        
        // Счетчик добавленных тегов
        let addedTagsCount = 0;
        
        // Обрабатываем категории и подкатегории
        for (const category in tags) {
            if (typeof tags[category] === 'object' && !Array.isArray(tags[category])) {
                // Категория с подкатегориями
                for (const subcategory in tags[category]) {
                    const subcatTags = tags[category][subcategory];
                    if (subcatTags && subcatTags.length > 0) {
                        for (const tag of subcatTags) {
                            if (!userTags.has(tag)) {
                                // Проверяем лимит тегов
                                if (addedTagsCount >= remainingTagsCount) break;
                                
                                createTagElement(tag, categoryColors[category] || '#6366f1');
                                userTags.add(tag);
                                addedTagsCount++;
                            }
                        }
                    }
                    // Если достигли лимита, выходим из цикла
                    if (addedTagsCount >= remainingTagsCount) break;
                }
            } else if (Array.isArray(tags[category])) {
                // Категория с тегами без подкатегорий
                for (const tag of tags[category]) {
                    if (!userTags.has(tag)) {
                        // Проверяем лимит тегов
                        if (addedTagsCount >= remainingTagsCount) break;
                        
                        createTagElement(tag, categoryColors[category] || '#6366f1');
                        userTags.add(tag);
                        addedTagsCount++;
                    }
                }
            }
            // Если достигли лимита, выходим из цикла
            if (addedTagsCount >= remainingTagsCount) break;
        }
        
        // Если достигли лимита и не все теги были добавлены, показываем уведомление
        if (addedTagsCount >= remainingTagsCount && addedTagsCount > 0) {
            showNotification(`Добавлено ${addedTagsCount} тегов. Достигнут лимит в ${MAX_TAGS_COUNT} тегов.`, 'warning');
        } else if (addedTagsCount > 0) {
            showNotification(`Добавлено ${addedTagsCount} тегов`, 'success');
        }
    }
    
    // Функция для создания элемента тега
    function createTagElement(tag, tagColor) {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        
        // Запоминаем категорию тега
        const category = window.tagsToCategoryMap[tag];
        console.log(`Создание тега "${tag}" (категория: ${category || 'неизвестно'}) с цветом ${tagColor}`);
        
        // Устанавливаем цвет тега
        tagElement.style.backgroundColor = tagColor;
        tagElement.style.color = 'white';
        tagElement.style.borderColor = tagColor;
        
        const tagText = document.createElement('span');
        tagText.className = 'tag-text';
        tagText.textContent = tag;
        
        const removeBtn = document.createElement('i');
        removeBtn.className = 'bi bi-x-circle remove-tag';
        removeBtn.style.color = 'white';
        removeBtn.style.opacity = '0.7';
        
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            tagElement.remove();
            userTags.delete(tag);
            
            // Проверяем, остались ли теги
            if (userTags.size === 0) {
                const noTags = document.createElement('div');
                noTags.className = 'no-tags';
                noTags.textContent = 'Пока нет добавленных тегов';
                tagsContainer.appendChild(noTags);
            }
        });
        
        tagElement.appendChild(tagText);
        tagElement.appendChild(removeBtn);
        tagsContainer.appendChild(tagElement);
    }
    
    // Функция для создания модального окна программно
    function createNewTagsModal() {
        console.log('Создание нового модального окна программно...');
        
        // Сбрасываем временный набор выбранных тегов
        tempSelectedTags = new Set(userTags);
        
        // Удаляем существующее модальное окно, если оно есть
        const existingModal = document.getElementById('new-tags-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Создаем overlay
        const overlay = document.createElement('div');
        overlay.id = 'new-tags-modal-overlay';
        
        // Устанавливаем жесткие инлайн-стили для гарантированного отображения
        document.body.style.overflow = 'hidden'; // Блокируем прокрутку страницы
        
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '2147483647'; // Максимально возможный z-index
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.id = 'new-tags-menu';
        
        // Устанавливаем жесткие инлайн-стили
        modal.style.backgroundColor = 'white';
        modal.style.borderRadius = '10px';
        modal.style.width = '90%';
        modal.style.maxWidth = '800px';
        modal.style.maxHeight = '90vh';
        modal.style.overflow = 'hidden';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
        modal.style.position = 'relative';
        modal.style.zIndex = '2147483647';
        
        // Создаем заголовок
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 16px 20px;
            border-bottom: 1px solid #eaeaea;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;
        
        const title = document.createElement('div');
        title.textContent = 'Выберите теги';
        title.style.cssText = `
            font-weight: 600;
            font-size: 18px;
            color: #333;
        `;
        
        const closeBtn = document.createElement('i');
        closeBtn.className = 'bi bi-x';
        closeBtn.style.cssText = `
            font-size: 24px;
            color: #888;
            cursor: pointer;
        `;
        closeBtn.addEventListener('click', function() {
            document.body.style.overflow = 'auto'; // Восстанавливаем прокрутку
            overlay.remove();
        }, { once: true });
        
        // Создаем поле поиска
        const searchBox = document.createElement('div');
        searchBox.style.cssText = `
            padding: 14px 20px;
            border-bottom: 1px solid #eaeaea;
        `;
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Поиск тегов...';
        searchInput.style.cssText = `
            width: 100%;
            padding: 10px 15px;
            border: 1px solid #eaeaea;
            border-radius: 6px;
            font-size: 14px;
        `;
        
        // Добавляем функциональность поиска
        searchInput.addEventListener('input', function() {
            const searchText = this.value.toLowerCase().trim();
            const tagElements = modal.querySelectorAll('[data-tag]');
            
            console.log('Поиск тегов:', searchText);
            console.log('Найдено тегов:', tagElements.length);
            
            if (!searchText) {
                // Если поле поиска пустое, показываем все теги и категории
                tagElements.forEach(tag => {
                    tag.style.display = 'inline-flex';
                });
                
                // Показываем все категории
                const categoryDivs = modal.querySelectorAll('.tag-category');
                categoryDivs.forEach(cat => {
                    cat.style.display = 'block';
                });
                
                // Удаляем сообщение "ничего не найдено", если оно есть
                const noResults = modal.querySelector('.no-search-results');
                if (noResults) {
                    noResults.remove();
                }
                
                console.log('Поиск сброшен, отображены все теги');
            } else {
                // Если введен поисковый запрос, фильтруем теги и категории
                let matchFound = false;
                
                // Создаем Map для подсчета видимых тегов в каждой категории
                const visibleTagsCount = new Map();
                
                // Прячем или показываем теги в зависимости от поискового запроса
                tagElements.forEach(tag => {
                    const tagText = tag.textContent.toLowerCase();
                    const categoryDiv = tag.closest('.tag-category');
                    const categoryName = categoryDiv ? categoryDiv.dataset.category : null;
                    
                    if (tagText.includes(searchText)) {
                        tag.style.display = 'inline-flex';
                        matchFound = true;
                        
                        // Увеличиваем счетчик видимых тегов для категории
                        if (categoryName) {
                            visibleTagsCount.set(
                                categoryName, 
                                (visibleTagsCount.get(categoryName) || 0) + 1
                            );
                        }
                    } else {
                        tag.style.display = 'none';
                    }
                });
                
                // Скрываем или показываем категории в зависимости от наличия видимых тегов
                const categoryDivs = modal.querySelectorAll('.tag-category');
                categoryDivs.forEach(cat => {
                    const categoryName = cat.dataset.category;
                    if (visibleTagsCount.get(categoryName) > 0) {
                        cat.style.display = 'block';
                    } else {
                        cat.style.display = 'none';
                    }
                });
                
                console.log('Результаты поиска:', {
                    matchFound: matchFound,
                    visibleCategories: Array.from(visibleTagsCount.keys())
                });
                
                // Добавляем сообщение, если ничего не найдено
                if (!matchFound) {
                    let noResults = modal.querySelector('.no-search-results');
                    if (!noResults) {
                        noResults = document.createElement('div');
                        noResults.className = 'no-search-results';
                        noResults.style.cssText = `
                            padding: 40px 20px;
                            text-align: center;
                            color: #888;
                            font-style: italic;
                            margin-top: 20px;
                        `;
                        noResults.textContent = 'По вашему запросу ничего не найдено';
                        content.appendChild(noResults);
                    }
                } else {
                    // Удаляем сообщение "ничего не найдено", если оно есть
                    const noResults = modal.querySelector('.no-search-results');
                    if (noResults) {
                        noResults.remove();
                    }
                }
            }
        });
        
        // Создаем контент
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        `;
        
        // Создаем категории
        const categories = document.createElement('div');
        categories.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
        `;
        
        // Добавляем тестовый контент
        const testContent = document.createElement('div');
        testContent.textContent = 'Здесь будут категории и теги';
        testContent.style.cssText = `
            padding: 20px;
            text-align: center;
            color: #888;
            font-style: italic;
        `;
        
        // Создаем футер
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 16px 20px;
            border-top: 1px solid #eaeaea;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
        `;
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Отмена';
        cancelBtn.style.cssText = `
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            background-color: #f8f9fa;
            color: #333;
            border: 1px solid #eaeaea;
        `;
        cancelBtn.addEventListener('click', function() {
            document.body.style.overflow = 'auto'; // Восстанавливаем прокрутку
            overlay.remove();
        }, { once: true });
        
        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Применить';
        applyBtn.style.cssText = `
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            background-color: #4f46e5;
            color: white;
            border: none;
        `;
        applyBtn.addEventListener('click', function() {
            // Обновляем пользовательские теги
            console.log('Применение выбранных тегов:', Array.from(tempSelectedTags));
            
            // Проверяем количество тегов
            if (tempSelectedTags.size > MAX_TAGS_COUNT) {
                showNotification(`Вы выбрали ${tempSelectedTags.size} тегов. Максимально допустимое количество: ${MAX_TAGS_COUNT}`, 'error');
                return;
            }
            
            // Очищаем существующие теги
            tagsContainer.innerHTML = '';
            
            // Обновляем набор тегов пользователя
            userTags = new Set(tempSelectedTags);
            
            // Если нет выбранных тегов, показываем сообщение
            if (userTags.size === 0) {
                const noTags = document.createElement('div');
                noTags.className = 'no-tags';
                noTags.textContent = 'Пока нет добавленных тегов';
                tagsContainer.appendChild(noTags);
            } else {
                // Добавляем теги в контейнер
                userTags.forEach(tag => {
                    const category = window.tagsToCategoryMap[tag] || 'Другое';
                    const color = window.categoryToColorMap[category] || '#6366f1';
                    createTagElement(tag, color);
                });
            }
            
            // Закрываем модальное окно
            document.body.style.overflow = 'auto'; // Восстанавливаем прокрутку
            overlay.remove();
        }, { once: true });
        
        // Собираем всё вместе
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        searchBox.appendChild(searchInput);
        
        categories.appendChild(testContent);
        content.appendChild(categories);
        
        footer.appendChild(cancelBtn);
        footer.appendChild(applyBtn);
        
        modal.appendChild(header);
        modal.appendChild(searchBox);
        modal.appendChild(content);
        modal.appendChild(footer);
        
        overlay.appendChild(modal);
        
        // Добавляем модальное окно на страницу в конец body для избежания перекрытия
        document.body.appendChild(overlay);
        
        console.log('Модальное окно создано и добавлено в DOM');
        
        // Проверка видимости модального окна
        setTimeout(() => {
            const overlayStyle = getComputedStyle(overlay);
            const modalStyle = getComputedStyle(modal);
            
            console.log('Проверка видимости модального окна:');
            console.log('- overlay display:', overlayStyle.display);
            console.log('- overlay visibility:', overlayStyle.visibility);
            console.log('- overlay z-index:', overlayStyle.zIndex);
            console.log('- modal display:', modalStyle.display);
            console.log('- modal visibility:', modalStyle.visibility);
            console.log('- modal z-index:', modalStyle.zIndex);
            console.log('- viewport размеры:', {
                width: window.innerWidth,
                height: window.innerHeight
            });
            
            // Повторное применение стилей для обеспечения видимости
            overlay.style.display = 'flex';
            modal.style.opacity = '1';
        }, 100);
        
        // Закрытие модального окна при клике вне его
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                document.body.style.overflow = 'auto'; // Восстанавливаем прокрутку
                overlay.remove();
            }
        });
        
        // Добавляем закрытие по клавише Escape
        const closeOnEscape = function(e) {
            if (e.key === 'Escape') {
                document.body.style.overflow = 'auto'; // Восстанавливаем прокрутку
                overlay.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        };
        document.addEventListener('keydown', closeOnEscape);
        
        return {
            overlay: overlay,
            modal: modal,
            content: categories
        };
    }
    
    // Функция для открытия модального окна с тегами
    function openTagsModal() {
        console.log('Открытие модального окна с тегами');
        
        // Диагностика тегов перед открытием модального окна
        logTagsStatistics();
        
        // Создаем новое модальное окно
        const modal = createNewTagsModal();
        
        // Заполняем модальное окно категориями и тегами
        fillNewTagsModal(modal.content);
    }
    
    // Функция для заполнения нового модального окна тегами
    function fillNewTagsModal(container) {
        console.log('Заполнение нового модального окна тегами');
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        // Проверяем наличие тегов
        if (!allAvailableTags || Object.keys(allAvailableTags).length === 0) {
            console.warn('Теги не загружены, пробуем загрузить...');
            const loadingMessage = document.createElement('div');
            loadingMessage.textContent = 'Загрузка тегов...';
            loadingMessage.style.cssText = `
                padding: 20px;
                text-align: center;
                color: #888;
                font-style: italic;
            `;
            container.appendChild(loadingMessage);
            
            fetchAllTags().then(() => {
                // Повторно вызываем функцию после загрузки тегов
                fillNewTagsModal(container);
            }).catch(err => {
                console.error('Ошибка при загрузке тегов:', err);
                
                // Добавляем сообщение об ошибке в модальное окно
                container.innerHTML = '<div style="padding:20px;text-align:center;color:#888;font-style:italic;">Не удалось загрузить теги. Пожалуйста, попробуйте позже.</div>';
            });
            return;
        }
        
        let categoryCount = 0;
        let totalTagsCount = 0;
        
        // Добавляем категории и их теги
        for (const category in allAvailableTags) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'tag-category'; // Добавляем класс для легкой идентификации
            categoryDiv.dataset.category = category;
            categoryDiv.style.cssText = `
                margin-bottom: 16px;
                border-bottom: 1px solid #eee;
                padding-bottom: 16px;
            `;
            
            const categoryTitle = document.createElement('div');
            categoryTitle.textContent = category;
            categoryTitle.className = 'tag-category-title';
            categoryTitle.style.cssText = `
                font-weight: 600;
                font-size: 16px;
                margin-bottom: 10px;
                color: #333;
                display: flex;
                align-items: center;
                justify-content: space-between;
            `;
            
            const categoryTags = document.createElement('div');
            categoryTags.className = 'tag-category-tags';
            categoryTags.style.cssText = `
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            `;
            
            let tagsInCategory = 0;
            
            // Добавляем теги категории
            if (typeof allAvailableTags[category] === 'object' && !Array.isArray(allAvailableTags[category])) {
                // Категория с подкатегориями
                for (const subcategory in allAvailableTags[category]) {
                    const subcatTags = allAvailableTags[category][subcategory];
                    if (subcatTags && subcatTags.length > 0) {
                        subcatTags.forEach(tag => {
                            addTagToNewModal(tag, categoryTags);
                            tagsInCategory++;
                            totalTagsCount++;
                        });
                    }
                }
            } else if (Array.isArray(allAvailableTags[category])) {
                // Категория с тегами без подкатегорий
                allAvailableTags[category].forEach(tag => {
                    addTagToNewModal(tag, categoryTags);
                    tagsInCategory++;
                    totalTagsCount++;
                });
            }
            
            // Добавляем категорию только если в ней есть теги
            if (tagsInCategory > 0) {
                categoryDiv.appendChild(categoryTitle);
                categoryDiv.appendChild(categoryTags);
                container.appendChild(categoryDiv);
                categoryCount++;
            }
        }
        
        console.log('Новое модальное окно заполнено:');
        console.log('- категорий:', categoryCount);
        console.log('- всего тегов:', totalTagsCount);
        
        // Если нет тегов совсем, показываем сообщение
        if (totalTagsCount === 0) {
            const noTagsMsg = document.createElement('div');
            noTagsMsg.style.cssText = `
                padding: 40px 20px;
                text-align: center;
                color: #888;
                font-style: italic;
            `;
            noTagsMsg.textContent = 'Нет доступных тегов';
            container.appendChild(noTagsMsg);
        }
    }
    
    // Функция для добавления тега в новое модальное окно
    function addTagToNewModal(tag, container) {
        const category = window.tagsToCategoryMap[tag] || 'Другое';
        const tagColor = window.categoryToColorMap[category] || '#6366f1';
        
        const tagElement = document.createElement('div');
        tagElement.textContent = tag;
        tagElement.dataset.tag = tag;
        tagElement.dataset.category = category;
        
        // Если тег уже выбран, применяем стили выбранного тега
        if (tempSelectedTags.has(tag)) {
            tagElement.style.cssText = `
                display: inline-flex;
                align-items: center;
                padding: 6px 12px;
                background-color: ${tagColor};
                color: white;
                font-size: 13px;
                border-radius: 30px;
                border: 1px solid ${tagColor};
                cursor: pointer;
                transition: all 0.2s ease;
            `;
        } else {
            // Проверяем, не достигнут ли лимит тегов
            const isDisabled = tempSelectedTags.size >= MAX_TAGS_COUNT && !tempSelectedTags.has(tag);
            
            tagElement.style.cssText = `
                display: inline-flex;
                align-items: center;
                padding: 6px 12px;
                background-color: rgba(${hexToRgb(tagColor)}, ${isDisabled ? '0.05' : '0.1'});
                color: ${isDisabled ? '#999' : tagColor};
                font-size: 13px;
                border-radius: 30px;
                border: 1px solid rgba(${hexToRgb(tagColor)}, ${isDisabled ? '0.1' : '0.2'});
                cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
                transition: all 0.2s ease;
                ${isDisabled ? 'opacity: 0.7;' : ''}
            `;
            
            // Если тег отключен, добавляем подсказку
            if (isDisabled) {
                tagElement.title = `Достигнут лимит в ${MAX_TAGS_COUNT} тегов`;
            }
        }
        
        // Обработка клика по тегу
        tagElement.addEventListener('click', function() {
            if (tempSelectedTags.has(tag)) {
                tempSelectedTags.delete(tag);
                tagElement.style.cssText = `
                    display: inline-flex;
                    align-items: center;
                    padding: 6px 12px;
                    background-color: rgba(${hexToRgb(tagColor)}, 0.1);
                    color: ${tagColor};
                    font-size: 13px;
                    border-radius: 30px;
                    border: 1px solid rgba(${hexToRgb(tagColor)}, 0.2);
                    cursor: pointer;
                    transition: all 0.2s ease;
                `;
                tagElement.title = '';
                
                // Обновляем стили всех тегов, которые могли быть отключены
                if (tempSelectedTags.size === MAX_TAGS_COUNT - 1) {
                    updateTagsState(container.closest('.tags-menu, #new-tags-menu'));
                }
            } else {
                // Проверяем, не достигнут ли лимит тегов
                if (tempSelectedTags.size >= MAX_TAGS_COUNT) {
                    showMaxTagsLimitNotification();
                    return;
                }
                
                tempSelectedTags.add(tag);
                tagElement.style.cssText = `
                    display: inline-flex;
                    align-items: center;
                    padding: 6px 12px;
                    background-color: ${tagColor};
                    color: white;
                    font-size: 13px;
                    border-radius: 30px;
                    border: 1px solid ${tagColor};
                    cursor: pointer;
                    transition: all 0.2s ease;
                `;
                
                // Если достигли максимума тегов, обновляем стили всех неактивных тегов
                if (tempSelectedTags.size === MAX_TAGS_COUNT) {
                    updateTagsState(container.closest('.tags-menu, #new-tags-menu'));
                }
            }
        });
        
        container.appendChild(tagElement);
    }
    
    // Функция для конвертации HEX цвета в RGB формат
    function hexToRgb(hex) {
        // Убираем # если есть
        hex = hex.replace('#', '');
        
        // Парсим компоненты RGB
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        
        return `${r}, ${g}, ${b}`;
    }
    
    // Закрытие модального окна с тегами
    function closeTagsModal() {
        console.log('Закрытие модального окна с тегами');
        
        if (!tagsModalOverlay || !tagsMenu) {
            console.error('Элементы модального окна не найдены при закрытии');
            return;
        }
        
        // Удаляем класс active, чтобы скрыть модальное окно
        tagsModalOverlay.classList.remove('active');
        
        console.log('Модальное окно закрыто');
    }
    
    // Функция для отображения уведомлений
    function showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Добавляем уведомление на страницу
        container.appendChild(notification);
        
        // Удаляем уведомление через 5 секунд
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(20px)';
            
            // Удаляем элемент после завершения анимации
            setTimeout(() => {
                container.removeChild(notification);
            }, 300);
        }, 5000);
    }
    
    // Функция для проверки перекрытия модального окна другими элементами
    function checkOverlayVisibilityIssues() {
        console.log('Проверка возможных проблем с видимостью модального окна...');
        
        // Проверяем элементы с высоким z-index
        const allElements = document.querySelectorAll('*');
        const highZIndexElements = [];
        
        allElements.forEach(el => {
            const style = getComputedStyle(el);
            const zIndex = parseInt(style.zIndex);
            const position = style.position;
            
            if (!isNaN(zIndex) && zIndex > 9000 && position !== 'static' && el !== tagsModalOverlay && el !== tagsMenu) {
                highZIndexElements.push({
                    element: el,
                    tagName: el.tagName,
                    className: el.className,
                    id: el.id,
                    zIndex: zIndex,
                    position: position
                });
            }
        });
        
        if (highZIndexElements.length > 0) {
            console.warn('Найдены элементы с высоким z-index, которые могут перекрывать модальное окно:', highZIndexElements);
        } else {
            console.log('Не найдено элементов, которые могут перекрывать модальное окно по z-index');
        }
        
        // Проверка видимости модального окна
        if (tagsModalOverlay && tagsMenu) {
            const overlayRect = tagsModalOverlay.getBoundingClientRect();
            const menuRect = tagsMenu.getBoundingClientRect();
            
            console.log('Размеры модального окна:', {
                overlay: {
                    width: overlayRect.width,
                    height: overlayRect.height,
                    top: overlayRect.top,
                    left: overlayRect.left,
                    bottom: overlayRect.bottom,
                    right: overlayRect.right
                },
                menu: {
                    width: menuRect.width,
                    height: menuRect.height,
                    top: menuRect.top,
                    left: menuRect.left,
                    bottom: menuRect.bottom,
                    right: menuRect.right
                }
            });
            
            // Проверка, находится ли оверлей в видимой области экрана
            if (overlayRect.width === 0 || overlayRect.height === 0) {
                console.error('Модальное окно имеет нулевые размеры, возможно оно скрыто CSS');
            }
        }
    }
    
    // Функция для вывода диагностики тегов
    function logTagsStatistics() {
        console.log('===== ДИАГНОСТИКА ТЕГОВ =====');
        console.log('Всего категорий тегов:', Object.keys(allAvailableTags).length);
        
        // Подсчитываем количество тегов в каждой категории
        const tagsByCategory = {};
        let totalTags = 0;
        
        for (const category in allAvailableTags) {
            let count = 0;
            
            if (typeof allAvailableTags[category] === 'object' && !Array.isArray(allAvailableTags[category])) {
                // Категория с подкатегориями
                for (const subcategory in allAvailableTags[category]) {
                    const subcatTags = allAvailableTags[category][subcategory];
                    if (subcatTags && subcatTags.length > 0) {
                        count += subcatTags.length;
                    }
                }
            } else if (Array.isArray(allAvailableTags[category])) {
                // Категория с тегами без подкатегорий
                count = allAvailableTags[category].length;
            }
            
            tagsByCategory[category] = count;
            totalTags += count;
        }
        
        console.log('Теги по категориям:', tagsByCategory);
        console.log('Всего тегов:', totalTags);
        console.log('Выбранные теги пользователя:', Array.from(userTags));
        console.log('Временно выбранные теги:', Array.from(tempSelectedTags));
        console.log('============================');
    }
    
    // Функция для обновления состояния всех тегов при достижении лимита
    function updateTagsState(modalElement) {
        if (!modalElement) return;
        
        const allTagElements = modalElement.querySelectorAll('[data-tag]');
        allTagElements.forEach(tagEl => {
            const tagText = tagEl.dataset.tag;
            const category = tagEl.dataset.category || window.tagsToCategoryMap[tagText] || 'Другое';
            const tagColor = window.categoryToColorMap[category] || '#6366f1';
            
            // Если тег не выбран, обновляем его стиль
            if (!tempSelectedTags.has(tagText)) {
                const isDisabled = tempSelectedTags.size >= MAX_TAGS_COUNT;
                
                tagEl.style.cssText = `
                    display: inline-flex;
                    align-items: center;
                    padding: 6px 12px;
                    background-color: rgba(${hexToRgb(tagColor)}, ${isDisabled ? '0.05' : '0.1'});
                    color: ${isDisabled ? '#999' : tagColor};
                    font-size: 13px;
                    border-radius: 30px;
                    border: 1px solid rgba(${hexToRgb(tagColor)}, ${isDisabled ? '0.1' : '0.2'});
                    cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
                    transition: all 0.2s ease;
                    ${isDisabled ? 'opacity: 0.7;' : ''}
                `;
                
                if (isDisabled) {
                    tagEl.title = `Достигнут лимит в ${MAX_TAGS_COUNT} тегов`;
                } else {
                    tagEl.title = '';
                }
            }
        });
    }
    
    // Функция для отображения уведомления о достижении лимита тегов
    function showMaxTagsLimitNotification() {
        showNotification(`Вы можете выбрать максимум ${MAX_TAGS_COUNT} тегов`, 'warning');
    }
}); 