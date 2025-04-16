document.addEventListener('DOMContentLoaded', function() {
    // Элементы авторизации
    const profileBtn = document.getElementById('profile-btn');
    const authModal = document.getElementById('authModal');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginBtn');
    
    // Элементы меню профиля
    const profileMenu = document.getElementById('profile-menu');
    const profileUsername = document.getElementById('profile-username');
    const accountBtn = document.getElementById('account-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Кнопки показа/скрытия пароля
    const passwordToggleButtons = document.querySelectorAll('.password-toggle');
    
    // Элементы многошаговой регистрации
    const registerSteps = document.querySelectorAll('.register-step');
    const stepDots = document.querySelectorAll('.step-dot');
    
    // Шаг 1: Ввод Telegram
    const step1 = document.getElementById('step1');
    const regUsername = document.getElementById('regUsername');
    const step1NextBtn = document.getElementById('step1NextBtn');
    
    // Шаг 2: Верификация через бота
    const step2 = document.getElementById('step2');
    const confirmationCode = document.getElementById('confirmationCode');
    const step2BackBtn = document.getElementById('step2BackBtn');
    const step2NextBtn = document.getElementById('step2NextBtn');
    
    // Шаг 3: Создание пароля
    const step3 = document.getElementById('step3');
    const regPassword = document.getElementById('regPassword');
    const regPasswordConfirm = document.getElementById('regPasswordConfirm');
    const step3BackBtn = document.getElementById('step3BackBtn');
    const step3NextBtn = document.getElementById('step3NextBtn');
    
    // Шаг ФИО
    const stepFullName = document.getElementById('stepFullName');
    const regLastName = document.getElementById('regLastName');
    const regFirstName = document.getElementById('regFirstName');
    const regMiddleName = document.getElementById('regMiddleName');
    const stepFullNameBackBtn = document.getElementById('stepFullNameBackBtn');
    const stepFullNameNextBtn = document.getElementById('stepFullNameNextBtn');
    
    // Шаг 4: Анализ описания проекта
    const step4 = document.getElementById('step4');
    const descriptionText = document.getElementById('descriptionText');
    const descriptionCharCounter = document.getElementById('descriptionCharCounter');
    const analyzeBtn = document.getElementById('descriptionAnalyzeBtn');
    const analysisProgressContainer = document.getElementById('descriptionProgressContainer');
    const analysisProgressIndicator = document.getElementById('descriptionProgressIndicator');
    const tagsSection = document.getElementById('descriptionTagsSection');
    const tagsContainer = document.getElementById('descriptionTagsContainer');
    const addTagBtn = document.getElementById('descriptionAddTagBtn');
    const step4BackBtn = document.getElementById('step4BackBtn');
    const step4NextBtn = document.getElementById('step4NextBtn');
    
    // Элементы модального окна с тегами
    const tagsModalOverlay = document.getElementById('description-tags-modal-overlay');
    const tagsMenu = document.getElementById('description-tags-menu');
    const tagsMenuClose = document.getElementById('description-tags-menu-close');
    const tagsMenuCancel = document.getElementById('description-tags-menu-cancel');
    const tagsMenuApply = document.getElementById('description-tags-menu-apply');
    const tagsSearch = document.getElementById('description-tags-search');
    const tagsMenuCategories = document.getElementById('description-tags-menu-categories');
    
    // Шаг 5: Успешная регистрация
    const step5 = document.getElementById('step5');
    const goToLoginBtn = document.getElementById('goToLoginBtn');
    
    // Прогресс и индикаторы
    const progressIndicator = document.getElementById('progressIndicator');
    const currentStepNumber = document.getElementById('currentStepNumber');
    
    // Хранение текущего пользователя Telegram
    let currentTelegramUsername = '';
    let registrationInProgress = false;
    const totalSteps = 8;
    let currentStep = 1;
    
    // Данные пользователя
    let userData = {
        telegram_username: '',
        password: '',
        last_name: '',
        first_name: '',
        middle_name: '',
        user_role: '',
        age: null,
        about_me: '',
        tags: [],
        university: '',
        faculty: '',
        course: null,
        workplace: ''
    };
    
    // Хранение тегов для описания проекта
    let selectedTags = new Set();
    let tempSelectedTags = new Set();
    const MAX_DESCRIPTION_CHARS = 500;
    
    // Инициализация Bootstrap модального окна
    const bootstrapModal = new bootstrap.Modal(authModal);
    
    // Обработчик для открытия модального окна
    authModal.addEventListener('show.bs.modal', function() {
        // При каждом новом открытии показываем вкладку входа
        loginTab.click();
    });
    
    // Инициализация Bootstrap таб-панелей
    const triggerTabList = document.querySelectorAll('#authTabs button');
    triggerTabList.forEach(function (triggerEl) {
        triggerEl.addEventListener('click', function (event) {
            event.preventDefault();
            // Если переключаемся на вкладку регистрации
            if (this.id === 'register-tab') {
                resetRegistrationForm();
            }
        });
    });
    
    // Функция обработчик закрытия модального окна
    function handleModalClose() {
        cancelRegistration();
    }
    
    // При закрытии модального окна
    authModal.addEventListener('hidden.bs.modal', handleModalClose);
    
    // Функция отмены регистрации
    function cancelRegistration() {
        // Если регистрация началась, но не завершена, отменяем запрос
        if (registrationInProgress && currentTelegramUsername) {
            // Отправляем запрос на отмену регистрации
            fetch('/register/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ telegram_username: currentTelegramUsername })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Регистрация отменена:', data);
            })
            .catch(error => {
                console.error('Ошибка при отмене регистрации:', error);
            });
        }
        
        // Сбрасываем форму
        resetRegistrationForm();
    }
    
    // Функция сброса формы регистрации
    function resetRegistrationForm() {
        // Сбрасываем все поля
        if (regUsername) regUsername.value = '';
        if (confirmationCode) confirmationCode.value = '';
        if (regPassword) regPassword.value = '';
        if (regPasswordConfirm) regPasswordConfirm.value = '';
        if (regLastName) regLastName.value = '';
        if (regFirstName) regFirstName.value = '';
        if (regMiddleName) regMiddleName.value = '';
        if (descriptionText) descriptionText.value = '';
        if (descriptionCharCounter) descriptionCharCounter.textContent = '0/500';
        if (userAgeInput) userAgeInput.value = '';
        if (universityInput) universityInput.value = '';
        if (teacherUniversityInput) teacherUniversityInput.value = '';
        if (facultyInput) facultyInput.value = '';
        if (courseInput) courseInput.value = '';
        if (workplaceInput) workplaceInput.value = '';
        
        // Сбрасываем роль пользователя
        if (roleOptions) {
            roleOptions.forEach(opt => opt.classList.remove('selected'));
        }
        
        // Скрываем дополнительные поля
        if (studentFields) studentFields.style.display = 'none';
        if (teacherFields) teacherFields.style.display = 'none';
        if (employerFields) employerFields.style.display = 'none';
        
        // Деактивируем кнопку на шаге 4
        if (step4NextBtn) {
            step4NextBtn.disabled = true;
        }
        
        // Скрываем секцию с тегами в описании
        if (tagsSection) tagsSection.style.display = 'none';
        
        // Очищаем теги в описании
        if (tagsContainer) tagsContainer.innerHTML = '';
        selectedTags.clear();
        
        // Сбрасываем данные пользователя
        userData = {
            telegram_username: '',
            password: '',
            last_name: '',
            first_name: '',
            middle_name: '',
            user_role: '',
            age: null,
            about_me: '',
            tags: [],
            university: '',
            faculty: '',
            course: null,
            workplace: ''
        };
        
        // Показываем только первый шаг
        registerSteps.forEach(step => step.classList.remove('active'));
        if (step1) step1.classList.add('active');
        
        // Сбрасываем индикаторы шагов
        stepDots.forEach((dot, index) => {
            dot.classList.remove('active', 'completed');
            if (index === 0) {
                dot.classList.add('active');
            }
        });
        
        // Обновляем прогресс-бар
        if (progressIndicator) progressIndicator.style.width = (100 / totalSteps) + '%';
        if (currentStepNumber) currentStepNumber.textContent = '1';
        currentStep = 1;
        
        // Сбрасываем текущее имя пользователя
        currentTelegramUsername = '';
        registrationInProgress = false;
    }
    
    // Обработка отправки формы входа
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const telegramUsername = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        // Проверяем, что поля не пустые
        if (!telegramUsername || !password) {
            showNotification('Пожалуйста, заполните все поля', 'error');
            return;
        }
        
        loginBtn.disabled = true;
        loginBtn.textContent = 'Выполняется вход...';
        
        // Отправляем запрос на авторизацию
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                telegram_username: telegramUsername,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Сохраняем данные пользователя
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Обновляем кнопку профиля
                updateProfileButton(data.user);
                
                // Отключаем обработчик сброса формы, чтобы не сбрасывать её при закрытии
                authModal.removeEventListener('hidden.bs.modal', handleModalClose);
                
                // Закрываем модальное окно авторизации
                bootstrapModal.hide();
                
                // Очищаем форму
                document.getElementById('loginUsername').value = '';
                document.getElementById('loginPassword').value = '';
                
                // Показываем персонализированное уведомление об успешной авторизации
                const firstName = data.user.first_name || '';
                const greeting = firstName ? `${firstName}, вы успешно вошли в систему` : 'Вы успешно вошли в систему';
                showNotification(greeting, 'success');
                
                // Возвращаем обработчик закрытия для будущих открытий
                setTimeout(() => {
                    authModal.addEventListener('hidden.bs.modal', handleModalClose);
                }, 500);
            } else {
                showNotification(data.error || 'Ошибка при входе в систему', 'error');
                highlightInvalidField('loginUsername');
                highlightInvalidField('loginPassword');
            }
        })
        .catch(error => {
            console.error('Ошибка при авторизации:', error);
            showNotification('Произошла ошибка при авторизации', 'error');
        })
        .finally(() => {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Войти';
        });
    });
    
    // Добавляем обработчик клика на кнопку входа
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            // Отправляем форму логина при клике на кнопку
            loginForm.dispatchEvent(new Event('submit'));
        });
    }
    
    // Обработка шагов регистрации
    if (step1NextBtn) {
        step1NextBtn.addEventListener('click', function() {
            const telegram = regUsername.value.trim();
            
            // Удаляем подсветку ошибки при новой проверке
            regUsername.classList.remove('is-invalid');
            
            if (!telegram) {
                showNotification('Пожалуйста, введите имя пользователя Telegram', 'error');
                highlightInvalidField('regUsername');
                return;
            }
            
            // Проверка на наличие символа @
            if (!telegram.startsWith('@')) {
                showNotification('Имя пользователя должно начинаться с символа @', 'error');
                highlightInvalidField('regUsername');
                return;
            }
            
            step1NextBtn.disabled = true;
            step1NextBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i> Проверка...';
            
            console.log('Отправка имени пользователя на сервер:', telegram);
            
            // Отправка данных на сервер
            fetch('/register/step1', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ telegram_username: telegram })
            })
            .then(response => {
                console.log('Статус ответа:', response.status);
                if (!response.ok) {
                    if (response.status === 500) {
                        throw new Error('Ошибка сервера при проверке имени пользователя');
                    }
                }
                return response.json();
            })
            .then(data => {
                console.log('Ответ сервера:', data);
                step1NextBtn.disabled = false;
                step1NextBtn.innerHTML = '<span>Продолжить</span><i class="bi bi-arrow-right ms-2"></i>';
                
                if (data.success) {
                    // Сохраняем имя пользователя и переходим к следующему шагу
                    currentTelegramUsername = telegram;
                    registrationInProgress = true;
                    showStep(2);
                } else {
                    showNotification(data.error || 'Ошибка при проверке имени пользователя', 'error');
                    highlightInvalidField('regUsername');
                }
            })
            .catch(error => {
                console.error('Ошибка при запросе:', error);
                step1NextBtn.disabled = false;
                step1NextBtn.innerHTML = '<span>Продолжить</span><i class="bi bi-arrow-right ms-2"></i>';
                showNotification('Произошла ошибка при проверке имени пользователя', 'error');
                highlightInvalidField('regUsername');
            });
        });
    }
    
    // Кнопка "Назад" для шага 2
    if (step2BackBtn) {
        step2BackBtn.addEventListener('click', function() {
            showStep(1);
        });
    }
    
    // Кнопка "Далее" для шага 2
    if (step2NextBtn) {
        step2NextBtn.addEventListener('click', function() {
            const code = confirmationCode.value.trim();
            
            if (!code) {
                showNotification('Пожалуйста, введите код подтверждения', 'error');
                return;
            }
            
            step2NextBtn.disabled = true;
            step2NextBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i> Проверка...';
            
            // Отправка данных на сервер
            fetch('/register/step2', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    telegram_username: currentTelegramUsername,
                    verification_code: code 
                })
            })
            .then(response => response.json())
            .then(data => {
                step2NextBtn.disabled = false;
                step2NextBtn.innerHTML = '<span>Подтвердить</span><i class="bi bi-check-lg ms-2"></i>';
                
                if (data.success) {
                    // Автоматически переходим на следующий шаг
                    showStep(3);
                } else {
                    showNotification(data.error || 'Неверный код подтверждения', 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                step2NextBtn.disabled = false;
                step2NextBtn.innerHTML = '<span>Подтвердить</span><i class="bi bi-check-lg ms-2"></i>';
                showNotification('Произошла ошибка при проверке кода', 'error');
            });
        });
    }
    
    // Кнопка "Назад" для шага 3
    if (step3BackBtn) {
        step3BackBtn.addEventListener('click', function() {
            showStep(2);
        });
    }
    
    // Проверка силы пароля
    if (regPassword) {
        regPassword.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }
    
    // Шаг 3: Обработка кнопки "Продолжить"
    if (step3NextBtn) {
        step3NextBtn.addEventListener('click', function() {
            // Получаем пароли
            const password = regPassword.value;
            const confirmPassword = regPasswordConfirm.value;
            
            // Проверяем, что пароли не пустые
            if (!password || !confirmPassword) {
                showNotification('Пожалуйста, введите и подтвердите пароль', 'error');
                return;
            }
            
            // Проверяем минимальную длину пароля
            if (password.length < 8) {
                showNotification('Пароль должен содержать минимум 8 символов', 'error');
                return;
            }
            
            // Проверяем, что пароли совпадают
            if (password !== confirmPassword) {
                showNotification('Пароли не совпадают', 'error');
                return;
            }
            
            // Сохраняем пароль
            userData.password = password;
            
            // Переходим на шаг с ФИО
            showStep('full_name');
        });
    }
    
    // Шаг ФИО: Обработка кнопки "Назад"
    if (stepFullNameBackBtn) {
        stepFullNameBackBtn.addEventListener('click', function() {
            showStep(3);
        });
    }
    
    // Шаг ФИО: Обработка кнопки "Продолжить"
    if (stepFullNameNextBtn) {
        stepFullNameNextBtn.addEventListener('click', function() {
            const lastName = regLastName.value.trim();
            const firstName = regFirstName.value.trim();
            const middleName = regMiddleName.value.trim();
            
            // Проверяем, что фамилия и имя не пустые
            if (!lastName) {
                showNotification('Пожалуйста, введите вашу фамилию', 'error');
                highlightInvalidField('regLastName');
                return;
            }
            
            if (!firstName) {
                showNotification('Пожалуйста, введите ваше имя', 'error');
                highlightInvalidField('regFirstName');
                return;
            }
            
            // Сохраняем ФИО
            userData.last_name = lastName;
            userData.first_name = firstName;
            userData.middle_name = middleName;
            
            // Переходим на следующий шаг
            showStep(4);
        });
    }
    
    // Обработка шага 4 - Анализ описания проекта
    
    // Отслеживание ввода текста в описании
    if (descriptionText) {
        descriptionText.addEventListener('input', function() {
            const length = this.value.length;
            descriptionCharCounter.textContent = `${length}/${MAX_DESCRIPTION_CHARS}`;
            
            // Изменение стиля счетчика в зависимости от количества символов
            if (length > MAX_DESCRIPTION_CHARS * 0.8 && length <= MAX_DESCRIPTION_CHARS) {
                descriptionCharCounter.className = 'char-counter warning';
            } else if (length > MAX_DESCRIPTION_CHARS) {
                descriptionCharCounter.className = 'char-counter danger';
                analyzeBtn.disabled = true;
            } else {
                descriptionCharCounter.className = 'char-counter';
                analyzeBtn.disabled = false;
            }
            
            // Активируем кнопку анализа только если есть текст
            analyzeBtn.disabled = this.value.trim().length === 0 || length > MAX_DESCRIPTION_CHARS;
        });
    }
    
    // Обработка кнопки анализа в описании
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', function() {
            const text = descriptionText.value.trim();
            if (!text || text.length > MAX_DESCRIPTION_CHARS) return;
            
            // Показать прогресс-бар и изменить внешний вид кнопки
            analysisProgressContainer.style.display = 'block';
            analyzeBtn.disabled = true;
            analyzeBtn.classList.add('loading');
            
            // Меняем иконку на спиннер при загрузке
            analyzeBtn.querySelector('i').classList.remove('bi-lightning-charge');
            analyzeBtn.querySelector('i').classList.add('bi-arrow-repeat');
            
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
                
                analysisProgressIndicator.style.width = `${progress}%`;
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
                analysisProgressIndicator.style.width = '100%';
                
                // Небольшая задержка перед скрытием прогресс-бара
                setTimeout(() => {
                    analysisProgressContainer.style.display = 'none';
                    analysisProgressIndicator.style.width = '0%';
                    analyzeBtn.classList.remove('loading');
                    
                    // Возвращаем оригинальную иконку
                    analyzeBtn.querySelector('i').classList.remove('bi-arrow-repeat');
                    analyzeBtn.querySelector('i').classList.add('bi-lightning-charge');
                    
                    // Добавляем эффект успешной отправки
                    analyzeBtn.classList.add('success');
                    setTimeout(() => {
                        analyzeBtn.classList.remove('success');
                    }, 1000);
                    
                    // Отображение результатов
                    displayDescriptionResults(data.tags);
                    
                    // Показать секцию тегов
                    tagsSection.style.display = 'block';
                    
                    // Разблокировка кнопки
                    analyzeBtn.disabled = text.length === 0 || text.length > MAX_DESCRIPTION_CHARS;
                }, 500);
            })
            .catch(error => {
                console.error('Ошибка:', error);
                
                // Очистка прогресс-бара
                clearInterval(interval);
                analysisProgressContainer.style.display = 'none';
                analysisProgressIndicator.style.width = '0%';
                analyzeBtn.classList.remove('loading');
                
                // Возвращаем оригинальную иконку
                analyzeBtn.querySelector('i').classList.remove('bi-arrow-repeat');
                analyzeBtn.querySelector('i').classList.add('bi-lightning-charge');
                
                // Показываем сообщение об ошибке под полем ввода
                showNotification('Произошла ошибка при обработке запроса. Пожалуйста, попробуйте снова.', 'error');
                
                // Разблокировка кнопки
                analyzeBtn.disabled = text.length === 0 || text.length > MAX_DESCRIPTION_CHARS;
            });
        });
    }
    
    // Функция для отображения результатов в описании
    function displayDescriptionResults(data) {
        tagsContainer.innerHTML = '';
        selectedTags.clear();
        
        // Если нет данных или объект пустой
        if (!data || Object.keys(data).length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'Не найдено подходящих тегов';
            tagsContainer.appendChild(noResults);
            return;
        }
        
        // Собираем все теги из всех категорий
        const allTags = [];
        
        // Категории и их цвета
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
        
        // Обрабатываем категории и подкатегории
        for (const category in data) {
            if (typeof data[category] === 'object' && !Array.isArray(data[category])) {
                // Категория с подкатегориями
                for (const subcategory in data[category]) {
                    const subcatTags = data[category][subcategory];
                    if (subcatTags && subcatTags.length > 0) {
                        subcatTags.forEach(tag => {
                            allTags.push({ tag, category });
                            selectedTags.add(tag);
                        });
                    }
                }
            } else if (Array.isArray(data[category])) {
                // Категория с тегами без подкатегорий
                data[category].forEach(tag => {
                    allTags.push({ tag, category });
                    selectedTags.add(tag);
                });
            }
        }
        
        // Отображаем теги
        allTags.forEach(({ tag, category }) => createDescriptionTagElement(tag, category, categoryColors[category] || '#6366f1'));
    }
    
    // Функция для создания элемента тега в описании
    function createDescriptionTagElement(tag, category, tagColor) {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.dataset.tag = tag;
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
            selectedTags.delete(tag);
            
            // Если больше нет тегов, показываем сообщение
            if (tagsContainer.childElementCount === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'Не найдено подходящих тегов';
                tagsContainer.appendChild(noResults);
            }
        });
        
        tagElement.appendChild(tagText);
        tagElement.appendChild(removeBtn);
        tagsContainer.appendChild(tagElement);
        
        return tagElement;
    }
    
    // Обработка кнопки "Добавить тег" в описании
    if (addTagBtn) {
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
                    populateDescriptionTagsCategoriesMenu(data.categories);
                    
                    // Фокус на поиск
                    setTimeout(() => {
                        tagsSearch.focus();
                    }, 100);
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                    showNotification('Произошла ошибка при загрузке тегов', 'error');
                });
        });
    }
    
    // Функция для отображения всех категорий и тегов в модальном окне описания
    function populateDescriptionTagsCategoriesMenu(categories) {
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
                        const catColor = categoryColors[this.dataset.category] || defaultColors[colorIndex % defaultColors.length];
                        
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
                });
            }
            
            categoryElement.appendChild(tagsList);
            tagsMenuCategories.appendChild(categoryElement);
        }
    }
    
    // Закрытие модального окна тегов
    function closeDescriptionTagsModal() {
        tagsModalOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Разблокируем прокрутку страницы
    }
    
    // Обработчики для закрытия модального окна тегов
    if (tagsMenuClose) {
        tagsMenuClose.addEventListener('click', closeDescriptionTagsModal);
    }
    
    if (tagsModalOverlay) {
        tagsModalOverlay.addEventListener('click', function(e) {
            // Закрываем модальное окно при клике вне содержимого
            if (e.target === tagsModalOverlay) {
                closeDescriptionTagsModal();
            }
        });
    }
    
    if (tagsMenuCancel) {
        tagsMenuCancel.addEventListener('click', closeDescriptionTagsModal);
    }
    
    // Обработка кнопки применения выбранных тегов
    if (tagsMenuApply) {
        tagsMenuApply.addEventListener('click', function() {
            // Очищаем текущие теги
            tagsContainer.innerHTML = '';
            selectedTags = new Set([...tempSelectedTags]);
            
            // Если теги не выбраны, показываем сообщение
            if (selectedTags.size === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'Не найдено подходящих тегов';
                tagsContainer.appendChild(noResults);
            } else {
                // Отображаем выбранные теги
                // Получаем цвета категорий
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
                
                // Для каждого выбранного тега находим его категорию и отображаем
                tempSelectedTags.forEach(tag => {
                    // Ищем категорию тега из элементов в модальном окне
                    const tagItem = tagsMenuCategories.querySelector(`.tags-menu-item[data-tag="${tag}"]`);
                    if (tagItem) {
                        const category = tagItem.dataset.category;
                        const tagColor = categoryColors[category] || '#6366f1';
                        createDescriptionTagElement(tag, category, tagColor);
                    }
                });
                
                // Показываем уведомление
                if (selectedTags.size === 1) {
                    showNotification('Тег добавлен', 'success');
                } else {
                    showNotification(`Добавлено ${selectedTags.size} тегов`, 'success');
                }
            }
            
            // Закрываем модальное окно
            closeDescriptionTagsModal();
        });
    }
    
    // Поиск по тегам в модальном окне
    if (tagsSearch) {
        tagsSearch.addEventListener('input', function() {
            const searchValue = this.value.toLowerCase();
            const tagItems = tagsMenu.querySelectorAll('.tags-menu-item');
            
            // Проверяем, что теги существуют
            if (!tagItems.length) return;
            
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
            if (!categories.length) return;
            
            categories.forEach(category => {
                const visibleTags = category.querySelectorAll('.tags-menu-item[style*="display: inline-flex"]');
                if (visibleTags.length === 0) {
                    category.style.display = 'none';
                } else {
                    category.style.display = 'block';
                }
            });
        });
    }
    
    // Предотвращение закрытия при клике на содержимое модального окна
    if (tagsMenu) {
        tagsMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // Обработка кнопок навигации шага 4
    if (step4NextBtn) {
        step4NextBtn.addEventListener('click', function() {
            if (!userData.user_role) {
                showNotification('Пожалуйста, выберите кем вы являетесь', 'error');
                return;
            }
            
            // Проверка заполнения дополнительных полей в зависимости от роли
            if (userData.user_role === 'student') {
                if (!userData.university) {
                    showNotification('Пожалуйста, укажите ваш ВУЗ', 'error');
                    return;
                }
                if (!userData.faculty) {
                    showNotification('Пожалуйста, укажите ваш факультет', 'error');
                    return;
                }
                if (!userData.course) {
                    showNotification('Пожалуйста, укажите ваш курс', 'error');
                    return;
                }
            } else if (userData.user_role === 'teacher') {
                if (!userData.university) {
                    showNotification('Пожалуйста, укажите ваш ВУЗ', 'error');
                    return;
                }
            } else if (userData.user_role === 'employer') {
                if (!userData.workplace) {
                    showNotification('Пожалуйста, укажите место работы', 'error');
                    return;
                }
            }
            
            // Переходим к следующему шагу (Возраст)
            showStep(5);
        });
    }
    
    if (step4BackBtn) {
        step4BackBtn.addEventListener('click', function() {
            showStep(3);
        });
    }
    
    // Получение элементов DOM для новых шагов
    const step6 = document.getElementById('step6');
    const step7 = document.getElementById('step7');
    const userAgeInput = document.getElementById('userAge');
    const roleOptions = document.querySelectorAll('.role-option');
    const step5NextBtn = document.getElementById('step5NextBtn');
    const step6NextBtn = document.getElementById('step6NextBtn');
    const step5BackBtn = document.getElementById('step5BackBtn');
    const step6BackBtn = document.getElementById('step6BackBtn');
    
    // Получение элементов DOM для дополнительных полей
    const studentFields = document.getElementById('student-fields');
    const teacherFields = document.getElementById('teacher-fields');
    const employerFields = document.getElementById('employer-fields');
    const universityInput = document.getElementById('university');
    const teacherUniversityInput = document.getElementById('teacher-university');
    const facultyInput = document.getElementById('faculty');
    const courseInput = document.getElementById('course');
    const workplaceInput = document.getElementById('workplace');
    
    // Обработчики для шага "Кем являетесь"
    if (roleOptions) {
        roleOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Снимаем выделение со всех опций
                roleOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Скрываем все дополнительные поля
                if (studentFields) studentFields.style.display = 'none';
                if (teacherFields) teacherFields.style.display = 'none';
                if (employerFields) employerFields.style.display = 'none';
                
                // Выделяем выбранную опцию
                this.classList.add('selected');
                
                // Сохраняем выбранную роль
                const role = this.getAttribute('data-role');
                userData.user_role = role;
                
                // Показываем соответствующие дополнительные поля
                if (role === 'student' && studentFields) {
                    studentFields.style.display = 'block';
                } else if (role === 'teacher' && teacherFields) {
                    teacherFields.style.display = 'block';
                } else if (role === 'employer' && employerFields) {
                    employerFields.style.display = 'block';
                }
                
                // Активируем кнопку "Продолжить"
                if (step4NextBtn) {
                    step4NextBtn.disabled = false;
                }
            });
        });
    }
    
    // Обработчики для полей ввода данных
    if (universityInput) {
        universityInput.addEventListener('input', function() {
            userData.university = this.value.trim();
        });
    }
    
    if (teacherUniversityInput) {
        teacherUniversityInput.addEventListener('input', function() {
            userData.university = this.value.trim();
        });
    }
    
    if (facultyInput) {
        facultyInput.addEventListener('input', function() {
            userData.faculty = this.value.trim();
        });
    }
    
    if (courseInput) {
        courseInput.addEventListener('input', function() {
            userData.course = this.value ? parseInt(this.value, 10) : null;
        });
    }
    
    if (workplaceInput) {
        workplaceInput.addEventListener('input', function() {
            userData.workplace = this.value.trim();
        });
    }
    
    // Обработчик для поля возраста
    if (userAgeInput) {
        userAgeInput.addEventListener('input', function() {
            userData.age = this.value ? parseInt(this.value, 10) : null;
        });
    }
    
    // Обработчик для кнопки "Продолжить" на шаге 5 (Возраст)
    if (step5NextBtn) {
        step5NextBtn.addEventListener('click', function() {
            // Проверяем, что возраст указан
            if (!userData.age) {
                showNotification('Пожалуйста, укажите ваш возраст', 'error');
                return;
            }
            
            // Проверяем, что возраст в допустимых пределах
            if (userData.age < 14 || userData.age > 100) {
                showNotification('Пожалуйста, укажите корректный возраст (от 14 до 100 лет)', 'error');
                return;
            }
            
            // Переходим к шагу "О себе"
            showStep(6);
        });
    }
    
    // Обработчик для кнопки "Назад" на шаге 5
    if (step5BackBtn) {
        step5BackBtn.addEventListener('click', function() {
            showStep(4);
        });
    }
    
    // Обработчик для кнопки "Назад" на шаге 6
    if (step6BackBtn) {
        step6BackBtn.addEventListener('click', function() {
            showStep(5);
        });
    }
    
    // Обработчик для кнопки "Завершить" на шаге 6 (О себе)
    if (step6NextBtn) {
        step6NextBtn.addEventListener('click', function() {
            // Собираем выбранные теги в массив
            const tagsArray = Array.from(selectedTags);
            
            // Получаем описание о себе
            const aboutMe = descriptionText.value.trim();
            
            // Сохраняем данные в userData
            userData.telegram_username = currentTelegramUsername;
            userData.password = regPassword.value;
            userData.about_me = aboutMe;
            userData.tags = tagsArray;
            
            // Отправляем данные регистрации на сервер
            fetch('/register/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Показываем шаг успешной регистрации с обращением по имени
                    showStep(7);
                    
                    // Обновляем текст сообщения в шаге 7 с обращением по имени
                    const successMessage = document.querySelector('#step7 .success-message p');
                    if (successMessage) {
                        successMessage.textContent = `${userData.first_name}, ваш аккаунт успешно создан. Вход в систему будет выполнен автоматически.`;
                    }
                    
                    // Запускаем конфетти только здесь
                    startConfetti();
                    
                    // Автоматический вход пользователя
                    updateProfileButton(data.user);
                    
                    // Сохраняем данные пользователя в localStorage
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Отключаем обработчик события hidden.bs.modal, чтобы избежать сброса формы
                    authModal.removeEventListener('hidden.bs.modal', handleModalClose);
                    
                    // Закрываем модальное окно через 2 секунды
                    setTimeout(() => {
                        bootstrapModal.hide();
                        
                        // Показываем уведомление об успешной регистрации
                        showNotification('Вы успешно зарегистрированы и вошли в систему', 'success');
                        
                        // Сбрасываем флаг регистрации
                        registrationInProgress = false;
                        
                        // Через 500 мс после закрытия снова добавляем обработчик для будущих открытий модального окна
                        setTimeout(() => {
                            authModal.addEventListener('hidden.bs.modal', handleModalClose);
                        }, 500);
                    }, 2000);
                } else {
                    showNotification(data.error || 'Ошибка при регистрации', 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showNotification('Произошла ошибка при регистрации', 'error');
            });
        });
    }
    
    // Функция для копирования в буфер обмена
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
    
    // Функция для переключения между шагами
    function showStep(step) {
        // Скрываем все шаги
        registerSteps.forEach(s => s.classList.remove('active'));
        
        // Показываем нужный шаг и обновляем номер текущего шага
        if (step === 1) {
            step1.classList.add('active');
            currentStep = 1;
        } else if (step === 2) {
            step2.classList.add('active');
            currentStep = 2;
        } else if (step === 3) {
            step3.classList.add('active');
            currentStep = 3;
        } else if (step === 'full_name') {
            stepFullName.classList.add('active');
            currentStep = 4;
        } else if (step === 4) {
            step4.classList.add('active');
            currentStep = 5;
        } else if (step === 5) {
            step5.classList.add('active');
            currentStep = 6;
        } else if (step === 6) {
            step6.classList.add('active');
            currentStep = 7;
        } else if (step === 7) {
            step7.classList.add('active');
            currentStep = 8;
            // Не запускаем confetti здесь, так как это будет сделано в обработчике завершения регистрации
        }
        
        // Обновляем индикаторы шагов
        updateStepIndicators(currentStep);
        
        // Обновляем номер текущего шага
        if (currentStepNumber) {
            currentStepNumber.textContent = currentStep;
        }
        
        // Обновляем прогресс-бар
        if (progressIndicator) {
            progressIndicator.style.width = (currentStep / totalSteps * 100) + '%';
        }
    }
    
    // Функция для обновления индикаторов шагов
    function updateStepIndicators(step) {
        // Обновляем индикаторы точек
        stepDots.forEach((dot, index) => {
            dot.classList.remove('active', 'completed');
            const dotStep = parseInt(dot.getAttribute('data-step'), 10);
            
            if (dotStep === step) {
                dot.classList.add('active');
                
                // Центрируем активную точку с задержкой
                setTimeout(() => {
                    const stepIndicator = document.querySelector('.step-indicator');
                    if (stepIndicator) {
                        const dotRect = dot.getBoundingClientRect();
                        const indicatorRect = stepIndicator.getBoundingClientRect();
                        
                        // Вычисляем положение для центрирования
                        const scrollLeft = dot.offsetLeft - (indicatorRect.width / 2) + (dotRect.width / 2);
                        
                        // Плавно скроллим к нужной позиции
                        stepIndicator.scrollTo({
                            left: scrollLeft,
                            behavior: 'smooth'
                        });
                    }
                }, 350);
            } else if (dotStep < step) {
                dot.classList.add('completed');
            }
        });
        
        // Обновляем прогресс-бар
        if (progressIndicator) {
            const stepPercent = (step / totalSteps) * 100;
            progressIndicator.style.width = `${stepPercent}%`;
        }
        
        // Обновляем счетчик шагов
        if (currentStepNumber) {
            currentStepNumber.textContent = step;
        }
    }
    
    // Функция для обновления кнопки профиля
    function updateProfileButton(user) {
        if (user) {
            // Если пользователь авторизован, убираем атрибуты для модального окна
            profileBtn.removeAttribute('data-bs-toggle');
            profileBtn.removeAttribute('data-bs-target');
        } else {
            // Если не авторизован, устанавливаем атрибуты для модального окна
            profileBtn.setAttribute('data-bs-toggle', 'modal');
            profileBtn.setAttribute('data-bs-target', '#authModal');
        }
    }
    
    // Показать модальное окно авторизации
    function showLoginModal() {
        bootstrapModal.show();
    }
    
    // Показать меню пользователя
    function showUserMenu() {
        // Здесь может быть отображение меню пользователя
        // Или открытие модального окна с настройками
    }
    
    // Функция проверки силы пароля
    function checkPasswordStrength(password) {
        const strengthBar = document.getElementById('passwordStrengthBar');
        const strengthText = document.getElementById('passwordStrengthText');
        
        if (!strengthBar || !strengthText) return;
        
        let strength = 0;
        let message = '';
        
        if (password.length < 1) {
            strengthBar.style.width = '0%';
            strengthBar.style.backgroundColor = '#ef4444';
            strengthText.textContent = '';
            strengthText.style.color = '#ef4444';
            return;
        }
        
        // Проверки на силу пароля
        if (password.length >= 8) strength += 1;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
        if (password.match(/\d+/)) strength += 1;
        if (password.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/)) strength += 1;
        
        // Обновляем индикатор на основе силы
        switch (strength) {
            case 0:
            case 1:
                strengthBar.style.width = '25%';
                strengthBar.style.backgroundColor = '#ef4444';
                message = 'Слабый пароль';
                strengthText.style.color = '#ef4444';
                break;
            case 2:
                strengthBar.style.width = '50%';
                strengthBar.style.backgroundColor = '#f59e0b';
                message = 'Средний пароль';
                strengthText.style.color = '#f59e0b';
                break;
            case 3:
                strengthBar.style.width = '75%';
                strengthBar.style.backgroundColor = '#3b82f6';
                message = 'Хороший пароль';
                strengthText.style.color = '#3b82f6';
                break;
            case 4:
                strengthBar.style.width = '100%';
                strengthBar.style.backgroundColor = '#10b981';
                message = 'Отличный пароль';
                strengthText.style.color = '#10b981';
                break;
        }
        
        strengthText.textContent = message;
        return strength;
    }
    
    // Функция для отображения уведомлений
    function showNotification(message, type = 'info') {
        // Проверяем, есть ли уже уведомление
        let existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<i class="bi bi-check-circle-fill"></i>';
                break;
            case 'error':
                icon = '<i class="bi bi-exclamation-circle-fill"></i>';
                break;
            case 'warning':
                icon = '<i class="bi bi-exclamation-triangle-fill"></i>';
                break;
            default:
                icon = '<i class="bi bi-info-circle-fill"></i>';
        }
        
        notification.innerHTML = `
            ${icon}
            <span>${message}</span>
            <button class="notification-close"><i class="bi bi-x"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        // Показываем уведомление с небольшой задержкой
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Добавляем обработчик для закрытия
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            });
        }
        
        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
        
        // Для случая ошибки при вводе имени пользователя, подсвечиваем поле
        if (type === 'error') {
            if (message.toLowerCase().includes('имя пользователя') || message.toLowerCase().includes('telegram')) {
                highlightInvalidField(currentStep === 1 ? 'regUsername' : 'loginUsername');
            } else if (message.toLowerCase().includes('код') || message.toLowerCase().includes('подтверждения')) {
                highlightInvalidField('confirmationCode');
            } else if (message.toLowerCase().includes('пароль')) {
                highlightInvalidField('regPassword');
                if (message.toLowerCase().includes('не совпадают')) {
                    highlightInvalidField('regPasswordConfirm');
                }
            }
        }
    }
    
    // Функция для подсветки поля с ошибкой
    function highlightInvalidField(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('is-invalid');
            
            // Убираем выделение через некоторое время или при изменении поля
            setTimeout(() => {
                field.classList.remove('is-invalid');
            }, 5000);
            
            field.addEventListener('input', function onInput() {
                field.classList.remove('is-invalid');
                field.removeEventListener('input', onInput);
            });
            
            // Фокусируемся на поле с ошибкой
            field.focus();
        }
    }
    
    // Эффект конфетти для успешной регистрации
    function startConfetti() {
        const confettiContainer = document.querySelector('.confetti');
        if (!confettiContainer) return;
        
        // Очищаем контейнер перед добавлением новых конфетти
        confettiContainer.innerHTML = '';
        
        const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa'];
        const totalConfetti = 100;
        
        for (let i = 0; i < totalConfetti; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            confetti.style.opacity = Math.random() + 0.5;
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.animation = `confettiFall ${Math.random() * 3 + 2}s linear forwards`;
            confetti.style.animationDelay = Math.random() * 2 + 's';
            
            confettiContainer.appendChild(confetti);
        }
        
        // Удаляем конфетти через 5 секунд
        setTimeout(() => {
            if (confettiContainer) {
                confettiContainer.innerHTML = '';
            }
        }, 5000);
    }
    
    // Проверка аутентификации при загрузке страницы
    checkAuthentication();
    
    // Обработчики для кнопок показа/скрытия пароля
    if (passwordToggleButtons.length > 0) {
        passwordToggleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const passwordInput = document.getElementById(targetId);
                
                if (passwordInput) {
                    // Изменяем тип поля
                    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                    passwordInput.setAttribute('type', type);
                    
                    // Изменяем иконку
                    const icon = this.querySelector('i');
                    if (type === 'text') {
                        icon.classList.remove('bi-eye');
                        icon.classList.add('bi-eye-slash');
                    } else {
                        icon.classList.remove('bi-eye-slash');
                        icon.classList.add('bi-eye');
                    }
                }
            });
        });
    }
    
    // Обработчик клика на кнопку профиля
    profileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Проверяем, авторизован ли пользователь
        if (localStorage.getItem('user')) {
            // Если меню уже открыто, закрываем его
            if (profileMenu.classList.contains('active')) {
                profileMenu.classList.remove('active');
            } else {
                // Иначе открываем меню
                profileMenu.classList.add('active');
                
                // Устанавливаем имя пользователя
                const user = JSON.parse(localStorage.getItem('user'));
                profileUsername.textContent = '@' + user.telegram_username;
            }
        } else {
            // Если пользователь не авторизован, открываем модальное окно авторизации напрямую
            const modal = new bootstrap.Modal(authModal);
            modal.show();
        }
    });
    
    // Закрываем меню при клике в любое место страницы
    document.addEventListener('click', function(e) {
        if (profileMenu.classList.contains('active') && !profileMenu.contains(e.target) && e.target !== profileBtn) {
            profileMenu.classList.remove('active');
        }
    });
    
    // Обработчик кнопки аккаунта
    accountBtn.addEventListener('click', function() {
        // Закрываем меню профиля
        profileMenu.classList.remove('active');
        
        // Перенаправляем пользователя на страницу аккаунта
        window.location.href = '/account';
    });
    
    // Обработчик кнопки выхода
    logoutBtn.addEventListener('click', function() {
        logout();
        profileMenu.classList.remove('active');
    });
    
    // Обновлённая функция проверки авторизации
    function checkAuthentication() {
        fetch('/check_auth')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                // Сохраняем данные пользователя
                localStorage.setItem('user', JSON.stringify(data.user));
                // В случае авторизованного пользователя, снимаем обработчики Bootstrap
                profileBtn.removeAttribute('data-bs-toggle');
                profileBtn.removeAttribute('data-bs-target');
            } else {
                // Если пользователь не авторизован, очищаем localStorage
                localStorage.removeItem('user');
            }
        })
        .catch(error => {
            console.error('Ошибка при проверке авторизации:', error);
        });
    }
    
    // Функция для выхода из системы
    function logout() {
        fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Очищаем localStorage 
                localStorage.removeItem('user');
                
                // Показываем уведомление об успешном выходе
                showNotification('Вы успешно вышли из системы', 'success');
                
                // Перезагружаем страницу для сброса состояния
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        })
        .catch(error => {
            console.error('Ошибка при выходе из системы:', error);
            showNotification('Произошла ошибка при выходе из системы', 'error');
        });
    }
}); 