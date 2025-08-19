// ========================================
// PROGRAM TIMER AND DRAG & DROP FUNCTIONS
// ========================================

// Global Variables
let programTimer = null;
let programTimerQueue = [];
let programTimerIndex = 0;
let programTimerRunning = false;
let programTimerPaused = false;
let currentProgramExercise = 0;
let programSummary = null;
let programActiveStepIndex = -1;
let programRemainingSeconds = null;
let draggedElement = null;
let draggedIndex = null;

// Program Timer Functions
function startProgramTimer() {
    // If a program timer is already running, reset it to start fresh
    if (programTimerRunning) {
        try { clearInterval(programTimer); } catch {}
        programTimerRunning = false;
        programTimerPaused = false;
        programTimerIndex = 0;
        currentProgramExercise = 0;
    }
    
    if (!currentProgram || currentProgram.exercises.length === 0) {
        showNotification('No exercises found in program!', 'error');
        return;
    }
    
    // Parse exercise rest duration from text input
    const exerciseRestInput = document.getElementById('exerciseRestDuration').value.trim();
    let exerciseRestDuration = 60; // Default 1 minute
    
    if (exerciseRestInput) {
        const input = exerciseRestInput.toLowerCase();
        
        // Check for various time formats
        if (input.includes('minute') || input.includes('min')) {
            const minutes = parseFloat(input.match(/\d+/)?.[0] || 1);
            exerciseRestDuration = minutes * 60;
        } else if (input.includes('second') || input.includes('sec')) {
            exerciseRestDuration = parseInt(input.match(/\d+/)?.[0] || 60);
        } else {
            // Try to parse as number (assume seconds if no unit specified)
            const num = parseInt(input);
            if (!isNaN(num)) {
                exerciseRestDuration = num;
            }
        }
    }
    
    const exerciseRestColor = document.querySelector('.program-rest-color-option.ring-2')?.dataset.color || 'blue';
    
    programTimerQueue = [];
    
    // Build program timer queue
    currentProgram.exercises.forEach((exercise, exerciseIndex) => {
        // Normalize exercise object to prevent runtime errors
        const normalizedExercise = {
            name: exercise.name || `Exercise ${exerciseIndex + 1}`,
            setCount: parseInt(exercise.setCount) > 0 ? parseInt(exercise.setCount) : 1,
            repCount: parseInt(exercise.repCount) > 0 ? parseInt(exercise.repCount) : 1,
            restBetweenMovesEnabled: Boolean(exercise.restBetweenMovesEnabled),
            restBetweenMoves: parseInt(exercise.restBetweenMoves) || 0,
            restBetweenSets: parseInt(exercise.restBetweenSets) || 0,
            setRestColor: exercise.setRestColor || 'orange',
            restColor: exercise.restColor || 'green',
            moves: Array.isArray(exercise.moves) ? exercise.moves : []
        };

        // If moves are missing or empty, create a default move setup
        if (!normalizedExercise.moves || normalizedExercise.moves.length === 0) {
            const moveCount = parseInt(exercise.moveCount) > 0 ? parseInt(exercise.moveCount) : 1;
            for (let i = 1; i <= moveCount; i++) {
                normalizedExercise.moves.push({
                    name: `${i}. Move`,
                    duration: 3,
                    color: 'blue'
                });
            }
        }

        // Ensure each move has valid numeric duration and color
        normalizedExercise.moves = normalizedExercise.moves
            .map((m, idx) => ({
                name: m && m.name ? m.name : `${idx + 1}. Move`,
                duration: parseInt(m && m.duration) > 0 ? parseInt(m.duration) : 1,
                color: (m && m.color) || 'blue'
            }))
            .filter(m => m.duration > 0);

        // Add exercise timer queue
        for (let set = 1; set <= normalizedExercise.setCount; set++) {
            for (let rep = 1; rep <= normalizedExercise.repCount; rep++) {
                normalizedExercise.moves.forEach((move, moveIndex) => {
                    programTimerQueue.push({
                        type: 'Exercise Move',
                        exerciseIndex: exerciseIndex,
                        exerciseName: normalizedExercise.name,
                        moveName: move.name,
                        duration: move.duration,
                        set: set,
                        rep: rep,
                        move: moveIndex + 1,
                        color: move.color
                    });
                    
                    // Add rest between moves if enabled
                    if (normalizedExercise.restBetweenMovesEnabled && 
                        normalizedExercise.restBetweenMoves > 0 && 
                        moveIndex < normalizedExercise.moves.length - 1) {
                        programTimerQueue.push({
                            type: 'Exercise Rest',
                            exerciseIndex: exerciseIndex,
                            exerciseName: normalizedExercise.name,
                            duration: normalizedExercise.restBetweenMoves,
                            set: set,
                            rep: rep,
                            move: moveIndex + 1,
                            color: normalizedExercise.restColor
                        });
                    }
                });
                
                // Add rest between reps if enabled
                if (normalizedExercise.restBetweenMovesEnabled && 
                    normalizedExercise.restBetweenMoves > 0 && 
                    rep < normalizedExercise.repCount) {
                    programTimerQueue.push({
                        type: 'Rep Rest',
                        exerciseIndex: exerciseIndex,
                        exerciseName: normalizedExercise.name,
                        duration: normalizedExercise.restBetweenMoves,
                        set: set,
                        rep: rep,
                        color: normalizedExercise.restColor
                    });
                }
            }
            
            // Add rest between sets
            if (normalizedExercise.restBetweenSets > 0 && set < normalizedExercise.setCount) {
                programTimerQueue.push({
                    type: 'Set Rest',
                    exerciseIndex: exerciseIndex,
                    exerciseName: normalizedExercise.name,
                    duration: normalizedExercise.restBetweenSets,
                    set: set,
                    color: normalizedExercise.setRestColor
                });
            }
        }
        
        // Add exercise rest (except for last exercise)
        if (exerciseIndex < currentProgram.exercises.length - 1) {
            const restDuration = getRestDurationForExercise(exerciseIndex);
            if (restDuration > 0) {
                programTimerQueue.push({
                    type: 'Program Rest',
                    exerciseIndex: exerciseIndex,
                    exerciseName: normalizedExercise.name,
                    duration: restDuration,
                    color: exerciseRestColor
                });
            }
        }
    });
    
    // If queue could not be built, notify and abort
    if (!programTimerQueue || programTimerQueue.length === 0) {
        showNotification('Program could not be started. Check exercise settings.', 'error');
        return;
    }
    
    programTimerIndex = 0;
    programTimerRunning = true;
    programTimerPaused = true;
    currentProgramExercise = 0;
    programActiveStepIndex = -1;
    programRemainingSeconds = null;
    
    showPage('programTimerSection');
    updateProgramPlayPauseButton();
    updateProgramTimerStatus();
    updateProgramSkipButtonStates();
    rebuildProgramSummary();
    runProgramTimerStep();
}

