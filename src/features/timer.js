// ========================================
// TIMER FUNCTIONS
// ========================================

// Global Variables
let timer = null;
let timerQueue = [];
let timerIndex = 0;
let timerRunning = false;
let timerPaused = false;
let currentSet = 1;
let currentRep = 1;
let currentMove = 1;
let audioContext = null;
let audioSettings = {
    moveEnd: 'beep',
    restEnd: 'bell',
    setEnd: 'chime',
    exerciseEnd: 'success',
    restStart: 'whistle'
};

let colorSettings = {
    moveColor: 'blue',
    restColor: 'red',
    setRestColor: 'orange'
};

// Color options
const colorOptions = {
    blue: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-400', border: 'border-blue-300' },
    green: { bg: 'from-green-500 to-green-600', text: 'text-green-400', border: 'border-green-300' },
    purple: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-400', border: 'border-purple-300' },
    orange: { bg: 'from-orange-500 to-orange-600', text: 'text-orange-400', border: 'border-orange-300' },
    pink: { bg: 'from-pink-500 to-pink-600', text: 'text-pink-400', border: 'border-pink-300' }
};

// Audio sounds
const audioSounds = {
    beep: { frequency: 800, duration: 200 },
    bell: { frequency: 600, duration: 300 },
    chime: { frequency: 1000, duration: 500 },
    success: { frequency: 1200, duration: 800 },
    whistle: { frequency: 1500, duration: 400 },
    gong: { frequency: 400, duration: 600 },
    buzz: { frequency: 200, duration: 300 },
    cheer: { frequency: 800, duration: 1000, type: 'sawtooth' },
    motivation: { frequency: 600, duration: 800, type: 'square' },
    energy: { frequency: 1000, duration: 600, type: 'triangle' }
};

// Initialize audio context
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Play sound
function playSound(soundType) {
    if (!audioContext) initAudio();
    
    const sound = audioSounds[soundType] || audioSounds.beep;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(sound.frequency, audioContext.currentTime);
    oscillator.type = sound.type || 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration / 1000);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + sound.duration / 1000);
}

// Pause timer
function pauseTimer() {
    if (timerRunning && !timerPaused) {
        clearInterval(timer);
        timerPaused = true;
        updateTimerDisplay('PAUSED');
        updatePlayPauseButton();
    }
}

// Resume timer
function resumeTimer() {
    if (timerRunning && timerPaused) {
        timerPaused = false;
        runTimerStep();
        updatePlayPauseButton();
    }
}

// Stop timer
function stopTimer() {
    if (timerRunning) {
        clearInterval(timer);
        timerRunning = false;
        timerPaused = false;
        timerIndex = 0;
        currentSet = 1;
        currentRep = 1;
        currentMove = 1;
        updatePlayPauseButton();
        updateSkipButtonStates();
        // Don't go back to exercise page, stay on timer page
    }
}

// Restart timer
function restartTimer() {
    if (timerRunning) {
        clearInterval(timer);
        timerRunning = false;
        timerPaused = false;
        timerIndex = 0;
        currentSet = 1;
        currentRep = 1;
        currentMove = 1;
        updatePlayPauseButton();
        updateTimerStatus();
        updateSkipButtonStates();
        // Start timer again
        setTimeout(() => {
            startTimer();
        }, 500);
    }
}

// Skip to next rep
function skipToNextRep() {
    if (timerRunning) {
        const currentStep = timerQueue[timerIndex];
        if (!currentStep) return;
        
        // Find next rep start
        let foundNextRep = false;
        for (let i = timerIndex + 1; i < timerQueue.length; i++) {
            const step = timerQueue[i];
            if (step.rep > currentStep.rep) {
                timerIndex = i - 1;
                foundNextRep = true;
                break;
            }
        }
        
        if (!foundNextRep) {
            // Go to next set
            skipToNextSet();
            return;
        }
        
        clearInterval(timer);
        runTimerStep();
        updateTimerStatus();
        updateSkipButtonStates();
    }
}

