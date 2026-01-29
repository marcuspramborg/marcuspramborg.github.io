/* FocusFlow - Complete JavaScript Application */

// ============================================
// STATE
// ============================================
const state = {
    timer: { duration: 25 * 60, remaining: 25 * 60, running: false, isBreak: false, interval: null, sessions: 0 },
    notes: [],
    events: [],
    tasks: [],
    sounds: { white: { on: false, vol: 0.5 }, pink: { on: false, vol: 0.5 }, brown: { on: false, vol: 0.5 } },
    audioCtx: null,
    audioNodes: {},
    tts: { playing: false },
    canvas: { tool: 'pen', color: '#667eea', size: 3, drawing: false, history: [], historyIdx: -1 },
    settings: { theme: 'calm', highContrast: false, reducedMotion: false },
    rewards: { points: 0, streak: 0, lastActive: null, badges: [] },
    breaks: { breathing: false, stretching: false, eyeRest: false, grounding: { active: false, step: 0 } },
    hydration: 0,
    currentSection: 'dashboard',
    buddy: { active: false, timer: null }
};

// Data
const tips = [
    "Break large tasks into smaller chunks. Your brain loves small wins! 🧩",
    "Use the 'body doubling' technique - study with someone nearby. 👥",
    "Try color coding your notes - it helps ADHD brains remember! 🌈",
    "Take movement breaks every 25 min. Quick stretch keeps you fresh! 🚶",
    "Keep a 'parking lot' list for distracting thoughts. 📝",
    "Reward yourself after tasks. Dopamine boosts motivation! 🎁",
    "Study in sprints, not marathons. Quality beats quantity! 🏃",
    "White noise can mask distracting sounds. Try it! 🎧",
    "Eat that frog! Start with the task you dread most. 🐸"
];

const stretches = [
    { emoji: "🙆", text: "Reach arms above head and stretch tall" },
    { emoji: "🧘", text: "Roll shoulders backward 5 times" },
    { emoji: "🤸", text: "Gently tilt head to each side" },
    { emoji: "💪", text: "Stretch arms across your chest" },
    { emoji: "🦵", text: "Stand up and touch your toes" }
];

const groundingSteps = [
    { n: 5, sense: "SEE", text: "Name 5 things you can see" },
    { n: 4, sense: "TOUCH", text: "Name 4 things you can touch" },
    { n: 3, sense: "HEAR", text: "Name 3 things you can hear" },
    { n: 2, sense: "SMELL", text: "Name 2 things you can smell" },
    { n: 1, sense: "TASTE", text: "Name 1 thing you can taste" }
];

const aiResponses = {
    motivate: [
        "You've got this! Every small step counts. 🌟",
        "I believe in you! Let's break it down into manageable pieces.",
        "You're doing great just by showing up. That takes courage! 💪"
    ],
    studyTip: [
        "Try Pomodoro: 25 min focus, 5 min break. Perfect for ADHD brains!",
        "Write down distracting thoughts to deal with later.",
        "Use movement - walk while you read or use a standing desk!"
    ],
    breakTime: [
        "Time for a brain break! Try the 4-7-8 breathing exercise. 🌬️",
        "Great job focusing! How about a quick stretch?",
        "Your brain needs rest too. Take 5 mins - you've earned it! 🎉"
    ],
    pomodoro: [
        "The Pomodoro Technique: 25 min work, 5 min break. After 4 sessions, take a 15-30 min break. Perfect for ADHD because it creates urgency and rewards! 🍅"
    ]
};

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initApp();
    setupListeners();
    updateUI();
});

function loadState() {
    try {
        const saved = localStorage.getItem('focusflow');
        if (saved) {
            const data = JSON.parse(saved);
            state.notes = data.notes || [];
            state.events = data.events || [];
            state.tasks = data.tasks || [];
            state.rewards = data.rewards || state.rewards;
            state.settings = data.settings || state.settings;
            state.hydration = data.hydration || 0;
            state.timer.sessions = data.sessions || 0;
        }
    } catch (e) { console.log('Load error:', e); }
    applySettings();
}

function saveState() {
    localStorage.setItem('focusflow', JSON.stringify({
        notes: state.notes,
        events: state.events,
        tasks: state.tasks,
        rewards: state.rewards,
        settings: state.settings,
        hydration: state.hydration,
        sessions: state.timer.sessions
    }));
}

function initApp() {
    updateTimerDisplay();
    renderNotes();
    renderCalendar();
    renderTasks();
    renderEvents();
    initCanvas();
    populateVoices();
    showRandomTip();
    checkStreak();
    updateHydrationDisplay();
    showSection('dashboard');
}

