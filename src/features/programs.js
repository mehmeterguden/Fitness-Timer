// ========================================
// PROGRAMS MANAGEMENT
// ========================================

// Global Variables
let allPrograms = [];
window.allPrograms = allPrograms;

// Load all programs from storage
function loadAllPrograms() {
    const data = localStorage.getItem('allPrograms');
    
    if (data) {
        try {
            allPrograms = JSON.parse(data);
            window.allPrograms = allPrograms;
        } catch (error) {
            console.error('Error parsing programs:', error);
            allPrograms = [];
            window.allPrograms = allPrograms;
        }
    } else {
        allPrograms = [];
        window.allPrograms = allPrograms;
    }
    
    // Also update settingsPrograms if it exists
    if (typeof window.settingsPrograms !== 'undefined') {
        window.settingsPrograms = allPrograms;
    }
}

// Show programs list on home page
function showProgramsList() {
    // Hide program creation card
    const programCreationCard = document.getElementById('programCreationCard');
    if (programCreationCard) {
        programCreationCard.classList.add('hidden');
    }
    
    // Show programs list section
    const programsListSection = document.getElementById('programsListSection');
    if (programsListSection) {
        programsListSection.classList.remove('hidden');
    }
    
    // Load and display programs
    loadAllPrograms();
    displayProgramsList();
}