function runProgramTimerStep() {
    if (programTimerIndex >= programTimerQueue.length) {
        playSound(audioSettings.exerciseEnd);
        document.getElementById('programTimerDisplay').innerHTML = `
            <div class="text-center success-bounce">
                <div class="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-8">
                    <i class="fas fa-trophy text-6xl text-white"></i>
                </div>
                <div class="text-4xl font-bold text-green-400 mb-4">Congratulations!</div>
                <div class="text-2xl text-white/80 mb-4">Program completed.</div>
                <div class="text-lg text-white/60">All exercises were completed successfully.</div>
            </div>
        `;
        programTimerRunning = false;
        programTimerPaused = false;
        updateProgramPlayPauseButton();
        return;
    }
    
    const step = programTimerQueue[programTimerIndex];
    // Preserve remaining seconds across pause/resume
    if (programActiveStepIndex !== programTimerIndex || programRemainingSeconds === null) {
        programActiveStepIndex = programTimerIndex;
        programRemainingSeconds = step.duration;
    }
    let remaining = programRemainingSeconds;
    
    // Update current exercise
    currentProgramExercise = step.exerciseIndex;
    
    let colorClass, iconClass, stepInfo, soundType, displayText;
    const timerColor = getProgramTimerColor(step.type, step.color);
    
    if (step.type === 'Exercise Move') {
        colorClass = timerColor.text;
        iconClass = 'fas fa-running';
        stepInfo = `${step.exerciseName} - Set ${step.set} - Rep ${step.rep} - ${step.moveName}`;
        soundType = 'moveEnd';
        displayText = step.moveName;
    } else if (step.type === 'Exercise Rest') {
        colorClass = timerColor.text;
        iconClass = 'fas fa-pause';
        stepInfo = `${step.exerciseName} - Set ${step.set} - Rep ${step.rep} - Between moves`;
        soundType = 'restEnd';
        displayText = 'Move Rest';
    } else if (step.type === 'Rep Rest') {
        colorClass = timerColor.text;
        iconClass = 'fas fa-coffee';
        stepInfo = `${step.exerciseName} - Set ${step.set} - Between reps`;
        soundType = 'restEnd';
        displayText = 'Rep Rest';
    } else if (step.type === 'Set Rest') {
        colorClass = timerColor.text;
        iconClass = 'fas fa-pause';
        stepInfo = `${step.exerciseName} - Between sets (Set ${step.set})`;
        soundType = 'setEnd';
        displayText = 'Set Rest';
    } else {
        colorClass = timerColor.text;
        iconClass = 'fas fa-clock';
        stepInfo = `${step.exerciseName} finished - Rest before next exercise`;
        soundType = 'restEnd';
        displayText = 'Program Rest';
    }
    
    const containerClass = programTimerPaused ? 'program-timer-paused' : 'program-timer-active';
    document.getElementById('programTimerDisplay').innerHTML = `
        <div class="text-center ${containerClass}">
            <div class="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r ${timerColor.bg} rounded-full mb-8">
                <i class="${iconClass} text-5xl text-white"></i>
            </div>
            <div class="text-4xl font-bold ${colorClass} mb-4">${displayText}</div>
            <div class="text-lg text-white/60 mb-8">${stepInfo}</div>
            <div class="text-8xl font-bold ${colorClass}">${remaining}s</div>
        </div>
    `;
    
    updateProgramTimerStatus();
    updateProgramSkipButtonStates();
    rebuildProgramSummary();

    // At the start of any rest type in program timer, play a distinct start sound
    const isRestType = (step.type === 'Exercise Rest') || (step.type === 'Rep Rest') || (step.type === 'Set Rest') || (step.type === 'Program Rest');
    if (isRestType) {
        try { playSound((audioSettings && audioSettings.restStart) ? audioSettings.restStart : 'whistle'); } catch {}
    }
    
    if (programTimerPaused) {
        return;
    }
    let lastAnnounced = null;
    programTimer = setInterval(() => {
        if (programTimerPaused) return;
        
        remaining--;
        programRemainingSeconds = remaining;
        const containerClassTick = programTimerPaused ? 'program-timer-paused' : 'program-timer-active';
        document.getElementById('programTimerDisplay').innerHTML = `
            <div class="text-center ${containerClassTick}">
                <div class="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r ${timerColor.bg} rounded-full mb-8">
                    <i class="${iconClass} text-5xl text-white"></i>
                </div>
                <div class="text-4xl font-bold ${colorClass} mb-4">${displayText}</div>
                <div class="text-lg text-white/60 mb-8">${stepInfo}</div>
                <div class="text-8xl font-bold ${colorClass}">${remaining}s</div>
            </div>
        `;
        rebuildProgramSummary();
        
        // Voice countdown in the last 5 seconds for rest types (including Program Rest)
        if (isRestType && remaining > 0 && remaining <= 5) {
            if (lastAnnounced !== remaining) {
                const words = { 5: 'five', 4: 'four', 3: 'three', 2: 'two', 1: 'one' };
                const word = words[remaining];
                if (word && typeof speakText === 'function') speakText(word, 'en-US');
                lastAnnounced = remaining;
            }
        }

        if (remaining <= 0) {
            clearInterval(programTimer);
            // Map logical type to chosen sound name
            const chosen = (audioSettings && audioSettings[soundType]) ? audioSettings[soundType] : 'beep';
            playSound(chosen);
            programRemainingSeconds = null;
            programActiveStepIndex = -1;
            programTimerIndex++;
            runProgramTimerStep();
        }
    }, 1000);
}

