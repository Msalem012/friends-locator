// Theme switcher functionality
document.addEventListener('DOMContentLoaded', function() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Check for saved theme preference or respect OS theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply theme (from storage or OS preference)
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-theme');
        updateButtonText('dark');
    } else {
        updateButtonText('light');
    }
    
    // Theme toggle button click handler
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            // Toggle dark mode class on body
            document.body.classList.toggle('dark-theme');
            
            // Determine current theme after toggling
            const isDarkTheme = document.body.classList.contains('dark-theme');
            
            // Update button text
            updateButtonText(isDarkTheme ? 'dark' : 'light');
            
            // Save preference to localStorage
            localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
        });
    }
    
    function updateButtonText(theme) {
        // Update the button icon/text based on current theme
        if (themeToggleBtn) {
            if (theme === 'dark') {
                themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
                themeToggleBtn.title = 'Switch to Light Mode';
            } else {
                themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
                themeToggleBtn.title = 'Switch to Dark Mode';
            }
        }
    }
}); 