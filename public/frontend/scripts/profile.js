// Profile Page JavaScript

// Profile data structure
let profileData = {
    // Personal Information
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    phone: '',
    birthDate: '',
    bio: '',
    avatar: '',
    
    // Security
    twoFactorEnabled: false,
    loginNotifications: false,
    
    // Preferences
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    itemsPerPage: 24,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: false,
    backupReminders: true,
    updateNotifications: true,
    
    // Advanced
    autoSync: true,
    debugMode: false,
    analytics: false,
    autoBackup: false,
    compactMode: false,
    
    // Stats
    totalItems: 0,
    memberSince: new Date().getFullYear()
};

// Initialize profile page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Profile page loaded');
    
    // Load profile data (now async)
    await loadProfileData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update UI with loaded data
    updateUI();
});

// Load profile data from localStorage and API
async function loadProfileData() {
    const saved = localStorage.getItem('profileData');
    if (saved) {
        try {
            profileData = { ...profileData, ...JSON.parse(saved) };
        } catch (e) {
            console.warn('Failed to load profile data:', e);
        }
    }
    
    // Load settings from main app
    const settings = localStorage.getItem('appSettings');
    if (settings) {
        try {
            const appSettings = JSON.parse(settings);
            profileData.theme = appSettings.darkMode ? 'dark' : 'light';
            profileData.autoSync = appSettings.autoSync;
            profileData.emailNotifications = appSettings.notifications;
        } catch (e) {
            console.warn('Failed to load app settings:', e);
        }
    }
    
    // Load media data for stats from API (same as main app)
    await loadMediaDataForStats();
}

// Load media data for statistics
async function loadMediaDataForStats() {
    const authToken = localStorage.getItem('authToken');
    
    try {
        if (authToken) {
            // User is logged in, load from API
            const headers = { 'Authorization': `Bearer ${authToken}` };
            const response = await fetch("/api/media_relative.json", { headers });
            
            if (response.ok) {
                const mediaData = await response.json();
                profileData.totalItems = mediaData.length;
                console.log('Profile: Loaded media data from API', { itemCount: mediaData.length });
            } else {
                console.warn('Profile: API request failed, trying fallback');
                await loadMediaDataFallback();
            }
        } else {
            // User not logged in, try fallback
            await loadMediaDataFallback();
        }
    } catch (error) {
        console.warn('Profile: Failed to load media data from API:', error);
        await loadMediaDataFallback();
    }
}

// Fallback method to load media data
async function loadMediaDataFallback() {
    try {
        // Try to load from JSON file as fallback
        const response = await fetch("/data/data/media.json");
        if (response.ok) {
            const mediaData = await response.json();
            profileData.totalItems = mediaData.length;
            console.log('Profile: Loaded media data from JSON fallback', { itemCount: mediaData.length });
        } else {
            // Try localStorage as last resort
            const mediaData = localStorage.getItem('mediaData');
            if (mediaData) {
                const data = JSON.parse(mediaData);
                profileData.totalItems = data.length;
                console.log('Profile: Loaded media data from localStorage', { itemCount: data.length });
            } else {
                profileData.totalItems = 0;
                console.log('Profile: No media data found, setting totalItems to 0');
            }
        }
    } catch (error) {
        console.warn('Profile: All fallback methods failed:', error);
        profileData.totalItems = 0;
    }
}

// Save profile data to localStorage
function saveProfileData() {
    localStorage.setItem('profileData', JSON.stringify(profileData));
    
    // Also update main app settings
    const appSettings = {
        darkMode: profileData.theme === 'dark',
        autoSync: profileData.autoSync,
        notifications: profileData.emailNotifications
    };
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
}