function pauseProgramTimer() {
    if (programTimerRunning && !programTimerPaused) {
        clearInterval(programTimer);
        programTimerPaused = true;
        // Re-render current step keeping the remaining seconds
        const currentStep = programTimerQueue[programTimerIndex];
        if (currentStep) {
            // Keep current remaining value from programRemainingSeconds
            const timerColor = getProgramTimerColor(currentStep.type, currentStep.color);
            const iconClass = currentStep.type === 'Exercise Move' ? 'fas fa-running' : currentStep.type === 'Set Rest' ? 'fas fa-pause' : 'fas fa-clock';
            const displayText = currentStep.type === 'Exercise Move' ? currentStep.moveName : (currentStep.type === 'Set Rest' ? 'Set Rest' : 'Program Rest');
            const stepInfo = currentStep.type === 'Exercise Move' ? `${currentStep.exerciseName} - Set ${currentStep.set} - Rep ${currentStep.rep} - ${currentStep.moveName}` : `${currentStep.exerciseName}`;
            const colorClass = timerColor.text;
            const remaining = programRemainingSeconds !== null ? programRemainingSeconds : currentStep.duration;
            document.getElementById('programTimerDisplay').innerHTML = `
                <div class="text-center program-timer-paused">
                    <div class="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r ${timerColor.bg} rounded-full mb-8">
                        <i class="${iconClass} text-5xl text-white"></i>
                    </div>
                    <div class="text-4xl font-bold ${colorClass} mb-4">${displayText}</div>
                    <div class="text-lg text-white/60 mb-8">${stepInfo}</div>
                    <div class="text-8xl font-bold ${colorClass}">${remaining}s</div>
                </div>
            `;
        }
        updateProgramPlayPauseButton();
    }
}

function resumeProgramTimer() {
    if (programTimerRunning && programTimerPaused) {
        programTimerPaused = false;
        runProgramTimerStep();
        updateProgramPlayPauseButton();
    }
}

function stopProgramTimer() {
    if (programTimerRunning) {
        clearInterval(programTimer);
        programTimerRunning = false;
        programTimerPaused = false;
        programTimerIndex = 0;
        currentProgramExercise = 0;
        updateProgramPlayPauseButton();
        updateProgramSkipButtonStates();
    }
}

function restartProgramTimer() {
    // Always restart from the beginning, even if not running
    try { clearInterval(programTimer); } catch {}
    programTimerRunning = false;
    programTimerPaused = false;
    programTimerIndex = 0;
    currentProgramExercise = 0;
    updateProgramPlayPauseButton();
    // Rebuild queue and start
    setTimeout(() => {
        startProgramTimer();
    }, 100);
}

function skipProgramExercise() {
    if (programTimerRunning) {
        const currentStep = programTimerQueue[programTimerIndex];
        if (!currentStep) return;
        
        // Find next exercise start
        let foundNextExercise = false;
        for (let i = programTimerIndex + 1; i < programTimerQueue.length; i++) {
            const step = programTimerQueue[i];
            if (step.exerciseIndex > currentStep.exerciseIndex) {
                programTimerIndex = i; // jump directly to next exercise
                foundNextExercise = true;
                break;
            }
        }
        
        if (!foundNextExercise) {
            // Go to program end
            programTimerIndex = programTimerQueue.length - 1;
        }
        
        clearInterval(programTimer);
        programRemainingSeconds = null;
        programActiveStepIndex = -1;
        runProgramTimerStep();
        updateProgramTimerStatus();
        updateProgramSkipButtonStates();
    }
}

