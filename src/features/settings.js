// ========================================
// SETTINGS PAGE - IMPORT/EXPORT
// ========================================

// Global Variables
let selectedFile = null;
let importData = null;
let selectedPrograms = new Set();
let settingsPrograms = [];
window.settingsPrograms = settingsPrograms;

// Initialize settings page
function initSettings() {
    console.log('initSettings called');
    loadAllPrograms();
    updateExportStats();
    setupSettingsEventListeners();
    setupFileUpload();
    renderProgramSelection();
    console.log('initSettings completed');
}

// Load all programs
function loadAllPrograms() {
    const data = localStorage.getItem('allPrograms');
    
    if (data) {
        try {
            settingsPrograms = JSON.parse(data);
            window.settingsPrograms = settingsPrograms;
            // Also update the global allPrograms variable
            if (typeof window.allPrograms !== 'undefined') {
                window.allPrograms = settingsPrograms;
            }
        } catch (error) {
            settingsPrograms = [];
            window.settingsPrograms = settingsPrograms;
        }
    } else {
        settingsPrograms = [];
        window.settingsPrograms = settingsPrograms;
    }
}

// Update export statistics
function updateExportStats() {
    const totalPrograms = settingsPrograms.length;
    const selectedCount = selectedPrograms.size;
    
    // Calculate file size for selected programs
    const selectedProgramsData = settingsPrograms.filter(program => selectedPrograms.has(program.id));
    const dataSize = JSON.stringify(selectedProgramsData).length;
    const fileSizeKB = Math.round(dataSize / 1024 * 100) / 100;
    
    document.getElementById('exportProgramCount').textContent = totalPrograms;
    document.getElementById('exportSelectedCount').textContent = selectedCount;
    document.getElementById('exportFileSize').textContent = `${fileSizeKB} KB`;
    
    // Update export button state
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.disabled = selectedCount === 0;
    }
}

// Setup event listeners
function setupSettingsEventListeners() {
    console.log('setupSettingsEventListeners called');
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportSelectedPrograms);
    
    // Import button
    document.getElementById('importBtn').addEventListener('click', showImportPreview);
    
    // Program selection buttons
    document.getElementById('selectAllPrograms').addEventListener('click', selectAllPrograms);
    document.getElementById('deselectAllPrograms').addEventListener('click', deselectAllPrograms);
    
    // Import preview buttons
    document.getElementById('confirmImportBtn').addEventListener('click', confirmImport);
    document.getElementById('cancelImportBtn').addEventListener('click', cancelImport);
    
    // Data management buttons
    const viewDataBtn = document.getElementById('viewDataBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    console.log('Data management buttons found:', {
        viewDataBtn: !!viewDataBtn,
        clearAllBtn: !!clearAllBtn
    });
    
    if (viewDataBtn) viewDataBtn.addEventListener('click', showDataViewer);
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllData);
    
    // Data viewer modal
    const closeDataViewer = document.getElementById('closeDataViewer');
    if (closeDataViewer) closeDataViewer.addEventListener('click', hideDataViewer);
    
    // Back button
    const backBtn = document.getElementById('backToHomeFromSettings');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showPage('homePage');
        });
    }
    
    console.log('setupSettingsEventListeners completed');
}

// Setup file upload functionality
function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const fileUploadArea = document.getElementById('fileUploadArea');
    
    if (!fileInput || !fileUploadArea) {
        console.error('File input elements not found');
        return;
    }
    
    // Click to select file
    fileUploadArea.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    });
    
    // Drag and drop functionality
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// Handle file processing
function handleFile(file) {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
        showNotification('Please select a valid JSON file!', 'error');
        return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size too large! Maximum 10MB allowed.', 'error');
        return;
    }
    
    selectedFile = file;
    
    // Update file info display
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const importProgramCount = document.getElementById('importProgramCount');
    const fileInfo = document.getElementById('fileInfo');
    const importBtn = document.getElementById('importBtn');
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    // Read and validate file content
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure - check for both formats
            let programs = [];
            if (Array.isArray(data)) {
                // Direct array of programs
                programs = data;
            } else if (data.programs && Array.isArray(data.programs)) {
                // Object with programs property
                programs = data.programs;
            } else {
                throw new Error('Invalid file format. Expected array of programs or object with programs property.');
            }
            
            // Count programs
            const programCount = programs.length;
            importProgramCount.textContent = programCount;
            
            // Store import data
            importData = { programs: programs };
            
            // Show file info and enable import button
            fileInfo.classList.remove('hidden');
            importBtn.disabled = false;
            
            showNotification(`File loaded successfully! Found ${programCount} programs.`, 'success');
            
        } catch (error) {
            showNotification(`Invalid JSON file! Error: ${error.message}`, 'error');
            console.error('File validation error:', error);
        }
    };
    
    reader.readAsText(file);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Render program selection list
