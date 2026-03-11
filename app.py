import os
import requests
from flask import Flask, request, jsonify, render_template

# إنشاء تطبيق Flask
app = Flask(__name__)

# قراءة مفتاح OpenAI من متغير البيئة مباشرة
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
OPENAI_BASE_URL = "https://api.openai.com/v1"

headers = {
    "Authorization": f"Bearer {OPENAI_API_KEY}",
    "Content-Type": "application/json"
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'الرسالة فارغة'}), 400
        
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "أنت مساعد ذكي متعدد اللغات. قدم إجابات مفيدة ودقيقة."},
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        response = requests.post(
            f"{OPENAI_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        
        response_data = response.json()
        
        if response.status_code == 200:
            ai_response = response_data['choices'][0]['message']['content']
            return jsonify({
                'response': ai_response,
                'status': 'success'
            })
        else:
            error_msg = response_data.get('error', {}).get('message', 'Unknown error')
            return jsonify({'error': error_msg}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/image', methods=['POST'])
def generate_image():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        style = data.get('style', 'realistic')
        
        if not prompt:
            return jsonify({'error': 'وصف الصورة فارغ'}), 400
        
        # تعديل الوصف بناءً على النمط
        style_prompts = {
            'realistic': f"Realistic photo, high quality, detailed: {prompt}",
            'anime': f"Anime style, Japanese animation, vibrant colors, detailed: {prompt}",
            'animation': f"3D animation style, Pixar-like, colorful, detailed: {prompt}"
        }
        
        enhanced_prompt = style_prompts.get(style, style_prompts['realistic'])
        
        payload = {
            "model": "dall-e-3",
            "prompt": enhanced_prompt,
            "size": "1024x1024",
            "quality": "standard",
            "n": 1
        }
        
        response = requests.post(
            f"{OPENAI_BASE_URL}/images/generations",
            headers=headers,
            json=payload,
            timeout=120
        )
        
        response_data = response.json()
        
        if response.status_code == 200:
            image_url = response_data['data'][0]['url']
            return jsonify({
                'image_url': image_url,
                'status': 'success'
            })
        else:
            error_msg = response_data.get('error', {}).get('message', 'Unknown error')
            return jsonify({'error': error_msg}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
