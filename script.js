/* Focus - Complete JavaScript Application */

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
    canvas: { tool: 'pen', color: '#667eea', size: 3, drawing: false, history: [], historyIdx: -1, startX: 0, startY: 0, snapshot: null },
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
        const saved = localStorage.getItem('focus');
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
    localStorage.setItem('focus', JSON.stringify({
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
        ai: 'AI Study Assistant', canvas: 'Quick Sketch', breaks: 'Sensory Breaks',
        resources: 'External Resources'
    }[id] || 'Focus';

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
    document.title = `${display} - Focus`;
    
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
    downloadFile('focus-notes.md', text, 'text/markdown');
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
        const dayEvents = state.events.filter(e => e.date === dateStr);
        const hasEvent = dayEvents.length > 0;
        
        let eventPreview = '';
        if (dayEvents.length > 0) {
            const firstEvent = dayEvents[0];
            const icons = { exam: '📚', assignment: '📝', study: '📖', reminder: '⏰' };
            eventPreview = `<span class="event-preview" title="${escapeHtml(firstEvent.title)}">${icons[firstEvent.category] || '📌'}</span>`;
        }
        
        html += `<div class="calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}" data-date="${dateStr}">
            <span class="day-number">${day}</span>
            ${eventPreview}
        </div>`;
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
    list.innerHTML = upcoming.map(e => {
        const eventDate = new Date(e.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        return `
        <div class="event-item">
            <span>${icons[e.category] || '📌'}</span>
            <div class="event-details">
                <div class="event-title">${escapeHtml(e.title)}</div>
                <div class="event-date">${formattedDate} ${e.time ? 'at ' + e.time : ''}</div>
            </div>
        </div>
    `}).join('');
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

// Configuration
const AI_CONFIG = {
    // Change this to your Vercel deployment URL once deployed
    // For local development, use: 'http://localhost:3000/api/chat'
    // For production, use: 'https://your-app.vercel.app/api/chat'
    API_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api/chat'
        : '/api/chat', // Uses relative URL for same domain
    
    // Set to true to use real AI, false to use fallback responses
    USE_AI: true,
    
    // Maximum conversation history to send (to manage token costs)
    MAX_HISTORY: 6
};

// Store conversation history
let conversationHistory = [];

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    
    addChatBubble(msg, true);
    input.value = '';
    
    // Add to conversation history
    conversationHistory.push({ role: 'user', content: msg });
    
    // Add typing indicator
    const typingDiv = addTypingIndicator();
    
    if (AI_CONFIG.USE_AI) {
        await sendAIMessage(msg, typingDiv);
    } else {
        // Fallback to rule-based responses
        setTimeout(() => {
            const response = generateResponse(msg);
            typingDiv.remove();
            addChatBubble(response, false);
            conversationHistory.push({ role: 'assistant', content: response });
        }, 500);
    }
}

async function sendAIMessage(message, typingDiv) {
    try {
        const response = await fetch(AI_CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                conversationHistory: conversationHistory.slice(-AI_CONFIG.MAX_HISTORY)
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        
        const data = await response.json();
        typingDiv.remove();
        
        const aiResponse = data.response;
        addChatBubble(aiResponse, false);
        
        // Add to conversation history
        conversationHistory.push({ role: 'assistant', content: aiResponse });
        
        // Keep history manageable
        if (conversationHistory.length > AI_CONFIG.MAX_HISTORY * 2) {
            conversationHistory = conversationHistory.slice(-AI_CONFIG.MAX_HISTORY * 2);
        }
        
    } catch (error) {
        console.error('AI Chat Error:', error);
        typingDiv.remove();
        
        // Show user-friendly error message
        let errorMessage = '😅 Oops! I had trouble connecting. ';
        
        if (error.message.includes('API key')) {
            errorMessage += 'The AI service needs to be configured. Using offline mode for now!';
            // Fall back to rule-based response
            const fallbackResponse = generateResponse(message);
            addChatBubble(errorMessage, false);
            setTimeout(() => addChatBubble(fallbackResponse, false), 1000);
        } else if (error.message.includes('Rate limit')) {
            errorMessage += 'Too many requests. Please wait a moment and try again.';
            addChatBubble(errorMessage, false);
        } else {
            errorMessage += 'Please check your internet connection and try again.';
            addChatBubble(errorMessage, false);
        }
    }
}

function addTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'message bot typing';
    div.innerHTML = `<span class="avatar">🤖</span><div class="bubble typing-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

function addChatBubble(text, isUser) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `message ${isUser ? 'user' : 'bot'}`;
    
    // Use parseMarkdown for bot messages to render formatting, escapeHtml for user messages
    const formattedText = isUser ? escapeHtml(text) : parseMarkdown(text);
    
    div.innerHTML = `<span class="avatar">${isUser ? '👤' : '🤖'}</span><div class="bubble"><p>${formattedText}</p></div>`;
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
    
    // Save initial blank state after a brief delay to ensure canvas is ready
    setTimeout(() => {
        if (state.canvas.history.length === 0) {
            saveCanvasState();
        }
        updateCanvasButtons();
    }, 100);
    
    window.addEventListener('resize', resizeCanvas);
    
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    
    canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(getTouchPos(e)); });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); draw(getTouchPos(e)); });
    canvas.addEventListener('touchend', endDraw);
}

function resizeCanvas() {
    if (!canvas) return;
    const container = canvas.parentElement;
    
    // Save current content if canvas has been initialized
    const currentImage = state.canvas.history.length > 0 && state.canvas.historyIdx >= 0 
        ? state.canvas.history[state.canvas.historyIdx]
        : null;
    
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    
    // Restore the saved content
    if (currentImage) {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = currentImage;
    }
}

function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return { 
        offsetX: touch.clientX - rect.left, 
        offsetY: touch.clientY - rect.top,
        pageX: touch.clientX,
        pageY: touch.clientY
    };
}

function startDraw(e) {
    const x = e.offsetX !== undefined ? e.offsetX : e.pageX - canvas.offsetLeft;
    const y = e.offsetY !== undefined ? e.offsetY : e.pageY - canvas.offsetTop;
    
    state.canvas.drawing = true;
    state.canvas.startX = x;
    state.canvas.startY = y;
    
    // For shapes and text, save the current canvas state
    if (['line', 'rect', 'circle', 'text'].includes(state.canvas.tool)) {
        state.canvas.snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    
    // For text tool, show prompt
    if (state.canvas.tool === 'text') {
        const text = prompt('Enter text:');
        if (text) {
            ctx.font = `${state.canvas.size * 6}px Inter, sans-serif`;
            ctx.fillStyle = state.canvas.color;
            ctx.textBaseline = 'top';
            ctx.fillText(text, x, y);
            saveCanvasState();
        }
        state.canvas.drawing = false;
        return;
    }
    
    // For pen tool, begin path
    if (state.canvas.tool === 'pen') {
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
}

function draw(e) {
    if (!state.canvas.drawing) return;
    
    const x = e.offsetX !== undefined ? e.offsetX : e.pageX - canvas.offsetLeft;
    const y = e.offsetY !== undefined ? e.offsetY : e.pageY - canvas.offsetTop;
    
    if (state.canvas.tool === 'pen') {
        ctx.lineTo(x, y);
        ctx.strokeStyle = state.canvas.color;
        ctx.lineWidth = state.canvas.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    } 
    else if (state.canvas.tool === 'eraser') {
        ctx.clearRect(x - state.canvas.size * 2, y - state.canvas.size * 2, state.canvas.size * 4, state.canvas.size * 4);
    }
    else if (state.canvas.tool === 'line') {
        // Restore snapshot and draw new line
        ctx.putImageData(state.canvas.snapshot, 0, 0);
        ctx.beginPath();
        ctx.moveTo(state.canvas.startX, state.canvas.startY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = state.canvas.color;
        ctx.lineWidth = state.canvas.size;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
    else if (state.canvas.tool === 'rect') {
        // Restore snapshot and draw new rectangle
        ctx.putImageData(state.canvas.snapshot, 0, 0);
        const width = x - state.canvas.startX;
        const height = y - state.canvas.startY;
        ctx.strokeStyle = state.canvas.color;
        ctx.lineWidth = state.canvas.size;
        ctx.strokeRect(state.canvas.startX, state.canvas.startY, width, height);
    }
    else if (state.canvas.tool === 'circle') {
        // Restore snapshot and draw new circle
        ctx.putImageData(state.canvas.snapshot, 0, 0);
        const radius = Math.sqrt(
            Math.pow(x - state.canvas.startX, 2) + 
            Math.pow(y - state.canvas.startY, 2)
        );
        ctx.beginPath();
        ctx.arc(state.canvas.startX, state.canvas.startY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = state.canvas.color;
        ctx.lineWidth = state.canvas.size;
        ctx.stroke();
    }
}

function endDraw() {
    if (state.canvas.drawing) {
        state.canvas.drawing = false;
        
        // For shapes, the final state is already on the canvas from the last draw() call
        // Save after a tiny delay to ensure canvas has fully rendered
        setTimeout(() => {
            saveCanvasState();
        }, 10);
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
    updateCanvasButtons();
}

function restoreCanvasState() {
    if (!canvas || state.canvas.history.length === 0 || state.canvas.historyIdx < 0) return;
    
    const dataURL = state.canvas.history[state.canvas.historyIdx];
    if (!dataURL) return;
    
    const img = new Image();
    img.onload = () => {
        // Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw the image at full canvas size
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.onerror = () => {
        console.error('Failed to load canvas state image');
    };
    img.src = dataURL;
}

function undoCanvas() {
    if (state.canvas.historyIdx > 0) {
        state.canvas.historyIdx--;
        restoreCanvasState();
        updateCanvasButtons();
    }
}

function redoCanvas() {
    if (state.canvas.historyIdx < state.canvas.history.length - 1) {
        state.canvas.historyIdx++;
        restoreCanvasState();
        updateCanvasButtons();
    }
}

function updateCanvasButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
        undoBtn.disabled = state.canvas.historyIdx <= 0;
        undoBtn.style.opacity = state.canvas.historyIdx <= 0 ? '0.5' : '1';
    }
    
    if (redoBtn) {
        redoBtn.disabled = state.canvas.historyIdx >= state.canvas.history.length - 1;
        redoBtn.style.opacity = state.canvas.historyIdx >= state.canvas.history.length - 1 ? '0.5' : '1';
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
    link.download = 'focus-sketch.png';
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

function parseMarkdown(text) {
    // First escape HTML to prevent XSS attacks
    let html = escapeHtml(text);
    
    // Convert markdown formatting to HTML
    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Code: `code`
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    
    // Line breaks: preserve newlines
    html = html.replace(/\n/g, '<br>');
    
    // Emoji support (already works, but ensure spacing)
    html = html.replace(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu, ' $1 ');
    html = html.replace(/\s+/g, ' '); // Clean up extra spaces
    
    return html;
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

// ============================================
// BODY DOUBLING FUNCTIONALITY
// ============================================

const bodyDoubling = {
    peer: null,
    currentCall: null,
    localStream: null,
    remoteStream: null,
    sessionStartTime: null,
    sessionTimer: null,
    dataConnection: null,
    profile: null,
    
    init() {
        this.loadProfile();
        this.setupEventListeners();
        this.checkProfileStatus();
        this.populateTimezones();
    },
    
    loadProfile() {
        const saved = localStorage.getItem('bdProfile');
        if (saved) {
            this.profile = JSON.parse(saved);
        }
    },
    
    saveProfile(data) {
        this.profile = data;
        localStorage.setItem('bdProfile', JSON.stringify(data));
    },
    
    checkProfileStatus() {
        if (!this.profile) {
            document.getElementById('bdProfileSetup').style.display = 'block';
            document.getElementById('bdMain').style.display = 'none';
        } else {
            document.getElementById('bdProfileSetup').style.display = 'none';
            document.getElementById('bdMain').style.display = 'block';
            this.initializePeer();
            this.loadPartners();
            this.loadSessions();
        }
    },
    
    populateTimezones() {
        const select = document.getElementById('bdTimezone');
        if (!select) return;
        
        const timezones = [
            'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
            'America/Toronto', 'America/Vancouver', 'America/Mexico_City',
            'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
            'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul',
            'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland'
        ];
        
        const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        timezones.forEach(tz => {
            const option = document.createElement('option');
            option.value = tz;
            option.textContent = tz.replace(/_/g, ' ');
            if (tz === userTZ) option.selected = true;
            select.appendChild(option);
        });
    },
    
    setupEventListeners() {
        // Profile creation
        document.getElementById('bdCreateProfile')?.addEventListener('click', () => this.createProfile());
        
        // Tab switching
        document.querySelectorAll('.bd-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Partner actions
        document.getElementById('bdRefreshPartners')?.addEventListener('click', () => this.loadPartners());
        document.getElementById('bdQuickMatch')?.addEventListener('click', () => this.quickMatch());
        document.getElementById('bdScheduleSession')?.addEventListener('click', () => this.scheduleSession());
        
        // Video controls
        document.getElementById('bdToggleMic')?.addEventListener('click', () => this.toggleMic());
        document.getElementById('bdToggleVideo')?.addEventListener('click', () => this.toggleVideo());
        document.getElementById('bdToggleScreen')?.addEventListener('click', () => this.toggleScreen());
        document.getElementById('bdToggleChat')?.addEventListener('click', () => this.toggleChat());
        document.getElementById('bdEndSession')?.addEventListener('click', () => this.endSession());
        document.getElementById('bdCloseChat')?.addEventListener('click', () => this.toggleChat());
        
        // Chat
        document.getElementById('bdSendChat')?.addEventListener('click', () => this.sendChatMessage());
        document.getElementById('bdChatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
    },
    
    createProfile() {
        const name = document.getElementById('bdDisplayName').value.trim();
        const timezone = document.getElementById('bdTimezone').value;
        const sessionLength = document.getElementById('bdSessionLength').value;
        
        if (!name) {
            alert('Please enter a display name');
            return;
        }
        
        const interests = Array.from(document.querySelectorAll('.checkbox-grid input:checked'))
            .map(cb => cb.value);
        
        if (interests.length === 0) {
            alert('Please select at least one interest');
            return;
        }
        
        const profile = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name,
            timezone,
            interests,
            sessionLength: parseInt(sessionLength),
            createdAt: new Date().toISOString(),
            availableNow: false
        };
        
        this.saveProfile(profile);
        this.checkProfileStatus();
    },
    
    initializePeer() {
        if (this.peer) return;
        
        try {
            this.peer = new Peer(this.profile.id, {
                config: {
                    'iceServers': [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });
            
            this.peer.on('open', (id) => {
                console.log('Peer connection opened with ID:', id);
            });
            
            this.peer.on('call', (call) => {
                this.handleIncomingCall(call);
            });
            
            this.peer.on('connection', (conn) => {
                this.dataConnection = conn;
                this.setupDataConnection(conn);
            });
            
            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                alert('Connection error: ' + err.type);
            });
        } catch (err) {
            console.error('Failed to initialize peer:', err);
        }
    },
    
    switchTab(tabName) {
        document.querySelectorAll('.bd-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.bd-tab-content').forEach(c => c.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`bdTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
    },
    
    loadPartners() {
        const grid = document.getElementById('bdPartnersGrid');
        grid.innerHTML = '<div class="bd-empty-state"><span class="empty-icon">👥</span><p>Loading partners...</p></div>';
        
        // Simulate loading partners (in production, this would fetch from a server)
        setTimeout(() => {
            const mockPartners = this.generateMockPartners();
            this.displayPartners(mockPartners);
        }, 1000);
    },
    
    generateMockPartners() {
        const names = ['Alex', 'Jordan', 'Sam', 'Casey', 'Morgan', 'Taylor', 'Riley', 'Avery'];
        const statuses = ['available', 'busy', 'offline'];
        const allInterests = ['math', 'science', 'languages', 'programming', 'arts', 'business', 'writing', 'other'];
        
        return names.map((name, i) => ({
            id: 'partner_' + i,
            name,
            status: statuses[i % 3],
            interests: allInterests.slice(i % 3, (i % 3) + 3),
            timezone: 'EST',
            sessionLength: [25, 50, 90][i % 3]
        }));
    },
    
    displayPartners(partners) {
        const grid = document.getElementById('bdPartnersGrid');
        
        if (partners.length === 0) {
            grid.innerHTML = '<div class="bd-empty-state"><span class="empty-icon">👥</span><p>No partners found. Try adjusting your filters!</p></div>';
            return;
        }
        
        grid.innerHTML = partners.map(partner => `
            <div class="bd-partner-card">
                <div class="bd-partner-header">
                    <span class="bd-partner-name">${partner.name}</span>
                    <span class="bd-partner-status ${partner.status}">${partner.status}</span>
                </div>
                <div class="bd-partner-interests">
                    ${partner.interests.map(interest => `<span class="bd-interest-tag">${interest}</span>`).join('')}
                </div>
                <div class="bd-partner-info">
                    ⏰ ${partner.timezone} • Prefers ${partner.sessionLength}min sessions
                </div>
                <div class="bd-partner-actions">
                    <button class="btn btn-primary" onclick="bodyDoubling.connectToPartner('${partner.id}')" ${partner.status !== 'available' ? 'disabled' : ''}>
                        ${partner.status === 'available' ? '📞 Call Now' : '💬 Message'}
                    </button>
                    <button class="btn btn-secondary" onclick="bodyDoubling.scheduleWithPartner('${partner.id}')">
                        📅 Schedule
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    quickMatch() {
        alert('🔍 Finding you a study partner...\n\nIn a full implementation, this would:\n• Match you with available partners\n• Consider your interests and timezone\n• Start a session immediately\n\nFor now, try selecting a partner from the "Find Partners" tab!');
    },
    
    scheduleSession() {
        const partnerName = prompt('Enter partner name to schedule with:');
        if (!partnerName) return;
        
        const dateTime = prompt('Enter date and time (e.g., "Feb 10, 2026 2:00 PM"):');
        if (!dateTime) return;
        
        const session = {
            id: 'session_' + Date.now(),
            partner: partnerName,
            dateTime,
            duration: this.profile.sessionLength,
            createdAt: new Date().toISOString()
        };
        
        const sessions = JSON.parse(localStorage.getItem('bdSessions') || '[]');
        sessions.push(session);
        localStorage.setItem('bdSessions', JSON.stringify(sessions));
        
        this.loadSessions();
        alert('✅ Session scheduled!');
    },
    
    scheduleWithPartner(partnerId) {
        alert(`📅 Scheduling with partner \${partnerId}...\\n\\nIn production, this would show a calendar picker with the partner's availability.`);
    },
    
    loadSessions() {
        const sessions = JSON.parse(localStorage.getItem('bdSessions') || '[]');
        const container = document.getElementById('bdSessionsList');
        
        if (sessions.length === 0) {
            container.innerHTML = '<div class="bd-empty-state"><span class="empty-icon">📅</span><p>No upcoming sessions. Find a partner or quick match to get started!</p></div>';
            return;
        }
        
        container.innerHTML = sessions.map(session => `
            <div class="bd-session-card">
                <div class="bd-session-header">
                    <span class="bd-session-partner">👤 ${session.partner}</span>
                </div>
                <div class="bd-session-time">📅 ${session.dateTime} • ${session.duration} minutes</div>
                <div class="bd-session-actions">
                    <button class="btn btn-primary" onclick="bodyDoubling.joinSession('${session.id}')">Join Session</button>
                    <button class="btn btn-secondary" onclick="bodyDoubling.cancelSession('${session.id}')">Cancel</button>
                </div>
            </div>
        `).join('');
    },
    
    async connectToPartner(partnerId) {
        try {
            // Get user media
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            // Display local video
            const localVideo = document.getElementById('bdLocalVideo');
            localVideo.srcObject = this.localStream;
            
            // Initiate call
            this.currentCall = this.peer.call(partnerId, this.localStream);
            
            this.currentCall.on('stream', (remoteStream) => {
                this.handleRemoteStream(remoteStream);
            });
            
            this.currentCall.on('close', () => {
                this.endSession();
            });
            
            // Setup data connection for chat
            this.dataConnection = this.peer.connect(partnerId);
            this.setupDataConnection(this.dataConnection);
            
            // Show active session
            this.startSession(partnerId);
            
        } catch (err) {
            console.error('Failed to connect:', err);
            alert('Could not access camera/microphone. Please check permissions.');
        }
    },
    
    async handleIncomingCall(call) {
        const accept = confirm(`Incoming call from a study partner. Accept?`);
        
        if (!accept) {
            call.close();
            return;
        }
        
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            const localVideo = document.getElementById('bdLocalVideo');
            localVideo.srcObject = this.localStream;
            
            call.answer(this.localStream);
            this.currentCall = call;
            
            call.on('stream', (remoteStream) => {
                this.handleRemoteStream(remoteStream);
            });
            
            call.on('close', () => {
                this.endSession();
            });
            
            this.startSession(call.peer);
            
        } catch (err) {
            console.error('Failed to answer call:', err);
            alert('Could not access camera/microphone.');
        }
    },
    
    handleRemoteStream(stream) {
        this.remoteStream = stream;
        const remoteVideo = document.getElementById('bdRemoteVideo');
        remoteVideo.srcObject = stream;
    },
    
    setupDataConnection(conn) {
        conn.on('open', () => {
            console.log('Data connection established');
        });
        
        conn.on('data', (data) => {
            if (data.type === 'chat') {
                this.displayChatMessage(data.message, false);
            }
        });
    },
    
    startSession(partnerId) {
        document.getElementById('bdNoSession').style.display = 'none';
        document.getElementById('bdSessionActive').style.display = 'block';
        document.getElementById('bdPartnerNameOverlay').textContent = partnerId;
        
        // Switch to active session tab
        this.switchTab('active');
        
        // Start timer
        this.sessionStartTime = Date.now();
        this.sessionTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('bdSessionTimer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    },
    
    toggleMic() {
        if (!this.localStream) return;
        
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            const btn = document.getElementById('bdToggleMic');
            btn.classList.toggle('active', audioTrack.enabled);
            btn.querySelector('.control-icon').textContent = audioTrack.enabled ? '🎤' : '🔇';
        }
    },
    
    toggleVideo() {
        if (!this.localStream) return;
        
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            const btn = document.getElementById('bdToggleVideo');
            btn.classList.toggle('active', videoTrack.enabled);
            btn.querySelector('.control-icon').textContent = videoTrack.enabled ? '📹' : '📷';
        }
    },
    
    async toggleScreen() {
        try {
            if (!this.localStream.getVideoTracks()[0].label.includes('screen')) {
                // Start screen sharing
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                
                // Replace video track
                const sender = this.currentCall.peerConnection
                    .getSenders()
                    .find(s => s.track.kind === 'video');
                sender.replaceTrack(screenTrack);
                
                document.getElementById('bdToggleScreen').classList.add('active');
                
                screenTrack.onended = () => {
                    this.toggleScreen(); // Switch back to camera
                };
            } else {
                // Switch back to camera
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const videoTrack = videoStream.getVideoTracks()[0];
                
                const sender = this.currentCall.peerConnection
                    .getSenders()
                    .find(s => s.track.kind === 'video');
                sender.replaceTrack(videoTrack);
                
                document.getElementById('bdToggleScreen').classList.remove('active');
            }
        } catch (err) {
            console.error('Screen sharing error:', err);
            alert('Could not share screen');
        }
    },
    
    toggleChat() {
        const sidebar = document.getElementById('bdChatSidebar');
        sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
    },
    
    sendChatMessage() {
        const input = document.getElementById('bdChatInput');
        const message = input.value.trim();
        
        if (!message || !this.dataConnection) return;
        
        this.dataConnection.send({
            type: 'chat',
            message
        });
        
        this.displayChatMessage(message, true);
        input.value = '';
    },
    
    displayChatMessage(text, isSelf) {
        const container = document.getElementById('bdChatMessages');
        const div = document.createElement('div');
        div.className = `bd-chat-message ${isSelf ? 'self' : 'other'}`;
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },
    
    endSession() {
        if (this.currentCall) {
            this.currentCall.close();
            this.currentCall = null;
        }
        
        if (this.dataConnection) {
            this.dataConnection.close();
            this.dataConnection = null;
        }
        
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
        
        document.getElementById('bdNoSession').style.display = 'block';
        document.getElementById('bdSessionActive').style.display = 'none';
        document.getElementById('bdChatSidebar').style.display = 'none';
        
        // Clear videos
        document.getElementById('bdLocalVideo').srcObject = null;
        document.getElementById('bdRemoteVideo').srcObject = null;
    },
    
    joinSession(sessionId) {
        alert(`Joining session ${sessionId}...\n\nIn production, this would connect you to your scheduled partner.`);
    },
    
    cancelSession(sessionId) {
        const sessions = JSON.parse(localStorage.getItem('bdSessions') || '[]');
        const filtered = sessions.filter(s => s.id !== sessionId);
        localStorage.setItem('bdSessions', JSON.stringify(filtered));
        this.loadSessions();
    }
};

// Initialize body doubling when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    bodyDoubling.init();
});

// Make bodyDoubling accessible globally for inline event handlers
window.bodyDoubling = bodyDoubling;
