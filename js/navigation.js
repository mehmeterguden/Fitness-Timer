// ========================================
// NAVIGATION FUNCTIONS
// ========================================

// Navigate back to program page
function backToProgram() {
    showPage('programPage');
}

// Navigate back to home page
function backToHome() {
    showMainHeader();
    showPage('homePage');
    currentProgram = null;
} 