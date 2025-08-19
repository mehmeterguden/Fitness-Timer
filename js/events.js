// ========================================
// EVENT LISTENERS
// ========================================

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load all programs and settings
    loadAllPrograms();
    loadAudioSettings();
    loadColorSettings();
    renderProgramsDropdown();
    
    // Program creation
    document.getElementById('createProgramBtn').addEventListener('click', createProgram);
    
    // Exercise management
    document.getElementById('addExerciseBtn').addEventListener('click', addExercise);
    document.getElementById('saveExercise').addEventListener('click', saveExercise);
    document.getElementById('startExercise').addEventListener('click', startExercise);
    
    // Navigation
    document.getElementById('backToProgram').addEventListener('click', backToProgram);
    document.getElementById('backToHome').addEventListener('click', backToHome);
    
    // Timer navigation
    document.getElementById('backToExercise').addEventListener('click', backToExercise);
    document.getElementById('backToExerciseBtn').addEventListener('click', backToExercise);
    
    // Dropdown management - Home
    document.getElementById('programsBtn').addEventListener('click', toggleProgramsDropdown);
    document.getElementById('newProgramBtn').addEventListener('click', function() {
        toggleProgramsDropdown();
        document.getElementById('programName').focus();
    });
    
    // Dropdown management - Program page
    document.getElementById('programsBtnProgram').addEventListener('click', toggleProgramsDropdownProgram);
    document.getElementById('newProgramBtnProgram').addEventListener('click', function() {
        toggleProgramsDropdownProgram();
        showPage('homePage');
        document.getElementById('programName').focus();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        // Home page dropdown
        const dropdown = document.getElementById('programsDropdown');
        const menu = document.getElementById('programsMenu');
        const btn = document.getElementById('programsBtn');
        
        if (dropdown && !dropdown.contains(e.target)) {
            menu.classList.add('invisible', 'opacity-0', 'translate-y-2');
            menu.classList.remove('opacity-100');
            btn.querySelector('.fa-chevron-down').style.transform = 'rotate(0deg)';
        }
        
        // Program page dropdown
        const dropdownProgram = document.getElementById('programsDropdownProgram');
        const menuProgram = document.getElementById('programsMenuProgram');
        const btnProgram = document.getElementById('programsBtnProgram');
        
        if (dropdownProgram && !dropdownProgram.contains(e.target)) {
            menuProgram.classList.add('invisible', 'opacity-0', 'translate-y-2');
            menuProgram.classList.remove('opacity-100');
            btnProgram.querySelector('.fa-chevron-down').style.transform = 'rotate(0deg)';
        }
    });
    
    // Exercise flow updates
    const exerciseInputs = ['setCount', 'repCount', 'moveCount', 'restBetweenMoves', 'restBetweenSets', 'restBetweenMovesEnabled'];
    exerciseInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('input', updateExerciseFlow);
            element.addEventListener('change', updateExerciseFlow);
        }
    });
    
    // Move count change
    document.getElementById('moveCount').addEventListener('change', function() {
        createMoveFields();
        updateExerciseFlow();
    });
    
    // Rest between moves toggle
    document.getElementById('restBetweenMovesEnabled').addEventListener('change', function() {
        toggleRestBetweenMoves();
        updateExerciseFlow();
    });
    
    // Enter key for exercise input
    document.getElementById('exerciseNameInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addExercise();
        }
    });
    
    // Enter key for program name input
    document.getElementById('programName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            createProgram();
        }
    });
    
    // Timer Controls
    document.getElementById('playPauseBtn').addEventListener('click', function() {
        if (!timerRunning) {
            startTimer();
        } else if (timerPaused) {
            resumeTimer();
        } else {
            pauseTimer();
        }
        updatePlayPauseButton();
    });
    
    document.getElementById('stopBtn').addEventListener('click', stopTimer);
    document.getElementById('restartBtn').addEventListener('click', restartTimer);
    document.getElementById('skipMoveBtn').addEventListener('click', skipMove);
    document.getElementById('skipRepBtn').addEventListener('click', skipToNextRep);
    document.getElementById('skipSetBtn').addEventListener('click', skipToNextSet);
    document.getElementById('skipSetRestBtn').addEventListener('click', skipSetRest);
    
    // Timer Settings
    document.getElementById('timerSettingsBtn').addEventListener('click', openTimerSettings);
    document.getElementById('closeSettingsBtn').addEventListener('click', closeTimerSettings);
    // Optional: testSoundBtn may not exist in the DOM; guard before adding listener
    const testSoundEl = document.getElementById('testSoundBtn');
    if (testSoundEl) {
        testSoundEl.addEventListener('click', testSound);
    }
    document.getElementById('saveAudioSettingsBtn').addEventListener('click', saveAudioSettingsFromForm);
    
    // Audio settings change with live test
    document.getElementById('moveEndSound').addEventListener('change', function() {
        updateAudioSetting('moveEnd', this.value);
    });
    
    document.getElementById('restEndSound').addEventListener('change', function() {
        updateAudioSetting('restEnd', this.value);
    });
    
    document.getElementById('setEndSound').addEventListener('change', function() {
        updateAudioSetting('setEnd', this.value);
    });
    
    document.getElementById('exerciseEndSound').addEventListener('change', function() {
        updateAudioSetting('exerciseEnd', this.value);
    });
    
    // Sound preview buttons
    document.querySelectorAll('.preview-sound-btn').forEach(button => {
        button.addEventListener('click', function() {
            const soundSelect = document.getElementById(this.dataset.sound);
            playSound(soundSelect.value);
        });
    });
    
    // Color selection for moves
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('move-color-option')) {
            const color = e.target.dataset.color;
            const moveIndex = parseInt(e.target.dataset.move) - 1;
            
            // Remove active class from all buttons in this move group
            document.querySelectorAll(`[data-move="${e.target.dataset.move}"]`).forEach(btn => {
                btn.classList.remove('ring-4', 'ring-white');
            });
            
            // Add active class to clicked button
            e.target.classList.add('ring-4', 'ring-white');
            
            // Update exercise color
            if (currentProgram && currentExerciseIndex !== null) {
                const exercise = currentProgram.exercises[currentExerciseIndex];
                if (exercise.moves[moveIndex]) {
                    exercise.moves[moveIndex].color = color;
                }
            }
            
            // Show immediate feedback
            showNotification(`Move ${moveIndex + 1} color updated!`, 'success');
        }
        
        if (e.target.classList.contains('rest-color-option')) {
            const color = e.target.dataset.color;
            
            // Remove active class from all rest color buttons
            document.querySelectorAll('.rest-color-option').forEach(btn => {
                btn.classList.remove('ring-4', 'ring-white');
            });
            
            // Add active class to clicked button
            e.target.classList.add('ring-4', 'ring-white');
            
            // Update exercise rest color
            if (currentProgram && currentExerciseIndex !== null) {
                const exercise = currentProgram.exercises[currentExerciseIndex];
                exercise.restColor = color;
            }
            
            // Show immediate feedback
            showNotification('Rest color updated!', 'success');
        }
        
        if (e.target.classList.contains('set-rest-color-option')) {
            const color = e.target.dataset.color;
            
            // Remove active class from all set rest color buttons
            document.querySelectorAll('.set-rest-color-option').forEach(btn => {
                btn.classList.remove('ring-4', 'ring-white');
            });
            
            // Add active class to clicked button
            e.target.classList.add('ring-4', 'ring-white');
            
            // Update exercise set rest color
            if (currentProgram && currentExerciseIndex !== null) {
                const exercise = currentProgram.exercises[currentExerciseIndex];
                exercise.setRestColor = color;
            }
            
            // Show immediate feedback
            showNotification('Set rest color updated!', 'success');
        }
    });
    
    // Close settings modal when clicking outside
    document.getElementById('timerSettingsModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeTimerSettings();
        }
    });
    

    
    // Load audio settings into form
    loadAudioSettingsToForm();
    
    // Program Timer Controls
    document.getElementById('startProgramBtn').addEventListener('click', startProgramTimer);
    document.getElementById('programPlayPauseBtn').addEventListener('click', function() {
        if (!programTimerRunning) {
            startProgramTimer();
        } else if (programTimerPaused) {
            resumeProgramTimer();
        } else {
            pauseProgramTimer();
        }
        updateProgramPlayPauseButton();
    });
    
    document.getElementById('programRestartBtn').addEventListener('click', restartProgramTimer);
    document.getElementById('skipExerciseBtn').addEventListener('click', skipProgramExercise);
    document.getElementById('skipExerciseRestBtn').addEventListener('click', skipProgramRest);
    const skipSetRestBtnProgram = document.getElementById('skipSetRestBtnProgram');
    if (skipSetRestBtnProgram) {
        skipSetRestBtnProgram.addEventListener('click', skipProgramSetRest);
    }
    const skipSetBtnProgram = document.getElementById('skipSetBtnProgram');
    if (skipSetBtnProgram) {
        skipSetBtnProgram.addEventListener('click', function() {
            if (typeof skipCurrentSetProgram === 'function') skipCurrentSetProgram();
        });
    }

    // Prev/Next step controls
    document.getElementById('programPrevBtn').addEventListener('click', function() {
        if (typeof stepProgramBackward === 'function') stepProgramBackward();
    });
    document.getElementById('programNextBtn').addEventListener('click', function() {
        if (typeof stepProgramForward === 'function') stepProgramForward();
    });

    // Program Audio Settings
    const programAudioBtn = document.getElementById('programAudioSettingsBtn');
    const programAudioModal = document.getElementById('programAudioSettingsModal');
    const programAudioClose = document.getElementById('closeProgramAudioSettingsBtn');
    const programAudioSave = document.getElementById('saveProgramAudioSettingsBtn');
    if (programAudioBtn) {
        programAudioBtn.addEventListener('click', function() {
            openProgramAudioSettings();
        });
    }
    if (programAudioClose) {
        programAudioClose.addEventListener('click', function() {
            closeProgramAudioSettings();
        });
    }
    if (programAudioModal) {
        programAudioModal.addEventListener('click', function(e) {
            if (e.target === programAudioModal) closeProgramAudioSettings();
        });
    }
    if (programAudioSave) {
        programAudioSave.addEventListener('click', function() {
            saveProgramAudioSettingsFromForm();
        });
    }
    // Preview buttons
    document.querySelectorAll('.program-preview-sound-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const select = document.getElementById(this.dataset.target);
            if (select) playSound(select.value);
        });
    });
    // Keyboard shortcuts (global)
    document.addEventListener('keydown', function(e) {
        const active = document.activeElement;
        const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
        if (isTyping) return;

        if (e.code === 'Space') {
            e.preventDefault();
            if (!programTimerRunning) {
                startProgramTimer();
            } else if (programTimerPaused) {
                resumeProgramTimer();
            } else {
                pauseProgramTimer();
            }
            updateProgramPlayPauseButton();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (typeof stepProgramBackward === 'function') stepProgramBackward();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (typeof stepProgramForward === 'function') stepProgramForward();
        }
    });

    // Summary panel interactions (jumping to exercise / set)
    document.getElementById('programSummaryWrapper').addEventListener('click', function(e) {
        const exerciseJump = e.target.closest('.exercise-jump');
        const setChip = e.target.closest('.exercise-set-chip');
        if (setChip) {
            const exerciseIndex = parseInt(setChip.dataset.exerciseIndex);
            const setNumber = parseInt(setChip.dataset.set);
            if (!isNaN(exerciseIndex) && !isNaN(setNumber)) {
                if (typeof jumpToExerciseSet === 'function') {
                    jumpToExerciseSet(exerciseIndex, setNumber);
                }
            }
            return;
        }
        if (exerciseJump) {
            const exerciseIndex = parseInt(exerciseJump.dataset.exerciseIndex);
            if (!isNaN(exerciseIndex)) {
                if (typeof jumpToExercise === 'function') {
                    jumpToExercise(exerciseIndex);
                }
            }
        }
    });
    
    // Program Timer Navigation
    document.getElementById('backToProgramFromTimer').addEventListener('click', backToProgramFromTimer);
    document.getElementById('backToProgramBtn').addEventListener('click', backToProgramFromTimer);
    
    // Initialize program rest color selection
    initProgramRestColorSelection();
    
    // Initialize rest duration options
    initRestDurationOptions();
    
    // Initialize rest edit modal events
    initRestEditModalEvents();
    
    // Test color selection functionality
    setTimeout(() => {
        console.log('Testing color selection...');
        const restButtons = document.querySelectorAll('.rest-color-option');
        const setRestButtons = document.querySelectorAll('.set-rest-color-option');
        const moveButtons = document.querySelectorAll('.move-color-option');
        
        console.log('Found rest color buttons:', restButtons.length);
        console.log('Found set rest color buttons:', setRestButtons.length);
        console.log('Found move color buttons:', moveButtons.length);
        
        // Add direct event listeners to ensure they work
        restButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const color = this.dataset.color;
                console.log('Rest color clicked:', color);
                
                // Remove active class from all rest color buttons
                document.querySelectorAll('.rest-color-option').forEach(b => {
                    b.classList.remove('ring-4', 'ring-white');
                });
                
                // Add active class to clicked button
                this.classList.add('ring-4', 'ring-white');
                
                // Update exercise rest color
                if (currentProgram && currentExerciseIndex !== null) {
                    const exercise = currentProgram.exercises[currentExerciseIndex];
                    exercise.restColor = color;
                }
                
                // Show immediate feedback
                showNotification('Rest color updated!', 'success');
            });
        });
        
        setRestButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const color = this.dataset.color;
                console.log('Set rest color clicked:', color);
                
                // Remove active class from all set rest color buttons
                document.querySelectorAll('.set-rest-color-option').forEach(b => {
                    b.classList.remove('ring-4', 'ring-white');
                });
                
                // Add active class to clicked button
                this.classList.add('ring-4', 'ring-white');
                
                // Update exercise set rest color
                if (currentProgram && currentExerciseIndex !== null) {
                    const exercise = currentProgram.exercises[currentExerciseIndex];
                    exercise.setRestColor = color;
                }
                
                // Show immediate feedback
                showNotification('Set rest color updated!', 'success');
            });
        });
        
        moveButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const color = this.dataset.color;
                const moveIndex = parseInt(this.dataset.move) - 1;
                console.log('Move color clicked:', color, 'for move:', moveIndex + 1);
                
                // Remove active class from all buttons in this move group
                document.querySelectorAll(`[data-move="${this.dataset.move}"]`).forEach(b => {
                    b.classList.remove('ring-4', 'ring-white');
                });
                
                // Add active class to clicked button
                this.classList.add('ring-4', 'ring-white');
                
                // Update exercise color
                if (currentProgram && currentExerciseIndex !== null) {
                    const exercise = currentProgram.exercises[currentExerciseIndex];
                    if (exercise.moves[moveIndex]) {
                        exercise.moves[moveIndex].color = color;
                    }
                }
                
                // Show immediate feedback
                showNotification(`Move ${moveIndex + 1} color updated!`, 'success');
            });
        });
    }, 1000);
});