function applySettings() {
    document.body.className = `theme-${state.settings.theme}`;
    if (state.settings.highContrast) document.body.classList.add('high-contrast');
    
    // Update UI toggles
    const hc = document.getElementById('highContrastToggle');
    const rm = document.getElementById('reducedMotionToggle');
    if (hc) hc.checked = state.settings.highContrast;
    if (rm) rm.checked = state.settings.reducedMotion;
    
    // Update theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === state.settings.theme);
    });
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.dataset.section));
    });

    // Menu toggle (mobile)
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('show');
    });

    // Settings
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        document.getElementById('settingsPanel').classList.toggle('show');
    });
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    document.getElementById('highContrastToggle')?.addEventListener('change', e => {
        state.settings.highContrast = e.target.checked;
        applySettings();
        saveState();
    });

    // Timer controls
    document.getElementById('timerStartBtn')?.addEventListener('click', startTimer);
    document.getElementById('timerPauseBtn')?.addEventListener('click', pauseTimer);
    document.getElementById('timerResetBtn')?.addEventListener('click', resetTimer);
    document.getElementById('miniStartBtn')?.addEventListener('click', () => {
        if (state.timer.running) pauseTimer(); else startTimer();
    });

    // Timer presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mins = parseInt(btn.dataset.minutes);
            const isBreak = btn.dataset.break === 'true';
            setTimerDuration(mins, isBreak);
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Notes
    document.getElementById('newNoteBtn')?.addEventListener('click', () => openNoteModal());
    document.getElementById('noteForm')?.addEventListener('submit', saveNote);
    document.getElementById('notesSearch')?.addEventListener('input', filterNotes);
    document.getElementById('exportNotesBtn')?.addEventListener('click', exportNotes);
    document.querySelectorAll('.color-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });
    });

    // Tasks
    document.getElementById('addTaskBtn')?.addEventListener('click', () => openModal('taskModal'));
    document.getElementById('taskForm')?.addEventListener('submit', saveTask);

    // Calendar
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => navCalendar(-1));
    document.getElementById('nextMonthBtn')?.addEventListener('click', () => navCalendar(1));
    document.getElementById('todayBtn')?.addEventListener('click', () => { calendarDate = new Date(); renderCalendar(); });
    document.getElementById('eventForm')?.addEventListener('submit', addEvent);

    // Sounds
    document.querySelectorAll('.channel-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleSound(btn.dataset.sound));
    });
    document.querySelectorAll('.volume-slider').forEach(slider => {
        slider.addEventListener('input', e => setVolume(e.target.dataset.sound, e.target.value / 100));
    });
    document.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => applySoundPreset(card.dataset.preset));
    });
    document.getElementById('stopAllSoundsBtn')?.addEventListener('click', stopAllSounds);

    // TTS
    document.getElementById('ttsPlayBtn')?.addEventListener('click', playTTS);
    document.getElementById('ttsPauseBtn')?.addEventListener('click', pauseTTS);
    document.getElementById('ttsStopBtn')?.addEventListener('click', stopTTS);
    document.getElementById('ttsSpeed')?.addEventListener('input', e => {
        document.getElementById('ttsSpeedVal').textContent = e.target.value + 'x';
    });
    document.getElementById('ttsPitch')?.addEventListener('input', e => {
        document.getElementById('ttsPitchVal').textContent = e.target.value + 'x';
    });
    document.getElementById('ttsFileInput')?.addEventListener('change', handleTTSFile);

    // AI Chat
    document.getElementById('chatSendBtn')?.addEventListener('click', sendChatMessage);
    document.getElementById('chatInput')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') sendChatMessage();
    });
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => handleQuickAction(btn.dataset.action));
    });

    // Canvas
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.canvas.tool = btn.dataset.tool;
        });
    });
    document.getElementById('brushSize')?.addEventListener('input', e => state.canvas.size = +e.target.value);
    document.getElementById('brushColor')?.addEventListener('input', e => state.canvas.color = e.target.value);
    document.getElementById('undoBtn')?.addEventListener('click', undoCanvas);
    document.getElementById('redoBtn')?.addEventListener('click', redoCanvas);
    document.getElementById('clearCanvasBtn')?.addEventListener('click', clearCanvas);
    document.getElementById('downloadCanvasBtn')?.addEventListener('click', downloadCanvas);

    // Breaks
    document.getElementById('breathingBtn')?.addEventListener('click', toggleBreathing);
    document.getElementById('stretchBtn')?.addEventListener('click', toggleStretching);
    document.getElementById('eyeBtn')?.addEventListener('click', toggleEyeRest);
    document.getElementById('groundingBtn')?.addEventListener('click', handleGrounding);
    document.getElementById('logWaterBtn')?.addEventListener('click', logWater);
    document.querySelectorAll('.glass').forEach(g => {
        g.addEventListener('click', () => setHydration(+g.dataset.idx));
    });

    // Dashboard
    document.getElementById('newTipBtn')?.addEventListener('click', showRandomTip);
    document.getElementById('buddyBtn')?.addEventListener('click', toggleBuddy);

    // Modals
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => { if (e.target === overlay) closeModals(); });
    });
    document.getElementById('celebrationCloseBtn')?.addEventListener('click', () => {
        document.getElementById('celebrationModal').classList.remove('show');
    });

    // Click outside settings
    document.addEventListener('click', e => {
        const panel = document.getElementById('settingsPanel');
        const btn = document.getElementById('settingsBtn');
        if (panel && !panel.contains(e.target) && !btn.contains(e.target)) {
            panel.classList.remove('show');
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

// ============================================
// NAVIGATION
// ============================================
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`section-${id}`)?.classList.add('active');
    document.querySelector(`[data-section="${id}"]`)?.classList.add('active');
    
    state.currentSection = id;
    document.getElementById('pageTitle').textContent = {
        dashboard: 'Dashboard', timer: 'Focus Timer', notes: 'Quick Notes',
        calendar: 'Calendar', sounds: 'Focus Sounds', tts: 'Text-to-Speech',
        ai: 'AI Study Assistant', canvas: 'Quick Sketch', breaks: 'Sensory Breaks'
    }[id] || 'FocusFlow';

    // Close mobile sidebar
    document.getElementById('sidebar')?.classList.remove('show');
    
    // Resize canvas when shown
    if (id === 'canvas') resizeCanvas();
}

// ============================================
// TIMER
// ============================================
function startTimer() {
    if (state.timer.running) return;
    state.timer.running = true;
    updateTimerButtons();
    
    state.timer.interval = setInterval(() => {
        state.timer.remaining--;
        updateTimerDisplay();
        if (state.timer.remaining <= 0) completeSession();
    }, 1000);
}

function pauseTimer() {
    state.timer.running = false;
    clearInterval(state.timer.interval);
    updateTimerButtons();
}

function resetTimer() {
    pauseTimer();
    state.timer.remaining = state.timer.duration;
    state.timer.isBreak = false;
    updateTimerDisplay();
    document.getElementById('timerLabel').textContent = 'Focus Time';
}

function setTimerDuration(mins, isBreak = false) {
    pauseTimer();
    state.timer.duration = mins * 60;
    state.timer.remaining = mins * 60;
    state.timer.isBreak = isBreak;
    updateTimerDisplay();
    document.getElementById('timerLabel').textContent = isBreak ? 'Break Time' : 'Focus Time';
}

function updateTimerDisplay() {
    const m = Math.floor(state.timer.remaining / 60);
    const s = state.timer.remaining % 60;
    const display = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    
    document.getElementById('timerTime').textContent = display;
    document.getElementById('miniTime').textContent = display;
    document.title = `${display} - FocusFlow`;
    
    // Update progress rings
    const progress = 1 - (state.timer.remaining / state.timer.duration);
    const mainRing = document.getElementById('timerProgress');
    const miniRing = document.getElementById('miniProgress');
    
    if (mainRing) mainRing.style.strokeDashoffset = 565 * (1 - progress);
    if (miniRing) miniRing.style.strokeDashoffset = 283 * (1 - progress);
}

function updateTimerButtons() {
    const startBtn = document.getElementById('timerStartBtn');
    const pauseBtn = document.getElementById('timerPauseBtn');
    const miniBtn = document.getElementById('miniStartBtn');
    
    if (state.timer.running) {
        if (startBtn) startBtn.style.display = 'none';
        if (pauseBtn) pauseBtn.style.display = 'inline-flex';
        if (miniBtn) miniBtn.textContent = '⏸ Pause';
    } else {
        if (startBtn) startBtn.style.display = 'inline-flex';
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (miniBtn) miniBtn.textContent = '▶ Start';
    }
}

function completeSession() {
    pauseTimer();
    
    if (!state.timer.isBreak) {
        state.timer.sessions++;
        state.rewards.points += 50;
        addSessionHistory();
        showCelebration();
        toast('Session Complete!', 'You earned 50 points! 🎉', 'success');
        
        // Award first session badge
        if (!state.rewards.badges.includes('first-session')) {
            state.rewards.badges.push('first-session');
            toast('New Badge!', 'You earned First Focus! 🌟', 'success');
        }
        
        // Switch to break
        setTimerDuration(5, true);
    } else {
        setTimerDuration(25, false);
        toast('Break Over', 'Ready for another focus session? 💪', 'info');
    }
    
    playNotificationSound();
    saveState();
    updateUI();
}

function addSessionHistory() {
    const history = document.getElementById('sessionHistory');
    if (!history) return;
    
    const empty = history.querySelector('.empty-msg');
    if (empty) empty.remove();
    
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = 'task-item';
    div.innerHTML = `<span>Focus (${Math.round(state.timer.duration / 60)} min)</span><span style="margin-left:auto;color:var(--text-muted)">${time}</span>`;
    history.insertBefore(div, history.firstChild);
}

// ============================================
// NOTES
// ============================================
let editingNoteId = null;

function openNoteModal(note = null) {
    editingNoteId = note?.id || null;
    document.getElementById('noteTitle').value = note?.title || '';
    document.getElementById('noteContent').value = note?.content || '';
    document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('active'));
    document.querySelector(`.color-opt[data-color="${note?.color || '#fef3c7'}"]`)?.classList.add('active') 
        || document.querySelector('.color-opt')?.classList.add('active');
    openModal('noteModal');
}