function skipProgramRest() {
    if (programTimerRunning) {
        const currentStep = programTimerQueue[programTimerIndex];
        if (!currentStep || currentStep.type !== 'Program Rest') return;
        
        // Find next non-rest step
        for (let i = programTimerIndex + 1; i < programTimerQueue.length; i++) {
            const step = programTimerQueue[i];
            if (step.type !== 'Program Rest') {
                programTimerIndex = i; // jump directly to the next meaningful step
                break;
            }
        }
        
        clearInterval(programTimer);
        runProgramTimerStep();
        updateProgramTimerStatus();
        updateProgramSkipButtonStates();
    }
}

// Skip Set Rest inside current exercise (program context)
function skipProgramSetRest() {
    if (programTimerRunning) {
        const currentStep = programTimerQueue[programTimerIndex];
        if (!currentStep || currentStep.type !== 'Set Rest') return;
        // Jump to next non set-rest step
        for (let i = programTimerIndex + 1; i < programTimerQueue.length; i++) {
            const step = programTimerQueue[i];
            if (step.type !== 'Set Rest') {
                programTimerIndex = i; // jump directly to the next step
                break;
            }
        }
        clearInterval(programTimer);
        runProgramTimerStep();
        updateProgramTimerStatus();
        updateProgramSkipButtonStates();
    }
}

function updateProgramTimerDisplay(status = '') {
    const timerDisplay = document.getElementById('programTimerDisplay');
    if (!timerDisplay) return;
    
    const currentStep = programTimerQueue[programTimerIndex];
    if (!currentStep) return;
    
    const statusHtml = status ? `<div class="text-2xl font-bold text-white mb-4">${status}</div>` : '';
    
    // Get color for current step
    const colorInfo = getProgramTimerColor(currentStep.type, currentStep.color);
    
    timerDisplay.innerHTML = `
        <div class="text-center program-timer-active">
            <div class="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r ${colorInfo.bg} rounded-full mb-8">
                <i class="${currentStep.type === 'Exercise Move' ? 'fas fa-running' : currentStep.type === 'Set Rest' ? 'fas fa-pause' : 'fas fa-clock'} text-5xl text-white"></i>
            </div>
            <div class="text-3xl font-bold text-white mb-2">${currentStep.exerciseName}</div>
            ${statusHtml}
            <div class="text-8xl font-bold bg-gradient-to-r ${colorInfo.bg} bg-clip-text text-transparent">${currentStep.duration}s</div>
        </div>
    `;
}

function updateProgramTimerStatus() {
    const currentStep = programTimerQueue[programTimerIndex];
    if (!currentStep) return;
    
    const totalExercises = currentProgram.exercises.length;
    const currentExerciseNum = currentStep.exerciseIndex + 1;
    
    document.getElementById('currentExerciseProgress').textContent = `Exercise ${currentExerciseNum} / ${totalExercises}`;
    document.getElementById('currentProgramPosition').textContent = `${currentStep.exerciseName} - ${currentStep.type}`;
}

// Step forward/backward regardless of type; reset remaining to full duration
function stepProgramForward() {
    if (!programTimerQueue.length) return;
    clearInterval(programTimer);
    // If at the end, keep at end
    if (programTimerIndex < programTimerQueue.length - 1) {
        programTimerIndex += 1;
    }
    runProgramTimerStep();
}

function stepProgramBackward() {
    if (!programTimerQueue.length) return;
    clearInterval(programTimer);
    if (programTimerIndex > 0) {
        programTimerIndex -= 1;
    }
    runProgramTimerStep();
}

function updateProgramPlayPauseButton() {
    const btn = document.getElementById('programPlayPauseBtn');
    const restartBtn = document.getElementById('programRestartBtn');
    const icon = btn.querySelector('i');
    const text = btn.querySelector('span');
    
    if (programTimerRunning && !programTimerPaused) {
        icon.className = 'fas fa-pause text-3xl';
        text.textContent = 'Pause (Space)';
        btn.className = btn.className.replace('from-green-500 to-emerald-500', 'from-yellow-500 to-orange-500');
        btn.className = btn.className.replace('hover:from-green-600 hover:to-emerald-600', 'hover:from-yellow-600 hover:to-orange-600');
        // Keep restart visible as requested
        if (restartBtn) restartBtn.classList.remove('hidden');
    } else if (programTimerRunning && programTimerPaused) {
        icon.className = 'fas fa-play text-3xl';
        text.textContent = 'Resume (Space)';
        btn.className = btn.className.replace('from-yellow-500 to-orange-500', 'from-green-500 to-emerald-500');
        btn.className = btn.className.replace('hover:from-yellow-600 hover:to-orange-600', 'hover:from-green-600 hover:to-emerald-600');
        if (restartBtn) restartBtn.classList.remove('hidden');
    } else {
        icon.className = 'fas fa-play text-3xl';
        text.textContent = 'Start (Space)';
        btn.className = btn.className.replace('from-yellow-500 to-orange-500', 'from-green-500 to-emerald-500');
        btn.className = btn.className.replace('hover:from-yellow-600 hover:to-orange-600', 'hover:from-green-600 hover:to-emerald-600');
        // Keep restart visible as requested
        if (restartBtn) restartBtn.classList.remove('hidden');
    }
}