// Toggle exercise flow visibility
function toggleExerciseFlow() {
    const flowElement = document.getElementById('exerciseFlow');
    const toggleIcon = document.getElementById('exerciseFlowToggle');
    
    if (flowElement.classList.contains('hidden')) {
        flowElement.classList.remove('hidden');
        toggleIcon.style.transform = 'rotate(180deg)';
        updateExerciseFlow();
    } else {
        flowElement.classList.add('hidden');
        toggleIcon.style.transform = 'rotate(0deg)';
    }
}

// Update play/pause button
function updatePlayPauseButton() {
    const btn = document.getElementById('playPauseBtn');
    const icon = btn.querySelector('i');
    const text = btn.querySelector('span');
    
    if (!timerRunning) {
        icon.className = 'fas fa-play';
        text.textContent = 'Start';
        btn.className = 'py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center space-x-2';
    } else if (timerPaused) {
        icon.className = 'fas fa-play';
        text.textContent = 'Resume';
        btn.className = 'py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center space-x-2';
    } else {
        icon.className = 'fas fa-pause';
        text.textContent = 'Pause';
        btn.className = 'py-4 px-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center space-x-2';
    }
}

// Update timer status
function updateTimerStatus() {
    const statusElement = document.getElementById('currentPosition');
    if (statusElement && timerRunning) {
        statusElement.textContent = `Set ${currentSet} - Rep ${currentRep}`;
    }
    
    // Update skip button states
    updateSkipButtonStates();
}