function renderProgramSelection() {
    const container = document.getElementById('programSelectionList');
    container.innerHTML = '';
    
    if (settingsPrograms.length === 0) {
        container.innerHTML = '<p class="text-white/60 text-center py-4">No programs found. Create some programs first!</p>';
        return;
    }
    
    settingsPrograms.forEach(program => {
        const programItem = document.createElement('div');
        programItem.className = 'program-selection-item';
        programItem.dataset.programId = program.id;
        
        const exerciseCount = program.exercises ? program.exercises.length : 0;
        
        programItem.innerHTML = `
            <div class="program-checkbox ${selectedPrograms.has(program.id) ? 'checked' : ''}"></div>
            <div class="program-info">
                <div class="program-name">${program.name}</div>
                <div class="program-details">
                    Exercises: ${exerciseCount} • 
                    Created: ${new Date(program.createdAt).toLocaleDateString()}
                </div>
            </div>
        `;
        
        // Add click event
        programItem.addEventListener('click', () => {
            toggleProgramSelection(program.id);
        });
        
        container.appendChild(programItem);
    });
}

// Toggle program selection
function toggleProgramSelection(programId) {
    if (selectedPrograms.has(programId)) {
        selectedPrograms.delete(programId);
    } else {
        selectedPrograms.add(programId);
    }
    
    // Update UI
    const programItem = document.querySelector(`[data-program-id="${programId}"]`);
    const checkbox = programItem.querySelector('.program-checkbox');
    
    if (selectedPrograms.has(programId)) {
        programItem.classList.add('selected');
        checkbox.classList.add('checked');
    } else {
        programItem.classList.remove('selected');
        checkbox.classList.remove('checked');
    }
    
    // Update counter
    updateSelectionCounter();
    updateExportStats();
}

// Update selection counter
function updateSelectionCounter() {
    const counter = document.getElementById('selectedProgramCount');
    const count = selectedPrograms.size;
    
    counter.textContent = `${count} program${count !== 1 ? 's' : ''}`;
    counter.classList.add('selection-counter', 'updated');
    
    setTimeout(() => {
        counter.classList.remove('updated');
    }, 600);
}

// Select all programs
function selectAllPrograms() {
    settingsPrograms.forEach(program => {
        selectedPrograms.add(program.id);
    });
    
    renderProgramSelection();
    updateSelectionCounter();
    updateExportStats();
}

// Deselect all programs
function deselectAllPrograms() {
    selectedPrograms.clear();
    
    renderProgramSelection();
    updateSelectionCounter();
    updateExportStats();
}

// Export selected programs to JSON file
function exportSelectedPrograms() {
    try {
        if (selectedPrograms.size === 0) {
            showNotification('Please select programs to export!', 'warning');
            return;
        }
        
        const selectedProgramsData = settingsPrograms.filter(program => selectedPrograms.has(program.id));
        
        // Create export data with metadata
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            programs: selectedProgramsData,
            metadata: {
                totalPrograms: selectedProgramsData.length,
                totalExercises: selectedProgramsData.reduce((total, program) => total + (program.exercises?.length || 0), 0),
                appVersion: 'Fitness Timer v1.0'
            }
        };
        
        // Create and download file
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `fitness-programs-${new Date().toISOString().split('T')[0]}.json`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`Successfully exported ${selectedProgramsData.length} programs!`, 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Export failed! Please try again.', 'error');
    }
}

// Show import preview page
function showImportPreview() {
    if (!importData) {
        showNotification('Please select a file first!', 'warning');
        return;
    }
    
    try {
        const programs = importData.programs || importData; // Handle both formats
        
        if (!Array.isArray(programs)) {
            throw new Error('Invalid import data format');
        }
        
        // Store programs for preview
        window.previewPrograms = programs;
        
        // Show preview page
        showPage('importPreviewPage');
        renderImportPreview();
        
    } catch (error) {
        console.error('Import preview error:', error);
        showNotification('Invalid file format! Please check the file.', 'error');
    }
}