function saveNote(e) {
    e.preventDefault();
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const colorOpt = document.querySelector('.color-opt.active');
    const color = colorOpt?.dataset.color || '#fef3c7';
    
    if (!title && !content) {
        toast('Empty Note', 'Please add some content.', 'warning');
        return;
    }
    
    if (editingNoteId) {
        const note = state.notes.find(n => n.id === editingNoteId);
        if (note) {
            note.title = title || 'Untitled';
            note.content = content;
            note.color = color;
            note.updatedAt = new Date().toISOString();
        }
    } else {
        state.notes.unshift({
            id: Date.now().toString(),
            title: title || 'Untitled',
            content,
            color,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        state.rewards.points += 10;
    }
    
    saveState();
    renderNotes();
    closeModals();
    toast('Saved', 'Note saved successfully! 📝', 'success');
}

function renderNotes() {
    const grid = document.getElementById('notesGrid');
    if (!grid) return;
    
    if (state.notes.length === 0) {
        grid.innerHTML = `<div class="empty-state"><span class="empty-icon">📝</span><h3>No notes yet</h3><p>Click "New Note" to create one</p></div>`;
        return;
    }
    
    grid.innerHTML = state.notes.map(n => `
        <div class="note-card" data-id="${n.id}" style="border-top-color: ${n.color}">
            <h4>${escapeHtml(n.title)}</h4>
            <p>${escapeHtml(n.content).substring(0, 100)}${n.content.length > 100 ? '...' : ''}</p>
            <div class="note-card-footer">
                <span>${formatDate(n.updatedAt)}</span>
                <button class="btn small ghost note-delete" onclick="event.stopPropagation(); deleteNote('${n.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
    
    grid.querySelectorAll('.note-card').forEach(card => {
        card.addEventListener('click', () => {
            const note = state.notes.find(n => n.id === card.dataset.id);
            if (note) openNoteModal(note);
        });
    });
}

function deleteNote(id) {
    if (confirm('Delete this note?')) {
        state.notes = state.notes.filter(n => n.id !== id);
        saveState();
        renderNotes();
        toast('Deleted', 'Note removed.', 'info');
    }
}

function filterNotes(e) {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.note-card').forEach(card => {
        const match = card.textContent.toLowerCase().includes(q);
        card.style.display = match ? '' : 'none';
    });
}

function exportNotes() {
    if (state.notes.length === 0) {
        toast('No Notes', 'Nothing to export.', 'warning');
        return;
    }
    const text = state.notes.map(n => `# ${n.title}\n\n${n.content}\n\n---\n`).join('\n');
    downloadFile('focusflow-notes.md', text, 'text/markdown');
    toast('Exported', 'Notes downloaded!', 'success');
}

// ============================================
// TASKS
// ============================================
function saveTask(e) {
    e.preventDefault();
    const title = document.getElementById('taskInput').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const date = document.getElementById('taskDate').value;
    
    if (!title) {
        toast('Missing Title', 'Please enter a task.', 'warning');
        return;
    }
    
    state.tasks.push({
        id: Date.now().toString(),
        title,
        priority,
        date,
        completed: false
    });
    
    saveState();
    renderTasks();
    closeModals();
    document.getElementById('taskInput').value = '';
    toast('Added', 'Task added! 📋', 'success');
}

function renderTasks() {
    const list = document.getElementById('tasksList');
    if (!list) return;
    
    if (state.tasks.length === 0) {
        list.innerHTML = '<p class="empty-msg">No tasks yet</p>';
        updateProgressStats();
        return;
    }
    
    const sorted = [...state.tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
    });
    
    list.innerHTML = sorted.map(t => `
        <div class="task-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
            <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask('${t.id}')">
            <span>${escapeHtml(t.title)}</span>
            <span class="task-priority ${t.priority}">${t.priority}</span>
        </div>
    `).join('');
    
    updateProgressStats();
}

function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        if (task.completed) {
            state.rewards.points += 20;
            toast('Done!', 'Task completed! +20 points ✅', 'success');
        }
        saveState();
        renderTasks();
        updateUI();
    }
}