// Update skip button states based on current timer state
function updateSkipButtonStates() {
    if (!timerRunning) {
        // Disable all skip buttons when timer is not running
        document.getElementById('skipMoveBtn').disabled = true;
        document.getElementById('skipRepBtn').disabled = true;
        document.getElementById('skipSetBtn').disabled = true;
        document.getElementById('skipSetRestBtn').disabled = true;
        return;
    }
    
    // Enable all skip buttons when timer is running
    document.getElementById('skipMoveBtn').disabled = false;
    document.getElementById('skipRepBtn').disabled = false;
    document.getElementById('skipSetBtn').disabled = false;
    document.getElementById('skipSetRestBtn').disabled = false;
}

// Open timer settings
function openTimerSettings() {
    document.getElementById('timerSettingsModal').classList.remove('hidden');
    loadAudioSettingsToForm();
}

// Close timer settings
function closeTimerSettings() {
    document.getElementById('timerSettingsModal').classList.add('hidden');
}

// Load audio settings to form
function loadAudioSettingsToForm() {
    document.getElementById('moveEndSound').value = audioSettings.moveEnd;
    document.getElementById('restEndSound').value = audioSettings.restEnd;
    document.getElementById('setEndSound').value = audioSettings.setEnd;
    document.getElementById('exerciseEndSound').value = audioSettings.exerciseEnd;
}



