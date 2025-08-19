// ========================================
// UTILITY FUNCTIONS
// ========================================

// Storage Management (using localStorage)
function setCookie(name, value, days) {
    localStorage.setItem(name, value);
}

function getCookie(name) {
    return localStorage.getItem(name) || '';
}

// Page Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
}

// Header Management
function showMainHeader() {
    document.getElementById('mainHeader').classList.remove('hidden');
    document.getElementById('programHeader').classList.add('hidden');
}

function showProgramHeader() {
    document.getElementById('mainHeader').classList.add('hidden');
    document.getElementById('programHeader').classList.remove('hidden');
}

// Notification System
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-xl text-white font-semibold transition-all duration-300 transform translate-x-full`;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(full)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
} 

// Speech synthesis helper (English countdown etc.)
function speakText(text, lang = 'en-US') {
    try {
        if (!('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(String(text));
        utterance.lang = lang;
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
    } catch (e) {
        // ignore speech errors silently
    }
}