// Set up event listeners
function setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }
    
    // Navigation buttons
    const libraryBtn = document.getElementById('libraryBtn');
    const statisticsBtn = document.getElementById('statisticsBtn');
    const profileBtn = document.getElementById('profileBtn');
    
    if (libraryBtn) {
        libraryBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    if (statisticsBtn) {
        statisticsBtn.addEventListener('click', () => {
            window.location.href = 'statistics.html';
        });
    }
    
    // Settings search functionality
    setupSettingsSearch();
    
    // Refresh stats button
    const refreshStatsBtn = document.getElementById('refreshStatsBtn');
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', async () => {
            refreshStatsBtn.classList.add('loading');
            try {
                await refreshMediaStats();
                showNotification('Statistics refreshed successfully!', 'success');
            } catch (error) {
                console.error('Failed to refresh statistics:', error);
                showNotification('Failed to refresh statistics', 'error');
            } finally {
                refreshStatsBtn.classList.remove('loading');
            }
        });
    }
    
    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    // Save all button
    const saveAllBtn = document.getElementById('saveAllBtn');
    if (saveAllBtn) {
        saveAllBtn.addEventListener('click', saveAllChanges);
    }
    
    // Avatar change
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');
    if (changeAvatarBtn && avatarInput) {
        changeAvatarBtn.addEventListener('click', () => avatarInput.click());
        avatarInput.addEventListener('change', handleAvatarChange);
    }
    
    // Password toggles
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => togglePasswordVisibility(toggle.dataset.target));
    });
    
    // Password strength
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', checkPasswordStrength);
    }
    
    // Form inputs
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('change', handleInputChange);
        input.addEventListener('input', handleInputChange);
    });
    
    // Data management buttons
    setupDataManagementButtons();
    
    // Danger zone buttons
    setupDangerZoneButtons();
    
    // Confirmation modal
    setupConfirmationModal();
    
    // Auto-refresh stats when page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            refreshMediaStats();
        }
    });
    
    // Auto-refresh stats every 30 seconds
    setInterval(() => {
        refreshMediaStats();
    }, 30000);
}

// Handle input changes
function handleInputChange(event) {
    const input = event.target;
    const field = input.id;
    let value = input.value;
    
    // Handle checkboxes
    if (input.type === 'checkbox') {
        value = input.checked;
    }
    
    // Update profile data
    profileData[field] = value;
    
    // Auto-save for certain fields
    if (['theme', 'autoSync', 'emailNotifications'].includes(field)) {
        saveProfileData();
        if (field === 'theme') {
            applyTheme();
        }
    }
}

// Update UI with profile data
function updateUI() {
    // Personal information
    document.getElementById('firstName').value = profileData.firstName || '';
    document.getElementById('lastName').value = profileData.lastName || '';
    document.getElementById('displayName').value = profileData.displayName || '';
    document.getElementById('email').value = profileData.email || '';
    document.getElementById('phone').value = profileData.phone || '';
    document.getElementById('birthDate').value = profileData.birthDate || '';
    document.getElementById('bio').value = profileData.bio || '';
    
    // Security
    document.getElementById('twoFactorEnabled').checked = profileData.twoFactorEnabled;
    document.getElementById('loginNotifications').checked = profileData.loginNotifications;
    
    // Preferences
    document.getElementById('theme').value = profileData.theme;
    document.getElementById('language').value = profileData.language;
    document.getElementById('timezone').value = profileData.timezone;
    document.getElementById('dateFormat').value = profileData.dateFormat;
    document.getElementById('itemsPerPage').value = profileData.itemsPerPage;
    
    // Notifications
    document.getElementById('emailNotifications').checked = profileData.emailNotifications;
    document.getElementById('pushNotifications').checked = profileData.pushNotifications;
    document.getElementById('weeklyDigest').checked = profileData.weeklyDigest;
    document.getElementById('backupReminders').checked = profileData.backupReminders;
    document.getElementById('updateNotifications').checked = profileData.updateNotifications;
    
    // Advanced
    document.getElementById('autoSync').checked = profileData.autoSync;
    document.getElementById('debugMode').checked = profileData.debugMode;
    document.getElementById('analytics').checked = profileData.analytics;
    document.getElementById('autoBackup').checked = profileData.autoBackup;
    document.getElementById('compactMode').checked = profileData.compactMode;
    
    // Profile header
    updateProfileHeader();
    
    // Apply theme
    applyTheme();
}

// Update profile header
function updateProfileHeader() {
    const displayName = profileData.displayName || 
                       `${profileData.firstName} ${profileData.lastName}`.trim() || 
                       'User';
    const email = profileData.email || 'user@example.com';
    
    document.getElementById('profileName').textContent = displayName;
    document.getElementById('profileEmail').textContent = email;
    document.getElementById('totalItems').textContent = profileData.totalItems;
    document.getElementById('memberSince').textContent = profileData.memberSince;
    
    // Update avatar
    updateAvatar();
}

