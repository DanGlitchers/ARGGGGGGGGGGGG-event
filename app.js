import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. חובה להחליף למפתח חדש שייצרת ב-https://aistudio.google.com/app/apikey
const API_KEY = "AIzaSyA886QPoQ5wd-Pji2Qh9XR1aAOscj-8ekE"; 

const genAI = new GoogleGenerativeAI(API_KEY);

// שימוש במודל gemini-1.5-flash-latest - הגרסה הכי יציבה כרגע
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash-latest" 
});

let projects = JSON.parse(localStorage.getItem('roblox_projects')) || [];
let currentProjectId = null;

function appendMessage(role, text) {
    const chatWindow = document.getElementById('chat-window');
    const msgDiv = document.createElement('div');
    msgDiv.className = role === 'user' 
        ? "bg-blue-600 p-4 rounded-2xl max-w-[80%] self-end text-white shadow-md mb-4" 
        : "bg-[#21262d] p-4 rounded-2xl max-w-[80%] self-start border border-gray-700 text-gray-200 shadow-md mb-4";
    
    msgDiv.innerText = text;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function renderProjectList() {
    const list = document.getElementById('project-list');
    list.innerHTML = '';
    projects.forEach(p => {
        const item = document.createElement('div');
        item.className = `p-3 rounded-lg cursor-pointer transition-all mb-2 ${currentProjectId === p.id ? 'bg-blue-900 border border-blue-500' : 'hover:bg-gray-800 text-gray-400'}`;
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

async function handleSendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    
    if (!text || !currentProjectId) {
        if (!currentProjectId) alert("נא ליצור או לבחור פרויקט!");
        return;
    }

    appendMessage('user', text);
    input.value = '';

    const project = projects.find(p => p.id === currentProjectId);
    project.chatHistory.push({ role: 'user', text: text });

    try {
        // התחלת צ'אט עם הנחיות מערכת ידניות
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "אתה עוזר מומחה לפיתוח ברובלוקס. ענה תמיד בעברית." }],
                },
                {
                    role: "model",
                    parts: [{ text: "הבנתי, אני מוכן לעזור לך לבנות משחקים ברובלוקס בעברית!" }],
                },
                ...project.chatHistory.slice(0, -1).map(m => ({
                    role: m.role === 'user' ? "user" : "model",
                    parts: [{ text: m.text }],
                }))
            ]
        });

        const result = await chat.sendMessage(text);
        const response = await result.response;
        const aiText = response.text();

        appendMessage('ai', aiText);
        project.chatHistory.push({ role: 'ai', text: aiText });
        localStorage.setItem('roblox_projects', JSON.stringify(projects));
        
    } catch (error) {
        console.error("שגיאה:", error);
        appendMessage('ai', "שגיאה בחיבור. וודא שהמפתח תקין ושבחרת פרויקט.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('new-project-btn').onclick = () => {
        const name = prompt("שם המשחק:");
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
