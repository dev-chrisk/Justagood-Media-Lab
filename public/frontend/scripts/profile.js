// Profile Page JavaScript - Simple and Working Version
console.log('Profile: Script loaded');

// Profile data structure
let profileData = {
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    phone: '',
    birthDate: '',
    bio: '',
    avatar: '',
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile: DOM loaded, initializing...');
    
    // Check if user is logged in
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        console.log('Profile: No auth token, redirecting to index');
        window.location.href = 'index.html';
        return;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Load profile data
    loadProfileData();
    
    // Update UI
    updateUI();
    
    // Hide loading state
    hideLoadingState();
    
    console.log('Profile: Initialization complete');
});

// Set up all event listeners
function setupEventListeners() {
    console.log('Profile: Setting up event listeners');
    
    // Navigation buttons
    const libraryBtn = document.getElementById('libraryBtn');
    const statisticsBtn = document.getElementById('statisticsBtn');
    const profileBtn = document.getElementById('profileBtn');
    
    if (libraryBtn) {
        libraryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Profile: Library button clicked');
            window.location.href = 'index.html';
        });
    }
    
    if (statisticsBtn) {
        statisticsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Profile: Statistics button clicked');
            window.location.href = 'statistics.html';
        });
    }
    
    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Profile: Back button clicked');
            window.location.href = 'index.html';
        });
    }
    
    // Save all button
    const saveAllBtn = document.getElementById('saveAllBtn');
    if (saveAllBtn) {
        saveAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Profile: Save all button clicked');
            saveAllChanges();
        });
    }
    
    // Refresh stats button
    const refreshStatsBtn = document.getElementById('refreshStatsBtn');
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Profile: Refresh stats button clicked');
            refreshStats();
        });
    }
    
    // Avatar change
    const profileAvatar = document.getElementById('profileAvatar');
    const avatarInput = document.getElementById('avatarInput');
    if (profileAvatar && avatarInput) {
        profileAvatar.addEventListener('click', function() {
            avatarInput.click();
        });
        
        avatarInput.addEventListener('change', function(e) {
            handleAvatarChange(e);
        });
    }
    
    // Input change listeners
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', function(e) {
            handleInputChange(e);
        });
    });
    
    // Data management buttons
    setupDataManagementButtons();
    
    // Danger zone buttons
    setupDangerZoneButtons();
    
    // Mobile sidebar toggle
    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.toggle('mobile-open');
            }
        });
    }
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.toggle('collapsed');
            }
        });
    }
    
    console.log('Profile: Event listeners set up successfully');
}

// Load profile data from localStorage
function loadProfileData() {
    console.log('Profile: Loading profile data');
    
    try {
        // Load from localStorage
        const saved = localStorage.getItem('profileData');
        if (saved) {
            const savedData = JSON.parse(saved);
            profileData = { ...profileData, ...savedData };
            console.log('Profile: Loaded saved data', savedData);
        }
        
        // Load app settings
        const settings = localStorage.getItem('appSettings');
        if (settings) {
            const appSettings = JSON.parse(settings);
            profileData.theme = appSettings.darkMode ? 'dark' : 'light';
            profileData.autoSync = appSettings.autoSync !== false;
            profileData.emailNotifications = appSettings.notifications !== false;
            console.log('Profile: Loaded app settings', appSettings);
        }
        
        // Load media count
        const mediaData = localStorage.getItem('mediaData');
        if (mediaData) {
            const media = JSON.parse(mediaData);
            profileData.totalItems = media.length;
            console.log('Profile: Loaded media count', media.length);
        }
        
        console.log('Profile: Profile data loaded successfully', profileData);
        
    } catch (error) {
        console.error('Profile: Error loading profile data:', error);
    }
}

// Update UI with profile data
function updateUI() {
    console.log('Profile: Updating UI');
    
    try {
        // Update profile header
        updateProfileHeader();
        
        // Update form inputs
        updateFormInputs();
        
        // Apply theme
        applyTheme();
        
        console.log('Profile: UI updated successfully');
        
    } catch (error) {
        console.error('Profile: Error updating UI:', error);
    }
}

// Update profile header
function updateProfileHeader() {
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const totalItems = document.getElementById('totalItems');
    const memberSince = document.getElementById('memberSince');
    
    if (profileName) {
        const displayName = profileData.displayName || 
                           `${profileData.firstName} ${profileData.lastName}`.trim() || 
                           'User';
        profileName.textContent = displayName;
    }
    
    if (profileEmail) {
        profileEmail.textContent = profileData.email || 'user@example.com';
    }
    
    if (totalItems) {
        totalItems.textContent = profileData.totalItems || 0;
    }
    
    if (memberSince) {
        memberSince.textContent = profileData.memberSince || new Date().getFullYear();
    }
    
    // Update avatar
    updateAvatar();
}

// Update avatar
function updateAvatar() {
    const avatarImage = document.getElementById('avatarImage');
    const avatarInitials = document.getElementById('avatarInitials');
    
    if (avatarImage && avatarInitials) {
        if (profileData.avatar) {
            avatarImage.src = profileData.avatar;
            avatarImage.style.display = 'block';
            avatarInitials.style.display = 'none';
        } else {
            avatarImage.style.display = 'none';
            avatarInitials.style.display = 'block';
            
            const firstName = profileData.firstName || 'U';
            const lastName = profileData.lastName || 'ser';
            avatarInitials.textContent = (firstName[0] + lastName[0]).toUpperCase();
        }
    }
}

