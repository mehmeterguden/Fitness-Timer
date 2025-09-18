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
    
    if (programs.length === 0) {
        container.innerHTML = '';
        noProgramsMessage.classList.remove('hidden');
        return;
    }
    
    noProgramsMessage.classList.add('hidden');
    container.innerHTML = '';
    
    programs.forEach((program, index) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300';
        div.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <i class="fas fa-dumbbell text-white text-sm"></i>
                </div>
                <div>
                    <div class="text-white font-semibold">${program.name}</div>
                     <div class="text-white/60 text-xs">${program.exercises.length} exercise(s)</div>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="loadProgram('${program.id}')" class="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-all duration-300">
                    <i class="fas fa-play mr-1"></i>Open
                </button>
                <button onclick="deleteProgram('${program.id}')" class="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-all duration-300">
                    <i class="fas fa-trash"></i>
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
    
    if (programs.length === 0) {
        container.innerHTML = '';
        noProgramsMessage.classList.remove('hidden');
        return;
    }
    
    noProgramsMessage.classList.add('hidden');
    container.innerHTML = '';
    
    programs.forEach(program => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300';
        div.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <i class="fas fa-dumbbell text-white text-sm"></i>
                </div>
                <div>
                    <div class="text-white font-semibold">${program.name}</div>
                     <div class="text-white/60 text-xs">${program.exercises.length} exercise(s)</div>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="loadProgram('${program.id}')" class="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-all duration-300">
                    <i class="fas fa-play mr-1"></i>Open
                </button>
                <button onclick="deleteProgram('${program.id}')" class="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-all duration-300">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
} 