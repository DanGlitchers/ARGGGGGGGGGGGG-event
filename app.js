import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyA886QPoQ5wd-Pji2Qh9XR1aAOscj-8ekE";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "אתה מורה מומחה לרובלוקס. המטרה שלך היא לעזור למשתמש לבנות משחק שלב אחרי שלב. ענה בעברית, ספק קוד Lua כשצריך, ותן טיפים לעיצוב ב-Roblox Studio."
});

let projects = JSON.parse(localStorage.getItem('roblox_projects')) || [];
let currentProjectId = null;

// פונקציות עזר
function saveProjects() {
    localStorage.setItem('roblox_projects', JSON.stringify(projects));
    renderProjectList();
}

function renderProjectList() {
    const list = document.getElementById('project-list');
    list.innerHTML = projects.map(p => `
        <div data-id="${p.id}" class="project-item p-3 rounded-lg cursor-pointer transition-colors ${currentProjectId === p.id ? 'bg-blue-900/30 border border-blue-500 text-white' : 'hover:bg-gray-800 text-gray-400'}">
            🎮 ${p.name}
        </div>
    `).join('');

    // הוספת אירוע לחיצה לכל פרויקט ברשימה
    document.querySelectorAll('.project-item').forEach(item => {
        item.addEventListener('click', () => loadProject(parseInt(item.dataset.id)));
    });
}

function loadProject(id) {
    currentProjectId = id;
    const project = projects.find(p => p.id === id);
    document.getElementById('current-project-title').innerText = project.name;
    
    const chatWindow = document.getElementById('chat-window');
    chatWindow.innerHTML = '';
    
    project.chatHistory.forEach(msg => appendMessage(msg.role, msg.text));
    renderProjectList();
}

function appendMessage(role, text) {
    const chatWindow = document.getElementById('chat-window');
    const msgDiv = document.createElement('div');
    msgDiv.className = role === 'user' 
        ? "bg-blue-600 p-4 rounded-2xl max-w-[80%] self-end text-white shadow-md" 
        : "bg-[#21262d] p-4 rounded-2xl max-w-[80%] self-start border border-gray-700 text-gray-200 shadow-md";
    
    msgDiv.innerText = text;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function handleSendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    
    if (!text || !currentProjectId) {
        if (!currentProjectId) alert("נא ליצור או לבחור פרויקט קודם!");
        return;
    }
    
    appendMessage('user', text);
    input.value = '';
    
    const project = projects.find(p => p.id === currentProjectId);
    project.chatHistory.push({ role: 'user', text: text });

    try {
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
        saveProjects();
    } catch (error) {
        console.error(error);
        appendMessage('ai', "שגיאה בחיבור ל-AI. ייתכן והמפתח אינו תקין.");
    }
}

// חיבור הכפתורים לאחר שהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('new-project-btn').addEventListener('click', () => {
        const name = prompt("שם המשחק:");
        if (!name) return;
        const newProj = { id: Date.now(), name, chatHistory: [] };
        projects.push(newProj);
        saveProjects();
        loadProject(newProj.id);
    });

    document.getElementById('send-btn').addEventListener('click', handleSendMessage);
    
    document.getElementById('user-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });

    renderProjectList();
});
