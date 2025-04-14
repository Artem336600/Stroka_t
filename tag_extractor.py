from openai import OpenAI
from tags_data import categorized_tags

# Инициализация клиента DeepSeek с API-ключом
client = OpenAI(api_key="sk-4343a8699fd7460d98903b12836a4627", base_url="https://api.deepseek.com")

# Функция для извлечения тегов
def extract_tags(description):
    # Формируем список всех тегов для отправки в DeepSeek
    all_tags = [tag for category in categorized_tags.values() for subcategory in category.values() for tag in
                subcategory]
    prompt = f"""
    У меня есть описание проекта или интересов: "{description}".
    Пожалуйста, выбери из следующего списка тегов те, которые лучше всего соответствуют описанию: {', '.join(all_tags)}.
    Верни только список подходящих тегов, разделенных запятыми, ничего лишнего.
    """

    try:
        # Запрос к DeepSeek API
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system",
                 "content": "You are a helpful assistant that extracts relevant tags from descriptions."},
                {"role": "user", "content": prompt},
            ],
            stream=False
        )

        # Получаем результат
        result = response.choices[0].message.content.strip()
        selected_tags = result.split(", ") if result else []

        # Организуем теги по категориям и подкатегориям для вывода
        categorized_result = {
            category: {subcategory: [] for subcategory in subcategories}
            for category, subcategories in categorized_tags.items()
        }
        for tag in selected_tags:
            for category, subcategories in categorized_tags.items():
                for subcategory, tags in subcategories.items():
                    if tag in tags:
                        categorized_result[category][subcategory].append(tag)

        # Убираем пустые подкатегории и категории
        categorized_result = {
            category: {
                subcategory: tags for subcategory, tags in subcategories.items() if tags
            }
            for category, subcategories in categorized_result.items()
        }
        categorized_result = {category: subcategories for category, subcategories in categorized_result.items() if
                             subcategories}

        return categorized_result

    except Exception as e:
        print(f"Ошибка при запросе к DeepSeek API: {e}")
        return {} 