// Display programs in the list
function displayProgramsList() {
    const programsList = document.getElementById('programsListHome');
    const noProgramsMessage = document.getElementById('noProgramsMessageHome');
    
    if (!programsList || !noProgramsMessage) return;
    
    // Use window.allPrograms if available, fallback to allPrograms
    const programs = window.allPrograms || allPrograms;
    
    // Clear existing content
    programsList.innerHTML = '';
    
    if (programs.length === 0) {
        noProgramsMessage.classList.remove('hidden');
        return;
    }
    
    noProgramsMessage.classList.add('hidden');
    
    // Display each program
    programs.forEach((program, index) => {
        const programCard = document.createElement('div');
        programCard.className = 'glass bg-white/10 rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer';
        
        programCard.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4 flex-1 min-w-0">
                    <div class="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-dumbbell text-white text-xl"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                        <h3 class="text-xl font-bold text-white truncate">${program.name}</h3>
                        <p class="text-white/70 truncate">${program.exercises ? program.exercises.length : 0} exercises</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2 flex-shrink-0 ml-4">
                    <button onclick="startProgram(${index})" class="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center whitespace-nowrap">
                        <i class="fas fa-play mr-1 text-xs"></i>Start
                    </button>
                    <button onclick="editProgram(${index})" class="px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center whitespace-nowrap">
                        <i class="fas fa-edit mr-1 text-xs"></i>Edit
                    </button>
                    <button onclick="deleteProgram(${index})" class="px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center whitespace-nowrap">
                        <i class="fas fa-trash mr-1 text-xs"></i>Delete
                    </button>
                </div>
            </div>
        `;
        
        programsList.appendChild(programCard);
    });
}

// Start a program
function startProgram(index) {
    const programs = window.allPrograms || allPrograms;
    if (index >= 0 && index < programs.length) {
        const program = programs[index];
        currentProgram = program;
        currentProgramIndex = index;
        
        // Update program name in header
        const currentProgramElement = document.getElementById('currentProgram');
        if (currentProgramElement) {
            currentProgramElement.textContent = program.name;
        }
        
        // Show program page
        showPage('programPage');
        
        // Hide programs list and show program creation card
        const programsListSection = document.getElementById('programsListSection');
        const programCreationCard = document.getElementById('programCreationCard');
        if (programsListSection) programsListSection.classList.add('hidden');
        if (programCreationCard) programCreationCard.classList.remove('hidden');
    }
}

// Edit a program
function editProgram(index) {
    const programs = window.allPrograms || allPrograms;
    if (index >= 0 && index < programs.length) {
        const program = programs[index];
        currentProgram = program;
        currentProgramIndex = index;
        
        // Update program name in header
        const currentProgramElement = document.getElementById('currentProgram');
        if (currentProgramElement) {
            currentProgramElement.textContent = program.name;
        }
        
        // Show program page
        showPage('programPage');
        
        // Hide programs list and show program creation card
        const programsListSection = document.getElementById('programsListSection');
        const programCreationCard = document.getElementById('programCreationCard');
        if (programsListSection) programsListSection.classList.add('hidden');
        if (programCreationCard) programCreationCard.classList.remove('hidden');
    }
}

// Delete a program
function deleteProgram(index) {
    const programs = window.allPrograms || allPrograms;
    if (index >= 0 && index < programs.length) {
        const program = programs[index];
        
        if (confirm(`Are you sure you want to delete "${program.name}"?`)) {
            programs.splice(index, 1);
            allPrograms = programs;
            window.allPrograms = allPrograms;
            saveAllPrograms();
            displayProgramsList();
            showNotification('Program deleted successfully!', 'success');
        }
    }
}

// Show create program form
function showCreateProgram() {
    // Hide programs list section
    const programsListSection = document.getElementById('programsListSection');
    if (programsListSection) {
        programsListSection.classList.add('hidden');
    }
    
    // Show program creation card
    const programCreationCard = document.getElementById('programCreationCard');
    if (programCreationCard) {
        programCreationCard.classList.remove('hidden');
    }
    
    // Clear the input
    const programNameInput = document.getElementById('programName');
    if (programNameInput) {
        programNameInput.value = '';
        programNameInput.focus();
    }
}

// Save all programs to storage
function saveAllPrograms() {
    const data = JSON.stringify(allPrograms);
    localStorage.setItem('allPrograms', data);
    window.allPrograms = allPrograms;
    
    // Also update settingsPrograms if it exists
    if (typeof window.settingsPrograms !== 'undefined') {
        window.settingsPrograms = allPrograms;
    }
}

// Create new program
function createProgram() {
    const programName = document.getElementById('programName').value.trim();
    if (!programName) {
        showNotification('Please enter a program name!', 'error');
        return;
    }

    // Check if program name already exists
    if (allPrograms.some(p => p.name === programName)) {
        showNotification('A program with this name already exists!', 'error');
        return;
    }

    const newProgram = {
        id: Date.now(),
        name: programName,
        exercises: [],
        createdAt: new Date().toISOString()
    };

    allPrograms.push(newProgram);
    window.allPrograms = allPrograms;
    saveAllPrograms();
    
    // Set as current program
    currentProgram = newProgram;
    
    // Update UI
    document.getElementById('currentProgram').textContent = programName;
    showProgramHeader();
    showPage('programPage');
    renderProgramsDropdown();
    
    // Clear form
    document.getElementById('programName').value = '';
    
    // Show programs list instead of staying on create form
    showProgramsList();
    
    showNotification('Program created successfully!', 'success');
}

// Load program
function loadProgram(programId) {
    // First try to reload programs from localStorage
    loadAllPrograms();
    
    const programs = window.allPrograms || allPrograms;
    
    // For string IDs, don't convert to number - keep as string
    const program = programs.find(p => p.id === programId);
    
    if (program) {
        currentProgram = program;
        document.getElementById('currentProgram').textContent = program.name;
        showProgramHeader();
        showPage('programPage');
        renderExercises(); // This now only renders the order list
        showNotification(`${program.name} loaded!`, 'success');
    } else {
        showNotification('Program not found!', 'error');
    }
}

// Delete program
function deleteProgram(programId) {
    // First try to reload programs from localStorage
    loadAllPrograms();
    
    const programs = window.allPrograms || allPrograms;
    const program = programs.find(p => p.id === programId);
    if (program) {
        if (confirm(`Are you sure you want to delete ${program.name}?`)) {
            allPrograms = allPrograms.filter(p => p.id !== programId);
            window.allPrograms = allPrograms;
            saveAllPrograms();
            renderProgramsDropdown();
            
            // If deleted program was current, go back to home
            if (currentProgram && currentProgram.id === programId) {
                backToHome();
            }
            
            showNotification('Program deleted successfully!', 'success');
        }
    }
}

// Toggle programs dropdown - Home page
function toggleProgramsDropdown() {
    const menu = document.getElementById('programsMenu');
    const btn = document.getElementById('programsBtn');
    const chevron = btn.querySelector('.fa-chevron-down');
    
    if (menu.classList.contains('invisible')) {
        menu.classList.remove('invisible', 'opacity-0', 'translate-y-2');
        menu.classList.add('opacity-100');
        chevron.style.transform = 'rotate(180deg)';
    } else {
        menu.classList.add('invisible', 'opacity-0', 'translate-y-2');
        menu.classList.remove('opacity-100');
        chevron.style.transform = 'rotate(0deg)';
    }
}

// Toggle programs dropdown - Program page
function toggleProgramsDropdownProgram() {
    const menu = document.getElementById('programsMenuProgram');
    const btn = document.getElementById('programsBtnProgram');
    const chevron = btn.querySelector('.fa-chevron-down');
    
    if (menu.classList.contains('invisible')) {
        menu.classList.remove('invisible', 'opacity-0', 'translate-y-2');
        menu.classList.add('opacity-100');
        chevron.style.transform = 'rotate(180deg)';
        // Show the same list
        renderProgramsDropdownProgram();
    } else {
        menu.classList.add('invisible', 'opacity-0', 'translate-y-2');
        menu.classList.remove('opacity-100');
        chevron.style.transform = 'rotate(0deg)';
    }
}

// Render programs dropdown
function renderProgramsDropdown() {
    const container = document.getElementById('programsList');
    const noProgramsMessage = document.getElementById('noProgramsMessage');
    
    // Use window.allPrograms if available, fallback to allPrograms
    const programs = window.allPrograms || allPrograms;
    
    // Update program count
    updateProgramCount(programs.length);
    
    if (programs.length === 0) {
        container.innerHTML = '';
        noProgramsMessage.classList.remove('hidden');
        return;
    }
    
    noProgramsMessage.classList.add('hidden');
    container.innerHTML = '';
    
    programs.forEach((program, index) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl hover:from-white/10 hover:to-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 group';
        div.innerHTML = `
            <div class="flex items-center space-x-4 flex-1 min-w-0">
                <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <i class="fas fa-dumbbell text-white text-lg"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="text-white font-bold text-lg truncate">${program.name}</div>
                    <div class="text-white/60 text-sm truncate">${program.exercises ? program.exercises.length : 0} exercise(s)</div>
                </div>
            </div>
            <div class="flex items-center space-x-2 flex-shrink-0 ml-3">
                <button onclick="loadProgram('${program.id}')" class="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center whitespace-nowrap">
                    <i class="fas fa-play mr-1 text-xs"></i>Open
                </button>
                <button onclick="deleteProgram('${program.id}')" class="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center whitespace-nowrap">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// Render programs dropdown - Program page
function renderProgramsDropdownProgram() {
    const container = document.getElementById('programsListProgram');
    const noProgramsMessage = document.getElementById('noProgramsMessageProgram');
    
    // Use window.allPrograms if available, fallback to allPrograms
    const programs = window.allPrograms || allPrograms;
    
    // Update program count
    updateProgramCountProgram(programs.length);
    
    if (programs.length === 0) {
        container.innerHTML = '';
        noProgramsMessage.classList.remove('hidden');
        return;
    }
    
    noProgramsMessage.classList.add('hidden');
    container.innerHTML = '';
    
    programs.forEach(program => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl hover:from-white/10 hover:to-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 group';
        div.innerHTML = `
            <div class="flex items-center space-x-4 flex-1 min-w-0">
                <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <i class="fas fa-dumbbell text-white text-lg"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="text-white font-bold text-lg truncate">${program.name}</div>
                    <div class="text-white/60 text-sm truncate">${program.exercises ? program.exercises.length : 0} exercise(s)</div>
                </div>
            </div>
            <div class="flex items-center space-x-2 flex-shrink-0 ml-3">
                <button onclick="loadProgram('${program.id}')" class="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center whitespace-nowrap">
                    <i class="fas fa-play mr-1 text-xs"></i>Open
                </button>
                <button onclick="deleteProgram('${program.id}')" class="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center whitespace-nowrap">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// Update program count in header dropdown
function updateProgramCount(count) {
    const programCountElement = document.getElementById('programCount');
    if (programCountElement) {
        programCountElement.textContent = count;
    }
}

// Update program count in program page dropdown
function updateProgramCountProgram(count) {
    const programCountElement = document.getElementById('programCountProgram');
    if (programCountElement) {
        programCountElement.textContent = count;
    }
} 