// ============================================
// CALENDAR
// ============================================
let calendarDate = new Date();

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthDisplay = document.getElementById('currentMonthDisplay');
    if (!grid) return;
    
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    monthDisplay.textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const prevMonth = new Date(year, month, 0);
    const today = new Date();
    
    let html = '';
    
    // Previous month
    for (let i = startPad - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${prevMonth.getDate() - i}</div>`;
    }
    
    // Current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const hasEvent = state.events.some(e => e.date === dateStr);
        html += `<div class="calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}" data-date="${dateStr}">${day}</div>`;
    }
    
    // Next month
    const remaining = 42 - (startPad + lastDay.getDate());
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="calendar-day other-month">${i}</div>`;
    }
    
    grid.innerHTML = html;
    renderEvents();
}

function navCalendar(dir) {
    calendarDate.setMonth(calendarDate.getMonth() + dir);
    renderCalendar();
}

function addEvent(e) {
    e.preventDefault();
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const category = document.getElementById('eventCategory').value;
    
    if (!title || !date) {
        toast('Missing Info', 'Please enter title and date.', 'warning');
        return;
    }
    
    state.events.push({ id: Date.now().toString(), title, date, time, category });
    saveState();
    renderCalendar();
    
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDate').value = '';
    document.getElementById('eventTime').value = '';
    toast('Added', 'Event scheduled! 📅', 'success');
}