// Test sound
function testSound() {
    const moveEndSound = document.getElementById('moveEndSound').value;
    playSound(moveEndSound);
}

// Save audio settings
function saveAudioSettingsFromForm() {
    audioSettings.moveEnd = document.getElementById('moveEndSound').value;
    audioSettings.restEnd = document.getElementById('restEndSound').value;
    audioSettings.setEnd = document.getElementById('setEndSound').value;
    audioSettings.exerciseEnd = document.getElementById('exerciseEndSound').value;
    
    // Call the timer.js saveAudioSettings function
    saveAudioSettings();
    showNotification('Settings saved!', 'success');
    closeTimerSettings();
}

// Back to exercise from timer
function backToExercise() {
    if (timerRunning) {
        if (confirm('The timer is running. Are you sure you want to stop it?')) {
            stopTimer();
        }
    } else {
        showPage('exerciseDetailPage');
    }
}

// Initialize rest duration options
function initRestDurationOptions() {
    const durationButtons = document.querySelectorAll('.rest-duration-option');
    
    durationButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const duration = parseInt(this.dataset.duration);
            
            // Remove active class from all buttons
            document.querySelectorAll('.rest-duration-option').forEach(b => {
                b.classList.remove('bg-gradient-to-r', 'from-blue-500', 'to-purple-500', 'ring-2', 'ring-blue-300');
                b.classList.add('bg-white/10');
            });
            
            // Add active class to clicked button
            this.classList.remove('bg-white/10');
            this.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-purple-500', 'ring-2', 'ring-blue-300');
            
            // Update the custom input field
            const customInput = document.getElementById('exerciseRestDuration');
            if (duration === 10) {
                customInput.value = '10 seconds';
            } else if (duration === 30) {
                customInput.value = '30 seconds';
            } else if (duration === 60) {
                customInput.value = '1 minute';
            } else if (duration === 180) {
                customInput.value = '3 minutes';
            } else if (duration === 300) {
                customInput.value = '5 minutes';
            }
            
            // Update rest cards if they exist
            if (typeof renderExercisesOrder === 'function') {
                renderExercisesOrder();
            }
            
            showNotification('Rest duration updated!', 'success');
        });
    });
    
    // Handle custom input changes
    const customInput = document.getElementById('exerciseRestDuration');
    if (customInput) {
        customInput.addEventListener('input', function() {
            // Remove active class from all buttons when user types custom value
            document.querySelectorAll('.rest-duration-option').forEach(b => {
                b.classList.remove('bg-gradient-to-r', 'from-blue-500', 'to-purple-500', 'ring-2', 'ring-blue-300');
                b.classList.add('bg-white/10');
            });
        });
        
        // Also handle Enter key for custom input
        customInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                showNotification('Rest duration updated!', 'success');
            }
        });
    }
}

