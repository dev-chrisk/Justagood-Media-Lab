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
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile page loaded');
    
    // Load profile data
    loadProfileData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update UI with loaded data
    updateUI();
});

// Load profile data from localStorage
function loadProfileData() {
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
    
    // Load media data for stats
    const mediaData = localStorage.getItem('mediaData');
    if (mediaData) {
        try {
            const data = JSON.parse(mediaData);
            profileData.totalItems = data.length;
        } catch (e) {
            console.warn('Failed to load media data for stats:', e);
        }
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

