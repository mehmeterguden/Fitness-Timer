// ========================================
// EXERCISE MANAGEMENT
// ========================================

// Global Variables
let currentProgram = null;
let currentExerciseIndex = null;

// Add new exercise
function addExercise() {
    if (!currentProgram) {
        showNotification('Please select a program first!', 'error');
        return;
    }
    
    const exerciseName = document.getElementById('exerciseNameInput').value.trim();
    if (!exerciseName) {
        showNotification('Please enter an exercise name!', 'error');
        return;
    }

    const exercise = {
        name: exerciseName,
        setCount: 2,
        repCount: 10,
        moveCount: 1,
        moves: [
            {
                name: "1. Move",
                duration: 3,
                color: 'blue'
            }
        ],
        restBetweenMoves: 0,
        restBetweenSets: 30,
        restBetweenMovesEnabled: false,
        moveColor: 'blue',
        restColor: 'green',
        setRestColor: 'orange'
    };

    currentProgram.exercises.push(exercise);
    saveAllPrograms();
    renderExercises();
    document.getElementById('exerciseNameInput').value = '';
    document.getElementById('exerciseNameInput').focus();
    
    showNotification('Exercise added successfully!', 'success');
}

// Render exercises list
function renderExercises() {
    // Only render the exercises order list since we combined them
    renderExercisesOrder();
    // Make exercise title clickable for opening detail
    setTimeout(() => {
        document.querySelectorAll('#exercisesOrderList .exercise-title').forEach((el, idx) => {
            el.style.cursor = 'pointer';
            el.addEventListener('click', (e) => {
                openExerciseDetail(idx);
            });
        });
    }, 0);
}

// Create move input fields
function createMoveFields() {
    const moveCount = parseInt(document.getElementById('moveCount').value) || 1;
    const container = document.getElementById('movesList');
    container.innerHTML = '';
    const exercise = currentProgram.exercises[currentExerciseIndex];
    
    for (let i = 1; i <= moveCount; i++) {
        const move = exercise && exercise.moves && exercise.moves[i - 1] ? exercise.moves[i - 1] : { color: 'blue' };
        const moveDiv = document.createElement('div');
        moveDiv.className = 'glass bg-white/10 rounded-2xl p-6 border border-white/20';
        moveDiv.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center space-x-3 mb-4">
                    <div class="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        ${i}
                    </div>
                    <h4 class="text-xl font-bold text-white">${i}. Move</h4>
                </div>
                
                <div class="space-y-3">
                    <div>
                        <label class="text-white font-semibold text-lg flex items-center mb-2">
                            <i class="fas fa-tag text-blue-400 mr-2"></i>Move Name
                        </label>
                        <input type="text" id="moveName${i}" placeholder="${i}. Move Name" 
                               class="w-full px-4 py-3 rounded-xl border-2 border-blue-300/50 bg-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:bg-white/30 input-focus transition-all duration-300 text-lg" />
                    </div>
                    
                    <div>
                        <label class="text-white font-semibold text-lg flex items-center mb-2">
                            <i class="fas fa-clock text-yellow-400 mr-2"></i>Duration (seconds)
                        </label>
                        <input type="number" id="moveDuration${i}" min="1" placeholder="3" 
                               class="w-full px-4 py-3 rounded-xl border-2 border-yellow-300/50 bg-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:bg-white/30 input-focus transition-all duration-300 text-lg" />
                    </div>
                    
                    <div>
                        <label class="text-white font-semibold text-lg flex items-center mb-2">
                            <i class="fas fa-palette text-purple-400 mr-2"></i>Move Color
                        </label>
                        <div class="flex space-x-3">
                            <button class="move-color-option w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-blue-300 hover:scale-110 transition-all duration-300" data-color="blue" data-move="${i}"></button>
                            <button class="move-color-option w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-300 hover:scale-110 transition-all duration-300" data-color="green" data-move="${i}"></button>
                            <button class="move-color-option w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 border-2 border-purple-300 hover:scale-110 transition-all duration-300" data-color="purple" data-move="${i}"></button>
                            <button class="move-color-option w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 border-2 border-orange-300 hover:scale-110 transition-all duration-300" data-color="orange" data-move="${i}"></button>
                            <button class="move-color-option w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 border-2 border-pink-300 hover:scale-110 transition-all duration-300" data-color="pink" data-move="${i}"></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(moveDiv);
        // Aktif renk class'ı ekle
        setTimeout(() => {
            document.querySelectorAll(`[data-move="${i}"]`).forEach(btn => {
                btn.classList.remove('ring-4', 'ring-white');
            });
            if (move.color) {
                const colorBtn = document.querySelector(`[data-move="${i}"][data-color="${move.color}"]`);
                if (colorBtn) {
                    colorBtn.classList.add('ring-4', 'ring-white');
                }
            }
        }, 0);
    }
}