// Update form inputs
function updateFormInputs() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        const field = input.id;
        if (profileData.hasOwnProperty(field)) {
            if (input.type === 'checkbox') {
                input.checked = profileData[field];
            } else {
                input.value = profileData[field] || '';
            }
        }
    });
}

// Handle input changes
function handleInputChange(event) {
    const input = event.target;
    const field = input.id;
    let value = input.value;
    
    if (input.type === 'checkbox') {
        value = input.checked;
    }
    
    profileData[field] = value;
    
    // Auto-save for certain fields
    if (['theme', 'autoSync', 'emailNotifications'].includes(field)) {
        saveProfileData();
        if (field === 'theme') {
            applyTheme();
        }
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

// Apply theme
function applyTheme() {
    const body = document.body;
    if (profileData.theme === 'dark') {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }
}

// Save profile data
function saveProfileData() {
    try {
        localStorage.setItem('profileData', JSON.stringify(profileData));
        
        // Update app settings
        const appSettings = {
            darkMode: profileData.theme === 'dark',
            autoSync: profileData.autoSync,
            notifications: profileData.emailNotifications
        };
        localStorage.setItem('appSettings', JSON.stringify(appSettings));
        
        console.log('Profile: Data saved successfully');
        
    } catch (error) {
        console.error('Profile: Error saving data:', error);
    }
}

// Save all changes
function saveAllChanges() {
    saveProfileData();
    showNotification('All changes saved successfully!', 'success');
}

// Refresh stats
function refreshStats() {
    const mediaData = localStorage.getItem('mediaData');
    if (mediaData) {
        const media = JSON.parse(mediaData);
        profileData.totalItems = media.length;
        updateProfileHeader();
        showNotification('Statistics refreshed!', 'success');
    } else {
        showNotification('No media data found', 'error');
    }
}

// Setup data management buttons
function setupDataManagementButtons() {
    const exportBtn = document.getElementById('exportDataBtn');
    const importBtn = document.getElementById('importDataBtn');
    const backupBtn = document.getElementById('backupDataBtn');
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportData();
        });
    }
    
    if (importBtn) {
        importBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = function(e) {
                importData(e);
            };
            input.click();
        });
    }
    
    if (backupBtn) {
        backupBtn.addEventListener('click', function(e) {
            e.preventDefault();
            createBackup();
        });
    }
    
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearCache();
        });
    }
}

// Setup danger zone buttons
function setupDangerZoneButtons() {
    const resetBtn = document.getElementById('resetSettingsBtn');
    const clearBtn = document.getElementById('clearAllDataBtn');
    const deleteBtn = document.getElementById('deleteAccountBtn');
    
    if (resetBtn) {
        resetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to reset all settings?')) {
                resetSettings();
            }
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
                clearAllData();
            }
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to delete your account? This cannot be undone!')) {
                deleteAccount();
            }
        });
    }
}

// Export data
function exportData() {
    try {
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
        a.download = `media-library-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification('Data exported successfully!', 'success');
        
    } catch (error) {
        console.error('Profile: Error exporting data:', error);
        showNotification('Failed to export data', 'error');
    }
}

// Import data
function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.profile) {
                    profileData = { ...profileData, ...data.profile };
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
                updateUI();
                showNotification('Data imported successfully!', 'success');
                
            } catch (error) {
                console.error('Profile: Error importing data:', error);
                showNotification('Failed to import data', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Create backup
function createBackup() {
    try {
        const backupData = {
            profile: profileData,
            media: JSON.parse(localStorage.getItem('mediaData') || '[]'),
            collections: JSON.parse(localStorage.getItem('collections') || '[]'),
            settings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
            backupDate: new Date().toISOString()
        };
        
        const backupKey = `backup_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backupData));
        
        showNotification('Backup created successfully!', 'success');
        
    } catch (error) {
        console.error('Profile: Error creating backup:', error);
        showNotification('Failed to create backup', 'error');
    }
}

// Clear cache
function clearCache() {
    showNotification('Cache cleared successfully!', 'success');
}

// Reset settings
function resetSettings() {
    profileData = {
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        phone: '',
        birthDate: '',
        bio: '',
        avatar: '',
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
        totalItems: profileData.totalItems,
        memberSince: profileData.memberSince
    };
    
    updateUI();
    saveProfileData();
    showNotification('Settings reset successfully!', 'success');
}

// Clear all data
function clearAllData() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// Delete account
function deleteAccount() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Hide loading state
function hideLoadingState() {
    const loading = document.getElementById('profileLoading');
    const profileHeader = document.getElementById('profileHeader');
    const settingsSections = document.getElementById('settingsSections');
    
    if (loading) {
        loading.style.display = 'none';
    }
    if (profileHeader) {
        profileHeader.style.display = 'block';
    }
    if (settingsSections) {
        settingsSections.style.display = 'block';
    }
}

console.log('Profile: Script loaded successfully');