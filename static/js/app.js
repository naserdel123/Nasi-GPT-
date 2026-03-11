// عناصر DOM
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const typingIndicator = document.getElementById('typingIndicator');
const sendBtn = document.getElementById('sendBtn');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');

// تعديل ارتفاع textarea تلقائياً
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
});

// إرسال الرسالة عند الضغط على Enter (بدون Shift)
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// إرسال رسالة
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // إضافة رسالة المستخدم
    addMessage(message, 'user');
    
    // مسح حقل الإدخال
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // إظهار مؤشر الكتابة
    showTypingIndicator();
    sendBtn.disabled = true;

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        
        hideTypingIndicator();
        
        if (data.status === 'success') {
            addMessage(data.response, 'ai');
        } else {
            addMessage('عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.', 'ai', true);
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage('عذراً، لا يمكن الاتصال بالخادم. يرجى التحقق من اتصالك.', 'ai', true);
        console.error('Error:', error);
    } finally {
        sendBtn.disabled = false;
    }
}

// إنشاء صورة
async function generateImage() {
    const prompt = document.getElementById('imagePrompt').value.trim();
    const style = document.getElementById('imageStyle').value;
    
    if (!prompt) {
        alert('الرجاء إدخال وصف للصورة');
        return;
    }

    // إظهار رسالة انتظار
    const waitingMsg = addMessage(`جاري إنشاء صورة: "${prompt}"...`, 'user');
    
    // إضافة مؤشر تحميل
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message';
    loadingDiv.innerHTML = `
        <div class="avatar">🎨</div>
        <div class="message-content">
            <div class="loading"></div> جاري إنشاء الصورة...
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    scrollToBottom();

    try {
        const response = await fetch('/image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                prompt: prompt,
                style: style 
            })
        });

        const data = await response.json();
        
        // إزالة مؤشر التحميل
        loadingDiv.remove();
        
        if (data.status === 'success') {
            // إضافة الصورة إلى المحادثة
            const imageContainer = document.createElement('div');
            imageContainer.className = 'message ai-message';
            
            const styleNames = {
                'realistic': 'واقعي',
                'anime': 'أنمي',
                'animation': 'أنيميشن'
            };
            
            imageContainer.innerHTML = `
                <div class="avatar">🎨</div>
                <div class="message-content">
                    <p>تم إنشاء الصورة بنمط: ${styleNames[style]}</p>
                    <img src="${data.image_url}" 
                         alt="Generated Image" 
                         class="generated-image"
                         onclick="openModal('${data.image_url}')">
                    <p class="image-caption">انقر على الصورة لتكبيرها</p>
                </div>
            `;
            chatMessages.appendChild(imageContainer);
            scrollToBottom();
            
            // مسح حقل الوصف
            document.getElementById('imagePrompt').value = '';
        } else {
            addMessage('عذراً، فشل إنشاء الصورة. ' + (data.error || ''), 'ai', true);
        }
    } catch (error) {
        loadingDiv.remove();
        addMessage('عذراً، حدث خطأ أثناء إنشاء الصورة.', 'ai', true);
        console.error('Error:', error);
    }
}

// إضافة رسالة إلى المحادثة
function addMessage(text, sender, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = sender === 'user' ? '👤' : (isError ? '⚠️' : '🤖');
    const contentClass = isError ? 'style="background-color: #fee2e2; color: #991b1b;"' : '';
    
    // تحويل الروابط إلى clickable links
    const linkedText = text.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" style="color: inherit; text-decoration: underline;">$1</a>'
    );
    
    // تحويل الخطوط الجديدة إلى <br>
    const formattedText = linkedText.replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = `
        <div class="avatar">${avatar}</div>
        <div class="message-content" ${contentClass}>
            ${formattedText}
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    return messageDiv;
}

// إظهار/إخفاء مؤشر الكتابة
function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// التمرير لأسفل
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// مسح المحادثة
function clearChat() {
    chatMessages.innerHTML = `
        <div class="message ai-message">
            <div class="avatar">🤖</div>
            <div class="message-content">
                <p>بدأنا محادثة جديدة! كيف يمكنني مساعدتك؟</p>
            </div>
        </div>
    `;
}

// تغيير المظهر (داير/فاتح)
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// استعادة المظهر المحفوظ
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// Modal للصور
function openModal(src) {
    modalImage.src = src;
    imageModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(event) {
    if (event.target === imageModal || event.target.className === 'close-modal') {
        imageModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// إغلاق Modal بزر Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && imageModal.style.display === 'block') {
        imageModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// منع إرسال النموذج الافتراضي
document.addEventListener('submit', function(e) {
    e.preventDefault();
});
