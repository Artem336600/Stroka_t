from flask import Flask, render_template, request, jsonify, session
from tag_extractor import extract_tags
from tags_data import categorized_tags
import json
import os
import logging
from supabase_client import (
    create_registration_request,
    verify_registration_request,
    register_user,
    validate_telegram_username,
    authenticate_user,
    supabase
)

# Настройка логирования
logging.basicConfig(level=logging.DEBUG, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = 'your-secret-key'  # Замените на реальный секретный ключ

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/extract_tags', methods=['POST'])
def process_request():
    data = request.json
    description = data.get('description', '')
    
    if not description:
        return jsonify({'error': 'Описание не может быть пустым'}), 400
    
    # Извлекаем теги
    tags = extract_tags(description)
    
    return jsonify({'tags': tags})

@app.route('/get_all_tags', methods=['GET'])
def get_all_tags():
    # Возвращаем все теги из tags_data.py
    return jsonify({'categories': categorized_tags})

@app.route('/login', methods=['POST'])
def login():
    """
    Авторизация пользователя
    """
    data = request.json
    telegram_username = data.get('telegram_username')
    password = data.get('password')
    
    if not telegram_username or not password:
        return jsonify({'success': False, 'error': 'Пожалуйста, заполните все поля'}), 400
    
    # Удаляем символ @ из имени пользователя, если он есть
    clean_username = telegram_username[1:] if telegram_username.startswith('@') else telegram_username
    
    # Проверяем учетные данные
    success, user_data = authenticate_user(clean_username, password)
    
    if success:
        # Устанавливаем сессию пользователя
        session['user'] = clean_username
        
        # Возвращаем данные пользователя
        return jsonify({
            'success': True, 
            'user': {
                'telegram_username': clean_username,
                'last_name': user_data.get('last_name', ''),
                'first_name': user_data.get('first_name', ''),
                'middle_name': user_data.get('middle_name', ''),
                'user_role': user_data.get('user_role', ''),
                'age': user_data.get('age'),
                'university': user_data.get('university', ''),
                'faculty': user_data.get('faculty', ''),
                'course': user_data.get('course'),
                'workplace': user_data.get('workplace', '')
            }
        })
    
    return jsonify({'success': False, 'error': 'Неверное имя пользователя или пароль'}), 401

@app.route('/register/step1', methods=['POST'])
def register_step1():
    data = request.json
    telegram_username = data.get('telegram_username')
    
    logger.debug(f"Получен запрос на регистрацию (шаг 1): {telegram_username}")
    
    if not telegram_username:
        logger.warning("Имя пользователя не предоставлено")
        return jsonify({'success': False, 'error': 'Пожалуйста, введите имя пользователя Telegram'}), 400
    
    # Проверяем формат имени пользователя Telegram
    logger.debug(f"Валидация имени пользователя: {telegram_username}")
    is_valid, message = validate_telegram_username(telegram_username)
    
    if not is_valid:
        logger.warning(f"Имя пользователя {telegram_username} не прошло валидацию: {message}")
        return jsonify({'success': False, 'error': message}), 400
    
    # Удаляем символ @ для базы данных
    clean_username = telegram_username[1:]
    logger.debug(f"Имя пользователя прошло валидацию, очищенное: {clean_username}")
    
    # Создаем запрос на регистрацию
    try:
        verification_code = create_registration_request(clean_username)
        logger.info(f"Создан запрос на регистрацию для {clean_username}, код: {verification_code}")
        
        # В реальном приложении здесь могла бы быть логика для отправки кода верификации
        # Но в нашем случае пользователь должен получить код через бота
        
        return jsonify({'success': True, 'next_step': 'verification'})
    except Exception as e:
        logger.error(f"Ошибка при создании запроса на регистрацию: {str(e)}")
        return jsonify({'success': False, 'error': 'Произошла ошибка при обработке запроса'}), 500

@app.route('/register/step2', methods=['POST'])
def register_step2():
    data = request.json
    telegram_username = data.get('telegram_username')
    verification_code = data.get('verification_code')
    
    if not telegram_username or not verification_code:
        return jsonify({'success': False, 'error': 'Пожалуйста, введите все необходимые данные'}), 400
    
    # Удаляем символ @ из имени пользователя, если он есть
    clean_username = telegram_username[1:] if telegram_username.startswith('@') else telegram_username
    
    # Проверяем код верификации
    is_verified = verify_registration_request(clean_username, verification_code)
    
    if is_verified:
        return jsonify({'success': True, 'next_step': 'password'})
    
    return jsonify({'success': False, 'error': 'Неверный код подтверждения'}), 400

@app.route('/register/step3', methods=['POST'])
def register_step3():
    data = request.json
    telegram_username = data.get('telegram_username')
    password = data.get('password')
    
    if not telegram_username or not password:
        return jsonify({'success': False, 'error': 'Пожалуйста, введите пароль'}), 400
    
    # Простая проверка на длину пароля
    if len(password) < 8:
        return jsonify({'success': False, 'error': 'Пароль должен содержать минимум 8 символов'}), 400
    
    return jsonify({'success': True, 'next_step': 'full_name'})

@app.route('/register/step_full_name', methods=['POST'])
def register_step_full_name():
    data = request.json
    telegram_username = data.get('telegram_username')
    last_name = data.get('last_name')
    first_name = data.get('first_name')
    middle_name = data.get('middle_name')
    
    if not telegram_username or not last_name or not first_name:
        return jsonify({'success': False, 'error': 'Пожалуйста, введите вашу фамилию и имя'}), 400
    
    # Проверяем минимальную длину фамилии и имени
    if len(last_name.strip()) < 2:
        return jsonify({'success': False, 'error': 'Пожалуйста, введите корректную фамилию'}), 400
    
    if len(first_name.strip()) < 2:
        return jsonify({'success': False, 'error': 'Пожалуйста, введите корректное имя'}), 400
    
    return jsonify({'success': True, 'next_step': 'role'})

@app.route('/register/step4', methods=['POST'])
def register_step4():
    data = request.json
    telegram_username = data.get('telegram_username')
    user_role = data.get('user_role')
    
    if not telegram_username or not user_role:
        return jsonify({'success': False, 'error': 'Пожалуйста, укажите кем вы являетесь (студент, преподаватель или работодатель)'}), 400
    
    # Проверяем, что роль указана корректно
    if user_role not in ['student', 'teacher', 'employer']:
        return jsonify({'success': False, 'error': 'Пожалуйста, выберите корректную роль (студент, преподаватель или работодатель)'}), 400
    
    return jsonify({'success': True, 'next_step': 'age'})

# Добавляем новый шаг для указания возраста
@app.route('/register/step5', methods=['POST'])
def register_step5():
    data = request.json
    telegram_username = data.get('telegram_username')
    age = data.get('age')
    
    if not telegram_username or age is None:
        return jsonify({'success': False, 'error': 'Пожалуйста, укажите ваш возраст'}), 400
    
    try:
        age_int = int(age)
        if age_int < 14 or age_int > 100:
            return jsonify({'success': False, 'error': 'Пожалуйста, укажите корректный возраст (от 14 до 100 лет)'}), 400
    except ValueError:
        return jsonify({'success': False, 'error': 'Возраст должен быть числом'}), 400
    
    # Получаем роль пользователя, чтобы определить следующий шаг
    user_role = data.get('user_role')
    if not user_role:
        return jsonify({'success': False, 'error': 'Информация о роли пользователя отсутствует'}), 400
    
    # После возраста переходим к шагу о себе (для всех ролей)
    # Дополнительная информация будет запрашиваться на следующих шагах
    return jsonify({'success': True, 'next_step': 'about_me'})

# Шаг о себе (для извлечения тегов)
@app.route('/register/step6_about_me', methods=['POST'])
def register_step6_about_me():
    data = request.json
    telegram_username = data.get('telegram_username')
    about_me = data.get('about_me')
    user_role = data.get('user_role')
    
    if not telegram_username:
        return jsonify({'success': False, 'error': 'Отсутствует имя пользователя'}), 400

    # Извлекаем теги из текста о себе, если текст был предоставлен
    extracted_tags = []
    if about_me and len(about_me.strip()) > 0:
        try:
            extracted_tags = extract_tags(about_me)
            logger.debug(f"Извлечены теги из описания: {extracted_tags}")
        except Exception as e:
            logger.error(f"Ошибка при извлечении тегов: {str(e)}")
    
    # Переходим к шагу с дополнительной информацией в зависимости от роли пользователя
    next_step = ''
    if user_role == 'student':
        next_step = 'university'
    elif user_role == 'teacher':
        next_step = 'university'
    elif user_role == 'employer':
        next_step = 'workplace'
    else:
        next_step = 'tags'  # Если роль не определена, переходим к выбору тегов
    
    return jsonify({
        'success': True, 
        'next_step': next_step,
        'extracted_tags': extracted_tags
    })

# Добавляем новый шаг для указания вуза
@app.route('/register/step7_university', methods=['POST'])
def register_step7_university():
    data = request.json
    telegram_username = data.get('telegram_username')
    university = data.get('university')
    user_role = data.get('user_role')
    
    if not telegram_username or not university:
        return jsonify({'success': False, 'error': 'Пожалуйста, укажите ваш вуз'}), 400
    
    next_step = ''
    if user_role == 'student':
        next_step = 'faculty'
    elif user_role == 'teacher':
        next_step = 'tags'
    
    return jsonify({'success': True, 'next_step': next_step})

# Добавляем новый шаг для указания факультета (только для студентов)
@app.route('/register/step8_faculty', methods=['POST'])
def register_step8_faculty():
    data = request.json
    telegram_username = data.get('telegram_username')
    faculty = data.get('faculty')
    
    if not telegram_username or not faculty:
        return jsonify({'success': False, 'error': 'Пожалуйста, укажите ваш факультет'}), 400
    
    return jsonify({'success': True, 'next_step': 'course'})

# Добавляем новый шаг для указания курса (только для студентов)
@app.route('/register/step9_course', methods=['POST'])
def register_step9_course():
    data = request.json
    telegram_username = data.get('telegram_username')
    course = data.get('course')
    
    if not telegram_username or course is None:
        return jsonify({'success': False, 'error': 'Пожалуйста, укажите ваш курс'}), 400
    
    try:
        course_int = int(course)
        if course_int < 1 or course_int > 6:
            return jsonify({'success': False, 'error': 'Пожалуйста, укажите корректный курс (от 1 до 6)'}), 400
    except ValueError:
        return jsonify({'success': False, 'error': 'Курс должен быть числом'}), 400
    
    return jsonify({'success': True, 'next_step': 'tags'})

# Добавляем новый шаг для указания места работы (только для работодателей)
@app.route('/register/step7_workplace', methods=['POST'])
def register_step7_workplace():
    data = request.json
    telegram_username = data.get('telegram_username')
    workplace = data.get('workplace')
    
    if not telegram_username or not workplace:
        return jsonify({'success': False, 'error': 'Пожалуйста, укажите ваше место работы'}), 400
    
    return jsonify({'success': True, 'next_step': 'tags'})

# Добавляем новый шаг для выбора тегов (для всех ролей)
@app.route('/register/step_tags', methods=['POST'])
def register_step_tags():
    data = request.json
    telegram_username = data.get('telegram_username')
    tags = data.get('tags')
    
    if not telegram_username or not tags or len(tags) == 0:
        return jsonify({'success': False, 'error': 'Пожалуйста, выберите хотя бы один тег'}), 400
    
    return jsonify({'success': True, 'next_step': 'complete'})

@app.route('/register/complete', methods=['POST'])
def register_complete():
    # Получаем все данные, собранные в течение процесса регистрации
    data = request.json
    telegram_username = data.get('telegram_username')  # Шаг 1: Telegram
    password = data.get('password')  # Шаг 3: Пароль
    last_name = data.get('last_name')  # Шаг ФИО - Фамилия
    first_name = data.get('first_name')  # Шаг ФИО - Имя
    middle_name = data.get('middle_name')  # Шаг ФИО - Отчество
    about_me = data.get('about_me')  # Шаг 6: О себе
    tags = data.get('tags')  # Шаг по выбору тегов (извлеченных или выбранных вручную)
    user_role = data.get('user_role')  # Шаг 4: Кем является
    age = data.get('age')  # Шаг 5: Возраст
    
    # Дополнительные данные в зависимости от роли пользователя
    university = data.get('university')  # Для студентов и преподавателей
    faculty = data.get('faculty')  # Только для студентов
    course = data.get('course')  # Только для студентов
    workplace = data.get('workplace')  # Только для работодателей
    
    logger.debug(f"Получен запрос на завершение регистрации для {telegram_username}")
    
    if not telegram_username or not password:
        logger.warning("Отсутствуют обязательные поля для регистрации")
        return jsonify({'success': False, 'error': 'Пожалуйста, введите все необходимые данные'}), 400
    
    # Проверяем наличие роли пользователя
    if not user_role:
        logger.warning("Пользователь не указал свою роль")
        return jsonify({'success': False, 'error': 'Пожалуйста, укажите кем вы являетесь (студент, преподаватель или работодатель)'}), 400
    
    # Проверяем возраст
    if age is None:
        logger.warning("Пользователь не указал свой возраст")
        return jsonify({'success': False, 'error': 'Пожалуйста, укажите ваш возраст'}), 400
    
    # Проверяем данные в зависимости от роли
    if user_role == 'student':
        if not university:
            logger.warning("Студент не указал вуз")
            return jsonify({'success': False, 'error': 'Пожалуйста, укажите ваш вуз'}), 400
        if not faculty:
            logger.warning("Студент не указал факультет")
            return jsonify({'success': False, 'error': 'Пожалуйста, укажите ваш факультет'}), 400
        if course is None:
            logger.warning("Студент не указал курс")
            return jsonify({'success': False, 'error': 'Пожалуйста, укажите ваш курс'}), 400
    elif user_role == 'teacher':
        if not university:
            logger.warning("Преподаватель не указал вуз")
            return jsonify({'success': False, 'error': 'Пожалуйста, укажите ваш вуз'}), 400
    elif user_role == 'employer':
        if not workplace:
            logger.warning("Работодатель не указал место работы")
            return jsonify({'success': False, 'error': 'Пожалуйста, укажите ваше место работы'}), 400
    
    # Проверяем наличие хотя бы одного тега
    if not tags or len(tags) == 0:
        logger.warning("Пользователь не указал ни одного тега")
        return jsonify({'success': False, 'error': 'Пожалуйста, выберите хотя бы один тег'}), 400
    
    # Удаляем символ @ из имени пользователя, если он есть
    clean_username = telegram_username[1:] if telegram_username.startswith('@') else telegram_username
    
    logger.debug(f"Регистрация пользователя: {clean_username}")
    
    # Регистрируем пользователя
    success, message = register_user(
        clean_username, 
        password,
        about_me,
        tags,
        user_role,
        age,
        university,
        faculty,
        course,
        workplace,
        last_name,
        first_name,
        middle_name
    )
    
    if success:
        logger.info(f"Пользователь {clean_username} успешно зарегистрирован")
        # Авторизуем пользователя сразу после регистрации
        session['user'] = clean_username
        return jsonify({
            'success': True, 
            'user': {
                'telegram_username': clean_username,
                'last_name': last_name,
                'first_name': first_name,
                'middle_name': middle_name,
                'user_role': user_role,
                'age': age,
                'university': university,
                'faculty': faculty,
                'course': course,
                'workplace': workplace
            }
        })
    
    logger.warning(f"Ошибка при регистрации пользователя {clean_username}: {message}")
    return jsonify({'success': False, 'error': message}), 400

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({'success': True})

@app.route('/check_auth', methods=['GET'])
def check_auth():
    if 'user' in session:
        # Получаем дополнительные данные о пользователе
        try:
            response = supabase.table('users').select('*').eq('telegram_username', session['user']).execute()
            if response.data:
                user = response.data[0]
                user_data = {
                    'telegram_username': session['user'],
                    'last_name': user.get('last_name'),
                    'first_name': user.get('first_name'),
                    'middle_name': user.get('middle_name'),
                    'user_role': user.get('user_role'),
                    'age': user.get('age'),
                    'university': user.get('university'),
                    'faculty': user.get('faculty'),
                    'course': user.get('course'),
                    'workplace': user.get('workplace')
                }
                return jsonify({
                    'authenticated': True, 
                    'user': user_data
                })
        except Exception as e:
            logger.error(f"Ошибка при получении данных пользователя: {str(e)}")
            
        # Если не удалось получить дополнительные данные, возвращаем минимум
        return jsonify({
            'authenticated': True, 
            'user': {'telegram_username': session['user']}
        })
    return jsonify({'authenticated': False})

# Новый маршрут для страницы аккаунта
@app.route('/account', methods=['GET'])
def account():
    if 'user' not in session:
        return render_template('index.html')
    
    # Получаем данные пользователя из БД
    username = session['user']
    response = supabase.table('users').select('*').eq('telegram_username', username).execute()
    
    if len(response.data) > 0:
        user_data = response.data[0]
        return render_template('account.html', user=user_data)
    
    return render_template('index.html')

# Маршрут для обновления данных пользователя
@app.route('/update_account', methods=['POST'])
def update_account():
    if 'user' not in session:
        return jsonify({'success': False, 'error': 'Пользователь не авторизован'}), 401
    
    data = request.json
    username = session['user']
    
    logger.info(f"Запрос на обновление данных: username={username}, data={data}")
    
    try:
        # Поля, которые можно обновить
        allowed_fields = [
            'last_name', 'first_name', 'middle_name',
            'age', 'university', 'faculty', 
            'course', 'workplace', 'about_me', 'tags'
        ]
        
        # Отфильтровываем только допустимые поля
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        # Проверяем на пустые значения
        for key, value in update_data.items():
            if value and isinstance(value, str):
                update_data[key] = value.strip()
        
        # Логируем данные для отладки
        logger.info(f"Обновление данных пользователя {username}: {update_data}")
        
        # Проверяем, есть ли поле tags и правильно ли оно форматировано
        if 'tags' in update_data:
            logger.info(f"Поле tags: {update_data['tags']}, тип: {type(update_data['tags'])}")
            
            # Проверяем, является ли поле tags списком
            if isinstance(update_data['tags'], list):
                logger.info(f"Поле tags является списком с {len(update_data['tags'])} элементами")
            else:
                logger.warning(f"Поле tags не является списком, преобразуем его")
                try:
                    # Пытаемся преобразовать tags в список, если это не список
                    update_data['tags'] = list(update_data['tags'])
                    logger.info(f"Преобразовано в список: {update_data['tags']}")
                except Exception as e:
                    logger.error(f"Не удалось преобразовать tags в список: {e}")
        
        # Обновляем данные в БД
        logger.info(f"Отправляем запрос на обновление: table=users, username={username}, data={update_data}")
        response = supabase.table('users').update(update_data).eq('telegram_username', username).execute()
        logger.info(f"Ответ от Supabase: {response.data}")
        
        if len(response.data) > 0:
            logger.info(f"Данные пользователя {username} успешно обновлены")
            return jsonify({'success': True, 'user': response.data[0]})
        else:
            logger.error(f"Не удалось обновить данные пользователя {username}, ответ пуст")
            return jsonify({'success': False, 'error': 'Не удалось обновить данные пользователя'}), 400
    
    except Exception as e:
        logger.error(f"Ошибка при обновлении данных пользователя: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': 'Произошла ошибка при обработке запроса'}), 500

# Маршрут для запуска скрипта Telegram бота
@app.route('/start_bot', methods=['GET'])
def start_bot():
    try:
        # Импортируем и запускаем бота в отдельном потоке
        from telegram_bot import main
        import threading
        
        bot_thread = threading.Thread(target=main)
        bot_thread.daemon = True
        bot_thread.start()
        
        return jsonify({'success': True, 'message': 'Telegram бот запущен'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/register/cancel', methods=['POST'])
def register_cancel():
    data = request.json
    telegram_username = data.get('telegram_username')
    
    if not telegram_username:
        return jsonify({'success': False, 'error': 'Отсутствует имя пользователя Telegram'}), 400
    
    # Удаляем символ @ из имени пользователя, если он есть
    clean_username = telegram_username[1:] if telegram_username.startswith('@') else telegram_username
    
    try:
        # Удаляем запрос на регистрацию из базы данных
        supabase.table('registration_requests').delete().eq('telegram_username', clean_username).execute()
        return jsonify({'success': True, 'message': 'Запрос на регистрацию отменен'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/register/get_steps', methods=['GET'])
def get_registration_steps():
    """
    Возвращает информацию о шагах регистрации для фронтенда.
    Фронтенд может использовать эту информацию для отображения прогресса регистрации.
    """
    basic_steps = [
        {"id": "telegram", "label": "Telegram", "order": 1},
        {"id": "verification", "label": "Проверка", "order": 2},
        {"id": "password", "label": "Пароль", "order": 3},
        {"id": "full_name", "label": "ФИО", "order": 4},
        {"id": "user_role", "label": "Кем являетесь", "order": 5},
        {"id": "age", "label": "Возраст", "order": 6},
        {"id": "about_me", "label": "О себе", "order": 7},
        {"id": "complete", "label": "Готово", "order": 8}
    ]
    
    return jsonify({
        "steps": basic_steps,
        "additional_steps": {
            "student": [
                {"id": "university", "label": "ВУЗ", "after": "about_me"},
                {"id": "faculty", "label": "Факультет", "after": "university"},
                {"id": "course", "label": "Курс", "after": "faculty"},
                {"id": "tags", "label": "Теги", "after": "course"}
            ],
            "teacher": [
                {"id": "university", "label": "ВУЗ", "after": "about_me"},
                {"id": "tags", "label": "Теги", "after": "university"}
            ],
            "employer": [
                {"id": "workplace", "label": "Место работы", "after": "about_me"},
                {"id": "tags", "label": "Теги", "after": "workplace"}
            ]
        }
    })

@app.route('/get_users', methods=['GET'])
def get_users():
    """
    Получение списка всех пользователей из базы данных
    """
    try:
        # Получаем всех пользователей из базы данных
        response = supabase.table('users').select('*').execute()
        
        if response.data:
            # Создаем список пользователей, исключая пароли и скрывая телеграм (будет отображаться только в системе)
            users_data = []
            for user in response.data:
                user_data = {
                    'id': user.get('id'),
                    'last_name': user.get('last_name', ''),
                    'first_name': user.get('first_name', ''),
                    'middle_name': user.get('middle_name', ''),
                    'user_role': user.get('user_role', ''),
                    'age': user.get('age'),
                    'university': user.get('university', ''),
                    'faculty': user.get('faculty', ''),
                    'course': user.get('course'),
                    'workplace': user.get('workplace', ''),
                    'about_me': user.get('about_me', ''),
                    'tags': user.get('tags', []),
                    'created_at': user.get('created_at')
                }
                users_data.append(user_data)
            
            return jsonify({'success': True, 'users': users_data})
        
        return jsonify({'success': False, 'error': 'Пользователи не найдены'}), 404
        
    except Exception as e:
        logger.error(f"Ошибка при получении пользователей: {str(e)}")
        return jsonify({'success': False, 'error': 'Произошла ошибка при получении данных пользователей'}), 500

@app.route('/get_users_by_tags', methods=['POST'])
def get_users_by_tags():
    """
    Получение списка пользователей, у которых есть хотя бы один тег из запрошенных
    """
    try:
        data = request.json
        tags = data.get('tags', [])
        
        if not tags:
            return jsonify({'success': False, 'error': 'Не указаны теги для поиска'}), 400
        
        # Получаем всех пользователей из базы данных
        response = supabase.table('users').select('*').execute()
        
        if not response.data:
            return jsonify({'success': False, 'error': 'Пользователи не найдены'}), 404
        
        # Фильтруем пользователей по тегам
        matching_users = []
        for user in response.data:
            user_tags = user.get('tags', [])
            
            # Проверяем, есть ли у пользователя хотя бы один из запрашиваемых тегов
            if user_tags and any(tag in user_tags for tag in tags):
                user_data = {
                    'id': user.get('id'),
                    'last_name': user.get('last_name', ''),
                    'first_name': user.get('first_name', ''),
                    'middle_name': user.get('middle_name', ''),
                    'user_role': user.get('user_role', ''),
                    'age': user.get('age'),
                    'university': user.get('university', ''),
                    'faculty': user.get('faculty', ''),
                    'course': user.get('course'),
                    'workplace': user.get('workplace', ''),
                    'about_me': user.get('about_me', ''),
                    'tags': user.get('tags', []),
                    'created_at': user.get('created_at')
                }
                matching_users.append(user_data)
        
        return jsonify({'success': True, 'users': matching_users})
        
    except Exception as e:
        logger.error(f"Ошибка при получении пользователей по тегам: {str(e)}")
        return jsonify({'success': False, 'error': 'Произошла ошибка при получении данных пользователей'}), 500

if __name__ == '__main__':
    # Запускаем бота только если это основной процесс
    # Flask в режиме debug создает два процесса, и мы хотим избежать дублирования бота
    import sys
    if not os.environ.get('WERKZEUG_RUN_MAIN'):
        # Запускаем бота только в родительском процессе
        from telegram_bot import main as start_bot
        start_bot()
    
    # Запускаем Flask-приложение
    app.run(host='0.0.0.0', debug=True)