// Refresh media statistics
async function refreshMediaStats() {
    console.log('Profile: Refreshing media statistics...');
    await loadMediaDataForStats();
    updateProfileHeader();
    console.log('Profile: Media statistics refreshed', { totalItems: profileData.totalItems });
}

// Update avatar
function updateAvatar() {
    const avatarImage = document.getElementById('avatarImage');
    const avatarInitials = document.getElementById('avatarInitials');
    
    if (profileData.avatar) {
        avatarImage.src = profileData.avatar;
        avatarImage.style.display = 'block';
        avatarInitials.style.display = 'none';
    } else {
        avatarImage.style.display = 'none';
        avatarInitials.style.display = 'block';
        
        // Generate initials
        const firstName = profileData.firstName || 'U';
        const lastName = profileData.lastName || 'ser';
        avatarInitials.textContent = (firstName[0] + lastName[0]).toUpperCase();
    }
}

// Handle avatar change
function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profileData.avatar = e.target.result;
            updateAvatar();
            saveProfileData();
            showNotification('Profile picture updated successfully!', 'success');
        };
        reader.readAsDataURL(file);
    }
}

// Toggle password visibility
function togglePasswordVisibility(targetId) {
    const input = document.getElementById(targetId);
    const toggle = document.querySelector(`[data-target="${targetId}"]`);
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = '🙈';
    } else {
        input.type = 'password';
        toggle.textContent = '👁️';
    }
}

// Check password strength
function checkPasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strengthIndicator = document.getElementById('passwordStrength');
    
    if (!password) {
        strengthIndicator.className = 'password-strength';
        return;
    }
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    strengthIndicator.className = 'password-strength';
    if (strength < 2) strengthIndicator.classList.add('weak');
    else if (strength < 3) strengthIndicator.classList.add('fair');
    else if (strength < 4) strengthIndicator.classList.add('good');
    else strengthIndicator.classList.add('strong');
}

// Apply theme
function applyTheme() {
    const body = document.body;
    if (profileData.theme === 'dark') {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }
}

// Save all changes
function saveAllChanges() {
    saveProfileData();
    showNotification('All changes saved successfully!', 'success');
}

// Setup data management buttons
function setupDataManagementButtons() {
    // Export data
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAllData);
    }
    
    // Import data
    const importBtn = document.getElementById('importDataBtn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = handleDataImport;
            input.click();
        });
    }
    
    // Backup data
    const backupBtn = document.getElementById('backupDataBtn');
    if (backupBtn) {
        backupBtn.addEventListener('click', createBackup);
    }
    
    // Clear cache
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', clearCache);
    }
}

// Export all data
function exportAllData() {
    const allData = {
        profile: profileData,
        media: JSON.parse(localStorage.getItem('mediaData') || '[]'),
        collections: JSON.parse(localStorage.getItem('collections') || '[]'),
        settings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `justagood-media-lab-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
}

// Handle data import
function handleDataImport(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.profile) {
                    profileData = { ...profileData, ...data.profile };
                    updateUI();
                }
                
                if (data.media) {
                    localStorage.setItem('mediaData', JSON.stringify(data.media));
                }
                
                if (data.collections) {
                    localStorage.setItem('collections', JSON.stringify(data.collections));
                }
                
                if (data.settings) {
                    localStorage.setItem('appSettings', JSON.stringify(data.settings));
                }
                
                saveProfileData();
                showNotification('Data imported successfully!', 'success');
                
                // Update stats
                profileData.totalItems = data.media ? data.media.length : 0;
                updateProfileHeader();
                
            } catch (error) {
                showNotification('Failed to import data. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Create backup
function createBackup() {
    const backupData = {
        profile: profileData,
        media: JSON.parse(localStorage.getItem('mediaData') || '[]'),
        collections: JSON.parse(localStorage.getItem('collections') || '[]'),
        settings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
        backupDate: new Date().toISOString()
    };
    
    // Store backup in localStorage
    const backupKey = `backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    
    // Keep only last 5 backups
    const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
    if (backupKeys.length > 5) {
        backupKeys.sort().slice(0, -5).forEach(key => localStorage.removeItem(key));
    }
    
    showNotification('Backup created successfully!', 'success');
}

// Clear cache
function clearCache() {
    // Clear any cached data (this is a placeholder for actual cache clearing)
    showNotification('Cache cleared successfully!', 'success');
}

// Setup danger zone buttons
function setupDangerZoneButtons() {
    // Reset settings
    const resetBtn = document.getElementById('resetSettingsBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            showConfirmation(
                'Reset All Settings',
                'Are you sure you want to reset all settings to their default values? This action cannot be undone.',
                resetAllSettings
            );
        });
    }
    
    // Clear all data
    const clearDataBtn = document.getElementById('clearAllDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            showConfirmation(
                'Clear All Data',
                'Are you sure you want to permanently delete all your data? This action cannot be undone.',
                clearAllData
            );
        });
    }
    
    // Delete account
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            showConfirmation(
                'Delete Account',
                'Are you sure you want to permanently delete your account? This will remove all your data and cannot be undone.',
                deleteAccount
            );
        });
    }
}

