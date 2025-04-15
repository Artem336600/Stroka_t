import logging
import threading
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from supabase import create_client, Client
import random
import string
import asyncio

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# Supabase настройки
SUPABASE_URL = "https://ddfjcrfioaymllejalpm.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZmpjcmZpb2F5bWxsZWphbHBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjQ3ODYzOSwiZXhwIjoyMDU4MDU0NjM5fQ.Dh42k1K07grKhF3DntbNLSwUifaXAa0Q6-LEIzRgpWM"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Telegram Bot токен
TOKEN = "7574510217:AAGYVNk4uqTxJ7HF7Z5XCkSqX59SOfJPjKU"

# Глобальная переменная для хранения запущенного приложения бота
bot_app = None

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик команды /start."""
    username = update.effective_user.username
    
    if not username:
        await update.message.reply_text(
            "Пожалуйста, установите имя пользователя в настройках Telegram, чтобы использовать бота."
        )
        return
    
    # Проверяем, есть ли запрос на регистрацию для этого пользователя
    response = supabase.table('registration_requests').select('*').eq('telegram_username', username).eq('status', 'pending').execute()
    
    if response.data:
        # Генерируем код подтверждения
        verification_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        # Обновляем запись с кодом верификации
        supabase.table('registration_requests').update({'verification_code': verification_code}).eq('telegram_username', username).execute()
        
        await update.message.reply_text(
            f"Здравствуйте! Мы получили ваш запрос на регистрацию.\n\n"
            f"Ваш код подтверждения: {verification_code}\n\n"
            f"Пожалуйста, введите этот код на сайте для завершения регистрации."
        )
    else:
        # Проверяем, зарегистрирован ли пользователь
        user_response = supabase.table('users').select('*').eq('telegram_username', username).execute()
        
        if user_response.data:
            await update.message.reply_text(
                f"Здравствуйте! Вы уже зарегистрированы в системе."
            )
        else:
            await update.message.reply_text(
                "Для регистрации, пожалуйста, начните процесс на нашем сайте, указав ваше имя пользователя Telegram."
            )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик команды /help."""
    await update.message.reply_text(
        "Этот бот помогает с регистрацией на нашем сервисе.\n\n"
        "Команды:\n"
        "/start - Проверить статус регистрации\n"
        "/help - Показать это сообщение"
    )

def run_bot_polling():
    """Запускает бота в отдельном процессе"""
    global bot_app
    try:
        # Создаем и конфигурируем приложение бота
        bot_app = Application.builder().token(TOKEN).build()
        bot_app.add_handler(CommandHandler("start", start))
        bot_app.add_handler(CommandHandler("help", help_command))
        
        # Запускаем бота (блокирующий вызов)
        bot_app.run_polling(allowed_updates=Update.ALL_TYPES)
    except Exception as e:
        logging.error(f"Ошибка при запуске бота: {e}")

def main():
    """Запускает бота в отдельном процессе"""
    # Создаем и запускаем процесс для бота
    import multiprocessing
    bot_process = multiprocessing.Process(target=run_bot_polling)
    bot_process.daemon = True  # Процесс завершится вместе с основным
    bot_process.start()
    logging.info("Telegram бот запущен в отдельном процессе")

if __name__ == "__main__":
    main() 