function updateProgramSkipButtonStates() {
    const skipExerciseBtn = document.getElementById('skipExerciseBtn');
    const skipRestBtn = document.getElementById('skipExerciseRestBtn');
    const skipSetRestBtnProgram = document.getElementById('skipSetRestBtnProgram');
    const skipSetBtnProgram = document.getElementById('skipSetBtnProgram');
    
    if (!programTimerRunning) {
        skipExerciseBtn.disabled = true;
        skipRestBtn.disabled = true;
        if (skipSetRestBtnProgram) skipSetRestBtnProgram.disabled = true;
        if (skipSetBtnProgram) skipSetBtnProgram.disabled = true;
        return;
    }
    
    const currentStep = programTimerQueue[programTimerIndex];
    if (!currentStep) return;
    
    skipExerciseBtn.disabled = false;
    skipRestBtn.disabled = currentStep.type !== 'Program Rest';
    if (skipSetRestBtnProgram) skipSetRestBtnProgram.disabled = currentStep.type !== 'Set Rest';
    if (skipSetBtnProgram) skipSetBtnProgram.disabled = currentStep.type === 'Program Rest';
}

function getProgramTimerColor(type, colorKey) {
    const colorOptions = {
        blue: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-400' },
        green: { bg: 'from-green-500 to-green-600', text: 'text-green-400' },
        purple: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-400' },
        orange: { bg: 'from-orange-500 to-orange-600', text: 'text-orange-400' },
        pink: { bg: 'from-pink-500 to-pink-600', text: 'text-pink-400' }
    };
    
    // For program rest, use the selected color
    if (type === 'Program Rest') {
        const selectedColorButton = document.querySelector('.program-rest-color-option.ring-2');
        if (selectedColorButton) {
            const selectedColor = selectedColorButton.dataset.color;
            return colorOptions[selectedColor] || colorOptions.blue;
        }
    }
    
    return colorOptions[colorKey] || colorOptions.blue;
}

// -----------------------------
// Program Summary Panel Helpers
// -----------------------------
function rebuildProgramSummary() {
    const panel = document.getElementById('programSummaryPanel');
    if (!panel || !currentProgram) return;
    const { totalSeconds, perExercise } = computeProgramDurations();
    const { minutes: totalMinutes, seconds: totalSecs } = formatMinutesSeconds(totalSeconds);
    const remaining = computeRemainingTime();
    const { minutes: remainingMinutes, seconds: remainingSecs } = formatMinutesSeconds(remaining);

    let html = '';
    html += `<div class="mb-4">
                <div class="text-white text-xl font-bold mb-1">Program Summary</div>
                <div class="text-white/70 text-sm">Total Duration: <span class="text-white">${totalMinutes}d ${totalSecs}s</span></div>
                <div class="text-white/70 text-sm">Remaining Duration: <span class="text-white">${remainingMinutes}d ${remainingSecs}s</span></div>
             </div>`;
    html += '<div class="space-y-3">';
    currentProgram.exercises.forEach((ex, idx) => {
        const stats = perExercise[idx] || { seconds: 0, remainingSets: ex.setCount || 0 };
        const isCompleted = isExerciseCompleted(idx);
        const current = idx === (programTimerQueue[programTimerIndex]?.exerciseIndex || -1);
        html += `
            <div class="p-4 rounded-xl border border-white/10 ${current ? 'bg-white/10' : 'bg-white/5'} ${isCompleted ? 'opacity-60' : ''}">
                <div class="flex items-start justify-between">
                    <div>
                        <div class="text-white font-semibold ${isCompleted ? 'line-through' : ''}">${ex.name}</div>
                        <div class="text-white/60 text-xs">${ex.setCount} set • ${ex.repCount} rep</div>
                    </div>
                    <div class="text-white/70 text-xs">~${formatMinutesSeconds(stats.seconds).minutes}dk ${String(formatMinutesSeconds(stats.seconds).seconds).padStart(2,'0')}sn</div>
                </div>
                <div class="mt-2 text-white/60 text-xs">
                    Remaining set: ${stats.remainingSets} / ${ex.setCount}
                </div>
            </div>`;
    });
    html += '</div>';
    panel.innerHTML = html;
}

function computeProgramDurations() {
    let total = 0;
    const perExercise = [];
    (currentProgram.exercises || []).forEach((exercise, index) => {
        const ex = {
            setCount: parseInt(exercise.setCount) || 1,
            repCount: parseInt(exercise.repCount) || 1,
            moves: Array.isArray(exercise.moves) ? exercise.moves : [],
            restBetweenMovesEnabled: Boolean(exercise.restBetweenMovesEnabled),
            restBetweenMoves: parseInt(exercise.restBetweenMoves) || 0,
            restBetweenSets: parseInt(exercise.restBetweenSets) || 0
        };
        if (ex.moves.length === 0) ex.moves = [{ duration: 3 }];
        const moveDuration = ex.moves.reduce((s, m) => s + (parseInt(m.duration) || 0), 0);
        // Moves time per rep
        let seconds = ex.setCount * ex.repCount * moveDuration;
        // Move rests within rep
        if (ex.restBetweenMovesEnabled && ex.restBetweenMoves > 0) {
            const moveRestsPerRep = Math.max(ex.moves.length - 1, 0);
            seconds += ex.setCount * ex.repCount * moveRestsPerRep * ex.restBetweenMoves;
            // Rep rests between reps
            seconds += ex.setCount * Math.max(ex.repCount - 1, 0) * ex.restBetweenMoves;
        }
        // Set rests
        seconds += Math.max(ex.setCount - 1, 0) * ex.restBetweenSets;
        total += seconds;

        // Remaining sets estimate based on current position in queue
        const remainingSets = estimateRemainingSets(index, ex.setCount);
        perExercise.push({ seconds, remainingSets });
    });

    // Add program rests between exercises based on current default/custom
    for (let i = 0; i < currentProgram.exercises.length - 1; i++) {
        total += getRestDurationForExercise(i) || 0;
    }

    return { totalSeconds: total, perExercise };
}

