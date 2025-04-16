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
        }
        
        if (tagsMenuCancel) {
            tagsMenuCancel.addEventListener('click', closeTagsModal);
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
                // Очищаем текущие теги
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
                closeTagsModal();
            });
        }
        
        console.log('Все обработчики событий инициализированы');
    }
    
    // Получаем все доступные теги с сервера
    function fetchAllTags() {
        console.log('Загрузка тегов с сервера...');
        return fetch('/get_all_tags')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при загрузке тегов: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log('Теги успешно загружены:', data);
                if (data.categories) {
                    allAvailableTags = data.categories;
                    
                    // Заполняем маппинги тегов и категорий
                    for (const category in allAvailableTags) {
                        const categoryColor = window.categoryToColorMap[category] || '#6366f1';
                        
                        if (typeof allAvailableTags[category] === 'object' && !Array.isArray(allAvailableTags[category])) {
                            // Категория с подкатегориями
                            for (const subcategory in allAvailableTags[category]) {
                                const subcatTags = allAvailableTags[category][subcategory];
                                if (subcatTags && subcatTags.length > 0) {
                                    subcatTags.forEach(tag => {
                                        window.tagsToCategoryMap[tag] = category;
                                    });
                                }
                            }
                        } else if (Array.isArray(allAvailableTags[category])) {
                            // Категория с тегами без подкатегорий
                            allAvailableTags[category].forEach(tag => {
                                window.tagsToCategoryMap[tag] = category;
                            });
                        }
                    }
                    return data.categories;
                }
                return {};
            })
            .catch(error => {
                console.error('Ошибка при получении тегов:', error);
                return {};
            });
    }
    
    // Инициализация тегов пользователя
    function initUserTags() {
        // Сначала очищаем контейнер
        if (!tagsContainer) return;
        
        // Получаем все теги из DOM
        const tagElements = tagsContainer.querySelectorAll('.tag');
        tagElements.forEach(tag => {
            const tagText = tag.querySelector('.tag-text').textContent.trim();
            userTags.add(tagText);
            
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
    }
    
    // Функция для добавления извлеченных тегов
    function addExtractedTags(tags) {
        if (!tagsContainer) return;
        
        // Удаляем сообщение об отсутствии тегов, если оно есть
        const noTags = tagsContainer.querySelector('.no-tags');
        if (noTags) {
            noTags.remove();
        }
        
        // Категории и их цвета
        const categoryColors = window.categoryToColorMap;
        
        // Обрабатываем категории и подкатегории
        for (const category in tags) {
            if (typeof tags[category] === 'object' && !Array.isArray(tags[category])) {
                // Категория с подкатегориями
                for (const subcategory in tags[category]) {
                    const subcatTags = tags[category][subcategory];
                    if (subcatTags && subcatTags.length > 0) {
                        subcatTags.forEach(tag => {
                            if (!userTags.has(tag)) {
                                createTagElement(tag, categoryColors[category] || '#6366f1');
                                userTags.add(tag);
                            }
                        });
                    }
                }
            } else if (Array.isArray(tags[category])) {
                // Категория с тегами без подкатегорий
                tags[category].forEach(tag => {
                    if (!userTags.has(tag)) {
                        createTagElement(tag, categoryColors[category] || '#6366f1');
                        userTags.add(tag);
                    }
                });
            }
        }
    }
    
    // Функция для создания элемента тега
    function createTagElement(tag, tagColor) {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.style.backgroundColor = tagColor;
        tagElement.style.color = 'white';
        
        const tagText = document.createElement('span');
        tagText.className = 'tag-text';
        tagText.textContent = tag;
        
        const removeBtn = document.createElement('i');
        removeBtn.className = 'bi bi-x-circle remove-tag';
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
    
    // Функция для открытия модального окна с тегами
    function openTagsModal() {
        // Сбрасываем временный набор выбранных тегов
        tempSelectedTags = new Set(userTags);
        
        // Заполняем модальное окно категориями тегов
        populateTagsMenu();
        
        // Сначала сбрасываем стили
        tagsMenu.style.opacity = '0';
        tagsMenu.style.transform = 'translateY(20px)';
        
        // Открываем модальное окно
        tagsModalOverlay.style.display = 'flex';
        
        // Добавляем небольшую задержку перед анимацией появления
        setTimeout(() => {
            tagsMenu.style.opacity = '1';
            tagsMenu.style.transform = 'translateY(0)';
        }, 10);
    }
    
    // Функция для заполнения модального окна категориями тегов
    function populateTagsMenu() {
        console.log('Заполнение модального окна тегами');
        console.log('Категории тегов:', allAvailableTags);
        
        if (!tagsMenuCategories) {
            console.error('Элемент tagsMenuCategories не найден');
            return;
        }
        
        if (!allAvailableTags || Object.keys(allAvailableTags).length === 0) {
            console.warn('Теги не загружены, пробуем загрузить...');
            fetchAllTags().then(() => {
                // Повторно вызываем функцию после загрузки тегов
                populateTagsMenu();
            });
            return;
        }
        
        // Очищаем контейнер категорий
        tagsMenuCategories.innerHTML = '';
        
        // Добавляем категории и их теги
        for (const category in allAvailableTags) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'tags-category';
            
            const categoryTitle = document.createElement('div');
            categoryTitle.className = 'tags-category-title';
            categoryTitle.textContent = category;
            
            const categoryTags = document.createElement('div');
            categoryTags.className = 'tags-category-tags';
            
            // Добавляем теги категории
            if (typeof allAvailableTags[category] === 'object' && !Array.isArray(allAvailableTags[category])) {
                // Категория с подкатегориями
                for (const subcategory in allAvailableTags[category]) {
                    const subcatTags = allAvailableTags[category][subcategory];
                    if (subcatTags && subcatTags.length > 0) {
                        subcatTags.forEach(tag => {
                            addTagToMenu(tag, categoryTags);
                        });
                    }
                }
            } else if (Array.isArray(allAvailableTags[category])) {
                // Категория с тегами без подкатегорий
                allAvailableTags[category].forEach(tag => {
                    addTagToMenu(tag, categoryTags);
                });
            }
            
            // Добавляем категорию только если в ней есть теги
            if (categoryTags.children.length > 0) {
                categoryDiv.appendChild(categoryTitle);
                categoryDiv.appendChild(categoryTags);
                tagsMenuCategories.appendChild(categoryDiv);
            }
        }
        
        console.log('Модальное окно заполнено, категорий: ', tagsMenuCategories.querySelectorAll('.tags-category').length);
    }
    
    // Функция для добавления тега в модальное окно
    function addTagToMenu(tag, container) {
        const tagElement = document.createElement('div');
        tagElement.className = 'tags-menu-tag';
        tagElement.textContent = tag;
        tagElement.dataset.tag = tag;
        
        // Если тег уже выбран, добавляем класс selected
        if (tempSelectedTags.has(tag)) {
            tagElement.classList.add('selected');
        }
        
        // Обработка клика по тегу
        tagElement.addEventListener('click', function() {
            if (tagElement.classList.contains('selected')) {
                tagElement.classList.remove('selected');
                tempSelectedTags.delete(tag);
            } else {
                tagElement.classList.add('selected');
                tempSelectedTags.add(tag);
            }
        });
        
        container.appendChild(tagElement);
    }
    
    // Закрытие модального окна с тегами
    function closeTagsModal() {
        tagsMenu.style.opacity = '0';
        tagsMenu.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            tagsModalOverlay.style.display = 'none';
        }, 300);
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
}); 