// Skip to next set
function skipToNextSet() {
    if (timerRunning) {
        const currentStep = timerQueue[timerIndex];
        if (!currentStep) return;
        
        // Find next set start
        let foundNextSet = false;
        for (let i = timerIndex + 1; i < timerQueue.length; i++) {
            const step = timerQueue[i];
            if (step.set > currentStep.set) {
                timerIndex = i - 1;
                foundNextSet = true;
                break;
            }
        }
        
        if (!foundNextSet) {
            // Go to exercise end
            timerIndex = timerQueue.length - 1;
        }
        
        clearInterval(timer);
        runTimerStep();
        updateTimerStatus();
        updateSkipButtonStates();
    }
}

// Skip current move (advance by move duration)
function skipMove() {
    if (timerRunning) {
        const currentStep = timerQueue[timerIndex];
        if (!currentStep || currentStep.type !== 'Move') return;
        
        // Skip to the end of current move
        clearInterval(timer);
        timerIndex++;
        runTimerStep();
        updateTimerStatus();
        updateSkipButtonStates();
    }
}

// Skip set rest
function skipSetRest() {
    if (timerRunning) {
        const currentStep = timerQueue[timerIndex];
        if (!currentStep || currentStep.type !== 'Set Rest') return;
        
        // Find next non-rest step
        for (let i = timerIndex + 1; i < timerQueue.length; i++) {
            const step = timerQueue[i];
            if (step.type !== 'Set Rest') {
                timerIndex = i - 1;
                break;
            }
        }
        
        clearInterval(timer);
        runTimerStep();
        updateTimerStatus();
        updateSkipButtonStates();
    }
}

// Update timer display with status
function updateTimerDisplay(status = '') {
    const timerDisplay = document.getElementById('timerDisplay');
    if (!timerDisplay) return;
    
    const currentStep = timerQueue[timerIndex];
    if (!currentStep) return;
    
    let colorClass, iconClass, stepInfo;
    
    if (currentStep.type === 'Move') {
        colorClass = 'text-yellow-400';
        iconClass = 'fas fa-running';
        stepInfo = `Set ${currentStep.set} - Rep ${currentStep.rep} - ${currentStep.moveName}`;
    } else if (currentStep.type === 'Move Rest') {
        colorClass = 'text-orange-400';
        iconClass = 'fas fa-pause';
        const nextMove = getNextMoveName(currentStep);
        stepInfo = `Set ${currentStep.set} - Rep ${currentStep.rep} - Rest before ${nextMove}`;
    } else if (currentStep.type === 'Rep Rest') {
        colorClass = 'text-red-400';
        iconClass = 'fas fa-coffee';
        const nextRep = getNextRepInfo(currentStep);
        stepInfo = `Set ${currentStep.set} - Rest before ${nextRep}`;
    } else {
        colorClass = 'text-red-400';
        iconClass = 'fas fa-pause';
        const nextSet = getNextSetInfo(currentStep);
        stepInfo = `Rest before ${nextSet}`;
    }
    
    const statusHtml = status ? `<div class="text-2xl font-bold text-white mb-4">${status}</div>` : '';
    
    timerDisplay.innerHTML = `
        <div class="text-center timer-active">
            <div class="inline-flex items-center justify-center w-32 h-32 bg-white/10 rounded-full mb-8">
                <i class="${iconClass} text-5xl ${colorClass}"></i>
            </div>
            <div class="text-3xl font-bold text-white mb-4">${currentStep.name}</div>
            <div class="text-xl text-white/70 mb-4">${currentStep.type}</div>
            <div class="text-lg text-white/60 mb-8">${stepInfo}</div>
            ${statusHtml}
            <div class="text-9xl font-bold ${colorClass}">${currentStep.duration}s</div>
        </div>
    `;
}