// Initialize rest edit modal events
function initRestEditModalEvents() {
    const modal = document.getElementById('restEditModal');
    const saveBtn = document.getElementById('restEditSave');
    const cancelBtn = document.getElementById('restEditCancel');
    const input = document.getElementById('restEditInput');
    
    // Save button click
    saveBtn.addEventListener('click', saveRestDuration);
    
    // Cancel button click
    cancelBtn.addEventListener('click', closeRestEditModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeRestEditModal();
        }
    });
    
    // Handle Enter key in input
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveRestDuration();
        }
    });
    
    // Handle Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeRestEditModal();
        }
    });
}



// Back to program from timer
function backToProgramFromTimer() {
    if (programTimerRunning) {
        if (confirm('The program timer is running. Are you sure you want to stop it?')) {
            stopProgramTimer();
        }
    } else {
        showPage('programPage');
    }
}

// Make functions globally available
window.openExerciseDetail = openExerciseDetail;
window.loadProgram = loadProgram;
window.deleteProgram = deleteProgram;
window.updatePlayPauseButton = updatePlayPauseButton;
window.updateTimerStatus = updateTimerStatus;
window.updateSkipButtonStates = updateSkipButtonStates;
window.openTimerSettings = openTimerSettings;
window.closeTimerSettings = closeTimerSettings;
window.backToExercise = backToExercise;
window.backToProgramFromTimer = backToProgramFromTimer;
window.initRestDurationOptions = initRestDurationOptions;
window.toggleExerciseFlow = toggleExerciseFlow;
window.toggleProgramsDropdown = toggleProgramsDropdown;
window.toggleProgramsDropdownProgram = toggleProgramsDropdownProgram; 