function renderEvents() {
    const list = document.getElementById('eventsList');
    if (!list) return;
    
    const upcoming = state.events
        .filter(e => new Date(e.date) >= new Date().setHours(0, 0, 0, 0))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
    
    if (upcoming.length === 0) {
        list.innerHTML = '<p class="empty-msg">No upcoming events</p>';
        return;
    }
    
    const icons = { exam: '📚', assignment: '📝', study: '📖', reminder: '⏰' };
    list.innerHTML = upcoming.map(e => `
        <div class="event-item">
            <span>${icons[e.category] || '📌'}</span>
            <div class="event-details">
                <div class="event-title">${escapeHtml(e.title)}</div>
                <div class="event-date">${formatDate(e.date)} ${e.time || ''}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// SOUNDS
// ============================================
function initAudioContext() {
    if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function createNoise(type) {
    initAudioContext();
    const bufferSize = 2 * state.audioCtx.sampleRate;
    const buffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    if (type === 'white') {
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === 'pink') {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
    } else if (type === 'brown') {
        let last = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (last + 0.02 * white) / 1.02;
            last = data[i];
            data[i] *= 3.5;
        }
    }
    
    const source = state.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const gain = state.audioCtx.createGain();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(state.audioCtx.destination);
    
    return { source, gain };
}

function toggleSound(type) {
    initAudioContext();
    const btn = document.querySelector(`.channel-btn[data-sound="${type}"]`);
    
    if (state.sounds[type].on) {
        if (state.audioNodes[type]) {
            state.audioNodes[type].gain.gain.setTargetAtTime(0, state.audioCtx.currentTime, 0.1);
            setTimeout(() => {
                state.audioNodes[type].source.stop();
                delete state.audioNodes[type];
            }, 200);
        }
        state.sounds[type].on = false;
        btn.textContent = '▶';
        btn.classList.remove('active');
    } else {
        const nodes = createNoise(type);
        nodes.source.start();
        nodes.gain.gain.setTargetAtTime(state.sounds[type].vol, state.audioCtx.currentTime, 0.1);
        state.audioNodes[type] = nodes;
        state.sounds[type].on = true;
        btn.textContent = '⏸';
        btn.classList.add('active');
    }
}

function setVolume(type, vol) {
    state.sounds[type].vol = vol;
    if (state.audioNodes[type]) {
        state.audioNodes[type].gain.gain.setTargetAtTime(vol, state.audioCtx.currentTime, 0.1);
    }
}

function applySoundPreset(preset) {
    stopAllSounds();
    const presets = {
        deepFocus: { white: 0.3, brown: 0.2 },
        nature: { brown: 0.4 },
        rain: { pink: 0.4, brown: 0.2 },
        cafe: { white: 0.2, pink: 0.3 }
    };
    
    const config = presets[preset];
    if (config) {
        Object.entries(config).forEach(([type, vol]) => {
            state.sounds[type].vol = vol;
            const slider = document.querySelector(`.volume-slider[data-sound="${type}"]`);
            if (slider) slider.value = vol * 100;
            toggleSound(type);
        });
    }
    
    document.querySelectorAll('.preset-card').forEach(c => c.classList.toggle('active', c.dataset.preset === preset));
}

function stopAllSounds() {
    Object.keys(state.sounds).forEach(type => {
        if (state.sounds[type].on) toggleSound(type);
    });
    document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
}

// ============================================
// TTS
// ============================================
function populateVoices() {
    const select = document.getElementById('ttsVoice');
    if (!select) return;
    
    const load = () => {
        const voices = speechSynthesis.getVoices();
        select.innerHTML = voices.map((v, i) => `<option value="${i}">${v.name} (${v.lang})</option>`).join('');
    };
    load();
    speechSynthesis.onvoiceschanged = load;
}

function playTTS() {
    const text = document.getElementById('ttsText').value.trim();
    if (!text) {
        toast('No Text', 'Please enter text to read.', 'warning');
        return;
    }
    
    if (speechSynthesis.paused) {
        speechSynthesis.resume();
        state.tts.playing = true;
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices[document.getElementById('ttsVoice').value];
    utterance.rate = parseFloat(document.getElementById('ttsSpeed').value);
    utterance.pitch = parseFloat(document.getElementById('ttsPitch').value);
    
    const highlight = document.getElementById('ttsHighlight');
    const words = text.split(/\s+/);
    let idx = 0;
    
    utterance.onboundary = e => {
        if (e.name === 'word' && highlight) {
            highlight.innerHTML = words.map((w, i) => 
                i === idx ? `<span class="current-word">${w}</span>` : w
            ).join(' ');
            idx++;
        }
    };
    
    utterance.onend = () => {
        state.tts.playing = false;
        if (highlight) highlight.innerHTML = text;
    };
    
    speechSynthesis.speak(utterance);
    state.tts.playing = true;
    if (highlight) highlight.innerHTML = text;
}

function pauseTTS() {
    if (speechSynthesis.speaking) {
        speechSynthesis.pause();
        state.tts.playing = false;
    }
}

function stopTTS() {
    speechSynthesis.cancel();
    state.tts.playing = false;
}

function handleTTSFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('ttsFileName').textContent = file.name;
    const reader = new FileReader();
    reader.onload = ev => document.getElementById('ttsText').value = ev.target.result;
    reader.readAsText(file);
}

// ============================================
// AI CHAT
// ============================================
function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    
    addChatBubble(msg, true);
    input.value = '';
    
    setTimeout(() => {
        const response = generateResponse(msg);
        addChatBubble(response, false);
    }, 500);
}

function addChatBubble(text, isUser) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `message ${isUser ? 'user' : 'bot'}`;
    div.innerHTML = `<span class="avatar">${isUser ? '👤' : '🤖'}</span><div class="bubble"><p>${escapeHtml(text)}</p></div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function generateResponse(msg) {
    const lower = msg.toLowerCase();
    if (lower.includes('motivat') || lower.includes('can\'t') || lower.includes('help')) {
        return aiResponses.motivate[Math.floor(Math.random() * aiResponses.motivate.length)];
    }
    if (lower.includes('break') || lower.includes('tired') || lower.includes('rest')) {
        return aiResponses.breakTime[Math.floor(Math.random() * aiResponses.breakTime.length)];
    }
    if (lower.includes('tip') || lower.includes('advice') || lower.includes('study')) {
        return aiResponses.studyTip[Math.floor(Math.random() * aiResponses.studyTip.length)];
    }
    if (lower.includes('pomodoro')) {
        return aiResponses.pomodoro[0];
    }
    return aiResponses.motivate[Math.floor(Math.random() * aiResponses.motivate.length)];
}

function handleQuickAction(action) {
    const responses = aiResponses[action];
    if (responses) {
        addChatBubble(responses[Math.floor(Math.random() * responses.length)], false);
    }
}

// ============================================
// CANVAS
// ============================================
let canvas, ctx;

function initCanvas() {
    canvas = document.getElementById('sketchCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    
    canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(getTouchPos(e)); });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); draw(getTouchPos(e)); });
    canvas.addEventListener('touchend', endDraw);
    
    saveCanvasState();
}