function getProgramIndexForExercise(exerciseIndex) {
    for (let i = 0; i < programTimerQueue.length; i++) {
        const step = programTimerQueue[i];
        if (step.exerciseIndex === exerciseIndex && step.type === 'Exercise Move') {
            return i;
        }
    }
    return -1;
}

function getProgramIndexForExerciseSet(exerciseIndex, setNumber) {
    for (let i = 0; i < programTimerQueue.length; i++) {
        const step = programTimerQueue[i];
        if (step.exerciseIndex === exerciseIndex && step.set === setNumber && step.type === 'Exercise Move') {
            return i;
        }
    }
    return -1;
}

// Skip only the current set: jump to the first step of the next set for the same exercise,
// or the first step of the next exercise if no more sets remain.
function skipCurrentSetProgram() {
    if (!programTimerRunning) return;
    const currentStep = programTimerQueue[programTimerIndex];
    if (!currentStep) return;
    const currentExercise = currentStep.exerciseIndex;
    const currentSet = currentStep.set || 1;
    // Find the first step with same exercise and higher set, else next exercise
    let targetIndex = -1;
    for (let i = programTimerIndex + 1; i < programTimerQueue.length; i++) {
        const step = programTimerQueue[i];
        if (step.exerciseIndex === currentExercise && (step.set || 1) > currentSet && step.type === 'Exercise Move') {
            targetIndex = i; break;
        }
        if (step.exerciseIndex > currentExercise && step.type === 'Exercise Move') {
            // next exercise start
            targetIndex = i; break;
        }
    }
    if (targetIndex === -1) {
        // go to end
        targetIndex = programTimerQueue.length - 1;
    }
    clearInterval(programTimer);
    programTimerIndex = targetIndex;
    runProgramTimerStep();
}

function jumpToExercise(exerciseIndex) {
    if (!currentProgram || !programTimerQueue.length) return;
    const idx = getProgramIndexForExercise(exerciseIndex);
    if (idx >= 0) {
        clearInterval(programTimer);
        programTimerIndex = idx;
        programTimerRunning = true;
        programTimerPaused = false;
        runProgramTimerStep();
    }
}

function jumpToExerciseSet(exerciseIndex, setNumber) {
    if (!currentProgram || !programTimerQueue.length) return;
    const idx = getProgramIndexForExerciseSet(exerciseIndex, setNumber);
    if (idx >= 0) {
        clearInterval(programTimer);
        programTimerIndex = idx;
        programTimerRunning = true;
        programTimerPaused = false;
        runProgramTimerStep();
    }
}

function formatMinutesSeconds(totalSeconds) {
    const minutes = Math.floor((totalSeconds || 0) / 60);
    const seconds = Math.max(0, (totalSeconds || 0) % 60);
    return { minutes, seconds };
}

function computeRemainingTime() {
    let remaining = 0;
    for (let i = programTimerIndex; i < programTimerQueue.length; i++) {
        const step = programTimerQueue[i];
        if (step && typeof step.duration === 'number') remaining += step.duration;
    }
    return remaining;
}

function isExerciseCompleted(exerciseIndex) {
    // If the next queued step belongs to a later exercise, this one is done
    const current = programTimerQueue[programTimerIndex];
    if (!current) return false;
    return exerciseIndex < current.exerciseIndex;
}

function estimateRemainingSets(exerciseIndex, totalSets) {
    const current = programTimerQueue[programTimerIndex];
    if (!current) return totalSets;
    if (current.exerciseIndex > exerciseIndex) return 0;
    if (current.exerciseIndex < exerciseIndex) return totalSets;
    // Same exercise: remaining including current set
    return Math.max(totalSets - (current.set || 1) + 1, 0);
}