// Start timer
function startTimer() {
    if (timerRunning) return;
    
    const exercise = currentProgram.exercises[currentExerciseIndex];
    timerQueue = [];
    
    for (let set = 1; set <= exercise.setCount; set++) {
        for (let rep = 1; rep <= exercise.repCount; rep++) {
            // Add moves for this repetition
            exercise.moves.forEach((move, moveIndex) => {
                timerQueue.push({
                    type: 'Move',
                    name: exercise.name,
                    moveName: move.name,
                    duration: move.duration,
                    set: set,
                    rep: rep,
                    move: moveIndex + 1
                });
                
                // Add rest between moves if enabled
                if (exercise.restBetweenMovesEnabled && 
                    exercise.restBetweenMoves > 0 && 
                    moveIndex < exercise.moves.length - 1) {
                    timerQueue.push({
                        type: 'Move Rest',
                        name: exercise.name,
                        duration: exercise.restBetweenMoves,
                        set: set,
                        rep: rep,
                        move: moveIndex + 1
                    });
                }
            });
            
            // Add rest between reps if enabled
            if (exercise.restBetweenMovesEnabled && 
                exercise.restBetweenMoves > 0 && 
                rep < exercise.repCount) {
                timerQueue.push({
                    type: 'Rep Rest',
                    name: exercise.name,
                    duration: exercise.restBetweenMoves,
                    set: set,
                    rep: rep
                });
            }
        }
        
        // Add rest between sets
        if (exercise.restBetweenSets > 0 && set < exercise.setCount) {
            timerQueue.push({
                type: 'Set Rest',
                name: exercise.name,
                duration: exercise.restBetweenSets,
                set: set
            });
        }
    }
    
    timerIndex = 0;
    timerRunning = true;
    timerPaused = false;
    currentSet = 1;
    currentRep = 1;
    currentMove = 1;
    
    showPage('timerSection');
    updatePlayPauseButton();
    updateTimerStatus();
    updateSkipButtonStates();
    updateSkipButtonStates();
    runTimerStep();
}

// Run timer step
function runTimerStep() {
    if (timerIndex >= timerQueue.length) {
        playSound(audioSettings.exerciseEnd);
        document.getElementById('timerDisplay').innerHTML = `
            <div class="text-center success-bounce">
                <div class="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-8">
                    <i class="fas fa-trophy text-6xl text-white"></i>
                </div>
                <div class="text-4xl font-bold text-green-400 mb-4">Congratulations!</div>
                <div class="text-2xl text-white/80">Exercise completed.</div>
            </div>
        `;
        timerRunning = false;
        timerPaused = false;
        updatePlayPauseButton();
        return;
    }
    
    const step = timerQueue[timerIndex];
    let remaining = step.duration;
    
    // Update current position
    currentSet = step.set;
    currentRep = step.rep || 1;
    currentMove = step.move || 1;
    
    let colorClass, iconClass, stepInfo, soundType, displayText;
    const timerColor = getTimerColor(step.type, step.move - 1);
    
    if (step.type === 'Move') {
        colorClass = timerColor.text;
        iconClass = 'fas fa-running';
        stepInfo = `Set ${step.set} - Rep ${step.rep} - ${step.moveName}`;
        soundType = 'moveEnd';
        displayText = step.moveName;
    } else if (step.type === 'Move Rest') {
        colorClass = timerColor.text;
        iconClass = 'fas fa-pause';
        const nextMove = getNextMoveName(step);
        stepInfo = `Set ${step.set} - Rep ${step.rep} - Rest before ${nextMove}`;
        soundType = 'restEnd';
        displayText = 'Move Rest';
    } else if (step.type === 'Rep Rest') {
        colorClass = timerColor.text;
        iconClass = 'fas fa-coffee';
        const nextRep = getNextRepInfo(step);
        stepInfo = `Set ${step.set} - Rest before ${nextRep}`;
        soundType = 'restEnd';
        displayText = 'Rep Rest';
    } else {
        colorClass = timerColor.text;
        iconClass = 'fas fa-pause';
        const nextSet = getNextSetInfo(step);
        stepInfo = `Rest before ${nextSet}`;
        soundType = 'setEnd';
        displayText = 'Set Rest';
    }
    
    document.getElementById('timerDisplay').innerHTML = `
        <div class="text-center timer-active">
            <div class="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r ${timerColor.bg} rounded-full mb-8">
                <i class="${iconClass} text-5xl text-white"></i>
            </div>
            <div class="text-6xl font-bold ${colorClass} mb-4">${displayText}</div>
            <div class="text-xl text-white/70 mb-4">${step.type}</div>
            <div class="text-lg text-white/60 mb-8">${stepInfo}</div>
            <div class="text-9xl font-bold ${colorClass}">${remaining}s</div>
        </div>
    `;
    
    updateTimerStatus();
    updateSkipButtonStates();

    // Play distinct sound at the start of rest periods
    const isRestType = (step.type === 'Move Rest') || (step.type === 'Rep Rest') || (step.type === 'Set Rest');
    if (isRestType) {
        try { playSound(audioSettings.restStart || 'whistle'); } catch {}
    }
    
    let lastAnnounced = null;
    timer = setInterval(() => {
        if (timerPaused) return;
        
        remaining--;
        document.getElementById('timerDisplay').innerHTML = `
            <div class="text-center timer-active">
                <div class="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r ${timerColor.bg} rounded-full mb-8">
                    <i class="${iconClass} text-5xl text-white"></i>
                </div>
                <div class="text-6xl font-bold ${colorClass} mb-4">${displayText}</div>
                <div class="text-xl text-white/70 mb-4">${step.type}</div>
                <div class="text-lg text-white/60 mb-8">${stepInfo}</div>
                <div class="text-9xl font-bold ${colorClass}">${remaining}s</div>
            </div>
        `;
        
        // Voice countdown in the last 5 seconds for rest types
        if (isRestType && remaining > 0 && remaining <= 5) {
            if (lastAnnounced !== remaining) {
                const words = { 5: 'five', 4: 'four', 3: 'three', 2: 'two', 1: 'one' };
                const word = words[remaining];
                if (word && typeof speakText === 'function') speakText(word, 'en-US');
                lastAnnounced = remaining;
            }
        }

        if (remaining <= 0) {
            clearInterval(timer);
            playSound(soundType);
            timerIndex++;
            runTimerStep();
        }
    }, 1000);
}

