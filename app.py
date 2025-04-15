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
    authenticate_user
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
    data = request.json
    telegram_username = data.get('telegram_username')
    password = data.get('password')
    
    if not telegram_username or not password:
        return jsonify({'success': False, 'error': 'Пожалуйста, введите имя пользователя и пароль'}), 400
    
    # Удаляем символ @ из имени пользователя, если он есть
    clean_username = telegram_username[1:] if telegram_username.startswith('@') else telegram_username
    
    success, user = authenticate_user(clean_username, password)
    
    if success:
        session['user'] = clean_username
        return jsonify({'success': True, 'user': {'telegram_username': clean_username}})
    
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
        
        return jsonify({'success': True})
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
        return jsonify({'success': True})
    
    return jsonify({'success': False, 'error': 'Неверный код подтверждения'}), 400

@app.route('/register/step3', methods=['POST'])
def register_step3():
    data = request.json
    telegram_username = data.get('telegram_username')
    password = data.get('password')
    
    if not telegram_username or not password:
        return jsonify({'success': False, 'error': 'Пожалуйста, введите все необходимые данные'}), 400
    
    # Удаляем символ @ из имени пользователя, если он есть
    clean_username = telegram_username[1:] if telegram_username.startswith('@') else telegram_username
    
    # Регистрируем пользователя
    success, message = register_user(clean_username, password)
    
    if success:
        return jsonify({'success': True})
    
    return jsonify({'success': False, 'error': message}), 400

@app.route('/register/complete', methods=['POST'])
def register_complete():
    data = request.json
    telegram_username = data.get('telegram_username')
    password = data.get('password')
    about_me = data.get('about_me')
    tags = data.get('tags')
    
    logger.debug(f"Получен запрос на завершение регистрации для {telegram_username}")
    
    if not telegram_username or not password:
        logger.warning("Отсутствуют обязательные поля для регистрации")
        return jsonify({'success': False, 'error': 'Пожалуйста, введите все необходимые данные'}), 400
    
    # Удаляем символ @ из имени пользователя, если он есть
    clean_username = telegram_username[1:] if telegram_username.startswith('@') else telegram_username
    
    logger.debug(f"Регистрация пользователя: {clean_username}")
    
    # Регистрируем пользователя
    success, message = register_user(
        clean_username, 
        password,
        about_me,
        tags
    )
    
    if success:
        logger.info(f"Пользователь {clean_username} успешно зарегистрирован")
        # Авторизуем пользователя сразу после регистрации
        session['user'] = clean_username
        return jsonify({
            'success': True, 
            'user': {
                'telegram_username': clean_username
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
        return jsonify({
            'authenticated': True, 
            'user': {'telegram_username': session['user']}
        })
    return jsonify({'authenticated': False})

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