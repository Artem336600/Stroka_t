import logging
from supabase import create_client, Client
import random
import string

# Настройка логирования
logging.basicConfig(level=logging.DEBUG, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Supabase настройки
SUPABASE_URL = "https://ddfjcrfioaymllejalpm.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZmpjcmZpb2F5bWxsZWphbHBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjQ3ODYzOSwiZXhwIjoyMDU4MDU0NjM5fQ.Dh42k1K07grKhF3DntbNLSwUifaXAa0Q6-LEIzRgpWM"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_registration_request(telegram_username):
    """
    Создает запрос на регистрацию в базе данных
    """
    # Генерируем код верификации
    verification_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    # Проверяем, существует ли уже запрос для этого пользователя
    response = supabase.table('registration_requests').select('*').eq('telegram_username', telegram_username).execute()
    
    if response.data:
        # Обновляем существующий запрос
        result = supabase.table('registration_requests').update({
            'status': 'pending',
            'verification_code': verification_code
        }).eq('telegram_username', telegram_username).execute()
    else:
        # Создаем новый запрос
        result = supabase.table('registration_requests').insert({
            'telegram_username': telegram_username,
            'verification_code': verification_code
        }).execute()
    
    return verification_code

def verify_registration_request(telegram_username, verification_code):
    """
    Проверяет код верификации для запроса на регистрацию
    """
    response = supabase.table('registration_requests').select('*').eq('telegram_username', telegram_username).eq('verification_code', verification_code).execute()
    
    if response.data:
        # Обновляем статус запроса
        supabase.table('registration_requests').update({
            'status': 'approved'
        }).eq('telegram_username', telegram_username).execute()
        return True
    
    return False

def register_user(telegram_username, password):
    """
    Регистрирует пользователя в системе
    """
    # Удаляем символ @ из имени пользователя, если он есть
    clean_username = telegram_username[1:] if telegram_username.startswith('@') else telegram_username
    
    # Проверяем, существует ли уже этот пользователь
    response = supabase.table('users').select('*').eq('telegram_username', clean_username).execute()
    
    if response.data:
        return False, "Пользователь с таким именем уже зарегистрирован"
    
    # Создаем нового пользователя
    result = supabase.table('users').insert({
        'telegram_username': clean_username,
        'password': password
    }).execute()
    
    return True, "Регистрация успешно завершена"

def validate_telegram_username(username):
    """
    Проверяет валидность имени пользователя Telegram
    """
    logger.debug(f"Начало валидации имени пользователя: '{username}'")
    
    # Проверяем, что имя пользователя начинается с символа @
    if not username:
        logger.warning("Имя пользователя не может быть пустым")
        return False, "Имя пользователя не может быть пустым"
    
    if not username.startswith('@'):
        logger.warning(f"Имя пользователя не начинается с символа @: '{username}'")
        return False, "Имя пользователя должно начинаться с символа @"
    
    # Проверяем валидность без символа @
    username_without_at = username[1:]
    logger.debug(f"Имя пользователя без символа @: '{username_without_at}'")
    
    # Проверка формата имени пользователя Telegram (без @)
    if not username_without_at:
        logger.warning("Имя пользователя пусто после удаления символа @")
        return False, "Имя пользователя не может быть пустым после символа @"
        
    if not username_without_at.isalnum():
        logger.warning(f"Имя пользователя '{username_without_at}' содержит недопустимые символы")
        return False, "Имя пользователя может содержать только буквы и цифры"
        
    if len(username_without_at) < 5:
        logger.warning(f"Имя пользователя '{username_without_at}' слишком короткое: {len(username_without_at)} символов")
        return False, "Имя пользователя должно содержать не менее 5 символов после @"
    
    # Проверяем, существует ли уже этот пользователь
    try:
        response = supabase.table('users').select('*').eq('telegram_username', username_without_at).execute()
        
        if response.data:
            logger.warning(f"Пользователь с именем '{username_without_at}' уже зарегистрирован")
            return False, "Пользователь с таким именем уже зарегистрирован"
            
        logger.debug(f"Имя пользователя '{username}' прошло валидацию успешно")
        return True, "Имя пользователя валидно"
        
    except Exception as e:
        logger.error(f"Ошибка при проверке существования пользователя: {str(e)}")
        return False, "Произошла ошибка при проверке имени пользователя. Пожалуйста, попробуйте позже."

def authenticate_user(telegram_username, password):
    """
    Аутентифицирует пользователя
    """
    response = supabase.table('users').select('*').eq('telegram_username', telegram_username).eq('password', password).execute()
    
    if response.data:
        # Обновляем время последнего входа
        supabase.table('users').update({
            'last_login': 'now()'
        }).eq('telegram_username', telegram_username).execute()
        
        return True, response.data[0]
    
    return False, None 