function resizeCanvas() {
    if (!canvas) return;
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    restoreCanvasState();
}

function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { offsetX: e.touches[0].clientX - rect.left, offsetY: e.touches[0].clientY - rect.top };
}

function startDraw(e) {
    state.canvas.drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
}

function draw(e) {
    if (!state.canvas.drawing) return;
    
    if (state.canvas.tool === 'pen') {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = state.canvas.color;
        ctx.lineWidth = state.canvas.size;
        ctx.lineCap = 'round';
        ctx.stroke();
    } else if (state.canvas.tool === 'eraser') {
        ctx.clearRect(e.offsetX - state.canvas.size * 2, e.offsetY - state.canvas.size * 2, state.canvas.size * 4, state.canvas.size * 4);
    }
}

function endDraw() {
    if (state.canvas.drawing) {
        state.canvas.drawing = false;
        saveCanvasState();
    }
}

function saveCanvasState() {
    if (!canvas) return;
    state.canvas.history = state.canvas.history.slice(0, state.canvas.historyIdx + 1);
    state.canvas.history.push(canvas.toDataURL());
    state.canvas.historyIdx++;
    if (state.canvas.history.length > 20) {
        state.canvas.history.shift();
        state.canvas.historyIdx--;
    }
}

function restoreCanvasState() {
    if (!canvas || state.canvas.history.length === 0) return;
    const img = new Image();
    img.src = state.canvas.history[state.canvas.historyIdx];
    img.onload = () => ctx.drawImage(img, 0, 0);
}

