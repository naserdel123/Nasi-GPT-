import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

# تحميل متغيرات البيئة
load_dotenv()

app = Flask(__name__)
CORS(app)

# تهيئة عميل OpenAI
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

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
        
        # إرسال الطلب إلى OpenAI GPT-4o-mini
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "أنت مساعد ذكي متعدد اللغات. قدم إجابات مفيدة ودقيقة."},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        ai_response = response.choices[0].message.content
        
        return jsonify({
            'response': ai_response,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/image', methods=['POST'])
def generate_image():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        style = data.get('style', 'realistic')  # realistic, anime, animation
        
        if not prompt:
            return jsonify({'error': 'وصف الصورة فارغ'}), 400
        
        # تعديل الوصف بناءً على النمط المختار
        style_prompts = {
            'realistic': f"Realistic photo, high quality, detailed: {prompt}",
            'anime': f"Anime style, Japanese animation, vibrant colors, detailed: {prompt}",
            'animation': f"3D animation style, Pixar-like, colorful, detailed: {prompt}"
        }
        
        enhanced_prompt = style_prompts.get(style, style_prompts['realistic'])
        
        # إنشاء الصورة باستخدام DALL-E 3
        response = client.images.generate(
            model="dall-e-3",
            prompt=enhanced_prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        
        image_url = response.data[0].url
        
        return jsonify({
            'image_url': image_url,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