// Load audio settings from storage
function loadAudioSettings() {
    const data = getCookie('audioSettings');
    if (data) {
        try {
            audioSettings = JSON.parse(data);
        } catch {
            // Use default settings
        }
    }
}

// Save audio settings to storage
function saveAudioSettings() {
    setCookie('audioSettings', JSON.stringify(audioSettings), 30);
}

// Update audio setting
function updateAudioSetting(type, value) {
    audioSettings[type] = value;
    saveAudioSettings();
} 

// Load color settings from storage
function loadColorSettings() {
    const data = getCookie('colorSettings');
    if (data) {
        try {
            colorSettings = JSON.parse(data);
        } catch {
            // Use default settings
        }
    }
}

// Save color settings to storage
function saveColorSettings() {
    setCookie('colorSettings', JSON.stringify(colorSettings), 30);
}

// Update color setting
function updateColorSetting(type, value) {
    colorSettings[type] = value;
    saveColorSettings();
}

// Get next move name for rest periods
function getNextMoveName(currentStep) {
    const exercise = currentProgram.exercises[currentExerciseIndex];
    if (!exercise || !exercise.moves) return 'next move';
    
    const nextMoveIndex = currentStep.move;
    if (nextMoveIndex < exercise.moves.length) {
        return exercise.moves[nextMoveIndex].name;
    }
    
    return 'next rep';
}

// Get next rep info for rest periods
function getNextRepInfo(currentStep) {
    const exercise = currentProgram.exercises[currentExerciseIndex];
    if (!exercise) return 'next rep';
    
    const nextRep = currentStep.rep + 1;
    if (nextRep <= exercise.repCount) {
        return `Rep ${nextRep}`;
    }
    
    return 'next set';
}

// Get next set info for rest periods
function getNextSetInfo(currentStep) {
    const exercise = currentProgram.exercises[currentExerciseIndex];
    if (!exercise) return 'next set';
    
    const nextSet = currentStep.set + 1;
    if (nextSet <= exercise.setCount) {
        return `Set ${nextSet}`;
    }
    
    return 'exercise end';
}

// Get color for timer display
function getTimerColor(type, moveIndex = 0) {
    const exercise = currentProgram.exercises[currentExerciseIndex];
    
    if (type === 'Move') {
        // Get color from specific move
        const move = exercise.moves[moveIndex];
        const colorKey = move ? move.color : 'blue';
        return colorOptions[colorKey] || colorOptions.blue;
    } else if (type === 'Set Rest') {
        const colorKey = exercise.setRestColor || 'orange';
        return colorOptions[colorKey] || colorOptions.orange;
    } else {
        // Move Rest or Rep Rest
        const colorKey = exercise.restColor || 'green';
        return colorOptions[colorKey] || colorOptions.green;
    }
}

// Make functions globally available
window.skipMove = skipMove;
window.skipSetRest = skipSetRest;
window.loadColorSettings = loadColorSettings; 