// Render import preview
function renderImportPreview() {
    const container = document.getElementById('importedProgramsList');
    container.innerHTML = '';
    
    if (!window.previewPrograms || window.previewPrograms.length === 0) {
        container.innerHTML = '<p class="text-white/60 text-center py-4">No programs found in the file!</p>';
        return;
    }
    
    window.previewPrograms.forEach((program, index) => {
        const programItem = document.createElement('div');
        programItem.className = 'imported-program-item';
        programItem.dataset.programIndex = index;
        
        const exerciseCount = program.exercises ? program.exercises.length : 0;
        
        programItem.innerHTML = `
            <div class="program-input-group">
                <label class="program-input-label">Program Name</label>
                <input type="text" 
                       class="program-name-input" 
                       value="${program.name || ''}" 
                       placeholder="Enter program name..."
                       data-program-index="${index}">
            </div>
            
            <div class="program-preview-info">
                <div class="preview-stat">
                    <div class="preview-stat-label">Exercises</div>
                    <div class="preview-stat-value">${exerciseCount}</div>
                </div>
                <div class="preview-stat">
                    <div class="preview-stat-label">Created</div>
                    <div class="preview-stat-value">${program.createdAt ? new Date(program.createdAt).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div class="preview-stat">
                    <div class="preview-stat-label">ID</div>
                    <div class="preview-stat-value">${program.id || 'N/A'}</div>
                </div>
                <div class="preview-stat">
                    <div class="preview-stat-label">Version</div>
                    <div class="preview-stat-value">${importData.version || '1.0'}</div>
                </div>
            </div>
        `;
        
        container.appendChild(programItem);
    });
}

// Confirm import
function confirmImport() {
    try {
        if (!window.previewPrograms) {
            showNotification('No programs to import!', 'warning');
            return;
        }
        
        // Get updated program names with new IDs
        const updatedPrograms = window.previewPrograms.map((program, index) => {
            const nameInput = document.querySelector(`input[data-program-index="${index}"]`);
            const newId = generateId();
            
            // Generate new IDs for exercises as well
            const updatedExercises = program.exercises ? program.exercises.map((exercise, exerciseIndex) => ({
                ...exercise,
                id: `${newId}-${exerciseIndex}`
            })) : [];
            
            return {
                ...program,
                id: newId,
                name: nameInput.value.trim() || program.name || `Imported Program ${index + 1}`,
                exercises: updatedExercises,
                createdAt: new Date().toISOString() // Update creation date
            };
        });
        
        // Get existing programs
        const existingPrograms = JSON.parse(localStorage.getItem('allPrograms') || '[]');
        
        // Check for duplicate names and add suffix if needed
        const finalPrograms = updatedPrograms.map(program => {
            let finalName = program.name;
            let counter = 1;
            
            while (existingPrograms.some(existing => existing.name === finalName)) {
                finalName = `${program.name} (${counter})`;
                counter++;
            }
            
            return {
                ...program,
                name: finalName
            };
        });
        
        // Add imported programs to existing programs
        const mergedPrograms = [...existingPrograms, ...finalPrograms];
        
        // Save programs to localStorage
        const data = JSON.stringify(mergedPrograms);
        localStorage.setItem('allPrograms', data);
        
        // Update settings programs list
        settingsPrograms = mergedPrograms;
        
        // Update global allPrograms variable
        if (typeof window.allPrograms !== 'undefined') {
            window.allPrograms = mergedPrograms;
        }
        
        // Update programs display if function exists
        if (typeof renderProgramsDropdown === 'function') {
            renderProgramsDropdown();
        }
        
        // Update programs display for program page if function exists
        if (typeof renderProgramsDropdownProgram === 'function') {
            renderProgramsDropdownProgram();
        }
        
        // Reset import state
        resetImportState();
        window.previewPrograms = null;
        
        // Go back to settings
        showPage('settingsPage');
        
        // Refresh the settings page
        loadAllPrograms();
        updateExportStats();
        renderProgramSelection();
        
        showNotification(`Successfully imported ${finalPrograms.length} programs!`, 'success');
        
    } catch (error) {
        console.error('Import error:', error);
        showNotification('Import failed! Please try again.', 'error');
    }
}