// Setup confirmation modal
function setupConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    const cancelBtn = document.getElementById('confirmCancel');
    const confirmBtn = document.getElementById('confirmAction');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (window.confirmationCallback) {
                window.confirmationCallback();
                window.confirmationCallback = null;
            }
            modal.classList.remove('show');
        });
    }
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// Show confirmation dialog
function showConfirmation(title, message, callback) {
    const modal = document.getElementById('confirmationModal');
    const titleEl = document.getElementById('confirmationTitle');
    const messageEl = document.getElementById('confirmationMessage');
    const confirmBtn = document.getElementById('confirmAction');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    confirmBtn.textContent = title.includes('Delete') ? 'Delete' : 'Reset';
    confirmBtn.className = title.includes('Delete') ? 'confirm-btn' : 'confirm-btn';
    
    window.confirmationCallback = callback;
    modal.classList.add('show');
}

// Reset all settings
function resetAllSettings() {
    // Reset to default values
    profileData = {
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        phone: '',
        birthDate: '',
        bio: '',
        avatar: '',
        twoFactorEnabled: false,
        loginNotifications: false,
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        itemsPerPage: 24,
        emailNotifications: true,
        pushNotifications: false,
        weeklyDigest: false,
        backupReminders: true,
        updateNotifications: true,
        autoSync: true,
        debugMode: false,
        analytics: false,
        autoBackup: false,
        compactMode: false,
        totalItems: profileData.totalItems, // Keep stats
        memberSince: profileData.memberSince
    };
    
    updateUI();
    saveProfileData();
    showNotification('All settings have been reset to default values.', 'success');
}

// Clear all data
function clearAllData() {
    // Clear all localStorage data
    localStorage.clear();
    
    // Reset profile data
    profileData = {
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        phone: '',
        birthDate: '',
        bio: '',
        avatar: '',
        twoFactorEnabled: false,
        loginNotifications: false,
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        itemsPerPage: 24,
        emailNotifications: true,
        pushNotifications: false,
        weeklyDigest: false,
        backupReminders: true,
        updateNotifications: true,
        autoSync: true,
        debugMode: false,
        analytics: false,
        autoBackup: false,
        compactMode: false,
        totalItems: 0,
        memberSince: new Date().getFullYear()
    };
    
    updateUI();
    showNotification('All data has been cleared.', 'success');
}

// Delete account
function deleteAccount() {
    // Clear all data
    clearAllData();
    
    // Redirect to main page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
    
    showNotification('Account deleted. Redirecting...', 'info');
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Settings Search Functionality
function setupSettingsSearch() {
    const searchInput = document.getElementById('settingsSearchInput');
    const searchClear = document.getElementById('settingsSearchClear');
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    const searchResultsCount = document.getElementById('searchResultsCount');
    
    if (!searchInput) return;
    
    // Search input event listener
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        searchSettings(query);
    });
    
    // Clear search button
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            clearSearch();
        });
    }
    
    // Clear search on Escape key
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            clearSearch();
        }
    });
}