// Toggle rest between moves container
function toggleRestBetweenMoves() {
    const checkbox = document.getElementById('restBetweenMovesEnabled');
    const container = document.getElementById('restBetweenMovesContainer');
    
    if (checkbox.checked) {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

// Open exercise detail page
function openExerciseDetail(index) {
    currentExerciseIndex = index;
    const exercise = currentProgram.exercises[index];
    
    document.getElementById('exerciseDetailTitle').textContent = exercise.name;
    document.getElementById('setCount').value = exercise.setCount;
    document.getElementById('repCount').value = exercise.repCount;
    document.getElementById('moveCount').value = exercise.moveCount;
    document.getElementById('restBetweenMoves').value = exercise.restBetweenMoves;
    document.getElementById('restBetweenSets').value = exercise.restBetweenSets;
    document.getElementById('restBetweenMovesEnabled').checked = exercise.restBetweenMovesEnabled;
    
    // Create move fields
    createMoveFields();
    
    // Fill move data
    for (let i = 1; i <= exercise.moveCount; i++) {
        const move = exercise.moves[i - 1];
        if (move) {
            document.getElementById(`moveName${i}`).value = move.name;
            document.getElementById(`moveDuration${i}`).value = move.duration;
            
            // Set move color
            document.querySelectorAll(`[data-move="${i}"]`).forEach(btn => {
                btn.classList.remove('ring-4', 'ring-white');
            });
            if (move.color) {
                const colorBtn = document.querySelector(`[data-move="${i}"][data-color="${move.color}"]`);
                if (colorBtn) {
                    colorBtn.classList.add('ring-4', 'ring-white');
                }
            }
        }
    }
    
    // Set rest colors
    document.querySelectorAll('.rest-color-option').forEach(btn => {
        btn.classList.remove('ring-4', 'ring-white');
    });
    if (exercise.restColor) {
        const restColorBtn = document.querySelector(`.rest-color-option[data-color="${exercise.restColor}"]`);
        if (restColorBtn) {
            restColorBtn.classList.add('ring-4', 'ring-white');
        }
    }
    
    document.querySelectorAll('.set-rest-color-option').forEach(btn => {
        btn.classList.remove('ring-4', 'ring-white');
    });
    if (exercise.setRestColor) {
        const setRestColorBtn = document.querySelector(`.set-rest-color-option[data-color="${exercise.setRestColor}"]`);
        if (setRestColorBtn) {
            setRestColorBtn.classList.add('ring-4', 'ring-white');
        }
    }
    
    // Toggle rest container
    toggleRestBetweenMoves();
    
    updateExerciseFlow();
    showPage('exerciseDetailPage');
    
    // Add event listeners to color buttons after page is shown
    setTimeout(() => {
        const restButtons = document.querySelectorAll('.rest-color-option');
        const setRestButtons = document.querySelectorAll('.set-rest-color-option');
        const moveButtons = document.querySelectorAll('.move-color-option');
        
        // Add direct event listeners to ensure they work
        restButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const color = this.dataset.color;
                
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
    }, 100);
}

// Update exercise flow display
function updateExerciseFlow() {
    const setCount = parseInt(document.getElementById('setCount').value) || 2;
    const repCount = parseInt(document.getElementById('repCount').value) || 10;
    const moveCount = parseInt(document.getElementById('moveCount').value) || 1;
    const restBetweenMoves = parseInt(document.getElementById('restBetweenMoves').value) || 0;
    const restBetweenSets = parseInt(document.getElementById('restBetweenSets').value) || 30;
    const restBetweenMovesEnabled = document.getElementById('restBetweenMovesEnabled').checked;
    
    const moves = [];
    for (let i = 1; i <= moveCount; i++) {
        const name = document.getElementById(`moveName${i}`)?.value || `${i}. Move`;
        const duration = parseInt(document.getElementById(`moveDuration${i}`)?.value) || 0;
        if (duration > 0) {
            moves.push({ name, duration });
        }
    }
    
    let flowText = `<div class="space-y-3">`;
    flowText += `<div class="font-semibold text-white">Exercise Flow:</div>`;
    
    for (let set = 1; set <= setCount; set++) {
        flowText += `<div class="ml-4">`;
        flowText += `<div class="text-blue-400 font-semibold">Set ${set}:</div>`;
        
        for (let rep = 1; rep <= repCount; rep++) {
            flowText += `<div class="ml-4 text-sm">`;
            flowText += `<div class="text-green-400">Rep ${rep}:</div>`;
            
            moves.forEach((move, index) => {
                flowText += `<div class="ml-4 text-yellow-400">`;
                flowText += `• ${move.name}: ${move.duration}s`;
                if (restBetweenMovesEnabled && restBetweenMoves > 0 && index < moves.length - 1) {
                    flowText += ` → ${restBetweenMoves}s rest`;
                }
                flowText += `</div>`;
            });
            
            if (restBetweenMovesEnabled && restBetweenMoves > 0 && rep < repCount) {
                flowText += `<div class="ml-4 text-red-400">→ ${restBetweenMoves}s rest</div>`;
            }
            flowText += `</div>`;
        }
        
        if (set < setCount && restBetweenSets > 0) {
            flowText += `<div class="ml-4 text-red-400 font-semibold">→ ${restBetweenSets}s set rest</div>`;
        }
        flowText += `</div>`;
    }
    
    flowText += `</div>`;
    document.getElementById('exerciseFlow').innerHTML = flowText;
}

// Save exercise settings
function saveExercise() {
    const exercise = currentProgram.exercises[currentExerciseIndex];
    
    exercise.setCount = parseInt(document.getElementById('setCount').value);
    exercise.repCount = parseInt(document.getElementById('repCount').value);
    exercise.moveCount = parseInt(document.getElementById('moveCount').value);
    
    // Get moves data
    exercise.moves = [];
    for (let i = 1; i <= exercise.moveCount; i++) {
        const name = document.getElementById(`moveName${i}`)?.value || `${i}. Move`;
        const duration = parseInt(document.getElementById(`moveDuration${i}`)?.value || 0);
        // Keep existing color or get from the active button
        let color = 'blue'; // default
        const activeButton = document.querySelector(`.move-color-option[data-move="${i}"].ring-4`);
        if (activeButton) {
            color = activeButton.dataset.color;
        } else if (exercise.moves[i - 1]?.color) {
            color = exercise.moves[i - 1].color;
        }
        if (duration > 0) {
            exercise.moves.push({ name, duration, color });
        }
    }
    
    exercise.restBetweenMoves = parseInt(document.getElementById('restBetweenMoves').value) || 0;
    exercise.restBetweenSets = parseInt(document.getElementById('restBetweenSets').value) || 0;
    exercise.restBetweenMovesEnabled = document.getElementById('restBetweenMovesEnabled').checked;
    
    // Save rest colors from active buttons
    const activeRestButton = document.querySelector('.rest-color-option.ring-4');
    if (activeRestButton) {
        exercise.restColor = activeRestButton.dataset.color;
    }
    
    const activeSetRestButton = document.querySelector('.set-rest-color-option.ring-4');
    if (activeSetRestButton) {
        exercise.setRestColor = activeSetRestButton.dataset.color;
    }
    
    saveAllPrograms();
    renderExercises();
    showNotification('Exercise saved successfully!', 'success');
}

// Start exercise timer
function startExercise() {
    const exercise = currentProgram.exercises[currentExerciseIndex];
    
    exercise.setCount = parseInt(document.getElementById('setCount').value);
    exercise.repCount = parseInt(document.getElementById('repCount').value);
    exercise.moveCount = parseInt(document.getElementById('moveCount').value);
    
    // Get moves data
    exercise.moves = [];
    for (let i = 1; i <= exercise.moveCount; i++) {
        const name = document.getElementById(`moveName${i}`)?.value || `${i}. Move`;
        const duration = parseInt(document.getElementById(`moveDuration${i}`)?.value || 0);
        // Keep existing color or get from the active button
        let color = 'blue'; // default
        const activeButton = document.querySelector(`.move-color-option[data-move="${i}"].ring-4`);
        if (activeButton) {
            color = activeButton.dataset.color;
        } else if (exercise.moves[i - 1]?.color) {
            color = exercise.moves[i - 1].color;
        }
        if (duration > 0) {
            exercise.moves.push({ name, duration, color });
        }
    }
    
    exercise.restBetweenMoves = parseInt(document.getElementById('restBetweenMoves').value) || 0;
    exercise.restBetweenSets = parseInt(document.getElementById('restBetweenSets').value) || 0;
    exercise.restBetweenMovesEnabled = document.getElementById('restBetweenMovesEnabled').checked;
    
    // Save rest colors from active buttons
    const activeRestButton = document.querySelector('.rest-color-option.ring-4');
    if (activeRestButton) {
        exercise.restColor = activeRestButton.dataset.color;
    }
    
    const activeSetRestButton = document.querySelector('.set-rest-color-option.ring-4');
    if (activeSetRestButton) {
        exercise.setRestColor = activeSetRestButton.dataset.color;
    }
    
    saveAllPrograms();
    renderExercises();
    startTimer();
} 