// Cancel import
function cancelImport() {
    // Reset import state
    resetImportState();
    window.previewPrograms = null;
    
    // Go back to settings
    showPage('settingsPage');
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Reset import state
function resetImportState() {
    selectedFile = null;
    importData = null;
    
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').classList.add('hidden');
    document.getElementById('importBtn').disabled = true;
}

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
        try {
            // Clear all data
            localStorage.removeItem('allPrograms');
            localStorage.removeItem('workoutData');
            localStorage.removeItem('audioSettings');
            localStorage.removeItem('colorSettings');
            
            // Reset import state
            resetImportState();
            
            // Reload programs and update displays
            loadAllPrograms();
            updateExportStats();
            renderProgramSelection();
            
            if (typeof renderProgramsDropdown === 'function') {
                renderProgramsDropdown();
            }
            
            showNotification('All data cleared successfully!', 'success');
            
        } catch (error) {
            console.error('Clear data error:', error);
            showNotification('Failed to clear data!', 'error');
        }
    }
}


// Show data viewer modal
function showDataViewer() {
    const modal = document.getElementById('dataViewerModal');
    const content = document.getElementById('dataViewerContent');
    
    // Load all localStorage data
    const allData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        allData[key] = value;
    }
    
    // Calculate stats
    const totalKeys = Object.keys(allData).length;
    const totalSize = JSON.stringify(allData).length;
    const totalSizeKB = Math.round(totalSize / 1024 * 100) / 100;
    
    // Render stats
    content.innerHTML = `
        <div class="data-stats">
            <div class="data-stat">
                <div class="data-stat-value">${totalKeys}</div>
                <div class="data-stat-label">Total Keys</div>
            </div>
            <div class="data-stat">
                <div class="data-stat-value">${totalSizeKB} KB</div>
                <div class="data-stat-label">Total Size</div>
            </div>
            <div class="data-stat">
                <div class="data-stat-value">${Object.keys(allData).filter(key => key.includes('Program')).length}</div>
                <div class="data-stat-label">Program Keys</div>
            </div>
            <div class="data-stat">
                <div class="data-stat-value">${Object.keys(allData).filter(key => key.includes('workout')).length}</div>
                <div class="data-stat-label">Workout Keys</div>
            </div>
        </div>
    `;
    
    // Render data items
    Object.entries(allData).forEach(([key, value]) => {
        const dataItem = document.createElement('div');
        dataItem.className = 'data-item';
        
        const size = new Blob([value]).size;
        const sizeKB = Math.round(size / 1024 * 100) / 100;
        
        let formattedValue = value;
        try {
            const parsed = JSON.parse(value);
            formattedValue = JSON.stringify(parsed, null, 2);
        } catch (e) {
            // Keep as string if not JSON
        }
        
        dataItem.innerHTML = `
            <div class="data-item-header">
                <h3 class="data-item-title">${key}</h3>
                <span class="data-item-size">${sizeKB} KB</span>
            </div>
            <div class="data-item-content">${formattedValue}</div>
            <div class="data-item-actions">
                <button class="data-action-btn copy" onclick="copyToClipboard('${key}')">
                    <i class="fas fa-copy mr-1"></i>Copy
                </button>
                <button class="data-action-btn delete" onclick="deleteDataItem('${key}')">
                    <i class="fas fa-trash mr-1"></i>Delete
                </button>
            </div>
        `;
        
        content.appendChild(dataItem);
    });
    
    modal.classList.remove('hidden');
}

// Hide data viewer modal
function hideDataViewer() {
    const modal = document.getElementById('dataViewerModal');
    modal.classList.add('hidden');
}

// Copy data to clipboard
function copyToClipboard(key) {
    const value = localStorage.getItem(key);
    navigator.clipboard.writeText(value).then(() => {
        showNotification(`Copied ${key} to clipboard!`, 'success');
    }).catch(() => {
        showNotification('Failed to copy to clipboard!', 'error');
    });
}

// Delete data item
function deleteDataItem(key) {
    if (confirm(`Are you sure you want to delete "${key}"?`)) {
        localStorage.removeItem(key);
        showNotification(`Deleted ${key}`, 'success');
        showDataViewer(); // Refresh the viewer
    }
}

// Initialize settings when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if settings page exists
    if (document.getElementById('settingsPage')) {
        initSettings();
    }
});

// Override showPage to initialize settings when needed
const originalShowPage = window.showPage;
window.showPage = function(pageId) {
    if (originalShowPage) {
        originalShowPage(pageId);
    }
    
    // Initialize settings if settings page is shown
    if (pageId === 'settingsPage') {
        initSettings();
    }
};

// Make functions globally available
window.initSettings = initSettings;
window.showDataViewer = showDataViewer;
window.hideDataViewer = hideDataViewer;
window.clearAllData = clearAllData;
window.copyToClipboard = copyToClipboard;
window.deleteDataItem = deleteDataItem;
