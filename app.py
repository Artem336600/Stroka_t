from flask import Flask, render_template, request, jsonify
from tag_extractor import extract_tags
from tags_data import categorized_tags

app = Flask(__name__)

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)