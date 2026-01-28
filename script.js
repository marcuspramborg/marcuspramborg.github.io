// KNFC dashboard script (canonical)
// Clean single-file implementation: tool visibility, AI helper (local), pomodoro timer, focus noises, notes/events, TTS basic.

(function () {
    'use strict';

    const $id = id => document.getElementById(id);

    // DOM refs (guarded)
    const toolsSettingsContainer = $id('toolsSettings');
    const timerDisplay = $id('timerDisplay');
    const startTimerBtn = $id('startTimer');
    const pauseTimerBtn = $id('pauseTimer');
    const resetTimerBtn = $id('resetTimer');
    const timerMinutesInput = $id('timerMinutes');
    const pomodoroProgressEl = $id('pomodoroProgress');
    const quickNotesTextarea = $id('quickNotes');
    const clearNotesBtn = $id('clearNotes');
    const saveNotesBtn = $id('saveNotes');
    const calendarGrid = $id('calendarGrid');
    const currentMonthDisplay = $id('currentMonth');
    const prevMonthBtn = $id('prevMonth');
    const nextMonthBtn = $id('nextMonth');
    const eventTitleInput = $id('eventTitle');
    const eventDateInput = $id('eventDate');
    const eventTimeInput = $id('eventTime');
    const addEventBtn = $id('addEvent');
    const eventsContainer = $id('eventsContainer');
    const chatMessages = $id('chatMessages');
    const chatInput = $id('chatInput');
    const sendMessageBtn = $id('sendMessage');
    const periodicTipsCheckbox = $id('periodicTips');
    const playNoiseBtn = $id('playNoise');
    const stopNoiseBtn = $id('stopNoise');
    const noiseVolumeInput = $id('noiseVolume');
    const totalQuestionsInput = $id('totalQuestions');
    const completedQuestionsInput = $id('completedQuestions');
    const progressFill = $id('progressFill');
    const progressText = $id('progressText');
    const drawingCanvas = $id('drawingCanvas');
    const penTool = $id('penTool');
    const eraserTool = $id('eraserTool');
    const lineTool = $id('lineTool');
    const rectangleTool = $id('rectangleTool');
    const circleTool = $id('circleTool');
    const brushSize = $id('brushSize');
    const brushColor = $id('brushColor');
    const clearCanvasBtn = $id('clearCanvas');
    const saveDrawingBtn = $id('saveDrawing');

    const savedNotesContainer = $id('savedNotes');

    const toolCards = Array.from(document.querySelectorAll('.tool-card[data-tool]')) || [];

    // persistence keys
    const KEY_NOTES = 'examTools_quickNotes';
    const KEY_EVENTS = 'examTools_events';
    const KEY_VISIBLE = 'examTools_visible';
    const KEY_PREFER = 'examTools_prefs';

    // timer constants/state
    const POMODORO_R = 50;
    const POMODORO_CIRC = 2 * Math.PI * POMODORO_R;
    let timerInterval = null;
    let isTimerRunning = false;
    let timerDuration = (parseInt(timerMinutesInput?.value, 10) || 25) * 60;
    let timeRemaining = timerDuration;

    // events
    let events = JSON.parse(localStorage.getItem(KEY_EVENTS) || '[]');

    // Drawing state
    let drawingContext = null;
    let isDrawing = false;
    let currentTool = 'pen';
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;

    // Web Audio
    let audioCtx = null;
    let noiseSource = null;
    let noiseGain = null;

    function notify(msg) {
        const n = document.createElement('div');
        n.textContent = msg;
        n.style.cssText = 'position:fixed;top:18px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:8px 12px;border-radius:8px;z-index:9999;font-size:13px;';
        document.body.appendChild(n);
        setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 300); }, 1800);
    }

    // Notes
    function saveNotes() {
        if (!quickNotesTextarea || !savedNotesContainer) return;
        const text = quickNotesTextarea.value.trim();
        if (!text) return;
        let notes = JSON.parse(localStorage.getItem(KEY_NOTES) || '[]');
        notes.push({ text, timestamp: new Date().toISOString() });
        localStorage.setItem(KEY_NOTES, JSON.stringify(notes));
        renderSavedNotes();
        quickNotesTextarea.value = '';
        notify('Note saved');
    }
    function loadNotes() {
        renderSavedNotes();
    }
    function renderSavedNotes() {
        if (!savedNotesContainer) return;
        let notes = JSON.parse(localStorage.getItem(KEY_NOTES) || '[]');
        savedNotesContainer.innerHTML = '';
        notes.forEach((note, index) => {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'saved-note';
            const isLong = note.text.length > 100;
            const truncatedText = isLong ? note.text.substring(0, 100) + '...' : note.text.replace(/\n/g, '<br>');
            const fullText = note.text.replace(/\n/g, '<br>');
            noteDiv.innerHTML = `
                <div class="note-text" data-truncated="${truncatedText}" data-full="${fullText}" data-expanded="false">${truncatedText}</div>
                <div class="note-date">${new Date(note.timestamp).toLocaleString()}</div>
                <button class="delete-note" title="Delete note">×</button>
            `;
            // Add click to toggle text expansion
            const noteTextEl = noteDiv.querySelector('.note-text');
            noteTextEl.addEventListener('click', () => {
                const expanded = noteTextEl.dataset.expanded === 'true';
                noteTextEl.innerHTML = expanded ? noteTextEl.dataset.truncated : noteTextEl.dataset.full;
                noteTextEl.dataset.expanded = expanded ? 'false' : 'true';
            });
            // Add delete functionality
            const deleteBtn = noteDiv.querySelector('.delete-note');
            deleteBtn.addEventListener('click', () => {
                notes.splice(index, 1);
                localStorage.setItem(KEY_NOTES, JSON.stringify(notes));
                renderSavedNotes();
                notify('Note deleted');
            });
            savedNotesContainer.appendChild(noteDiv);
        });
    }

    // Tool visibility
    function initToolVisibility() {
        if (!toolsSettingsContainer) return;
        let saved = null;
        try { saved = JSON.parse(localStorage.getItem(KEY_VISIBLE)); } catch (e) { saved = null; }
        const visible = Array.isArray(saved) ? saved : toolCards.map(c => c.dataset.tool);
        toolCards.forEach(card => {
            const id = card.dataset.tool;
            if (id === 'ai') return; // keep AI always visible
            const lbl = document.createElement('label');
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = visible.includes(id);
            cb.addEventListener('change', () => { card.style.display = cb.checked ? '' : 'none'; saveVisible(); });
            lbl.appendChild(cb);
            const t = document.createElement('span'); t.textContent = ' ' + (id ? id.charAt(0).toUpperCase() + id.slice(1) : id);
            lbl.appendChild(t);
            toolsSettingsContainer.appendChild(lbl);
            card.style.display = cb.checked ? '' : 'none';
        });
    }
    function saveVisible() { const arr = toolCards.filter(c => c.dataset.tool !== 'ai' && c.style.display !== 'none').map(c => c.dataset.tool); localStorage.setItem(KEY_VISIBLE, JSON.stringify(arr)); }

    // Timer
    function setTimerDisplay() {
        if (!timerDisplay) return;
        const m = Math.floor(timeRemaining / 60); const s = timeRemaining % 60;
        timerDisplay.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        if (pomodoroProgressEl && timerDuration > 0) {
            // Calculate progress: elapsed time as percentage of total duration (ring fills up as time passes)
            const elapsed = timerDuration - timeRemaining;
            const progress = (elapsed / timerDuration) * POMODORO_CIRC;
            pomodoroProgressEl.style.strokeDasharray = `${progress} ${POMODORO_CIRC}`;
        }
    }
    function startTimer() { if (isTimerRunning) return; isTimerRunning = true; startTimerBtn && (startTimerBtn.disabled = true); timerInterval = setInterval(() => { timeRemaining = Math.max(0, timeRemaining - 1); setTimerDisplay(); if (timeRemaining <= 0) { pauseTimer(); notify("Time's up"); } }, 1000); }
    function pauseTimer() { if (!isTimerRunning) return; isTimerRunning = false; clearInterval(timerInterval); startTimerBtn && (startTimerBtn.disabled = false); }
    function resetTimer() { pauseTimer(); timerDuration = (parseInt(timerMinutesInput?.value, 10) || 25) * 60; timeRemaining = timerDuration; setTimerDisplay(); }

    // Noise generator (simple)
    function initNoiseControls() {
        if (!playNoiseBtn || !stopNoiseBtn || !noiseVolumeInput) return;
        playNoiseBtn.addEventListener('click', () => { const sel = document.querySelector('input[name="noiseType"]:checked')?.value || 'white'; startNoise(sel); });
        stopNoiseBtn.addEventListener('click', stopNoise);
        noiseVolumeInput.addEventListener('input', () => { if (noiseGain) noiseGain.gain.value = parseFloat(noiseVolumeInput.value); try { const p = JSON.parse(localStorage.getItem(KEY_PREFER) || '{}'); p.noiseVolume = noiseVolumeInput.value; localStorage.setItem(KEY_PREFER, JSON.stringify(p)); } catch (e) {} });
    }
    function createNoiseBuffer(ctx, seconds = 2, type='white') {
        const sampleRate = ctx.sampleRate; const buffer = ctx.createBuffer(1, sampleRate * seconds, sampleRate); const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1; // white
        if (type === 'pink' || type === 'brown') {
            // gentle smoothing for pink/brown
            let last = 0; for (let i = 0; i < data.length; i++) { last = (last + data[i]) / (type === 'brown' ? 1.02 : 1.5); data[i] = last; }
        }
        return buffer;
    }
    function startNoise(type='white') {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            stopNoise();
            noiseGain = audioCtx.createGain(); noiseGain.gain.value = parseFloat(noiseVolumeInput?.value || 0.35); noiseGain.connect(audioCtx.destination);
            noiseSource = audioCtx.createBufferSource(); noiseSource.buffer = createNoiseBuffer(audioCtx, 2, type); noiseSource.loop = true;
            if (type === 'white') noiseSource.connect(noiseGain); else { const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = type === 'pink' ? 1200 : 800; noiseSource.connect(filter); filter.connect(noiseGain); }
            noiseSource.start(); notify(`Playing ${type} noise`);
        } catch (e) { console.error('startNoise', e); notify('Audio unavailable'); }
    }
    function stopNoise() { try { if (noiseSource) noiseSource.stop(); } catch (e) {} try { noiseSource && noiseSource.disconnect && noiseSource.disconnect(); } catch (e) {} noiseSource = null; try { noiseGain && noiseGain.disconnect && noiseGain.disconnect(); } catch (e) {} noiseGain = null; }

    // Calendar/events
    let currentDate = new Date();
    function renderCalendar() {
        if (!calendarGrid || !currentMonthDisplay) return;
        const year = currentDate.getFullYear(); const month = currentDate.getMonth();
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        currentMonthDisplay.textContent = `${monthNames[month]} ${year}`;
        calendarGrid.innerHTML = '';
        const firstDay = new Date(year, month, 1); const lastDay = new Date(year, month + 1, 0); const startingDay = firstDay.getDay();
        for (let i = 0; i < startingDay; i++) { const cell = document.createElement('div'); cell.className = 'calendar-day other-month'; calendarGrid.appendChild(cell); }
        for (let d = 1; d <= lastDay.getDate(); d++) { const date = new Date(year, month, d); const cell = document.createElement('div'); cell.className = 'calendar-day'; cell.textContent = d; const iso = date.toISOString().split('T')[0]; if (events.some(ev => ev.date === iso)) cell.classList.add('has-event'); if (date.toDateString() === (new Date()).toDateString()) cell.classList.add('today'); calendarGrid.appendChild(cell); }
        while (calendarGrid.children.length < 42) { const cell = document.createElement('div'); cell.className = 'calendar-day other-month'; calendarGrid.appendChild(cell); }
    }
    function renderEventsList() { if (!eventsContainer) return; eventsContainer.innerHTML = ''; const upcoming = events.filter(e => new Date(e.date + 'T' + (e.time||'00:00')) >= new Date()).sort((a,b)=> new Date(a.date+'T'+(a.time||'00:00'))-new Date(b.date+'T'+(b.time||'00:00'))).slice(0,5); if (upcoming.length === 0) { const p = document.createElement('p'); p.style.color='#666'; p.style.fontStyle='italic'; p.textContent='No upcoming events'; eventsContainer.appendChild(p); return; } upcoming.forEach(ev => { const item = document.createElement('div'); item.className='event-item'; const details = document.createElement('div'); details.className='event-details'; const title = document.createElement('div'); title.className='event-title'; title.textContent = ev.title; const dt = document.createElement('div'); dt.className='event-datetime'; dt.textContent = new Date(ev.date + 'T' + (ev.time||'00:00')).toLocaleString(); details.appendChild(title); details.appendChild(dt); const del = document.createElement('button'); del.className='delete-event'; del.textContent='×'; del.addEventListener('click', ()=>{ events = events.filter(x=>x.id!==ev.id); saveEvents(); renderCalendar(); renderEventsList(); }); item.appendChild(details); item.appendChild(del); eventsContainer.appendChild(item); }); }
    function saveEvents() { localStorage.setItem(KEY_EVENTS, JSON.stringify(events)); }
    function addEvent() { if (!eventTitleInput || !eventDateInput) { notify('Event inputs missing'); return; } const title = (eventTitleInput.value || '').trim(); const date = eventDateInput.value; const time = eventTimeInput.value; if (!title || !date) { notify('Please enter title and date'); return; } const ev = { id: Date.now(), title, date, time, created: new Date().toISOString() }; events.push(ev); events.sort((a,b)=> new Date(a.date+'T'+(a.time||'00:00'))-new Date(b.date+'T'+(b.time||'00:00'))); saveEvents(); renderCalendar(); renderEventsList(); eventTitleInput.value=''; eventTimeInput.value=''; notify('Event added'); }

    // AI (local/simple)
    function addChatMessage(text, sender='ai') { if (!chatMessages) return; const m = document.createElement('div'); m.className = sender+'-message'; m.textContent = text; chatMessages.appendChild(m); chatMessages.scrollTop = chatMessages.scrollHeight; }
    function getContextualResponse(message) { if (!message) return null; const m = message.toLowerCase(); if (m.includes('focus') || m.includes('concentr')) return 'Try Pomodoro: 25 min focus, 5 min break.'; if (m.includes('overwhelm')||m.includes('stress')) return 'Break tasks into tiny steps.'; if (m.includes('memory')) return 'Use active recall and spaced repetition.'; return null; }
    function sendChat() { if (!chatInput) return; const msg = (chatInput.value||'').trim(); if (!msg) return; addChatMessage(msg, 'user'); chatInput.value=''; const local = getContextualResponse(msg); if (local) { setTimeout(()=>addChatMessage(local,'ai'), 300); return; } setTimeout(()=>addChatMessage('I can help with focus techniques, timers, or events. Try: "How do I focus?"', 'ai'), 500); }

    // Progress Tracker
    function updateProgress() {
        if (!totalQuestionsInput || !completedQuestionsInput || !progressFill || !progressText) return;
        
        const total = parseInt(totalQuestionsInput.value, 10) || 0;
        const completed = parseInt(completedQuestionsInput.value, 10) || 0;
        
        if (total <= 0) {
            progressFill.style.width = '0%';
            progressText.textContent = '0% Complete';
            return;
        }
        
        const percentage = Math.min(100, Math.max(0, (completed / total) * 100));
        progressFill.style.width = percentage + '%';
        progressText.textContent = Math.round(percentage) + '% Complete';
    }

    // Drawing functions
    function initDrawing() {
        if (!drawingCanvas) return;

        try {
            drawingContext = drawingCanvas.getContext('2d');
            if (!drawingContext) {
                console.error('Canvas 2D context not available');
                notify('Drawing tool unavailable - canvas not supported');
                return;
            }

            drawingContext.lineCap = 'round';
            drawingContext.lineJoin = 'round';

            // Set initial canvas background
            drawingContext.fillStyle = 'white';
            drawingContext.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);

            // Tool selection
            penTool && penTool.addEventListener('click', () => setDrawingTool('pen'));
            eraserTool && eraserTool.addEventListener('click', () => setDrawingTool('eraser'));
            lineTool && lineTool.addEventListener('click', () => setDrawingTool('line'));
            rectangleTool && rectangleTool.addEventListener('click', () => setDrawingTool('rectangle'));
            circleTool && circleTool.addEventListener('click', () => setDrawingTool('circle'));

            // Controls
            clearCanvasBtn && clearCanvasBtn.addEventListener('click', clearDrawingCanvas);
            saveDrawingBtn && saveDrawingBtn.addEventListener('click', saveDrawing);

            // Mouse events
            drawingCanvas.addEventListener('mousedown', startDrawing);
            drawingCanvas.addEventListener('mousemove', draw);
            drawingCanvas.addEventListener('mouseup', stopDrawing);
            drawingCanvas.addEventListener('mouseout', stopDrawing);

            // Touch events for mobile
            drawingCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
            drawingCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
            drawingCanvas.addEventListener('touchend', stopDrawing);

            console.log('Drawing tool initialized successfully');
        } catch (error) {
            console.error('Error initializing drawing tool:', error);
            notify('Drawing tool initialization failed');
        }
    }

    function setDrawingTool(tool) {
        currentTool = tool;
        // Update active tool button
        [penTool, eraserTool, lineTool, rectangleTool, circleTool].forEach(btn => {
            if (btn) btn.classList.remove('tool-active');
        });
        const activeBtn = { pen: penTool, eraser: eraserTool, line: lineTool, rectangle: rectangleTool, circle: circleTool }[tool];
        if (activeBtn) activeBtn.classList.add('tool-active');

        // Update cursor
        drawingCanvas.style.cursor = tool === 'eraser' ? 'grab' : 'crosshair';
    }

    function startDrawing(e) {
        isDrawing = true;
        const rect = drawingCanvas.getBoundingClientRect();
        startX = lastX = e.clientX - rect.left;
        startY = lastY = e.clientY - rect.top;

        if (currentTool === 'pen' || currentTool === 'eraser') {
            drawingContext.beginPath();
            drawingContext.moveTo(startX, startY);
        }
    }

    function draw(e) {
        if (!isDrawing) return;

        const rect = drawingCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        drawingContext.strokeStyle = currentTool === 'eraser' ? 'white' : brushColor.value;
        drawingContext.lineWidth = parseInt(brushSize.value);

        if (currentTool === 'pen' || currentTool === 'eraser') {
            drawingContext.lineTo(x, y);
            drawingContext.stroke();
        }

        lastX = x;
        lastY = y;
    }

    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;

        // Draw shapes on mouse up
        if (currentTool === 'line') {
            drawLine(startX, startY, lastX, lastY);
        } else if (currentTool === 'rectangle') {
            drawRectangle(startX, startY, lastX - startX, lastY - startY);
        } else if (currentTool === 'circle') {
            const radius = Math.sqrt(Math.pow(lastX - startX, 2) + Math.pow(lastY - startY, 2));
            drawCircle(startX, startY, radius);
        }

        drawingContext.beginPath(); // Reset path for next drawing
    }

    function drawLine(x1, y1, x2, y2) {
        drawingContext.strokeStyle = brushColor.value;
        drawingContext.lineWidth = parseInt(brushSize.value);
        drawingContext.beginPath();
        drawingContext.moveTo(x1, y1);
        drawingContext.lineTo(x2, y2);
        drawingContext.stroke();
    }

    function drawRectangle(x, y, width, height) {
        drawingContext.strokeStyle = brushColor.value;
        drawingContext.lineWidth = parseInt(brushSize.value);
        drawingContext.strokeRect(x, y, width, height);
    }

    function drawCircle(x, y, radius) {
        drawingContext.strokeStyle = brushColor.value;
        drawingContext.lineWidth = parseInt(brushSize.value);
        drawingContext.beginPath();
        drawingContext.arc(x, y, radius, 0, 2 * Math.PI);
        drawingContext.stroke();
    }

    function clearDrawingCanvas() {
        drawingContext.fillStyle = 'white';
        drawingContext.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        notify('Canvas cleared');
    }

    function saveDrawing() {
        try {
            const dataURL = drawingCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'drawing-' + new Date().toISOString().slice(0, 10) + '.png';
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            notify('Drawing saved successfully');
        } catch (error) {
            console.error('Error saving drawing:', error);
            notify('Save failed - try using Python server instead of Live Server');
        }
    }

    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        drawingCanvas.dispatchEvent(mouseEvent);
    }

    function handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        drawingCanvas.dispatchEvent(mouseEvent);
    }

    // TTS basic
    function initTTS() { const play = $id('playTTS'), pause = $id('pauseTTS'), stop = $id('stopTTS'), file = $id('textFileUpload'), ttsText = $id('ttsText'); if (play) play.addEventListener('click', ()=>{ if (!ttsText || !ttsText.value.trim()) return; const u = new SpeechSynthesisUtterance(ttsText.value); u.rate = parseFloat($id('speechRate')?.value || 1); u.pitch = parseFloat($id('speechPitch')?.value || 1); speechSynthesis.speak(u); }); if (pause) pause.addEventListener('click', ()=>speechSynthesis.pause()); if (stop) stop.addEventListener('click', ()=>speechSynthesis.cancel()); if (file) file.addEventListener('change', (e)=>{ const f = e.target.files[0]; if (!f) return; if (!f.type.startsWith('text') && !f.name.endsWith('.txt') && !f.name.endsWith('.md')) { notify('Select a text file'); return; } if (f.size > 1024*1024) { notify('File too large'); return; } const r = new FileReader(); r.onload = ()=>{ if (ttsText) ttsText.value = r.result; notify('File loaded'); }; r.readAsText(f); }); }

    function init() {
        initToolVisibility(); loadNotes(); quickNotesTextarea && clearNotesBtn && clearNotesBtn.addEventListener('click', ()=>{ quickNotesTextarea.value=''; notify('Textarea cleared'); }); saveNotesBtn && saveNotesBtn.addEventListener('click', saveNotes);
        startTimerBtn && startTimerBtn.addEventListener('click', startTimer); pauseTimerBtn && pauseTimerBtn.addEventListener('click', pauseTimer); resetTimerBtn && resetTimerBtn.addEventListener('click', resetTimer); timerMinutesInput && timerMinutesInput.addEventListener('change', ()=>{ timerDuration = (parseInt(timerMinutesInput.value,10)||25)*60; timeRemaining = timerDuration; setTimerDisplay(); }); setTimerDisplay();
        initNoiseControls(); renderCalendar(); renderEventsList(); prevMonthBtn && prevMonthBtn.addEventListener('click', ()=>{ currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); }); nextMonthBtn && nextMonthBtn.addEventListener('click', ()=>{ currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); }); addEventBtn && addEventBtn.addEventListener('click', addEvent); if (eventDateInput) eventDateInput.value = (new Date()).toISOString().split('T')[0];
        sendMessageBtn && sendMessageBtn.addEventListener('click', sendChat); chatInput && chatInput.addEventListener('keypress', (e)=>{ if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }); initTTS(); initDrawing(); if (periodicTipsCheckbox && periodicTipsCheckbox.checked) setInterval(()=>addChatMessage('⏱ Time for a short focus check — breathe and refocus.'), 15*60*1000);
        try { const prefs = JSON.parse(localStorage.getItem(KEY_PREFER) || '{}'); if (prefs.noiseVolume && noiseVolumeInput) noiseVolumeInput.value = prefs.noiseVolume; } catch (e) {}
        
        // Progress Tracker
        totalQuestionsInput && totalQuestionsInput.addEventListener('input', updateProgress);
        completedQuestionsInput && completedQuestionsInput.addEventListener('input', updateProgress);
        updateProgress(); // Initial update

        // Tab switching for Study Companion
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                // Remove active from all
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                // Add active to clicked
                button.classList.add('active');
                const targetContent = document.getElementById(tabName + '-tab');
                if (targetContent) targetContent.classList.add('active');
            });
        });
    }

        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