// Drag and Drop Functions
function renderExercisesOrder() {
    const container = document.getElementById('exercisesOrderList');
    const noExercisesMessage = document.getElementById('noExercisesMessage');
    
    if (!currentProgram || currentProgram.exercises.length === 0) {
        container.innerHTML = '';
        noExercisesMessage.classList.remove('hidden');
        return;
    }
    
    noExercisesMessage.classList.add('hidden');
    container.innerHTML = '';
    
    // Create roadmap container
    const roadmapContainer = document.createElement('div');
    roadmapContainer.className = 'exercise-roadmap';
    
    currentProgram.exercises.forEach((exercise, index) => {
        // Create roadmap item container
        const roadmapItem = document.createElement('div');
        roadmapItem.className = 'exercise-roadmap-item';
        
        // Create exercise card
        const div = document.createElement('div');
        div.className = 'exercise-order-item draggable-item';
        div.draggable = true;
        div.dataset.index = index;
        
        // Calculate total duration for this exercise
        const totalSets = exercise.setCount;
        const totalReps = exercise.repCount;
        const totalMoves = exercise.moves.length;
        const moveDuration = exercise.moves.reduce((sum, move) => sum + move.duration, 0);
        const setRestDuration = exercise.restBetweenSets || 0;
        const moveRestDuration = exercise.restBetweenMoves || 0;
        
        const totalDuration = (totalSets * totalReps * moveDuration) + 
                            (totalSets - 1) * setRestDuration + 
                            (totalSets * totalReps * totalMoves - 1) * moveRestDuration;
        
        const minutes = Math.floor(totalDuration / 60);
        const seconds = totalDuration % 60;
        const durationText = minutes > 0 ? `${minutes}d ${seconds}s` : `${seconds}s`;
        
        div.innerHTML = `
            <div class="exercise-number">${index + 1}</div>
            <div class="exercise-info">
                <div class="exercise-title">${exercise.name}</div>
                <div class="exercise-stats">
                    <div class="stat-item">
                        <i class="fas fa-layer-group text-blue-400"></i>
                        <span>${exercise.setCount} set</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-redo text-green-400"></i>
                        <span>${exercise.repCount} rep</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-clock text-yellow-400"></i>
                        <span>~${durationText}</span>
                    </div>
                </div>

            </div>
            <div class="exercise-actions">
                <button onclick="openExerciseDetail(${index})" class="bg-white/10 text-white hover:bg-white/20 transition-all duration-300" title="Edit Exercise">
                    <i class="fas fa-cog"></i>
                </button>
                <button onclick="removeExerciseFromOrder(${index})" class="bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-300" title="Delete Exercise">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add drag event listeners
        div.addEventListener('dragstart', handleDragStart);
        div.addEventListener('dragend', handleDragEnd);
        div.addEventListener('dragover', handleDragOver);
        div.addEventListener('drop', handleDrop);
        div.addEventListener('dragenter', function(e) {
            e.preventDefault();
        });
        div.addEventListener('dragleave', function(e) {
            e.preventDefault();
            if (!this.contains(e.relatedTarget)) {
                this.classList.remove('drag-over');
            }
        });
        
        // Add exercise card to roadmap item
        roadmapItem.appendChild(div);
        
        // Add arrow and rest card if not last item
        if (index < currentProgram.exercises.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'exercise-roadmap-arrow';
            roadmapItem.appendChild(arrow);
            
            // Add rest duration card between exercises
            const restCard = document.createElement('div');
            restCard.className = 'rest-duration-card';
            restCard.dataset.exerciseIndex = index;
            restCard.onclick = () => openRestEditModal(index);
            
            // Get rest duration for this exercise
            const restDuration = getRestDurationForExercise(index);
            const minutes = Math.floor(restDuration / 60);
            const seconds = restDuration % 60;
            const durationText = minutes > 0 ? `${minutes} minutes` : `${seconds} seconds`;
            
            restCard.innerHTML = `
                <i class="fas fa-pause rest-icon"></i>
                <div class="rest-text">Exercise Rest</div>
                <div class="rest-duration">${durationText}</div>
            `;
            
            roadmapItem.appendChild(restCard);
        }
        
        roadmapContainer.appendChild(roadmapItem);
    });
    
    container.appendChild(roadmapContainer);
}

function handleDragStart(e) {
    draggedElement = this;
    draggedIndex = parseInt(this.dataset.index);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedElement = null;
    draggedIndex = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Remove drag-over class from all items
    document.querySelectorAll('.exercise-order-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    
    // Add drag-over class to current item
    this.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    
    // Remove drag-over class from all items
    document.querySelectorAll('.exercise-order-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    
    if (draggedElement && draggedIndex !== null) {
        const dropIndex = parseInt(this.dataset.index);
        
        if (draggedIndex !== dropIndex) {
            // Reorder exercises
            const exercises = currentProgram.exercises;
            const draggedExercise = exercises[draggedIndex];
            
            // Remove from old position
            exercises.splice(draggedIndex, 1);
            
            // Insert at new position
            exercises.splice(dropIndex, 0, draggedExercise);
            
            // Save and re-render
            saveAllPrograms();
            renderExercisesOrder();
            renderExercises();
            
            showNotification('Exercise order updated!', 'success');
        }
    }
}

function removeExerciseFromOrder(index) {
    if (confirm('Are you sure you want to remove this exercise from the program?')) {
        currentProgram.exercises.splice(index, 1);
        saveAllPrograms();
        renderExercisesOrder();
        renderExercises();
        showNotification('Exercise removed from program!', 'success');
    }
}

// Initialize program rest color selection
function initProgramRestColorSelection() {
    const colorButtons = document.querySelectorAll('.program-rest-color-option');
    
    colorButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const color = this.dataset.color;
            
            // Remove active class from all buttons
            document.querySelectorAll('.program-rest-color-option').forEach(b => {
                b.classList.remove('ring-2', 'ring-white');
            });
            
            // Add active class to clicked button
            this.classList.add('ring-2', 'ring-white');
            
            showNotification('Program rest color changed!', 'success');
        });
    });
}

    // Rest duration editing functions
let currentEditingRestIndex = -1;

function openRestEditModal(exerciseIndex) {
    currentEditingRestIndex = exerciseIndex;
    const modal = document.getElementById('restEditModal');
    const input = document.getElementById('restEditInput');
    
    // Get current rest duration
    const currentDuration = getRestDurationForExercise(exerciseIndex);
    const minutes = Math.floor(currentDuration / 60);
    const seconds = currentDuration % 60;
    
    // Set current value in input
    if (minutes > 0) {
        input.value = `${minutes} minutes`;
    } else {
        input.value = `${seconds} seconds`;
    }
    
    modal.classList.add('active');
    input.focus();
}

function closeRestEditModal() {
    const modal = document.getElementById('restEditModal');
    modal.classList.remove('active');
    currentEditingRestIndex = -1;
}

function saveRestDuration() {
    if (currentEditingRestIndex === -1) return;
    
    const input = document.getElementById('restEditInput');
    const durationText = input.value.trim();
    
    if (!durationText) {
        alert('Please enter a duration');
        return;
    }
    
    const durationInSeconds = parseTimeInput(durationText);
    if (durationInSeconds === null) {
        alert('Invalid duration format. Examples: 1 minute, 30 seconds, 1 min, 30 sec');
        return;
    }
    
    // Store custom rest duration for this exercise
    if (!currentProgram.customRestDurations) {
        currentProgram.customRestDurations = {};
    }
    currentProgram.customRestDurations[currentEditingRestIndex] = durationInSeconds;
    
    // Save to localStorage
    saveAllPrograms();
    
    // Re-render exercises to update the display
    renderExercisesOrder();
    
    closeRestEditModal();
    showNotification('Rest duration updated!', 'success');
}

function getRestDurationForExercise(exerciseIndex) {
    // Check if there's a custom duration for this exercise
    if (currentProgram.customRestDurations && currentProgram.customRestDurations[exerciseIndex] !== undefined) {
        return currentProgram.customRestDurations[exerciseIndex];
    }
    
    // Otherwise use the default rest duration from the input
    const defaultDurationInput = document.getElementById('exerciseRestDuration');
    if (defaultDurationInput) {
        const defaultText = defaultDurationInput.value.trim();
        if (defaultText) {
            const input = defaultText.toLowerCase();
            
            // Check for various time formats
            if (input.includes('minute') || input.includes('min')) {
                const minutes = parseFloat(input.match(/\d+/)?.[0] || 1);
                return minutes * 60;
            } else if (input.includes('second') || input.includes('sec')) {
                return parseInt(input.match(/\d+/)?.[0] || 60);
            } else {
                // Try to parse as number (assume seconds if no unit specified)
                const num = parseInt(input);
                if (!isNaN(num)) {
                    return num;
                }
            }
        }
    }
    
    return 60; // Default fallback
}

function parseTimeInput(input) {
    const text = input.toLowerCase().trim();
    
    // Match patterns like "1 minute", "30 seconds", "1 min", "30 sec"
    const patterns = [
        /^(\d+)\s*minute?s?$/,
        /^(\d+)\s*min$/,
        /^(\d+)\s*second?s?$/,
        /^(\d+)\s*sec$/
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const value = parseInt(match[1]);
            if (text.includes('minute') || text.includes('min')) {
                return value * 60;
            } else {
                return value;
            }
        }
    }
    
    return null;
}

// Make functions globally available
window.startProgramTimer = startProgramTimer;
window.pauseProgramTimer = pauseProgramTimer;
window.resumeProgramTimer = resumeProgramTimer;
window.stopProgramTimer = stopProgramTimer;
window.restartProgramTimer = restartProgramTimer;
window.skipProgramExercise = skipProgramExercise;
window.skipProgramRest = skipProgramRest;
window.renderExercisesOrder = renderExercisesOrder;
window.removeExerciseFromOrder = removeExerciseFromOrder;
window.initProgramRestColorSelection = initProgramRestColorSelection;
window.openRestEditModal = openRestEditModal;
window.closeRestEditModal = closeRestEditModal;
window.saveRestDuration = saveRestDuration; 

// -----------------------------
// Program Audio Settings (Modal)
// -----------------------------
function openProgramAudioSettings() {
    const modal = document.getElementById('programAudioSettingsModal');
    if (!modal) return;
    // Populate selects with audio options
    const options = Object.keys(audioSounds || {}).map(k => `<option value="${k}">${k[0].toUpperCase()+k.slice(1)}</option>`).join('');
    const moveSel = document.getElementById('program_moveEndSound');
    const restSel = document.getElementById('program_restEndSound');
    const setSel = document.getElementById('program_setEndSound');
    const exSel = document.getElementById('program_exerciseEndSound');
    [moveSel, restSel, setSel, exSel].forEach(sel => { if (sel && !sel.innerHTML.trim()) sel.innerHTML = options; });
    // Set current values from audioSettings
    if (moveSel) moveSel.value = audioSettings.moveEnd || 'beep';
    if (restSel) restSel.value = audioSettings.restEnd || 'bell';
    if (setSel) setSel.value = audioSettings.setEnd || 'chime';
    if (exSel) exSel.value = audioSettings.exerciseEnd || 'success';
    modal.classList.remove('hidden');
}

function closeProgramAudioSettings() {
    const modal = document.getElementById('programAudioSettingsModal');
    if (!modal) return;
    modal.classList.add('hidden');
}

function saveProgramAudioSettingsFromForm() {
    const moveSel = document.getElementById('program_moveEndSound');
    const restSel = document.getElementById('program_restEndSound');
    const setSel = document.getElementById('program_setEndSound');
    const exSel = document.getElementById('program_exerciseEndSound');
    if (moveSel) audioSettings.moveEnd = moveSel.value;
    if (restSel) audioSettings.restEnd = restSel.value;
    if (setSel) audioSettings.setEnd = setSel.value;
    if (exSel) audioSettings.exerciseEnd = exSel.value;
    saveAudioSettings();
    showNotification('Program audio settings saved!', 'success');
    closeProgramAudioSettings();
}

window.openProgramAudioSettings = openProgramAudioSettings;
window.closeProgramAudioSettings = closeProgramAudioSettings;
window.saveProgramAudioSettingsFromForm = saveProgramAudioSettingsFromForm;