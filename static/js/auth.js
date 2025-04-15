document.addEventListener('DOMContentLoaded', function() {
    // Элементы авторизации
    const profileBtn = document.getElementById('profile-btn');
    const authModal = document.getElementById('authModal');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginBtn');
    
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
    
    // Шаг 4: Успешная регистрация
    const step4 = document.getElementById('step4');
    const goToLoginBtn = document.getElementById('goToLoginBtn');
    
    // Прогресс и индикаторы
    const progressIndicator = document.getElementById('progressIndicator');
    const currentStepNumber = document.getElementById('currentStepNumber');
    
    // Хранение текущего пользователя Telegram
    let currentTelegramUsername = '';
    let registrationInProgress = false;
    const totalSteps = 4;
    let currentStep = 1;
    
    // Обработка Bootstrap модального окна
    const bootstrapModal = new bootstrap.Modal(authModal);
    
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
    
    // При закрытии модального окна
    authModal.addEventListener('hidden.bs.modal', function () {
        cancelRegistration();
    });
    
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
        if (progressIndicator) progressIndicator.style.width = '25%';
        if (currentStepNumber) currentStepNumber.textContent = '1';
        currentStep = 1;
        
        // Сбрасываем текущее имя пользователя
        currentTelegramUsername = '';
        registrationInProgress = false;
    }
    
    // Обработка логина
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            const telegram = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!telegram || !password) {
                showNotification('Пожалуйста, заполните все поля', 'error');
                return;
            }
            
            // Удаляем символ @ если он присутствует
            const cleanUsername = telegram.startsWith('@') ? telegram.substring(1) : telegram;
            
            // Отправка данных на сервер
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ telegram_username: cleanUsername, password: password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    bootstrapModal.hide();
                    updateProfileButton(data.user);
                    showNotification('Вы успешно вошли в систему', 'success');
                } else {
                    showNotification(data.error || 'Ошибка при входе', 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showNotification('Произошла ошибка при входе', 'error');
            });
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
    
    // Кнопка "Завершить" для шага 3
    if (step3NextBtn) {
        step3NextBtn.addEventListener('click', function() {
            const password = regPassword.value;
            const confirmPassword = regPasswordConfirm.value;
            
            if (!password || !confirmPassword) {
                showNotification('Пожалуйста, заполните все поля', 'error');
                return;
            }
            
            if (password.length < 8) {
                showNotification('Пароль должен содержать минимум 8 символов', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showNotification('Пароли не совпадают', 'error');
                return;
            }
            
            step3NextBtn.disabled = true;
            step3NextBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i> Отправка...';
            
            // Отправка данных на сервер
            fetch('/register/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    telegram_username: currentTelegramUsername,
                    password: password
                })
            })
            .then(response => response.json())
            .then(data => {
                step3NextBtn.disabled = false;
                step3NextBtn.innerHTML = '<span>Завершить</span><i class="bi bi-check2-all ms-2"></i>';
                
                if (data.success) {
                    showStep(4);
                    // Добавляем эффект конфетти
                    startConfetti();
                } else {
                    showNotification(data.error || 'Ошибка при завершении регистрации', 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                step3NextBtn.disabled = false;
                step3NextBtn.innerHTML = '<span>Завершить</span><i class="bi bi-check2-all ms-2"></i>';
                showNotification('Произошла ошибка при регистрации', 'error');
            });
        });
    }
    
    // Кнопка "Войти" после успешной регистрации
    if (goToLoginBtn) {
        goToLoginBtn.addEventListener('click', function() {
            // Активация таба входа
            if (loginTab) {
                loginTab.click();
            }
            resetRegistrationForm();
        });
    }
    
    // Функция для переключения шагов
    function showStep(step) {
        currentStep = step;
        
        // Обновляем активные шаги
        registerSteps.forEach((s, i) => {
            s.classList.remove('active');
            if (i === step - 1) {
                s.classList.add('active');
            }
        });
        
        // Обновляем индикаторы шагов
        stepDots.forEach((dot, i) => {
            dot.classList.remove('active', 'completed');
            if (i < step - 1) {
                dot.classList.add('completed');
            } else if (i === step - 1) {
                dot.classList.add('active');
            }
        });
        
        // Обновляем счетчик шагов и прогресс-бар
        if (currentStepNumber) currentStepNumber.textContent = step;
        if (progressIndicator) progressIndicator.style.width = (step / totalSteps * 100) + '%';
    }
    
    // Функция для обновления кнопки профиля
    function updateProfileButton(user) {
        if (user) {
            // Пользователь авторизован
            profileBtn.innerHTML = `<i class="bi bi-person-check-fill"></i>`;
            profileBtn.title = `${user.telegram_username}`;
            
            // Добавить обработку выхода при клике на профиль
            profileBtn.removeEventListener('click', showLoginModal);
            profileBtn.addEventListener('click', showUserMenu);
        } else {
            // Пользователь не авторизован
            profileBtn.innerHTML = `<i class="bi bi-person-circle"></i>`;
            profileBtn.title = 'Войти или зарегистрироваться';
            
            // Вернуть обработчик для входа
            profileBtn.removeEventListener('click', showUserMenu);
            profileBtn.addEventListener('click', showLoginModal);
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
                const pieces = confettiContainer.querySelectorAll('.confetti-piece');
                pieces.forEach(piece => piece.remove());
            }
        }, 7000);
    }
    
    // Проверка аутентификации при загрузке страницы
    fetch('/check_auth')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                updateProfileButton(data.user);
            }
        })
        .catch(error => console.error('Ошибка при проверке аутентификации:', error));
}); 