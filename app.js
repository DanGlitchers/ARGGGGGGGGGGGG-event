import { GoogleGenerativeAI } from "@google/generative-ai";

// החלף את הטקסט בגרשיים במפתח ה-API האמיתי שלך
const API_KEY = "AIzaSyA886QPoQ5wd-Pji2Qh9XR1aAOscj-8ekE";

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "אתה עוזר מומחה לפיתוח ברובלוקס. ענה בעברית בצורה ברורה. כשאתה נותן קוד, כתוב אותו ב-Lua בתוך בלוק קוד. עזור למשתמש שלב אחר שלב."
});

let projects = JSON.parse(localStorage.getItem('roblox_projects')) || [];
let currentProjectId = null;

// פונקציה להצגת הודעות
function appendMessage(role, text) {
    const chatWindow = document.getElementById('chat-window');
    const msgDiv = document.createElement('div');
    
    if (role === 'user') {
        msgDiv.className = "bg-blue-600 p-4 rounded-2xl max-w-[80%] self-end text-white shadow-md";
    } else {
        msgDiv.className = "bg-[#21262d] p-4 rounded-2xl max-w-[80%] self-start border border-gray-700 text-gray-200 shadow-md";
    }
    
    msgDiv.innerText = text;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ניהול פרויקטים
function renderProjectList() {
    const list = document.getElementById('project-list');
    list.innerHTML = '';
    
    projects.forEach(p => {
        const item = document.createElement('div');
        item.className = `p-3 rounded-lg cursor-pointer transition-all ${currentProjectId === p.id ? 'bg-blue-900 border border-blue-500' : 'hover:bg-gray-800 text-gray-400'}`;
        item.innerText = `🎮 ${p.name}`;
        item.onclick = () => loadProject(p.id);
        list.appendChild(item);
    });
}

function loadProject(id) {
    currentProjectId = id;
    const project = projects.find(p => p.id === id);
    document.getElementById('current-project-title').innerText = project.name;
    document.getElementById('chat-window').innerHTML = '';
    project.chatHistory.forEach(msg => appendMessage(msg.role, msg.text));
    renderProjectList();
}

// פונקציית שליחת הודעה
async function handleSendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    
    if (!text) return;
    if (!currentProjectId) {
        alert("קודם צריך ליצור פרויקט חדש בסיידבר!");
        return;
    }

    appendMessage('user', text);
    input.value = '';

    const project = projects.find(p => p.id === currentProjectId);
    project.chatHistory.push({ role: 'user', text: text });

    try {
        // הכנת ההיסטוריה ל-AI
        const chat = model.startChat({
            history: project.chatHistory.slice(0, -1).map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }],
            })),
        });

        const result = await chat.sendMessage(text);
        const response = await result.response;
        const aiText = response.text();

        appendMessage('ai', aiText);
        project.chatHistory.push({ role: 'ai', text: aiText });
        localStorage.setItem('roblox_projects', JSON.stringify(projects));
        
    } catch (error) {
        console.error("Error:", error);
        appendMessage('ai', "שגיאה: " + (error.message.includes("API key") ? "מפתח ה-API לא תקין או חסום." : "משהו השתבש בחיבור."));
    }
}

// חיבור אירועים
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('new-project-btn').onclick = () => {
        const name = prompt("איך נקרא למשחק?");
        if (!name) return;
        const newP = { id: Date.now(), name, chatHistory: [] };
        projects.push(newP);
        localStorage.setItem('roblox_projects', JSON.stringify(projects));
        loadProject(newP.id);
    };

    document.getElementById('send-btn').onclick = handleSendMessage;
    document.getElementById('user-input').onkeypress = (e) => { if (e.key === 'Enter') handleSendMessage(); };

    renderProjectList();
});
