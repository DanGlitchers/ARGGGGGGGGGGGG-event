import { GoogleGenerativeAI } from "@google/generative-ai";

// ה-API Key שלך (כאן תחליף אותו בעתיד)
const API_KEY = "AIzaSyA886QPoQ5wd-Pji2Qh9XR1aAOscj-8ekE";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "אתה עוזר מומחה לפיתוח ברובלוקס (Roblox Studio). תפקידך להדריך משתמשים בבניית משחקים צעד אחר צעד. ענה תמיד בעברית. ספק קוד ב-Lua בתוך קטעי קוד ברורים. אם המשתמש שואל משהו לא קשור, החזר אותו בעדינות לפיתוח המשחק."
});

let projects = JSON.parse(localStorage.getItem('roblox_projects')) || [];
let currentProjectId = null;

// פונקציה ליצירת פרויקט חדש
window.createNewProject = function() {
    const name = prompt("איך לקרוא למשחק החדש שלך?");
    if (!name) return;
    
    const newProject = {
        id: Date.now(),
        name: name,
        chatHistory: []
    };
    
    projects.push(newProject);
    saveProjects();
    loadProject(newProject.id);
};

// שמירה ל-LocalStorage
function saveProjects() {
    localStorage.setItem('roblox_projects', JSON.stringify(projects));
    renderProjectList();
}

// הצגת רשימת הפרויקטים בסיידבר
function renderProjectList() {
    const list = document.getElementById('project-list');
    list.innerHTML = projects.map(p => `
        <div onclick="loadProject(${p.id})" class="p-3 rounded-lg cursor-pointer transition-colors ${currentProjectId === p.id ? 'bg-blue-900/30 border border-blue-500 text-white' : 'hover:bg-gray-800 text-gray-400'}">
            🎮 ${p.name}
        </div>
    `).join('');
}

// טעינת פרויקט ספציפי
window.loadProject = function(id) {
    currentProjectId = id;
    const project = projects.find(p => p.id === id);
    document.getElementById('current-project-title').innerText = project.name;
    
    const chatWindow = document.getElementById('chat-window');
    chatWindow.innerHTML = ''; // ניקוי הצ'אט
    
    project.chatHistory.forEach(msg => {
        appendMessage(msg.role, msg.text);
    });
    
    renderProjectList();
};

// שליחת הודעה ל-AI
window.sendMessage = async function() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    
    if (!text || !currentProjectId) return;
    
    appendMessage('user', text);
    input.value = '';
    
    const project = projects.find(p => p.id === currentProjectId);
    project.chatHistory.push({ role: 'user', text: text });

    try {
        // הכנת ההיסטוריה עבור ה-AI
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
        appendMessage('ai', "מצטער, יש לי תקלה קטנה בשרת. בדוק שה-API Key תקין.");
    }
};

function appendMessage(role, text) {
    const chatWindow = document.getElementById('chat-window');
    const msgDiv = document.createElement('div');
    
    if (role === 'user') {
        msgDiv.className = "bg-blue-600 p-4 rounded-2xl max-w-[80%] self-end text-white shadow-md";
    } else {
        msgDiv.className = "bg-[#21262d] p-4 rounded-2xl max-w-[80%] self-start border border-gray-700 text-gray-200 shadow-md";
    }
    
    // הפיכת טקסט עם קוד למשהו קריא (בסיסי)
    msgDiv.innerText = text;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// אתחול ראשוני
renderProjectList();