function undoCanvas() {
    if (state.canvas.historyIdx > 0) {
        state.canvas.historyIdx--;
        restoreCanvasState();
    }
}

function redoCanvas() {
    if (state.canvas.historyIdx < state.canvas.history.length - 1) {
        state.canvas.historyIdx++;
        restoreCanvasState();
    }
}

function clearCanvas() {
    if (confirm('Clear canvas?')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveCanvasState();
    }
}

function downloadCanvas() {
    const link = document.createElement('a');
    link.download = 'focusflow-sketch.png';
    link.href = canvas.toDataURL();
    link.click();
    toast('Saved', 'Sketch downloaded!', 'success');
}

// ============================================
// BREAKS
// ============================================
let breathInterval, stretchInterval, eyeInterval;

function toggleBreathing() {
    const btn = document.getElementById('breathingBtn');
    const circle = document.getElementById('breathCircle');
    const text = document.getElementById('breathText');
    
    if (state.breaks.breathing) {
        state.breaks.breathing = false;
        clearInterval(breathInterval);
        btn.textContent = 'Start';
        circle.classList.remove('inhale', 'exhale');
        text.textContent = 'Ready';
        return;
    }
    
    state.breaks.breathing = true;
    btn.textContent = 'Stop';
    
    const breathe = () => {
        // Inhale 4s
        circle.classList.add('inhale');
        circle.classList.remove('exhale');
        text.textContent = 'Breathe In...';
        
        setTimeout(() => {
            if (!state.breaks.breathing) return;
            text.textContent = 'Hold...';
            
            setTimeout(() => {
                if (!state.breaks.breathing) return;
                circle.classList.remove('inhale');
                circle.classList.add('exhale');
                text.textContent = 'Breathe Out...';
                
                setTimeout(() => {
                    if (state.breaks.breathing) breathe();
                }, 8000);
            }, 7000);
        }, 4000);
    };
    breathe();
}

function toggleStretching() {
    const btn = document.getElementById('stretchBtn');
    const emoji = document.getElementById('stretchEmoji');
    const text = document.getElementById('stretchText');
    
    if (state.breaks.stretching) {
        state.breaks.stretching = false;
        clearInterval(stretchInterval);
        btn.textContent = 'Start';
        return;
    }
    
    state.breaks.stretching = true;
    btn.textContent = 'Stop';
    let idx = 0;
    
    const show = () => {
        const s = stretches[idx % stretches.length];
        emoji.textContent = s.emoji;
        text.textContent = s.text;
        idx++;
    };
    show();
    stretchInterval = setInterval(show, 10000);
}

function toggleEyeRest() {
    const btn = document.getElementById('eyeBtn');
    const timer = document.getElementById('eyeTimer');
    const text = document.getElementById('eyeText');
    
    if (state.breaks.eyeRest) {
        state.breaks.eyeRest = false;
        clearInterval(eyeInterval);
        btn.textContent = 'Start';
        timer.textContent = '20';
        return;
    }
    
    state.breaks.eyeRest = true;
    btn.textContent = 'Stop';
    let secs = 20;
    
    const tick = () => {
        timer.textContent = secs;
        if (secs <= 0) {
            state.breaks.eyeRest = false;
            clearInterval(eyeInterval);
            btn.textContent = 'Start';
            text.textContent = 'Great! Eyes refreshed 👀';
            toast('Done!', '20-20-20 complete!', 'success');
            return;
        }
        secs--;
    };
    text.textContent = 'Look 20 feet away...';
    eyeInterval = setInterval(tick, 1000);
}

function handleGrounding() {
    const btn = document.getElementById('groundingBtn');
    const text = document.getElementById('groundingText');
    const dots = document.querySelectorAll('#groundingDots .dot');
    
    if (!state.breaks.grounding.active) {
        state.breaks.grounding.active = true;
        state.breaks.grounding.step = 0;
        btn.textContent = 'Next';
    }
    
    const step = groundingSteps[state.breaks.grounding.step];
    text.textContent = step.text;
    
    dots.forEach((d, i) => {
        d.classList.remove('active', 'completed');
        if (i < state.breaks.grounding.step) d.classList.add('completed');
        else if (i === state.breaks.grounding.step) d.classList.add('active');
    });
    
    state.breaks.grounding.step++;
    
    if (state.breaks.grounding.step > groundingSteps.length) {
        state.breaks.grounding.active = false;
        state.breaks.grounding.step = 0;
        btn.textContent = 'Start';
        text.textContent = 'You are grounded 🌿';
        dots.forEach(d => d.classList.add('completed'));
        toast('Done!', 'Grounding complete!', 'success');
    }
}

