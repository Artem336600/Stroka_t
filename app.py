from flask import Flask, render_template, request, jsonify, session
from tag_extractor import extract_tags
from tags_data import categorized_tags
import json
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key'  # Замените на реальный секретный ключ

# Временное хранилище пользователей (в реальном приложении используйте базу данных)
USERS_FILE = 'users.json'

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

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
    email = data.get('email')
    password = data.get('password')
    
    users = load_users()
    user = users.get(email)
    
    if user and user['password'] == password:
        session['user'] = email
        return jsonify({'success': True, 'user': {'email': email, 'name': user['name']}})
    
    return jsonify({'success': False, 'error': 'Неверный email или пароль'}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    users = load_users()
    
    if email in users:
        return jsonify({'success': False, 'error': 'Пользователь с таким email уже существует'}), 400
    
    users[email] = {
        'name': name,
        'password': password
    }
    
    save_users(users)
    session['user'] = email
    
    return jsonify({'success': True, 'user': {'email': email, 'name': name}})

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({'success': True})

@app.route('/check_auth', methods=['GET'])
def check_auth():
    if 'user' in session:
        users = load_users()
        user = users.get(session['user'])
        if user:
            return jsonify({'authenticated': True, 'user': {'email': session['user'], 'name': user['name']}})
    return jsonify({'authenticated': False})

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)