// Search through settings
function searchSettings(query) {
    if (!query) {
        clearSearch();
        return;
    }
    
    const sections = document.querySelectorAll('.settings-section');
    const formGroups = document.querySelectorAll('.form-group');
    let foundCount = 0;
    let firstFoundSection = null;
    
    // Clear previous search results
    sections.forEach(section => {
        section.classList.remove('search-highlighted', 'search-hidden');
    });
    
    formGroups.forEach(group => {
        group.classList.remove('search-highlighted', 'search-hidden');
    });
    
    // Search through sections
    sections.forEach(section => {
        const sectionTitle = section.querySelector('h3');
        const sectionDescription = section.querySelector('.section-header p');
        const sectionText = (sectionTitle?.textContent + ' ' + sectionDescription?.textContent).toLowerCase();
        
        if (matchesSearch(sectionText, query)) {
            section.classList.add('search-highlighted');
            if (!firstFoundSection) firstFoundSection = section;
            foundCount++;
        } else {
            // Search through form groups within this section
            const groups = section.querySelectorAll('.form-group');
            let hasMatchingGroups = false;
            
            groups.forEach(group => {
                const label = group.querySelector('label');
                const input = group.querySelector('input, select, textarea');
                const groupText = (label?.textContent + ' ' + (input?.placeholder || '')).toLowerCase();
                
                if (matchesSearch(groupText, query)) {
                    group.classList.add('search-highlighted');
                    section.classList.add('search-highlighted');
                    hasMatchingGroups = true;
                    if (!firstFoundSection) firstFoundSection = section;
                    foundCount++;
                } else {
                    group.classList.add('search-hidden');
                }
            });
            
            if (!hasMatchingGroups) {
                section.classList.add('search-hidden');
            }
        }
    });
    
    // Update search results info
    updateSearchResultsInfo(foundCount);
    
    // Scroll to first found section
    if (firstFoundSection) {
        setTimeout(() => {
            firstFoundSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
        }, 100);
    }
}

// Enhanced search matching with German translations
function matchesSearch(text, query) {
    if (!text || !query) return false;
    
    // Direct match
    if (text.includes(query)) return true;
    
    // German translations for common settings terms
    const translations = {
        'password': ['passwort', 'sicherheit'],
        'email': ['e-mail', 'nachricht'],
        'notification': ['benachrichtigung', 'meldung'],
        'theme': ['design', 'darstellung', 'modus'],
        'language': ['sprache'],
        'backup': ['sicherung', 'speicherung'],
        'privacy': ['datenschutz', 'privat'],
        'security': ['sicherheit', 'schutz'],
        'personal': ['persönlich', 'eigene'],
        'preferences': ['einstellungen', 'präferenzen'],
        'advanced': ['erweitert', 'fortgeschritten'],
        'data': ['daten'],
        'account': ['konto', 'benutzer'],
        'profile': ['profil', 'benutzerprofil'],
        'settings': ['einstellungen', 'konfiguration'],
        'danger': ['gefahr', 'löschen', 'entfernen'],
        'delete': ['löschen', 'entfernen'],
        'reset': ['zurücksetzen', 'neu'],
        'clear': ['leeren', 'löschen'],
        'export': ['exportieren', 'herunterladen'],
        'import': ['importieren', 'hochladen'],
        'sync': ['synchronisieren', 'abgleich'],
        'analytics': ['analysen', 'statistiken'],
        'debug': ['fehlerbehebung', 'debug'],
        'compact': ['kompakt', 'klein'],
        'auto': ['automatisch', 'selbst'],
        'manual': ['manuell', 'hand'],
        'enable': ['aktivieren', 'einschalten'],
        'disable': ['deaktivieren', 'ausschalten']
    };
    
    // Check if query matches any translated terms
    for (const [english, germanTerms] of Object.entries(translations)) {
        if (query.includes(english) || english.includes(query)) {
            for (const germanTerm of germanTerms) {
                if (text.includes(germanTerm)) return true;
            }
        }
        for (const germanTerm of germanTerms) {
            if (query.includes(germanTerm) && text.includes(english)) return true;
        }
    }
    
    return false;
}

// Clear search results
function clearSearch() {
    const sections = document.querySelectorAll('.settings-section');
    const formGroups = document.querySelectorAll('.form-group');
    
    sections.forEach(section => {
        section.classList.remove('search-highlighted', 'search-hidden');
    });
    
    formGroups.forEach(group => {
        group.classList.remove('search-highlighted', 'search-hidden');
    });
    
    updateSearchResultsInfo(0);
}

// Update search results info display
function updateSearchResultsInfo(count) {
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    const searchResultsCount = document.getElementById('searchResultsCount');
    
    if (searchResultsInfo && searchResultsCount) {
        searchResultsCount.textContent = count;
        
        if (count > 0) {
            searchResultsInfo.style.display = 'flex';
            searchResultsInfo.classList.add('show');
        } else {
            searchResultsInfo.style.display = 'none';
            searchResultsInfo.classList.remove('show');
        }
    }
}