function logWater() {
    if (state.hydration < 8) {
        state.hydration++;
        updateHydrationDisplay();
        saveState();
        if (state.hydration >= 8) {
            toast('Goal!', 'Hydration goal reached! 💧', 'success');
            if (!state.rewards.badges.includes('hydration')) {
                state.rewards.badges.push('hydration');
            }
        }
    }
}

function setHydration(n) {
    state.hydration = n;
    updateHydrationDisplay();
    saveState();
}

function updateHydrationDisplay() {
    document.querySelectorAll('.glass').forEach((g, i) => {
        g.classList.toggle('filled', i < state.hydration);
    });
    const count = document.getElementById('glassCount');
    if (count) count.textContent = state.hydration;
}

// ============================================
// UI HELPERS
// ============================================
function updateUI() {
    document.getElementById('streakCount').textContent = state.rewards.streak;
    document.getElementById('pointsCount').textContent = state.rewards.points;
    document.getElementById('sessionsToday').textContent = state.timer.sessions;
    document.getElementById('sessionCountDisplay').textContent = state.timer.sessions;
    updateProgressStats();
}

function updateProgressStats() {
    const focusHours = document.getElementById('focusHours');
    const tasksCompleted = document.getElementById('tasksCompleted');
    
    if (focusHours) {
        const hours = Math.floor((state.timer.sessions * 25) / 60);
        focusHours.textContent = hours + 'h';
    }
    
    if (tasksCompleted) {
        tasksCompleted.textContent = state.tasks.filter(t => t.completed).length;
    }
}

function showRandomTip() {
    const tip = tips[Math.floor(Math.random() * tips.length)];
    document.getElementById('tipText').textContent = tip;
}

function toggleBuddy() {
    const dot = document.getElementById('buddyDot');
    const msg = document.getElementById('buddyMessage');
    const btn = document.getElementById('buddyBtn');
    
    if (state.buddy.active) {
        state.buddy.active = false;
        clearInterval(state.buddy.timer);
        dot.classList.remove('online');
        btn.textContent = 'Find Buddy';
        msg.textContent = 'Start a focus session together!';
    } else {
        state.buddy.active = true;
        dot.classList.add('online');
        btn.textContent = 'End Session';
        
        const msgs = ['You\'re doing great! 💪', 'Stay focused! 🎯', 'Keep going! 🌟', 'Almost there! 🚀'];
        let i = 0;
        msg.textContent = msgs[0];
        state.buddy.timer = setInterval(() => {
            i = (i + 1) % msgs.length;
            msg.textContent = msgs[i];
        }, 30000);
    }
}

function checkStreak() {
    const today = new Date().toDateString();
    if (state.rewards.lastActive) {
        const last = new Date(state.rewards.lastActive);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (last.toDateString() === yesterday.toDateString()) {
            state.rewards.streak++;
        } else if (last.toDateString() !== today) {
            state.rewards.streak = 1;
        }
    } else {
        state.rewards.streak = 1;
    }
    state.rewards.lastActive = today;
    saveState();
}

// ============================================
// MODALS & NOTIFICATIONS
// ============================================
function openModal(id) {
    document.getElementById(id)?.classList.add('show');
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show'));
}

function showCelebration() {
    document.getElementById('celebrationModal')?.classList.add('show');
    setTimeout(() => document.getElementById('celebrationModal')?.classList.remove('show'), 4000);
}

function toast(title, message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span class="toast-icon">${icons[type]}</span><div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div>`;
    container.appendChild(t);
    
    setTimeout(() => {
        t.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => t.remove(), 300);
    }, 4000);
}

function playNotificationSound() {
    try {
        const audio = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.1, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + 0.5);
        osc.start();
        osc.stop(audio.currentTime + 0.5);
    } catch (e) {}
}

// ============================================
// SETTINGS
// ============================================
function setTheme(theme) {
    state.settings.theme = theme;
    applySettings();
    saveState();
}

// ============================================
// KEYBOARD
// ============================================
function handleKeyboard(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch (e.key) {
        case ' ': e.preventDefault(); state.timer.running ? pauseTimer() : startTimer(); break;
        case 'n': case 'N': openNoteModal(); break;
        case 'd': case 'D': showSection('dashboard'); break;
        case 't': case 'T': showSection('timer'); break;
        case 'Escape': closeModals(); break;
    }
}

// ============================================
// UTILITIES
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}

// Global functions for inline handlers
window.deleteNote = deleteNote;
window.toggleTask = toggleTask;
