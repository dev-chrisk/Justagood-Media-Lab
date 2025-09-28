let mediaData = [];
let currentCategory = "game";
let currentEditItem = null;
let activeFilters = [];
let airingFilter = "all"; // "all", "true", "false"
let renderBatchSize = 60; // initial batch size
let renderedCount = 0;

// Profile Status System
const PROFILE_STATUSES = {
    'noob': { min: 0, max: 9, name: 'Noob', color: '#6B7280', glow: '#374151', animation: 'pulse' },
    'rookie': { min: 10, max: 24, name: 'Rookie', color: '#10B981', glow: '#059669', animation: 'glow' },
    'collector': { min: 25, max: 49, name: 'Collector', color: '#3B82F6', glow: '#2563EB', animation: 'glow' },
    'enthusiast': { min: 50, max: 99, name: 'Enthusiast', color: '#8B5CF6', glow: '#7C3AED', animation: 'glow' },
    'expert': { min: 100, max: 199, name: 'Expert', color: '#F59E0B', glow: '#D97706', animation: 'glow' },
    'master': { min: 200, max: 499, name: 'Master', color: '#EF4444', glow: '#DC2626', animation: 'glow' },
    'legend': { min: 500, max: 999, name: 'Legend', color: '#EC4899', glow: '#DB2777', animation: 'legend' },
    'mythic': { min: 1000, max: Infinity, name: 'Mythic', color: '#F97316', glow: '#EA580C', animation: 'mythic' }
};

// Tooltip system
let tooltipDismissed = false;

// Tooltip functions
function checkTooltipDismissal() {
    const dismissed = localStorage.getItem('noobTooltipDismissed');
    tooltipDismissed = dismissed === 'true';
}

function showNoobTooltip() {
    if (tooltipDismissed) return;
    
    const tooltip = document.getElementById('noobTooltip');
    if (tooltip) {
        tooltip.style.display = 'block';
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            hideNoobTooltip();
        }, 10000);
    }
}

function hideNoobTooltip() {
    const tooltip = document.getElementById('noobTooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

function dismissTooltip() {
    tooltipDismissed = true;
    localStorage.setItem('noobTooltipDismissed', 'true');
    hideNoobTooltip();
}

// Profile Status Functions
function calculateProfileStatus(itemCount) {
    for (const [key, status] of Object.entries(PROFILE_STATUSES)) {
        if (itemCount >= status.min && itemCount <= status.max) {
            return { key, ...status };
        }
    }
    return { key: 'noob', ...PROFILE_STATUSES.noob };
}

function updateProfileStatus() {
    if (!currentUser) return;
    
    const itemCount = mediaData ? mediaData.length : 0;
    const status = calculateProfileStatus(itemCount);
    
    // Update sidebar profile
    updateSidebarProfileStatus(status);
    
    // Update account settings profile
    updateAccountProfileStatus(status);
    
    // Store current status in user data
    if (currentUser) {
        currentUser.status = status;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

function updateSidebarProfileStatus(status) {
    const userName = document.getElementById('userName');
    const userProfile = document.querySelector('.user-profile');
    const profileAvatar = document.querySelector('.user-profile .profile-avatar');
    
    if (userName && userProfile) {
        // Update name with status
        userName.innerHTML = `${currentUser.name} <span class="status-badge status-${status.key}">${status.name}</span>`;
        
        // Add tooltip for full name
        userName.title = currentUser.name;
        
        // Update profile styling
        userProfile.className = `user-profile status-${status.key}`;
        userProfile.style.setProperty('--status-color', status.color);
        userProfile.style.setProperty('--status-glow', status.glow);
        
        // Only animate if not already visible to prevent blinking
        if (!userProfile.classList.contains('show')) {
            userProfile.classList.add('animate-fade-in');
            
            // Remove animation class after animation completes to prevent re-triggering
            setTimeout(() => {
                userProfile.classList.remove('animate-fade-in');
            }, 500);
        }
        
        // Update avatar styling
        if (profileAvatar) {
            profileAvatar.style.setProperty('--status-color', status.color);
            profileAvatar.style.setProperty('--status-glow', status.glow);
        }
        
        // Show tooltip for noob status
        if (status.key === 'noob') {
            setTimeout(() => {
                showNoobTooltip();
            }, 1000); // Show after 1 second delay
        } else {
            hideNoobTooltip();
        }
    }
}

function updateAccountProfileStatus(status) {
    const accountUserName = document.getElementById('accountUserName');
    const profileInfo = document.querySelector('.profile-info');
    const profileAvatar = document.querySelector('.profile-info .profile-avatar');
    const profileStatus = document.getElementById('accountUserStatus');
    const statusValue = document.querySelector('.profile-info .status-value');
    
    if (accountUserName && profileInfo) {
        // Update name only (no status badge in name)
        accountUserName.textContent = currentUser.name;
        
        // Update profile styling
        profileInfo.className = `profile-info status-${status.key}`;
        profileInfo.style.setProperty('--status-color', status.color);
        profileInfo.style.setProperty('--status-glow', status.glow);
        
        // Update avatar styling
        if (profileAvatar) {
            profileAvatar.style.setProperty('--status-color', status.color);
            profileAvatar.style.setProperty('--status-glow', status.glow);
        }
        
        // Update status display
        if (profileStatus && statusValue) {
            profileStatus.style.display = 'flex';
            statusValue.innerHTML = `<span class="status-badge status-${status.key}">${status.name}</span>`;
        }
    }
}
let observer = null;
let searchQuery = "";
let gridColumns = 8; // default grid columns
let playMin = null;
let playMax = null;
// Always use grid view
let landscapeMode = false; // Keep for backward compatibility
let _gridColumns = 8; // Fixed grid column count

// Per-category landscape mode settings
let landscapeModeSettings = {
    game: false,
    series: false,
    movie: false,
    games_new: false,
    series_new: false,
    movie_new: false
};

// Authentication state
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Authentication check will be done after DOM is loaded

// Set up auth button event listeners
function setupAuthButtonListeners() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Use a more robust approach with event delegation
    if (loginBtn && !loginBtn.dataset.listenerAdded) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Login button clicked');
            showLoginModal();
        });
        loginBtn.dataset.listenerAdded = 'true';
    }
    
    if (registerBtn && !registerBtn.dataset.listenerAdded) {
        registerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Register button clicked');
            showRegisterModal();
        });
        registerBtn.dataset.listenerAdded = 'true';
    }
    
    if (logoutBtn && !logoutBtn.dataset.listenerAdded) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Logout button clicked');
            logout();
        });
        logoutBtn.dataset.listenerAdded = 'true';
    }
}

// Enable auth buttons and show correct UI
function enableAuthButtons() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const filterSection = document.getElementById('filtersSection');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Enable all buttons
    if (loginBtn) loginBtn.disabled = false;
    if (registerBtn) registerBtn.disabled = false;
    if (logoutBtn) logoutBtn.disabled = false;
    
    // Set up event listeners for auth buttons
    setupAuthButtonListeners();
    
    // Show correct UI based on auth state
    const authToken = localStorage.getItem('authToken');
    
    if (authToken) {
        // User is logged in - show user info and hide login buttons
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'flex';
            userInfo.style.setProperty('display', 'flex', 'important');
            // Update profile status to show rank badge
            updateProfileStatus();
        // Trigger smooth fade-in animation
        setTimeout(() => {
            userInfo.classList.add('show');
        }, 100);
        }
        if (filterSection) {
            filterSection.style.display = 'block';
            filterSection.style.setProperty('display', 'block', 'important');
            // Trigger smooth fade-in animation
            setTimeout(() => {
                filterSection.classList.add('show');
            }, 100);
        }
    } else {
        // User is not logged in - show login buttons and hide user info
        if (authButtons) {
            authButtons.style.display = 'flex';
            authButtons.style.setProperty('display', 'flex', 'important');
            // Trigger smooth fade-in animation
            setTimeout(() => {
                authButtons.classList.add('show');
            }, 50);
        }
        if (userInfo) {
            userInfo.style.display = 'none';
            userInfo.style.setProperty('display', 'none', 'important');
            userInfo.classList.remove('show');
        }
        if (filterSection) {
            filterSection.style.display = 'none';
            filterSection.classList.remove('show');
        }
    }
}

// Sidebar state
let sidebarCollapsed = false;
let floatingMenuOpen = false;

// Check authentication status
async function checkAuthStatus() {
    if (!authToken) {
        console.log('No auth token found, skipping auth check');
        return;
    }
    
    console.log('Checking auth status with token:', authToken);
    
    try {
        const response = await fetch('/api/user', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            console.log('Auth check successful, user:', currentUser);
            updateAuthUI();
            await loadData();
        } else {
            console.log('Auth check failed, clearing token. Status:', response.status);
            // Token is invalid, clear it
            authToken = null;
            currentUser = null;
            localStorage.removeItem('authToken');
            updateAuthUI();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        updateAuthUI();
    }
}

// Simple grid column getter (fixed at 8)
Object.defineProperty(window, 'gridColumns', {
    get: function() {
        return 8;
    },
    set: function(value) {
        // Grid columns are now fixed at 8, ignore attempts to change
        console.log('Grid columns are fixed at 8, ignoring change to:', value);
    }
});

// Generate unique ID for items
function generateUniqueId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${timestamp}_${random}`;
}

const orderedKeys = [
    "category",
    "count",
    "link",
    "path",
    "platforms",
    "rating",
    "release",
    "title",
    "genre",
    "discovered",
    "spielzeit",
    "isAiring",
    "nextSeason",
    "nextSeasonRelease"
];

// Authentication functions
async function login(email, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            updateAuthUI();
            await loadData();
            return true;
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function register(name, email, password) {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password, password_confirmation: password })
        });

        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            updateAuthUI();
            await loadData();
            return true;
        } else {
            throw new Error(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

async function logout() {
    try {
        if (authToken) {
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                }
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        updateAuthUI();
        mediaData = [];
        renderFilterBar();
        renderGrid();
        updateCounts();
        updateFilterCheckboxes();
        updateNavigationButtons();
    }
}

function updateAuthUIWithoutProfileStatus() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const filterSection = document.getElementById('filtersSection');
    const headerRight = document.querySelector('.header-right');
    
    console.log('updateAuthUIWithoutProfileStatus called:', { 
        currentUser: !!currentUser, 
        authButtons: !!authButtons, 
        userInfo: !!userInfo, 
        userName: !!userName,
        headerRight: !!headerRight
    });
    
    if (!authButtons || !userInfo || !userName) {
        console.log('Auth UI elements not found, skipping update');
        return;
    }
    
    // Set up event listeners for auth buttons
    setupAuthButtonListeners();
    
    if (currentUser) {
        authButtons.style.display = 'none';
        authButtons.classList.remove('show');
        
        userInfo.style.display = 'flex';
        userInfo.style.setProperty('display', 'flex', 'important');
        userName.textContent = currentUser.name; // Just set name, no rank yet
        userName.title = currentUser.name; // Add tooltip for full name
        
        // Trigger smooth fade-in animation for user info
        setTimeout(() => {
            userInfo.classList.add('show');
        }, 100);
        
        // Show filter section when logged in
        if (filterSection) {
            filterSection.style.display = 'block';
            filterSection.style.setProperty('display', 'block', 'important');
            // Trigger smooth fade-in animation for filter section
            setTimeout(() => {
                filterSection.classList.add('show');
            }, 100);
        }
        
        // Show header settings when logged in
        if (headerRight) {
            headerRight.style.display = 'flex';
            headerRight.style.setProperty('display', 'flex', 'important');
            // Trigger smooth fade-in animation for header settings
            setTimeout(() => {
                headerRight.classList.add('show');
            }, 100);
        }
    } else {
        authButtons.style.display = 'flex';
        authButtons.style.setProperty('display', 'flex', 'important');
        userInfo.style.display = 'none';
        userInfo.style.setProperty('display', 'none', 'important');
        userInfo.classList.remove('show');
        
        // Trigger smooth fade-in animation for auth buttons
        setTimeout(() => {
            authButtons.classList.add('show');
        }, 100);
        
        // Hide filter section when logged out
        if (filterSection) {
            filterSection.style.display = 'none';
            filterSection.classList.remove('show');
        }
        
        // Hide header settings when logged out
        if (headerRight) {
            headerRight.style.display = 'none';
            headerRight.style.setProperty('display', 'none', 'important');
            headerRight.classList.remove('show');
        }
    }
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const filterSection = document.getElementById('filtersSection');
    const headerRight = document.querySelector('.header-right');
    
    console.log('updateAuthUI called:', { 
        currentUser: !!currentUser, 
        authButtons: !!authButtons, 
        userInfo: !!userInfo, 
        userName: !!userName,
        headerRight: !!headerRight
    });
    
    if (!authButtons || !userInfo || !userName) {
        console.log('Auth UI elements not found, skipping update');
        return;
    }
    
    // Set up event listeners for auth buttons
    setupAuthButtonListeners();
    
    if (currentUser) {
        authButtons.style.display = 'none';
        authButtons.classList.remove('show');
        
        userInfo.style.display = 'flex';
        userInfo.style.setProperty('display', 'flex', 'important');
        userName.title = currentUser.name; // Add tooltip for full name
        
        // Update profile status to show rank badge (this will set the name with rank)
        updateProfileStatus();
        
        // Trigger smooth fade-in animation for user info
        setTimeout(() => {
            userInfo.classList.add('show');
        }, 100);
        
        // Show filter section when logged in
        if (filterSection) {
            filterSection.style.display = 'block';
            filterSection.style.setProperty('display', 'block', 'important');
            // Trigger smooth fade-in animation for filter section
            setTimeout(() => {
                filterSection.classList.add('show');
            }, 100);
        }
        
        // Show header settings when logged in
        if (headerRight) {
            headerRight.style.display = 'flex';
            headerRight.style.setProperty('display', 'flex', 'important');
            // Trigger smooth fade-in animation for header settings
            setTimeout(() => {
                headerRight.classList.add('show');
            }, 100);
        }
        
        // Update profile status when user logs in
        updateProfileStatus();
    } else {
        authButtons.style.display = 'flex';
        authButtons.style.setProperty('display', 'flex', 'important');
        userInfo.style.display = 'none';
        userInfo.style.setProperty('display', 'none', 'important');
        userInfo.classList.remove('show');
        
        // Trigger smooth fade-in animation for auth buttons
        setTimeout(() => {
            authButtons.classList.add('show');
        }, 100);
        
        // Hide filter section when logged out
        if (filterSection) {
            filterSection.style.display = 'none';
            filterSection.classList.remove('show');
        }
        
        // Hide header settings when logged out
        if (headerRight) {
            headerRight.style.display = 'none';
            headerRight.style.setProperty('display', 'none', 'important');
            headerRight.classList.remove('show');
        }
    }
}

async function loadData(){
    console.log('loadData() called', { authToken: !!authToken, currentUser: !!currentUser });
    
    // Update UI based on auth state (but don't update profile status yet - data not loaded)
    updateAuthUIWithoutProfileStatus();
    
    // If user is not logged in, load from JSON file for demo purposes
    if (!authToken) {
        console.log('User not logged in, loading from JSON file for demo');
        try {
            const res = await fetch("/data/data/media.json");
            mediaData = await res.json();
        mediaData.forEach((item, idx)=>{ if(item && item.__order == null) item.__order = idx; });
        renderFilterBar();
        renderGrid();
        updateCounts();
        updateFilterCheckboxes();
        updateNavigationButtons();
        
        // Update profile status after loading data
        updateProfileStatus();
        
        // Update statistics if they are currently visible
        if (statisticsManager && document.getElementById('statisticsView').style.display !== 'none') {
            statisticsManager.loadStatistics();
        }
        return;
        } catch(fallbackError) {
            console.error("JSON loading failed:", fallbackError);
            mediaData = [];
            renderFilterBar();
            renderGrid();
            updateCounts();
            return;
        }
    }
    
    // If user is logged in, only load from API
    try {
        const headers = { 'Authorization': `Bearer ${authToken}` };
        
        console.log('Fetching from API with headers:', headers);
        const res = await fetch("/api/media_relative.json", { headers });
        
        if (!res.ok) {
            throw new Error(`API request failed: ${res.status} ${res.statusText}`);
        }
        
        mediaData = await res.json();
        console.log('API response received:', { itemCount: mediaData.length });
        
        // capture original order index once
        mediaData.forEach((item, idx)=>{ if(item && item.__order == null) item.__order = idx; });
        renderFilterBar();
        renderGrid();
        updateCounts();
        updateFilterCheckboxes();
        updateNavigationButtons();
        
        // Update profile status after loading data
        updateProfileStatus();
        
        // Update statistics if they are currently visible
        if (statisticsManager && document.getElementById('statisticsView').style.display !== 'none') {
            statisticsManager.loadStatistics();
        }
    } catch(e){
        console.error("API failed for logged in user:", e);
        // If user is logged in but API fails, show empty data
        mediaData = [];
        renderFilterBar();
        renderGrid();
        updateCounts();
        updateFilterCheckboxes();
        updateNavigationButtons();
    }
}

function renderGrid(){
    console.log('renderGrid() called - fixed grid columns: 8');
    const container = document.getElementById("grid");
    container.innerHTML="";
    container.setAttribute("data-cat", baseCategory(currentCategory));
    
    // Reset rendering state
    renderedCount = 0;
    
    // Reset grid styles when switching from calendar
    if (currentCategory !== "calendar") {
        container.className = "";
        container.style.display = "grid";
        container.style.gridTemplateColumns = `repeat(${gridColumns}, 1fr)`;
        container.style.width = "100%";
        container.style.maxWidth = "none";
        container.style.margin = "0";
        container.style.overflow = "hidden";
    }
    
    // Handle calendar view
    if (currentCategory === "calendar") {
        renderCalendar(container);
        return;
    }
    
    let filtered = mediaData.filter(item => item.category===currentCategory);
    const now = new Date();
    if(!isNewCategory(currentCategory)){
        // Normal views: exclude future releases (they live in *New views only)
        filtered = filtered.filter(item=>{
            const d = new Date(item.release);
            return isNaN(d) || d <= now;
        });
    }
    if(searchQuery){
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(item => (item.title||"").toLowerCase().includes(q));
    }
    if(activeFilters.length>0){
        filtered = filtered.filter(item=>{
            if(currentCategory==="game") return item.platforms?.split(",").some(p=>activeFilters.includes(p.trim()));
            else return item.genre?.split(",").some(g=>activeFilters.includes(g.trim()));
        });
    }
    if(currentCategory==="game" && (playMin!=null || playMax!=null)){
        filtered = filtered.filter(item=>{
            const v = (item.spielzeit==null? null : Number(item.spielzeit));
            if(v==null || isNaN(v)) return false;
            if(playMin!=null && v < playMin) return false;
            if(playMax!=null && v > playMax) return false;
            return true;
        });
    }
    // Airing filter for series
    if((currentCategory==="series" || currentCategory==="series_new") && airingFilter !== "all"){
        filtered = filtered.filter(item=>{
            const isAiring = item.isAiring === true;
            if(airingFilter === "true") return isAiring;
            if(airingFilter === "false") return !isAiring;
            return true;
        });
    }
    const sortVal = document.getElementById("sortSelect")?.value;
    if(sortVal){
        if(sortVal==="release_asc") filtered.sort((a,b)=>new Date(a.release)-new Date(b.release));
        else if(sortVal==="release_desc") filtered.sort((a,b)=>new Date(b.release)-new Date(a.release));
        else if(sortVal==="title_asc") filtered.sort((a,b)=>a.title.localeCompare(b.title));
        else if(sortVal==="title_desc") filtered.sort((a,b)=>b.title.localeCompare(a.title));
        else if(sortVal==="rating_asc") filtered.sort((a,b)=>(a.rating||0)-(b.rating||0));
        else if(sortVal==="rating_desc") filtered.sort((a,b)=>(b.rating||0)-(a.rating||0));
        else if(sortVal==="discovered_asc") filtered.sort((a,b)=> new Date(a.discovered||"9999-12-31") - new Date(b.discovered||"9999-12-31"));
        else if(sortVal==="discovered_desc") filtered.sort((a,b)=> new Date(b.discovered||"0001-01-01") - new Date(a.discovered||"0001-01-01"));
        else if(sortVal==="order_asc") filtered.sort((a,b)=> (a.__order??0) - (b.__order??0));
        else if(sortVal==="order_desc") filtered.sort((a,b)=> (b.__order??0) - (a.__order??0));
    }
    // Reset incremental state
    renderedCount = 0;
    // Render first chunk
    renderChunk(filtered, container);
    // Setup infinite scroll sentinel only if there are more items to load
    if(filtered.length > renderBatchSize) {
        setupInfiniteScroll(filtered, container);
    }
    // Update counters after (re)render
    updateCounts();
}

function renderChunk(list, container){
    console.log('renderChunk() called - fixed grid columns: 8');
    
    // Ensure grid columns remain consistent during chunk rendering
    if (currentCategory !== "calendar") {
        container.style.gridTemplateColumns = `repeat(${gridColumns}, 1fr)`;
    }
    
    const end = Math.min(renderedCount + renderBatchSize, list.length);
    
    // Render cards first, then load images
    const fragment = document.createDocumentFragment();
    
    for(let i = renderedCount; i < end; i++){
        const item = list[i];
        const card=document.createElement("div");
        card.className="card";
        const imgWrap=document.createElement("div");
        imgWrap.className = "img-wrapper";
        const img=document.createElement("img");
        
        // Load image with better performance - use original but with lazy loading
        // Add /images/ prefix if the path doesn't already start with it
        const imagePath = item.path.startsWith('images/') ? `/${item.path}` : `/images/${item.path}`;
        img.src = imagePath;
        img.loading = "lazy";
        img.decoding = "async";
        
        // Add error handling
        img.onerror = function() {
            this.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.style.cssText = `
                width: 100%;
                height: 200px;
                background: #333;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #666;
                font-size: 14px;
            `;
            placeholder.textContent = 'Bild nicht verfügbar';
            this.parentNode.replaceChild(placeholder, this);
        };
        img.alt=item.title;
        imgWrap.appendChild(img);
        
        // Add rating badge if rating exists
        if (item.rating && item.rating > 0) {
            const ratingBadge = document.createElement("div");
            ratingBadge.className = "rating-badge";
            ratingBadge.innerHTML = `★ ${item.rating}`;
            
            // Set badge style based on rating
            const rating = item.rating;
            if (rating >= 8) {
                ratingBadge.classList.add("rating-excellent");
            } else if (rating >= 6) {
                ratingBadge.classList.add("rating-good");
            } else if (rating >= 4) {
                ratingBadge.classList.add("rating-average");
            } else {
                ratingBadge.classList.add("rating-poor");
            }
            
            imgWrap.appendChild(ratingBadge);
        }
        const title=document.createElement("h3"); title.className = "card-title"; title.textContent=item.title;
        // Show remaining days for series in both Series and Series New tabs
        if(baseCategory(currentCategory)==='series'){
            if(item.isAiring){
                const rel = item.nextSeasonRelease || '';
                const left = rel ? daysUntil(rel) : null;
                if(left!=null){ const span=document.createElement('span'); span.className='days-badge'; span.textContent = `(${left}d)`; title.appendChild(span); }
            }
        }
        // Show airing and next season badge
        if(item.category==='series' || item.category==='series_new'){
            if(item.isAiring){
                const ab=document.createElement('span'); ab.className='airing-badge';
                ab.textContent = item.nextSeason? `S${item.nextSeason}` : 'Airing';
                title.appendChild(ab);
            }
        }
        if(isNewCategory(currentCategory)){
            const left = daysUntil(item.release);
            if(left!=null){ const span=document.createElement('span'); span.className='days-badge'; span.textContent = `(${left}d)`; title.appendChild(span); }
        }

        // Open detail on card click
        card.onclick = () => openDetailModal(item);
        card.append(imgWrap,title);
        fragment.appendChild(card);
    }
    
    // Append all cards at once for better performance
    container.appendChild(fragment);
    renderedCount = end;
    
    // Move sentinel to end of rendered content
    const sentinel = document.getElementById("sentinel");
    if(sentinel && sentinel.parentNode === container) {
        container.appendChild(sentinel);
    }
    
    // Final check to ensure grid columns are still correct after rendering
    if (currentCategory !== "calendar") {
        container.style.gridTemplateColumns = `repeat(${gridColumns}, 1fr)`;
    }
}

function setupInfiniteScroll(list, container){
    if(observer){ observer.disconnect(); }
    
    // Remove existing sentinel if it exists
    const existingSentinel = document.getElementById("sentinel");
    if(existingSentinel) {
        existingSentinel.remove();
    }
    
    const sentinel = document.createElement("div");
    sentinel.id = "sentinel";
    sentinel.style.cssText = "height: 1px; width: 100%; background: transparent; margin: 0; padding: 0;";
    container.appendChild(sentinel);
    
    observer = new IntersectionObserver((entries)=>{
        for(const entry of entries){
            if(entry.isIntersecting){
                console.log('Intersection Observer triggered - renderedCount:', renderedCount, 'list.length:', list.length);
                if(renderedCount < list.length){
                    console.log('Calling renderChunk - current gridColumns:', gridColumns);
                    renderChunk(list, container);
                    console.log('After renderChunk - grid style:', container.style.gridTemplateColumns);
                }
            }
        }
    }, {
        rootMargin: "50px" // Load more content before reaching the sentinel
    });
    observer.observe(sentinel);
}

// Global variable to track filter bar expanded state
let filterBarExpanded = false;

function renderFilterBar(){
    const filterBar=document.getElementById("filterBar");
    const expandBtn = document.getElementById("filterExpandBtn");
    
    // Check if filterBar exists (it might not in the new layout)
    if (!filterBar) {
        console.log('Filter bar not found, using sidebar filters instead');
        return;
    }
    
    // Clear only the filter content, keep the expand button
    const existingLabels = filterBar.querySelectorAll('label');
    existingLabels.forEach(label => label.remove());
    
    let options=[];
    if(currentCategory==="game"){
        mediaData.forEach(item=>{
            if(item.category==="game" && item.platforms){
                item.platforms.split(",").forEach(p=>{
                    const t=p.trim(); if(!options.includes(t)) options.push(t);
                });
            }
        });
    } else {
        mediaData.forEach(item=>{
            if(item.category===currentCategory && item.genre){
                item.genre.split(",").forEach(g=>{
                    const t=g.trim(); if(!options.includes(t)) options.push(t);
                });
            }
        });
    }
    // custom order for game platforms
    if(currentCategory==="game"){
        const preferred=["PC","Game Boy","PSP","Xbox 360"];
        options.sort((a,b)=>{
            const ia=preferred.indexOf(a); const ib=preferred.indexOf(b);
            if(ia!==-1 || ib!==-1){ return (ia===-1?999:ia) - (ib===-1?999:ib); }
            return a.localeCompare(b);
        });
    } else {
        options.sort((a,b)=>a.localeCompare(b));
    }

    const maxVisible=4;
    
    const renderChips=()=>{
        // Check if filterBar exists
        if (!filterBar) {
            console.log('Filter bar not found, using sidebar filters instead');
            return;
        }
        
        // Remove existing labels
        const existingLabels = filterBar.querySelectorAll('label');
        existingLabels.forEach(label => label.remove());
        
        const slice = filterBarExpanded? options : options.slice(0, maxVisible);
        slice.forEach(opt=>{
        const label=document.createElement("label");
        const cb=document.createElement("input"); cb.type="checkbox"; cb.value=opt;
        cb.onchange=()=>toggleFilter(opt,cb.checked);
        label.appendChild(cb); label.appendChild(document.createTextNode(opt));
            filterBar.insertBefore(label, expandBtn);
        });
        
        // Update expand button visibility and state
        if(options.length>maxVisible && expandBtn){
            expandBtn.style.display = "flex";
            expandBtn.textContent = filterBarExpanded? "−" : "+";
            expandBtn.className = `filter-expand-btn ${filterBarExpanded ? 'expanded' : ''}`;
        } else if (expandBtn) {
            expandBtn.style.display = "none";
        }
    };
    
    // Set up expand button click handler
    if (expandBtn) {
        expandBtn.onclick = () => {
            filterBarExpanded = !filterBarExpanded;
            if (filterBar) {
                filterBar.classList.toggle('expanded', filterBarExpanded);
            }
            renderChips();
        };
    }
    
    renderChips();
}

function toggleFilter(option, checked){
    if(checked) activeFilters.push(option);
    else activeFilters=activeFilters.filter(f=>f!==option);
    renderGrid();
}

function switchCategory(cat){
    // Clean up grid protection from previous category
    // Grid protection cleanup no longer needed
    
    currentCategory=cat;
    activeFilters=[];
    // reset playtime filters when leaving games
    if(cat!=="game"){ playMin=null; playMax=null; const p1=document.getElementById('playMin'); const p2=document.getElementById('playMax'); if(p1) p1.value=''; if(p2) p2.value=''; }
    // reset airing filter when leaving series
    if(cat!=="series" && cat!=="series_new"){ airingFilter="all"; }
    
    // Hide filter bar for calendar
    const filterBar = document.getElementById('filterBar');
    if(filterBar) {
        filterBar.style.display = (cat === 'calendar' ? 'none' : 'block');
    }
    
    // Hide view mode controls for calendar
    // View mode group removed - always using grid
    
    renderFilterBar();
    renderGrid();
    // toggle visibility of playtime group
    const playtimeGroup = document.getElementById('playtimeGroup');
    if(playtimeGroup){ playtimeGroup.style.display = (cat==='game' ? 'flex' : 'none'); }
    // toggle visibility of airing group
    const airingGroup = document.getElementById('airingGroup');
    if(airingGroup){ airingGroup.style.display = (cat==='series' || cat==='series_new' ? 'flex' : 'none'); }
    setActiveCategoryButton();
    setActiveAiringButton(airingFilter);
}

function openEditModal(item){
    currentEditItem=item;
    document.getElementById("editCategory").value=item?.category||"game";
    document.getElementById("editTitle").value=item?.title||"";
    document.getElementById("editRelease").value=item?.release||"";
    document.getElementById("editRating").value=item?.rating??"";
    document.getElementById("editCount").value=item?.count??0;
    document.getElementById("editPath").value=item?.path||"";
    document.getElementById("editLink").value=item?.link||"";
    document.getElementById("editPlatforms").value=item?.platforms||"";
    document.getElementById("editGenre").value=item?.genre||"";
    // Set or generate unique ID for item
    document.getElementById("editId").value = item?.id || generateUniqueId();
    const isAiringSel=document.getElementById('editIsAiring'); if(isAiringSel) isAiringSel.value = item?.isAiring? 'true':'false';
    const nextSeasonInput=document.getElementById('editNextSeason'); if(nextSeasonInput) nextSeasonInput.value = item?.nextSeason??'';
    const nextSeasonReleaseInput=document.getElementById('editNextSeasonRelease'); if(nextSeasonReleaseInput) nextSeasonReleaseInput.value = item?.nextSeasonRelease||'';
    const discoveredInput = document.getElementById("editDiscovered");
    if(discoveredInput) discoveredInput.value=item?.discovered||"";
    const playtimeInput = document.getElementById("editPlaytime");
    if(playtimeInput) playtimeInput.value = (item?.spielzeit ?? "");
    document.getElementById("checkApi").checked=false;
    document.getElementById("apiMessage").textContent="";
    document.getElementById("checkInfoMessage").textContent="";
    
    // Clear autocomplete results
    const resultsContainer = document.getElementById('autocompleteResults');
    if (resultsContainer) {
        resultsContainer.classList.remove('show');
        resultsContainer.innerHTML = '';
    }
    
    // Initialize autocomplete
    initializeAutocomplete();
    
    const delBtn = document.getElementById("deleteFromEditBtn");
    if(delBtn) delBtn.onclick = async ()=>{
        if(!currentEditItem) return;
        const oldPath = currentEditItem.path;
        mediaData = mediaData.filter(e => e !== currentEditItem);
        await saveData();
        renderGrid();
        closeModal('editModal');
        if(oldPath){
            try{ 
                const headers = {'Content-Type':'application/json'};
                if (authToken) {
                    headers['Authorization'] = `Bearer ${authToken}`;
                }
                await fetch('/api/delete-image',{method:'POST', headers: headers, body: JSON.stringify({path: oldPath})}); 
            }catch(e){ console.error(e); }
        }
    };
    openModal("editModal");
}

let currentDetailItem = null;
let detailEditMode = false;

function openDetailModal(item){
    currentDetailItem = item;
    detailEditMode = false;
    
    // Fill fields
    document.getElementById("detailTitle").textContent = item.title || "";
    // Use original image for detail view
    const previewUrl = `/${item.path}`;
    const imgEl = document.getElementById("detailImage");
    imgEl.onerror = null;
    imgEl.src = previewUrl;
    imgEl.alt = item.title || "";
    
    // Update all detail fields
    updateDetailFields(item);
    
    // Wire actions
    document.getElementById("detailEditBtn").onclick = () => {
        closeModal('detailModal');
        openEditModal(item);
    };
    document.getElementById("detailDeleteBtn").onclick = async () => {
        const oldPath = item.path;
        mediaData = mediaData.filter(e => e !== item);
        await saveData();
        renderGrid();
        closeModal('detailModal');
        if (oldPath) {
            try {
                const headers = { "Content-Type": "application/json" };
                if (authToken) {
                    headers['Authorization'] = `Bearer ${authToken}`;
                }
                await fetch("/api/delete-image", {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify({ path: oldPath })
                });
            } catch(e) {
                console.error("Fehler beim Löschen des Bildes:", e);
            }
        }
    };
    document.getElementById("detailCloseBtn").onclick = () => closeModal('detailModal');
    
    // Wire save button
    document.getElementById("detailSaveBtn").onclick = () => {
        saveDetailChanges();
    };
    
    // Initialize editable fields
    initializeDetailInputs();
    
    // Use the new modal system
    openModal('detailModal');
}

function updateDetailFields(item) {
    console.log("Updating detail fields for item:", item);
    console.log("Item rating:", item.rating);
    
    // Basic info - update both display and input values
    document.getElementById("detailRelease").textContent = item.release || "-";
    const releaseInput = document.getElementById("detailReleaseInput");
    if(releaseInput) releaseInput.value = item.release || "";
    
    document.getElementById("detailRating").textContent = (item.rating ?? "-");
    
    document.getElementById("detailCount").textContent = (item.count ?? 0);
    
    // Update star rating
    updateStarRating(item.rating);
    
    // Custom fields
    const detDisc = document.getElementById("detailDiscovered");
    if(detDisc) detDisc.textContent = item.discovered || "-";
    const discInput = document.getElementById("detailDiscoveredInput");
    if(discInput) discInput.value = item.discovered || "";
    
    // Series specific
    const detAir = document.getElementById("detailIsAiring"); 
    if(detAir) detAir.textContent = item.isAiring? 'Airing':'Finished';
    const airInput = document.getElementById("detailIsAiringInput");
    if(airInput) airInput.value = item.isAiring ? "true" : "false";
    
    const detNS = document.getElementById("detailNextSeason"); 
    if(detNS) detNS.textContent = (item.nextSeason??'-');
    const nsInput = document.getElementById("detailNextSeasonInput");
    if(nsInput) nsInput.value = item.nextSeason || "";
    
    const detNSR = document.getElementById("detailNextSeasonRelease"); 
    if(detNSR) detNSR.textContent = (item.nextSeasonRelease||'-');
    const nsrInput = document.getElementById("detailNextSeasonReleaseInput");
    if(nsrInput) nsrInput.value = item.nextSeasonRelease || "";
    
    // Games specific
    const detPlay = document.getElementById("detailPlaytime");
    if(detPlay) detPlay.textContent = (item.spielzeit!=null? `${item.spielzeit} min` : "-");
    const playInput = document.getElementById("detailPlaytimeInput");
    if(playInput) playInput.value = item.spielzeit || "";
    
    // Common fields
    document.getElementById("detailPlatforms").textContent = item.platforms || "";
    const platInput = document.getElementById("detailPlatformsInput");
    if(platInput) platInput.value = item.platforms || "";
    
    document.getElementById("detailGenre").textContent = item.genre || "";
    const genreInput = document.getElementById("detailGenreInput");
    if(genreInput) genreInput.value = item.genre || "";
    
    const linkEl = document.getElementById("detailLink");
    linkEl.href = item.link || "#";
    linkEl.textContent = item.link || "-";
    
    // Show/hide fields based on category
    updateDetailFieldVisibility(item.category);
}

function initializeDetailInputs() {
    // Set up input event listeners for real-time updates
    const inputs = document.querySelectorAll('#detailModal .detail-input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            // Real-time update of display values
            updateDisplayFromInput(input);
        });
    });
}

function updateDisplayFromInput(input) {
    const inputId = input.id;
    const spanId = inputId.replace('Input', '');
    const span = document.getElementById(spanId);
    
    if (span) {
        let displayValue = input.value;
        
        // Format display values
        if (inputId === 'detailPlaytimeInput' && displayValue) {
            displayValue = `${displayValue} min`;
        } else if (inputId === 'detailIsAiringInput') {
            displayValue = displayValue === 'true' ? 'Airing' : 'Finished';
        } else if (!displayValue) {
            displayValue = '-';
        }
        
        span.textContent = displayValue;
    }
}

// Update rating display when star rating changes
function updateRatingDisplay(rating) {
    const ratingSpan = document.getElementById("detailRating");
    if (ratingSpan) {
        ratingSpan.textContent = rating || "-";
    }
}

function updateStarRating(rating) {
    const starRating = document.getElementById("detailStarRating");
    if (!starRating) {
        console.error("Star rating element not found!");
        return;
    }
    
    console.log("Updating star rating with:", rating);
    console.log("Star rating element:", starRating);
    
    // Clear existing stars
    starRating.innerHTML = "";
    
    // Create stars
    for (let i = 1; i <= 10; i++) {
        const star = document.createElement("span");
        star.className = "star";
        star.textContent = "★";
        star.dataset.value = i;
        star.style.cursor = "pointer";
        star.style.userSelect = "none";
        
        console.log("Creating star", i);
        
        // Use only click event listener - no hover
        star.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Star clicked:", i);
            
            // Visual feedback
            star.style.transform = "scale(1.2)";
            setTimeout(() => {
                star.style.transform = "scale(1)";
            }, 150);
            
            setStarRating(i);
        });
        
        starRating.appendChild(star);
    }
    
    // Update active stars
    const stars = starRating.querySelectorAll(".star");
    const ratingValue = rating ? Math.round(rating) : 0;
    
    console.log("Created stars:", stars.length);
    console.log("Setting active stars for rating:", ratingValue);
    
    stars.forEach((star, index) => {
        const isActive = index < ratingValue;
        star.classList.toggle("active", isActive);
        console.log(`Star ${index + 1}: active = ${isActive}`);
    });
}

function setStarRating(value) {
    if (!currentDetailItem) return;
    
    console.log("Setting star rating to:", value);
    
    // Update the item data
    currentDetailItem.rating = value;
    
    // Update text display
    updateRatingDisplay(value);
    
    // Update star display
    const stars = document.querySelectorAll("#detailStarRating .star");
    console.log("Found stars:", stars.length);
    
    stars.forEach((star, index) => {
        const isActive = index < value;
        star.classList.toggle("active", isActive);
        console.log(`Star ${index + 1}: active = ${isActive}`);
    });
}

// Hover functions removed to prevent conflicts

// Calendar functionality
let currentCalendarDate = new Date();

function renderCalendar(container) {
    container.innerHTML = "";
    container.className = "calendar-wrapper";
    
    // Get calendar items
    const calendarItems = getCalendarItems();
    
    // Create left navigation button
    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = "◀";
    prevBtn.className = "calendar-nav-btn";
    prevBtn.onclick = () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar(container);
    };
    
    // Create calendar container
    const calendarContainer = document.createElement("div");
    calendarContainer.className = "calendar-container";
    
    // Create calendar header
    const header = document.createElement("div");
    header.className = "calendar-header";
    
    const monthYear = document.createElement("h2");
    monthYear.className = "calendar-month-year";
    monthYear.textContent = currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    header.appendChild(monthYear);
    calendarContainer.appendChild(header);
    
    // Create right navigation button
    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "▶";
    nextBtn.className = "calendar-nav-btn";
    nextBtn.onclick = () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar(container);
    };
    
    // Create calendar grid
    const calendarGrid = document.createElement("div");
    calendarGrid.className = "calendar-grid";
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement("div");
        dayHeader.className = "calendar-day-header";
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const lastDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Calculate total cells needed (empty + days in month)
    const totalCells = startingDayOfWeek + daysInMonth;
    const weeksNeeded = Math.ceil(totalCells / 7);
    
    // Set dynamic grid rows based on weeks needed
    calendarGrid.style.gridTemplateRows = `auto repeat(${weeksNeeded}, 1fr)`;
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-day empty";
        calendarGrid.appendChild(emptyCell);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement("div");
        dayCell.className = "calendar-day";
        
        const dayNumber = document.createElement("div");
        dayNumber.className = "calendar-day-number";
        dayNumber.textContent = day;
        dayCell.appendChild(dayNumber);
        
        // Add items container for this day
        const itemsContainer = document.createElement("div");
        itemsContainer.className = "calendar-items-container";
        
        // Add items for this day
        const dayItems = getItemsForDay(calendarItems, currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
        dayItems.forEach(item => {
            const itemEl = document.createElement("div");
            itemEl.className = `calendar-item ${item.category}`;
            itemEl.innerHTML = `
                <div class="calendar-item-title">${item.title}</div>
                <div class="calendar-item-category">${getCategoryDisplayName(item.category)}</div>
            `;
            itemEl.onclick = () => openDetailModal(item);
            itemsContainer.appendChild(itemEl);
        });
        
        dayCell.appendChild(itemsContainer);
        
        calendarGrid.appendChild(dayCell);
    }
    
    // Add remaining empty cells to complete the grid
    const remainingCells = (weeksNeeded * 7) - totalCells;
    for (let i = 0; i < remainingCells; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-day empty";
        calendarGrid.appendChild(emptyCell);
    }
    
    calendarContainer.appendChild(calendarGrid);
    
    // Add all elements to container
    container.appendChild(prevBtn);
    container.appendChild(calendarContainer);
    container.appendChild(nextBtn);
}

function getCalendarItems() {
    const now = new Date();
    const items = [];
    
    // Get items from new categories and series with future dates
    mediaData.forEach(item => {
        let releaseDate = null;
        
        // Check different date fields based on category
        if (item.category === 'series' && item.isAiring && item.nextSeasonRelease) {
            releaseDate = new Date(item.nextSeasonRelease);
        } else if (item.release) {
            releaseDate = new Date(item.release);
        }
        
        // Only include future dates
        if (releaseDate && releaseDate > now && !isNaN(releaseDate.getTime())) {
            // Include items from new categories and series with next season releases
            if (item.category.includes('_new') || 
                (item.category === 'series' && item.isAiring && item.nextSeasonRelease)) {
                items.push({
                    ...item,
                    calendarDate: releaseDate
                });
            }
        }
    });
    
    return items.sort((a, b) => a.calendarDate - b.calendarDate);
}

function getItemsForDay(calendarItems, year, month, day) {
    const targetDate = new Date(year, month, day);
    return calendarItems.filter(item => {
        const itemDate = item.calendarDate;
        return itemDate.getFullYear() === year &&
               itemDate.getMonth() === month &&
               itemDate.getDate() === day;
    });
}


function updateDetailFieldVisibility(category) {
    const allRows = document.querySelectorAll('.detail-row');
    allRows.forEach(row => {
        const catData = row.getAttribute('data-cat');
        if (catData) {
            const categories = catData.split(' ');
            const isVisible = categories.includes(category) || categories.includes(category.replace('_new', ''));
            row.style.display = isVisible ? 'flex' : 'none';
        } else {
            // Always show rows without data-cat (basic info)
            row.style.display = 'flex';
        }
    });
}

// Removed toggleDetailEditMode - now using direct editing

// Removed makeDetailFieldsEditable - now using direct editing
function makeDetailFieldsEditable_OLD() {
    // Make basic fields editable
    makeFieldEditable("detailRelease", currentDetailItem.release || "");
    makeFieldEditable("detailCount", currentDetailItem.count ?? 0);
    makeFieldEditable("detailDiscovered", currentDetailItem.discovered || "");
    makeFieldEditable("detailPlatforms", currentDetailItem.platforms || "");
    makeFieldEditable("detailGenre", currentDetailItem.genre || "");
    makeFieldEditable("detailLink", currentDetailItem.link || "");
    
    // Show star rating for rating field
    const ratingText = document.getElementById("detailRating");
    const starRating = document.getElementById("detailStarRating");
    if (ratingText && starRating) {
        console.log("Switching to star rating mode");
        console.log("Current item rating:", currentDetailItem.rating);
        console.log("Rating text element:", ratingText);
        console.log("Star rating element:", starRating);
        
        ratingText.style.display = "none";
        starRating.style.display = "flex";
        
        // Initialize stars with current rating
        updateStarRating(currentDetailItem.rating);
        
        // Test if stars are clickable
        setTimeout(() => {
            const testStars = starRating.querySelectorAll(".star");
            console.log("Test: Found stars after creation:", testStars.length);
            testStars.forEach((star, index) => {
                console.log(`Test star ${index + 1}:`, star, "clickable:", star.style.cursor);
            });
        }, 100);
    } else {
        console.error("Rating elements not found!");
        console.log("Rating text:", ratingText);
        console.log("Star rating:", starRating);
    }
    
    // Category-specific fields
    if (currentDetailItem.category === "series" || currentDetailItem.category === "series_new") {
        makeFieldEditable("detailIsAiring", currentDetailItem.isAiring ? "true" : "false", "select", [
            {value: "true", text: "Airing"},
            {value: "false", text: "Finished"}
        ]);
        makeFieldEditable("detailNextSeason", currentDetailItem.nextSeason ?? "");
        makeFieldEditable("detailNextSeasonRelease", currentDetailItem.nextSeasonRelease || "");
    }
    
    if (currentDetailItem.category === "game" || currentDetailItem.category === "games_new") {
        makeFieldEditable("detailPlaytime", currentDetailItem.spielzeit ?? "");
    }
}

function makeFieldEditable(fieldId, value, type = "text", options = null) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const wrapper = field.parentElement;
    const input = document.createElement(type === "select" ? "select" : "input");
    input.type = type;
    input.value = value;
    input.className = "detail-edit-input";
    
    if (type === "select" && options) {
        options.forEach(opt => {
            const option = document.createElement("option");
            option.value = opt.value;
            option.textContent = opt.text;
            input.appendChild(option);
        });
    }
    
    // Store original field for restoration
    field.style.display = "none";
    field.dataset.originalValue = value;
    wrapper.appendChild(input);
}

// Removed makeDetailFieldsReadOnly - now using direct editing
function makeDetailFieldsReadOnly_OLD() {
    // Remove all edit inputs and restore original fields
    const editInputs = document.querySelectorAll(".detail-edit-input");
    editInputs.forEach(input => {
        const field = input.previousElementSibling;
        if (field) {
            field.style.display = "block";
            field.textContent = field.dataset.originalValue || "";
        }
        input.remove();
    });
    
    // Hide star rating and show text rating
    const ratingText = document.getElementById("detailRating");
    const starRating = document.getElementById("detailStarRating");
    if (ratingText && starRating) {
        ratingText.style.display = "block";
        starRating.style.display = "none";
        // Clear stars
        starRating.innerHTML = "";
    }
}

function saveDetailChanges() {
    if (!currentDetailItem) return;
    
    console.log("Saving detail changes for item:", currentDetailItem);
    
    // Collect values from input fields
    const changes = {};
    
    // Get values from input fields
    const releaseInput = document.getElementById("detailReleaseInput");
    if(releaseInput) changes.release = releaseInput.value || null;
    
    // Get rating from current item (updated by star rating)
    changes.rating = currentDetailItem.rating || null;
    
    const discInput = document.getElementById("detailDiscoveredInput");
    if(discInput) changes.discovered = discInput.value || null;
    
    const airInput = document.getElementById("detailIsAiringInput");
    if(airInput) changes.isAiring = airInput.value === "true";
    
    const nsInput = document.getElementById("detailNextSeasonInput");
    if(nsInput) changes.nextSeason = nsInput.value || null;
    
    const nsrInput = document.getElementById("detailNextSeasonReleaseInput");
    if(nsrInput) changes.nextSeasonRelease = nsrInput.value || null;
    
    const playInput = document.getElementById("detailPlaytimeInput");
    if(playInput) changes.spielzeit = parseInt(playInput.value) || null;
    
    const platInput = document.getElementById("detailPlatformsInput");
    if(platInput) changes.platforms = platInput.value || null;
    
    const genreInput = document.getElementById("detailGenreInput");
    if(genreInput) changes.genre = genreInput.value || null;
    
    console.log("Changes to apply:", changes);
    
    // Apply changes to item
    Object.assign(currentDetailItem, changes);
    
    console.log("Item after changes:", currentDetailItem);
    
    // Save data
    saveData().then(() => {
        console.log("Data saved successfully");
        // Update display
        updateDetailFields(currentDetailItem);
        
        // Re-render grid to show changes
        renderGrid();
    }).catch(error => {
        console.error("Error saving data:", error);
    });
}

// closeDetailModal function removed - now using closeModal('detailModal')

function openAddModal(){
    currentEditItem=null;
    document.getElementById("editCategory").value=currentCategory;
    document.getElementById("editTitle").value="";
    document.getElementById("editRelease").value="";
    document.getElementById("editRating").value="";
    document.getElementById("editCount").value=0;
    document.getElementById("editPath").value="";
    document.getElementById("editLink").value="";
    document.getElementById("editPlatforms").value="";
    document.getElementById("editGenre").value="";
    // Generate unique ID for new item
    document.getElementById("editId").value = generateUniqueId();
    const isAiringSel2=document.getElementById('editIsAiring'); if(isAiringSel2) isAiringSel2.value='false';
    const nextSeasonInput2=document.getElementById('editNextSeason'); if(nextSeasonInput2) nextSeasonInput2.value='';
    const nextSeasonReleaseInput2=document.getElementById('editNextSeasonRelease'); if(nextSeasonReleaseInput2) nextSeasonReleaseInput2.value='';
    const discoveredInput = document.getElementById("editDiscovered");
    if(discoveredInput) discoveredInput.value="";
    const playtimeInput = document.getElementById("editPlaytime");
    if(playtimeInput) playtimeInput.value = "";
    document.getElementById("checkApi").checked=false;
    document.getElementById("apiMessage").textContent="";
    document.getElementById("checkInfoMessage").textContent="";
    
    // Clear autocomplete results
    const resultsContainer = document.getElementById('autocompleteResults');
    if (resultsContainer) {
        resultsContainer.classList.remove('show');
        resultsContainer.innerHTML = '';
    }
    
    // Initialize autocomplete
    initializeAutocomplete();
    
    openModal("editModal");
}

async function saveEdit(){
    const cat=document.getElementById("editCategory").value;
    const checkApi=document.getElementById("checkApi").checked;
    const apiMessage=document.getElementById("apiMessage");
    apiMessage.textContent="";
    if(checkApi){
        const titleInput=document.getElementById("editTitle").value;
        if(!titleInput){ apiMessage.textContent="Titel erforderlich!"; return; }
        try {
            const headers = {"Content-Type":"application/json"};
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            const res=await fetch("/api/fetch-api",{
                method:"POST",
                headers: headers,
                body:JSON.stringify({title:titleInput, category:cat})
            });
            const data=await res.json();
            if(data.success){
                document.getElementById("editTitle").value=data.data.title;
                document.getElementById("editRelease").value=data.data.release;
                document.getElementById("editPlatforms").value=data.data.platforms||"";
                document.getElementById("editLink").value=data.data.link||"";
                const catDir = (cat==='movie' ? 'movies' : (cat==='series' ? 'series' : 'games'));
                // Generate unique ID for API data and use it for image path
                const apiId = generateUniqueId();
                document.getElementById("editId").value = apiId;
                // Only set path if it's empty (don't overwrite manually entered path)
                const currentPath = document.getElementById("editPath").value;
                if (!currentPath) {
                    document.getElementById("editPath").value=data.data.path||`images/${catDir}/${apiId}.jpg`;
                }
                document.getElementById("editGenre").value=data.data.genre||"";
                apiMessage.style.color="green"; apiMessage.textContent="API-Daten geladen!";
                const dbg = document.getElementById("apiDebugPre");
                if(dbg){ dbg.textContent = JSON.stringify(data.debug||{}, null, 2); }
            } else { apiMessage.style.color="red"; apiMessage.textContent="API Fehler: "+data.error; }
        } catch(e){ apiMessage.style.color="red"; apiMessage.textContent="Fehler bei API-Abfrage"; console.error(e); return; }
    }

    const titleVal = document.getElementById("editTitle").value;
    // derive default path if empty and ensure extension
    const sanitize = (s)=> (s||"").toString().trim().replace(/[^a-z0-9\-_. ]/gi,'').replace(/\s+/g,' ').replace(/ /g,'_');
    const catDir = dirCategory(cat);
    const pathInput = document.getElementById("editPath");
    let pathVal = (pathInput?.value||"").trim();
    
    // Use unique ID instead of sanitized title for filename
    const itemId = document.getElementById("editId").value;
    // Ensure we always have a valid ID, generate one if missing
    const finalId = itemId || generateUniqueId();
    // Update the ID field if it was empty
    if (!itemId) {
        document.getElementById("editId").value = finalId;
    }
    const baseName = finalId;
    
    const imgUrl = document.getElementById("editImageUrl")?.value.trim();
    
    // Only auto-generate path if no path is manually entered
    if (!pathVal) {
        if(imgUrl){
            // Prefer separate downloads dir to verify files easily
            const desiredBase = `images_downloads/${catDir}/${baseName}`;
            try{
                const headers = {'Content-Type':'application/json'};
                if (authToken) {
                    headers['Authorization'] = `Bearer ${authToken}`;
                }
                const res = await fetch('/api/download-image', {method:'POST', headers: headers, body: JSON.stringify({url: imgUrl, path: desiredBase})});
                const d = await res.json();
                if(d?.success && d?.saved){ pathVal = d.saved; }
                else { pathVal = desiredBase + '.jpg'; }
            }catch(e){ console.error('Download image failed', e); pathVal = desiredBase + '.jpg'; }
        } else {
            pathVal = `images/${catDir}/${baseName}`;
            if(!/\.[a-zA-Z0-9]+$/.test(pathVal)){ pathVal = pathVal + '.jpg'; }
        }
        // Update the path input with the generated path
        if(pathInput) pathInput.value = pathVal;
    } else {
        // Path was manually entered, respect it but ensure it has an extension
        if(!/\.[a-zA-Z0-9]+$/.test(pathVal)){ 
            pathVal = pathVal + '.jpg'; 
            if(pathInput) pathInput.value = pathVal;
        }
    }

    const itemData={
        id: finalId,
        title:titleVal,
        release:document.getElementById("editRelease").value,
        rating:parseFloat(document.getElementById("editRating").value)||null,
        count:parseInt(document.getElementById("editCount").value)||0,
        path:pathVal,
        link:document.getElementById("editLink").value,
        platforms:document.getElementById("editPlatforms").value||"",
        genre:document.getElementById("editGenre").value||"",
        discovered:(document.getElementById("editDiscovered")?.value||""),
        spielzeit:(()=>{ const v=document.getElementById("editPlaytime")?.value; return v===""? null : parseInt(v); })(),
        isAiring:(document.getElementById('editIsAiring')?.value==='true'),
        nextSeason:(()=>{ const v=document.getElementById('editNextSeason')?.value; return v===''? null : parseInt(v); })(),
        nextSeasonRelease:(document.getElementById('editNextSeasonRelease')?.value||''),
        category:cat
    };
    if(currentEditItem){
        Object.assign(currentEditItem,itemData);
    } else mediaData.push(itemData);
    closeModal('editModal');
    await saveData();
    renderFilterBar();
    renderGrid();
}

// closeModal function is defined below with modalId parameter

// Close modals on backdrop click - handled by new modal system

async function saveData(){
    console.log('💾 saveData() called', { 
        itemsCount: mediaData.length,
        hasAuth: !!authToken,
        timestamp: new Date().toISOString()
    });
    
    const orderedData=mediaData.map(item=>{ const o={}; orderedKeys.forEach(k=>o[k]=item[k]??null); return o; });
    console.log('💾 Data ordered, preparing request...', { orderedItemsCount: orderedData.length });
    
    try{ 
        const headers = {"Content-Type":"application/json"};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        console.log('💾 Sending data to /api/media_relative.json...');
        const saveStartTime = Date.now();
        
        const response = await fetch("/api/media_relative.json",{method:"POST",headers,body:JSON.stringify(orderedData,null,2)});
        
        const saveTime = Date.now() - saveStartTime;
        console.log('💾 Save response received', { 
            status: response.status, 
            ok: response.ok, 
            saveTime: saveTime + 'ms',
            timestamp: new Date().toISOString()
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('💾 Save failed:', { status: response.status, error: errorText });
            throw new Error(`Save failed: ${response.status} ${errorText}`);
        }
        
        console.log('💾 Data saved successfully!');
        
        // Update profile status after successful save
        updateProfileStatus();
    }
    catch(e){ 
        console.error("💾 Fehler beim Speichern:", e);
        throw e; // Re-throw so import can handle it
    }
}

function updateCounts(){
    const g = mediaData.filter(i=>i.category==='game').length;
    const s = mediaData.filter(i=>i.category==='series').length;
    const m = mediaData.filter(i=>i.category==='movie').length;
    const gn = mediaData.filter(i=>i.category==='games_new').length;
    const sn = mediaData.filter(i=>i.category==='series_new').length;
    const mn = mediaData.filter(i=>i.category==='movie_new').length;
    const cg=document.getElementById('countGames'); if(cg) cg.textContent = g;
    const cs=document.getElementById('countSeries'); if(cs) cs.textContent = s;
    const cm=document.getElementById('countMovies'); if(cm) cm.textContent = m;
    const cgn=document.getElementById('countGamesNew'); if(cgn) cgn.textContent = gn;
    const csn=document.getElementById('countSeriesNew'); if(csn) csn.textContent = sn;
    const cmn=document.getElementById('countMoviesNew'); if(cmn) cmn.textContent = mn;
}

// Check Infos
const checkInfoBtn = document.getElementById("checkInfoBtn");
if (checkInfoBtn) {
    checkInfoBtn.onclick = async() => {
    const title=document.getElementById("editTitle").value;
    const cat=document.getElementById("editCategory").value;
    const msgEl=document.getElementById("checkInfoMessage");
    msgEl.textContent=""; msgEl.style.color="black";
    if(!title){ msgEl.textContent="Titel erforderlich!"; msgEl.style.color="red"; return; }
    try{
        const res=await fetch("/fetch-api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,category:cat})});
        const data=await res.json();
        if(data.success){
            console.log("Check Infos:",data.data);
            msgEl.style.color="green";
            msgEl.textContent=`API Daten gefunden! Title: ${data.data.title}, Release: ${data.data.release}`;
            const dbg=document.getElementById("apiDebugPre");
            if(dbg){ dbg.textContent = JSON.stringify(data.debug||data.data||{}, null, 2); }
            const det=document.querySelector(".api-debug");
            if(det){ det.open = true; }
        } else { msgEl.style.color="red"; msgEl.textContent="API Fehler: "+data.error; console.warn("API Fehler:",data.error); }
    } catch(e){ msgEl.style.color="red"; msgEl.textContent="Fehler bei API-Abfrage"; console.error(e); }
    };
}

function applyViewMode(){
    console.log('applyViewMode() called - currentCategory:', currentCategory);
    // Don't apply view mode to calendar
    if (currentCategory === "calendar") {
        return;
    }
    
    const body = document.body;
    body.classList.remove('list-mode','compact-mode','landscape-mode');
    
    // Apply landscape mode based on current category
    const shouldUseLandscape = landscapeModeSettings[currentCategory] || false;
    if(shouldUseLandscape){ 
        body.classList.add('landscape-mode'); 
    }
    
    const grid = document.getElementById('grid');
    if(grid){
        console.log(`applyViewMode() - setting fixed grid columns to ${gridColumns}`);
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = `repeat(${gridColumns}, 1fr)`;
    }
}

function setupControls(){
    // Authentication controls - use the centralized function
    setupAuthButtonListeners();
    
    // Login form
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;
            const errorEl = document.getElementById("loginError");
            
            try {
                await login(email, password);
                closeLoginModal();
            } catch (error) {
                errorEl.textContent = error.message;
                errorEl.style.display = "block";
            }
        };
    }
    
    const loginCancel = document.getElementById("loginCancel");
    if (loginCancel) {
        loginCancel.onclick = closeLoginModal;
    }
    
    // Register form
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById("registerName").value;
            const email = document.getElementById("registerEmail").value;
            const password = document.getElementById("registerPassword").value;
            const passwordConfirm = document.getElementById("registerPasswordConfirm").value;
            const errorEl = document.getElementById("registerError");
            
            if (password !== passwordConfirm) {
                errorEl.textContent = "Passwords do not match";
                errorEl.style.display = "block";
                return;
            }
            
            try {
                await register(name, email, password);
                closeRegisterModal();
            } catch (error) {
                errorEl.textContent = error.message;
                errorEl.style.display = "block";
            }
        };
    }
    
    const registerCancel = document.getElementById("registerCancel");
    if (registerCancel) {
        registerCancel.onclick = closeRegisterModal;
    }
    
    // Category controls
    document.getElementById("btnGames").onclick=()=>{switchToGrid(); expandAndSwitchCategory("game");};
    document.getElementById("btnSeries").onclick=()=>{switchToGrid(); expandAndSwitchCategory("series");};
    document.getElementById("btnMovies").onclick=()=>{switchToGrid(); expandAndSwitchCategory("movie");};
    const gnew=document.getElementById('btnGamesNew'); if(gnew) gnew.onclick=()=>{switchToGrid(); expandAndSwitchCategory('games_new');};
    const snew=document.getElementById('btnSeriesNew'); if(snew) snew.onclick=()=>{switchToGrid(); expandAndSwitchCategory('series_new');};
    const mnew=document.getElementById('btnMoviesNew'); if(mnew) mnew.onclick=()=>{switchToGrid(); expandAndSwitchCategory('movie_new');};
    const cal=document.getElementById('btnCalendar'); if(cal) cal.onclick=()=>{switchToGrid(); expandAndSwitchCategory('calendar');};
    const stats=document.getElementById('btnStatistics'); if(stats) stats.onclick=()=>switchToStatistics();
    document.getElementById("saveEdit").onclick=saveEdit;
    document.getElementById("cancelEdit").onclick=() => closeModal('editModal');
    // Add Item button is handled directly in HTML with onclick
    // Column slider removed - using fixed 8 columns
    
    
    // Display toggles - only landscape mode remains
    
    // Per-category landscape mode toggles
    const landscapeToggles = {
        'landscapeModeGames': 'game',
        'landscapeModeSeries': 'series', 
        'landscapeModeMovies': 'movie',
        'landscapeModeGamesNew': 'games_new',
        'landscapeModeSeriesNew': 'series_new',
        'landscapeModeMoviesNew': 'movie_new'
    };
    
    Object.entries(landscapeToggles).forEach(([toggleId, category]) => {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
            toggle.onchange = function() {
                landscapeModeSettings[category] = this.checked;
                applyViewMode();
                saveViewPreferences();
            };
        }
    });
    
    // Keep old landscape mode toggle for backward compatibility
    const landscapeModeToggle=document.getElementById('landscapeMode');
    if(landscapeModeToggle) landscapeModeToggle.onchange=function(){ 
        landscapeMode = this.checked;
        // Apply to all categories when using global toggle
        Object.keys(landscapeModeSettings).forEach(cat => {
            landscapeModeSettings[cat] = this.checked;
        });
        applyViewMode();
        saveViewPreferences();
    };
    
    // Grid count control
    const gridCountSelect = document.getElementById("gridCountSelect");
    if(gridCountSelect) {
        gridCountSelect.onchange = function() {
            gridColumns = parseInt(this.value);
            saveViewPreferences();
            renderGrid();
        };
    }
    
    // View mode is always grid now
    const sortSelect=document.getElementById("sortSelect");
    if(sortSelect) sortSelect.onchange=renderGrid;
    const searchInput=document.getElementById("searchInput");
    if(searchInput) searchInput.oninput=function(){ searchQuery=this.value||""; renderGrid(); };
    const searchClear=document.getElementById("searchClear");
    if(searchClear) searchClear.onclick=function(){
        const si=document.getElementById("searchInput");
        if(si){ si.value=""; si.focus(); }
        searchQuery="";
        renderGrid();
    };
    
    // Make the entire search group clickable to focus the select
    const searchGroup=document.querySelector('.search-group');
    if(searchGroup) {
        searchGroup.onclick=function(e){
            // Don't trigger if clicking on the input or clear button
            if(e.target === searchInput || e.target === searchClear) return;
            // Focus the sort select
            const sortSelect=document.getElementById("sortSelect");
            if(sortSelect) sortSelect.focus();
        };
    }
    const playMinInput=document.getElementById("playMin");
    const playMaxInput=document.getElementById("playMax");
    if(playMinInput) playMinInput.oninput=function(){ const v=this.value.trim(); playMin = v===""? null : Math.max(0, parseInt(v)); renderGrid(); };
    if(playMaxInput) playMaxInput.oninput=function(){ const v=this.value.trim(); playMax = v===""? null : Math.max(0, parseInt(v)); renderGrid(); };
    
    // Airing filter buttons
    const airingAll=document.getElementById("airingAll");
    const airingTrue=document.getElementById("airingTrue");
    const airingFalse=document.getElementById("airingFalse");
    if(airingAll) airingAll.onclick=()=>{ airingFilter="all"; setActiveAiringButton("all"); renderGrid(); };
    if(airingTrue) airingTrue.onclick=()=>{ airingFilter="true"; setActiveAiringButton("true"); renderGrid(); };
    if(airingFalse) airingFalse.onclick=()=>{ airingFilter="false"; setActiveAiringButton("false"); renderGrid(); };

    // Image picker
    const pickerBtn=document.getElementById('openImagePicker');
    if(pickerBtn) pickerBtn.onclick=async()=>{
        try{
            const headers = {};
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            const res=await fetch('/api/list-images', {headers: headers});
            const data=await res.json();
            const listDiv=document.getElementById('imageList');
            listDiv.innerHTML='';
            (data.images||[]).forEach(p=>{
                const row=document.createElement('div'); row.style.display='flex'; row.style.alignItems='center'; row.style.gap='8px'; row.style.padding='4px 0';
                const radio=document.createElement('input'); radio.type='radio'; radio.name='pickImage'; radio.value=p;
                const lbl=document.createElement('span'); lbl.textContent=p;
                row.append(radio,lbl);
                listDiv.appendChild(row);
            });
            document.getElementById('imagePickerModal').classList.add("show");
        }catch(e){ console.error(e); }
    };
    const pickCancel=document.getElementById('imagePickCancel'); if(pickCancel) pickCancel.onclick=()=>{ 
        document.getElementById('imagePickerModal').classList.remove("show");
        setTimeout(() => {
            document.getElementById('imagePickerModal').style.display='none';
        }, 300);
    };
    const pickConfirm=document.getElementById('imagePickConfirm');
    if(pickConfirm) pickConfirm.onclick=async()=>{
        const sel = document.querySelector('input[name="pickImage"]:checked');
        if(!sel){ 
            document.getElementById('imagePickerModal').classList.remove("show");
            setTimeout(() => {
                document.getElementById('imagePickerModal').style.display='none';
            }, 300);
            return; 
        }
        const srcPath = sel.value;
        const pathInput=document.getElementById('editPath');
        let dstPath = (pathInput?.value||'').trim();
        if(!dstPath){
            const cat=document.getElementById('editCategory').value;
            const base=dirCategory(cat);
            // Use unique ID instead of title for filename
            const itemId = document.getElementById('editId')?.value || generateUniqueId();
            const ext = srcPath.split('.').pop();
            dstPath = `images/${base}/${itemId}.${ext}`;
        }
        try{
            const headers = {'Content-Type':'application/json'};
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            const res=await fetch('/api/copy-image',{method:'POST', headers: headers, body: JSON.stringify({src: srcPath, dst: dstPath})});
            const d=await res.json();
            if(d?.success && d?.saved){ if(pathInput) pathInput.value=d.saved; }
        }catch(e){ console.error(e); }
        document.getElementById('imagePickerModal').classList.remove("show");
        setTimeout(() => {
            document.getElementById('imagePickerModal').style.display='none';
        }, 300);
    };

    // Upload image (client file picker -> POST to server)
    const uploadBtn=document.getElementById('uploadImageBtn');
    const uploadInput=document.getElementById('uploadImageInput');
    if(uploadBtn && uploadInput){
        uploadBtn.onclick=()=>uploadInput.click();
        uploadInput.onchange=async()=>{
            if(!uploadInput.files || uploadInput.files.length===0) return;
            const file = uploadInput.files[0];
            const cat=document.getElementById('editCategory').value;
            const base=dirCategory(cat);
            // Use unique ID instead of title for filename
            const itemId = document.getElementById('editId')?.value || generateUniqueId();
            const form = new FormData();
            form.append('file', file);
            form.append('dst', `images/${base}/${itemId}`);
            try{
                const headers = {};
                if (authToken) {
                    headers['Authorization'] = `Bearer ${authToken}`;
                }
                const res = await fetch('/api/upload-image',{
                    method:'POST', 
                    headers: headers,
                    body: form
                });
                const d = await res.json();
                if(d?.success && d?.saved){ const pathInput=document.getElementById('editPath'); if(pathInput) pathInput.value=d.saved; }
            }catch(e){ console.error('Upload error:', e); }
            uploadInput.value='';
        };
    }
    
    // Export/Import buttons
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFileInput = document.getElementById('importFileInput');
    
    if(exportBtn) {
        exportBtn.onclick = exportData;
    }
    
    if(importBtn) {
        importBtn.onclick = importData;
    }
    
    if(importFileInput) {
        importFileInput.onchange = handleImportFile;
    }
    
    // Bulk Add Modal buttons
    const bulkAddBtn = document.getElementById('bulkAddBtn');
    const bulkAddModal = document.getElementById('bulkAddModal');
    const bulkAddStart = document.getElementById('bulkAddStart');
    const bulkAddCancel = document.getElementById('bulkAddCancel');
    
    // Bulk add button is handled in the floating menu section below
    
    if(bulkAddStart) {
        bulkAddStart.onclick = startBulkAdd;
    }
    
    if(bulkAddCancel) {
        bulkAddCancel.onclick = () => closeModal('bulkAddModal');
    }
    
    // Close modal when clicking outside
    if(bulkAddModal) {
        bulkAddModal.onclick = (e) => {
            if (e.target === bulkAddModal) {
                closeModal('bulkAddModal');
            }
        };
    }
    
    // Progress modal buttons
    const progressCancel = document.getElementById('progressCancel');
    const progressClose = document.getElementById('progressClose');
    
    if(progressCancel) {
        progressCancel.onclick = () => {
            hideProgressModal();
        };
    }
    
    if(progressClose) {
        progressClose.onclick = () => {
            hideProgressModal();
        };
    }
}

// View buttons removed - always using grid view

function setActiveCategoryButton(){
    const ids=['btnGames','btnSeries','btnMovies','btnGamesNew','btnSeriesNew','btnMoviesNew','btnCalendar'];
    ids.forEach(id=>{ const el=document.getElementById(id); if(!el) return; el.classList.remove('active'); });
    const map={ game:'btnGames', series:'btnSeries', movie:'btnMovies', games_new:'btnGamesNew', series_new:'btnSeriesNew', movie_new:'btnMoviesNew', calendar:'btnCalendar' };
    const el=document.getElementById(map[currentCategory]);
    if(el){ el.classList.add('active'); el.classList.add('pop'); setTimeout(()=>el.classList.remove('pop'),220); }
}

// View preferences management
    function saveViewPreferences() {
        const preferences = {
            landscapeMode: landscapeMode, // Keep for backward compatibility
            landscapeModeSettings: landscapeModeSettings, // New per-category settings
            gridColumns: gridColumns
        };
        localStorage.setItem('mediaLibraryViewPreferences', JSON.stringify(preferences));
    }

function loadViewPreferences() {
    const saved = localStorage.getItem('mediaLibraryViewPreferences');
    if (saved) {
        try {
            const preferences = JSON.parse(saved);
            
            // Apply landscape mode (backward compatibility)
            if (preferences.landscapeMode !== undefined) {
                landscapeMode = preferences.landscapeMode;
                const landscapeToggle = document.getElementById('landscapeMode');
                if (landscapeToggle) {
                    landscapeToggle.checked = landscapeMode;
                }
            }
            
            // Apply per-category landscape mode settings
            if (preferences.landscapeModeSettings) {
                landscapeModeSettings = { ...landscapeModeSettings, ...preferences.landscapeModeSettings };
                
                // Update UI toggles
                const landscapeToggles = {
                    'landscapeModeGames': 'game',
                    'landscapeModeSeries': 'series', 
                    'landscapeModeMovies': 'movie',
                    'landscapeModeGamesNew': 'games_new',
                    'landscapeModeSeriesNew': 'series_new',
                    'landscapeModeMoviesNew': 'movie_new'
                };
                
                Object.entries(landscapeToggles).forEach(([toggleId, category]) => {
                    const toggle = document.getElementById(toggleId);
                    if (toggle) {
                        toggle.checked = landscapeModeSettings[category] || false;
                    }
                });
            }
            
            // Size scale removed - using fixed card size
            
            // View mode is always grid now
            
            // Apply grid columns
            if (preferences.gridColumns) {
                console.log('loadViewPreferences() - setting gridColumns to:', preferences.gridColumns);
                gridColumns = preferences.gridColumns;
                const gridCountSelect = document.getElementById('gridCountSelect');
                if (gridCountSelect) {
                    gridCountSelect.value = gridColumns;
                }
            }
        } catch (e) {
            console.warn('Failed to load view preferences:', e);
        }
    }
}

function setActiveAiringButton(filter){
    const buttons = document.querySelectorAll('.airing-wrapper .filter-chip');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if((filter === 'all' && btn.id === 'airingAll') ||
           (filter === 'true' && btn.id === 'airingTrue') ||
           (filter === 'false' && btn.id === 'airingFalse')){
            btn.classList.add('active');
        }
    });
}

// Helpers for new categories
globalThis.NEW_CATS = { games_new: 'game', series_new: 'series', movie_new: 'movie' };

function isNewCategory(cat){ return Object.prototype.hasOwnProperty.call(NEW_CATS, cat); }
function baseCategory(cat){ return isNewCategory(cat) ? NEW_CATS[cat] : cat; }
function dirCategory(cat){
    if(cat==='games_new') return 'games';
    if(cat==='series_new') return 'series';
    if(cat==='movie_new') return 'movies';
    return (cat==='game'?'games':(cat==='series'?'series':(cat==='movie'?'movies':cat)));
}
function daysUntil(dateStr){ const d=new Date(dateStr); if(isNaN(d)) return null; const diff = Math.ceil((d - new Date())/86400000); return diff; }

// Auto-Complete System
let autocompleteTimeout = null;

function initializeAutocomplete() {
    const titleInput = document.getElementById('editTitle');
    const resultsContainer = document.getElementById('autocompleteResults');
    
    if (!titleInput || !resultsContainer) return;
    
    // Clear existing event listeners
    titleInput.removeEventListener('input', handleAutocompleteInput);
    titleInput.removeEventListener('blur', handleAutocompleteBlur);
    titleInput.removeEventListener('focus', handleAutocompleteFocus);
    
    // Add new event listeners
    titleInput.addEventListener('input', handleAutocompleteInput);
    titleInput.addEventListener('blur', handleAutocompleteBlur);
    titleInput.addEventListener('focus', handleAutocompleteFocus);
}

function handleAutocompleteInput(e) {
    const query = e.target.value.trim();
    const resultsContainer = document.getElementById('autocompleteResults');
    
    // Clear previous timeout
    if (autocompleteTimeout) {
        clearTimeout(autocompleteTimeout);
    }
    
    if (query.length < 2) {
        resultsContainer.classList.remove('show');
        resultsContainer.innerHTML = '';
        return;
    }
    
    // Debounce search
    autocompleteTimeout = setTimeout(() => {
        searchItems(query);
    }, 300);
}

async function handleAutocompleteFocus(e) {
    const query = e.target.value.trim();
    if (query.length >= 2) {
        await searchItems(query);
    }
}

function handleAutocompleteBlur(e) {
    // Delay hiding to allow click on results
    setTimeout(() => {
        const resultsContainer = document.getElementById('autocompleteResults');
        // Only hide if it's still visible (not already hidden by selection)
        if (resultsContainer.classList.contains('show')) {
            resultsContainer.classList.remove('show');
        }
    }, 200);
}

async function searchItems(query) {
    if (!query || query.length < 2) {
        displayAutocompleteResults([]);
        return;
    }
    
    try {
        // Search via API instead of local data
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`);
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        const results = await response.json();
        displayAutocompleteResults(results);
    } catch (error) {
        console.error('Search error:', error);
        displayAutocompleteResults([]);
    }
}

function displayAutocompleteResults(results) {
    const resultsContainer = document.getElementById('autocompleteResults');
    
    // Clear any existing timeout
    if (autocompleteTimeout) {
        clearTimeout(autocompleteTimeout);
        autocompleteTimeout = null;
    }
    
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        resultsContainer.classList.remove('show');
        return;
    }
    
    results.forEach(item => {
        const itemElement = createAutocompleteItem(item);
        resultsContainer.appendChild(itemElement);
    });
    
    resultsContainer.classList.add('show');
}

function createAutocompleteItem(item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'autocomplete-item';
    itemElement.dataset.itemId = item.id || Math.random().toString(36);
    
    // Create thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.className = 'autocomplete-thumbnail';
    // Use original image for autocomplete
    const thumbnailPath = item.path || '';
    if (thumbnailPath) {
        // Add /images/ prefix if the path doesn't already start with it
        const imagePath = thumbnailPath.startsWith('images/') ? `/${thumbnailPath}` : `/images/${thumbnailPath}`;
        thumbnail.src = imagePath;
    } else {
        thumbnail.src = item.image || '';
    }
    thumbnail.alt = item.title;
    thumbnail.onerror = () => {
        thumbnail.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA2MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjMwIiB5PSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
    };
    
    // Create info section
    const info = document.createElement('div');
    info.className = 'autocomplete-info';
    
    const title = document.createElement('div');
    title.className = 'autocomplete-title';
    title.textContent = item.title;
    
    const details = document.createElement('div');
    details.className = 'autocomplete-details';
    
    const category = document.createElement('span');
    category.className = 'autocomplete-category';
    category.textContent = getCategoryDisplayName(item.category);
    
    const year = document.createElement('span');
    year.className = 'autocomplete-year';
    year.textContent = item.release ? new Date(item.release).getFullYear() : 'Unknown';
    
    details.appendChild(category);
    details.appendChild(year);
    
    info.appendChild(title);
    info.appendChild(details);
    
    itemElement.appendChild(thumbnail);
    itemElement.appendChild(info);
    
    // Add click handler with event prevention
    itemElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectAutocompleteItem(item);
    });
    
    return itemElement;
}

function getCategoryDisplayName(category) {
    const categoryMap = {
        'game': 'Game',
        'series': 'Series',
        'movie': 'Movie',
        'games_new': 'Games New',
        'series_new': 'Series New',
        'movie_new': 'Movies New'
    };
    return categoryMap[category] || category;
}

function selectAutocompleteItem(item) {
    // Prevent any pending autocomplete searches
    if (autocompleteTimeout) {
        clearTimeout(autocompleteTimeout);
        autocompleteTimeout = null;
    }
    
    // Map API categories to dropdown values
    const categoryMap = {
        'movie': 'movie',
        'series': 'series', 
        'games': 'game'  // API returns 'games' but dropdown expects 'game'
    };
    
    // Temporarily disable input event listener to prevent interference
    const titleInput = document.getElementById('editTitle');
    titleInput.removeEventListener('input', handleAutocompleteInput);
    
    // Fill form with selected item data
    document.getElementById('editTitle').value = item.title;
    document.getElementById('editCategory').value = categoryMap[item.category] || item.category;
    document.getElementById('editRelease').value = item.release || '';
    document.getElementById('editRating').value = item.rating || '';
    document.getElementById('editCount').value = item.count || 0;
    document.getElementById('editPlatforms').value = item.platforms || '';
    document.getElementById('editGenre').value = item.genre || '';
    document.getElementById('editLink').value = item.link || '';
    document.getElementById('editPath').value = item.path || '';
    document.getElementById('editDiscovered').value = item.discovered || '';
    document.getElementById('editPlaytime').value = item.playtime || '';
    document.getElementById('editIsAiring').value = item.isAiring ? 'true' : 'false';
    document.getElementById('editNextSeason').value = item.nextSeason || '';
    document.getElementById('editNextSeasonRelease').value = item.nextSeasonRelease || '';
    document.getElementById('editImageUrl').value = item.image || '';
    
    // Auto-enable API checkbox when selecting from API results
    if (item.api_source) {
        document.getElementById('checkApi').checked = true;
    }
    
    // Hide autocomplete immediately
    const resultsContainer = document.getElementById('autocompleteResults');
    resultsContainer.classList.remove('show');
    resultsContainer.innerHTML = '';
    
    // Re-enable input event listener after a short delay
    setTimeout(() => {
        titleInput.addEventListener('input', handleAutocompleteInput);
    }, 100);
}

// Old window.onload removed - now using DOMContentLoaded event listener

// Progress Modal Functions
function showProgressModal(title, canCancel = false) {
    const modal = document.getElementById('progressModal');
    const titleEl = document.getElementById('progressTitle');
    const cancelBtn = document.getElementById('progressCancel');
    const closeBtn = document.getElementById('progressClose');
    
    titleEl.textContent = title;
    cancelBtn.style.display = canCancel ? 'inline-block' : 'none';
    closeBtn.style.display = 'none';
    
    updateProgress(0, 'Preparing...', '');
    modal.classList.add('show');
}

function hideProgressModal() {
    const modal = document.getElementById('progressModal');
    modal.classList.remove('show');
}

function updateProgress(percentage, status, details) {
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    const statusEl = document.getElementById('progressStatus');
    const detailsEl = document.getElementById('progressDetails');
    
    fill.style.width = percentage + '%';
    text.textContent = Math.round(percentage) + '%';
    statusEl.textContent = status;
    detailsEl.textContent = details;
}

function completeProgress(success, message) {
    const cancelBtn = document.getElementById('progressCancel');
    const closeBtn = document.getElementById('progressClose');
    
    cancelBtn.style.display = 'none';
    closeBtn.style.display = 'inline-block';
    
    updateProgress(100, success ? 'Completed!' : 'Failed!', message);
    
    if (success) {
        document.getElementById('progressFill').style.background = 'linear-gradient(90deg, #4CAF50, #45a049)';
    } else {
        document.getElementById('progressFill').style.background = 'linear-gradient(90deg, #f44336, #d32f2f)';
    }
}

// Export/Import Functions
async function exportData() {
    try {
        console.log('Starting data export...');
        
        // Check if user is logged in
        if (!authToken || !currentUser) {
            showNotification('Bitte loggen Sie sich ein, um Daten zu exportieren.', 'error');
            return;
        }
        
        // Show progress modal
        showProgressModal('Exporting Data...', false);
        
        // Disable export button
        const exportBtn = document.getElementById('exportBtn');
        exportBtn.disabled = true;
        
        updateProgress(10, 'Preparing data...', 'Collecting media items and settings...');
        
        // Load fresh data from API for export to ensure we have the latest user-specific data
        console.log('Loading fresh data from API for export...');
        const headers = { 'Authorization': `Bearer ${authToken}` };
        const res = await fetch("/api/media_relative.json", { headers });
        
        if (!res.ok) {
            throw new Error(`Failed to load data for export: ${res.status} ${res.statusText}`);
        }
        
        const freshMediaData = await res.json();
        console.log('Fresh data loaded for export:', { itemCount: freshMediaData.length });
        
        // Create export data structure - remove user_id from data
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: freshMediaData.map(item => {
                const { user_id, ...itemWithoutUserId } = item;
                return itemWithoutUserId;
            }),
            preferences: {
                landscapeMode: landscapeMode, // Keep for backward compatibility
                landscapeModeSettings: landscapeModeSettings, // New per-category settings
                gridColumns: gridColumns
            }
        };
        
        updateProgress(20, 'Creating category lists...', 'Generating text files for each category...');
        
        // Create category lists using fresh data
        const categoryLists = {};
        const categories = ['game', 'series', 'movie', 'games_new', 'series_new', 'movie_new'];
        
        categories.forEach(cat => {
            const items = freshMediaData.filter(item => item.category === cat);
            categoryLists[`${cat}_list.txt`] = items.map(item => item.title).join('\n');
        });
        
        updateProgress(40, 'Sending data to server...', 'Uploading export data and image references...');
        
        // Call backend to create ZIP
        const exportHeaders = {
            'Content-Type': 'application/json'
        };
        if (authToken) {
            exportHeaders['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch('/api/export-data', {
            method: 'POST',
            headers: exportHeaders,
            body: JSON.stringify({
                exportData: exportData,
                categoryLists: categoryLists
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Export failed: ${response.statusText}`);
        }
        
        updateProgress(80, 'Creating ZIP file...', 'Compressing data, images, and thumbnails...');
        
        // Download the ZIP file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `media-library-export-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        updateProgress(100, 'Export completed!', `ZIP file downloaded successfully.`);
        
        console.log('Export completed successfully');
        
        // Show success message
        showNotification('Export erfolgreich! ZIP-Datei wurde heruntergeladen.', 'success');
        
        completeProgress(true, 'Export completed successfully!');
        
    } catch (error) {
        console.error('Export failed:', error);
        showNotification('Export fehlgeschlagen: ' + error.message, 'error');
        completeProgress(false, 'Export failed: ' + error.message);
    } finally {
        // Reset button state
        const exportBtn = document.getElementById('exportBtn');
        exportBtn.disabled = false;
    }
}

async function importData() {
    const fileInput = document.getElementById('importFileInput');
    fileInput.click();
}

async function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.zip')) {
        showNotification('Bitte wählen Sie eine ZIP-Datei aus.', 'error');
        return;
    }
    
    // Check if user is authenticated
    if (!authToken || !currentUser) {
        showNotification('Bitte loggen Sie sich ein, um Daten zu importieren.', 'error');
        showLoginModal();
        return;
    }
    
    // Check file size and decide on upload method
    const fileSizeMB = Math.round(file.size / 1024 / 1024);
    const useChunkedUpload = fileSizeMB > 50; // Use chunked upload for files > 50MB
    
    if (useChunkedUpload) {
        console.log(`File is large (${fileSizeMB}MB), using chunked upload...`);
        await handleChunkedImport(file);
    } else {
        console.log(`File is small (${fileSizeMB}MB), using regular upload...`);
        await handleRegularImport(file);
    }
}

async function handleRegularImport(file) {
    try {
        console.log('Starting data import...');
        
        // Show progress modal
        showProgressModal('Importing Data...', false);
        
        // Disable import button
        const importBtn = document.getElementById('importBtn');
        importBtn.disabled = true;
        
        updateProgress(10, 'Validating file...', 'Checking ZIP file format...');
        if (window.importConsole) {
            updateImportConsole('📁 Validating ZIP file...');
        }
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        
        updateProgress(30, 'Uploading file...', 'Sending ZIP file to server...');
        if (window.importConsole) {
            updateImportConsole(`📤 Uploading file (${Math.round(file.size / 1024 / 1024)}MB)...`);
        }
        
        // Use Server-Sent Events for real-time progress updates
        console.log('🚀 Starting import with real-time progress...', { 
            fileSize: file.size, 
            fileName: file.name,
            hasAuth: !!authToken,
            timestamp: new Date().toISOString()
        });
        
        console.log('📤 Sending request to /api/import-data-stream...');
        const startTime = Date.now();
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.error('⏰ Import request timeout after 5 minutes!');
            controller.abort();
        }, 5 * 60 * 1000); // 5 minutes timeout
        
        // Prepare headers
        const headers = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        // Use Server-Sent Events for progress updates
        const response = await fetch('/api/import-data-stream', {
            method: 'POST',
            headers: {
                ...headers,
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache'
            },
            body: formData,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.error('❌ Import request failed!', { 
                status: response.status, 
                statusText: response.statusText,
                timestamp: new Date().toISOString()
            });
            
            // Check if it's an authentication error
            if (response.status === 401) {
                showNotification('Bitte loggen Sie sich ein, um Daten zu importieren.', 'error');
                throw new Error('Authentication required. Please log in first.');
            }
            
            // Check if it's a file size error
            if (response.status === 413) {
                const fileSizeMB = Math.round(file.size / 1024 / 1024);
                showNotification(`Die Datei ist zu groß (${fileSizeMB}MB). Server-Limits verhindern den Upload. Bitte wählen Sie eine kleinere Datei oder kontaktieren Sie den Administrator.`, 'error');
                throw new Error(`File too large (${fileSizeMB}MB). Server limits prevent upload. Please choose a smaller file or contact the administrator.`);
            }
            
            // Try to parse JSON error response
            let errorData;
            let responseText = '';
            try {
                // Clone the response to avoid "body stream already read" error
                const responseClone = response.clone();
                errorData = await response.json();
            } catch (e) {
                // If JSON parsing fails, it might be HTML error page
                try {
                    responseText = await response.text();
                    console.error('❌ Non-JSON error response:', responseText.substring(0, 200));
                } catch (textError) {
                    console.error('❌ Could not read response text:', textError);
                    responseText = 'Unable to read error response';
                }
                throw new Error(`Import failed: ${response.statusText} (Server returned HTML instead of JSON)`);
            }
            
            console.error('❌ Error details:', errorData);
            throw new Error(errorData.error || `Import failed: ${response.statusText}`);
        }
        
        console.log('✅ Starting Server-Sent Events stream...');
        
        // Show console for large imports
        if (file.size > 5 * 1024 * 1024) { // 5MB
            showImportConsole();
        }
        
        // Process Server-Sent Events
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = null;
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    console.log('📊 Stream completed', { result: result });
                    break;
                }
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            console.log('📊 Progress update:', data);
                            
                            // Debug: Log the structure of data
                            if (data.data) {
                                console.log('📊 Data structure:', {
                                    hasData: !!data.data,
                                    dataType: typeof data.data,
                                    hasSuccess: data.data && 'success' in data.data,
                                    dataKeys: data.data ? Object.keys(data.data) : []
                                });
                            }
                            
                            // Update progress bar
                            updateProgress(data.percentage, data.status, data.details);
                            
                            // Update console if available
                            if (window.importConsole) {
                                updateImportConsole(`📊 ${data.status}: ${data.details}`);
                            }
                            
                            // Check if this is the final update with data
                            if (data.data && data.data.success) {
                                result = data.data;
                                console.log('📊 Final result received:', result);
                            } else if (data.data && typeof data.data === 'object') {
                                // Alternative check for final data
                                result = data.data;
                                console.log('📊 Final result received (alternative):', result);
                            } else if (data.type === 'complete' && data.success) {
                                // Check for completion signal
                                console.log('📊 Completion signal received:', data);
                                // Keep the existing result if we have one
                                if (!result) {
                                    result = { success: true, type: 'complete' };
                                }
                            }
                            
                            // Debug: Log all data structures we receive
                            console.log('📊 Received data structure:', {
                                hasData: 'data' in data,
                                hasType: 'type' in data,
                                hasSuccess: 'success' in data,
                                dataKeys: Object.keys(data),
                                dataValue: data.data ? (typeof data.data === 'object' ? Object.keys(data.data) : data.data) : null
                            });
                            
                        } catch (e) {
                            console.error('❌ Error parsing SSE data:', e, line);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
        
        // If no result was received but we got to 100%, assume success
        if (!result && file.size > 0) {
            console.log('📊 No explicit result received, but stream completed. Assuming success.');
            result = { success: true, type: 'assumed_success' };
        }
        
        if (result && (result.success || result.data)) {
            console.log('✅ Import successful, updating local data...');
            
            // Show detailed import results
            const debug = result.debug || {};
            const itemsImported = debug.items_imported || result.data?.length || 0;
            const totalItems = debug.total_items || itemsImported;
            const errorsCount = debug.errors_count || 0;
            
            // If we don't have detailed data, show a generic success message
            if (result.type === 'complete' || result.type === 'assumed_success') {
                console.log('📊 Import completed successfully (generic success)');
                showNotification('Import erfolgreich abgeschlossen!', 'success');
                completeProgress(true, 'Import completed successfully');
                
                // Refresh the page to show imported data
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
                return;
            }
            
            console.log('📊 Import statistics:', {
                itemsImported: itemsImported,
                totalItems: totalItems,
                errorsCount: errorsCount,
                successRate: totalItems > 0 ? Math.round((itemsImported / totalItems) * 100) : 0
            });
            
            // Update console with results
            if (window.importConsole) {
                updateImportConsole(`✅ Import completed: ${itemsImported}/${totalItems} items imported`);
                if (errorsCount > 0) {
                    updateImportConsole(`⚠️ ${errorsCount} items had errors during import`);
                }
                if (debug.errors && debug.errors.length > 0) {
                    debug.errors.slice(0, 10).forEach(error => {
                        updateImportConsole(`❌ Error: ${error.item} - ${error.error}`);
                    });
                    if (debug.errors.length > 10) {
                        updateImportConsole(`... and ${debug.errors.length - 10} more errors`);
                    }
                }
            }
            
            // Update local data
            console.log('📝 Updating local mediaData...');
            mediaData = result.data || [];
            console.log('📝 Updated local data', { itemsCount: mediaData.length });
            
            // Save data to server
            console.log('💾 Saving data to server...');
            const saveStartTime = Date.now();
            await saveData();
            const saveTime = Date.now() - saveStartTime;
            console.log('💾 Data saved to server', { saveTime: saveTime + 'ms' });
            
            // Apply preferences if available
            if (result.preferences) {
                console.log('⚙️ Applying imported preferences...');
                applyImportedPreferences(result.preferences);
                console.log('⚙️ Preferences applied');
            }
            
            // Refresh the UI
            console.log('🔄 Refreshing UI components...');
            renderFilterBar();
            renderGrid();
            updateCounts();
            console.log('🔄 UI refreshed');
            
            console.log('🎉 Import completed successfully!', {
                itemsImported: itemsImported,
                totalItems: totalItems,
                errorsCount: errorsCount,
                totalTime: Date.now() - startTime + 'ms',
                timestamp: new Date().toISOString()
            });
            
            completeProgress(true, `Import completed! ${itemsImported}/${totalItems} items imported`);
            
            // Check for API candidates and show dialog
            if (result.api_candidates && result.api_candidates.length > 0) {
                showApiImageDialog(result.api_candidates);
            } else {
                showNotification(`Import erfolgreich! ${itemsImported} von ${totalItems} Einträgen wurden wiederhergestellt.`, 'success');
            }
        } else {
            console.error('❌ Import result indicates failure:', result);
            if (!result) {
                showNotification('Import-Stream wurde beendet, aber kein Ergebnis empfangen. Bitte versuchen Sie es erneut oder kontaktieren Sie den Administrator.', 'error');
                throw new Error('Import stream completed but no result received. This might be a server-side issue.');
            } else {
                showNotification('Import fehlgeschlagen: ' + (result?.error || 'Unbekannter Fehler'), 'error');
                throw new Error(result?.error || 'Import failed');
            }
        }
        
    } catch (error) {
        console.error('💥 Import failed:', error);
        console.error('💥 Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            timestamp: new Date().toISOString()
        });
        
        // Check if it's a timeout error
        if (error.name === 'AbortError') {
            console.error('💥 Import was aborted due to timeout!');
            showNotification('Import timeout: Die Datei ist zu groß oder der Server antwortet nicht.', 'error');
            completeProgress(false, 'Import timeout after 5 minutes');
        } else {
            showNotification('Import fehlgeschlagen: ' + error.message, 'error');
            completeProgress(false, 'Import failed: ' + error.message);
        }
    } finally {
        // Reset button state
        const importBtn = document.getElementById('importBtn');
        importBtn.disabled = false;
        
        // Clear file input
        document.getElementById('importFileInput').value = '';
    }
}

async function handleChunkedImport(file) {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    try {
        console.log(`Starting chunked upload: ${totalChunks} chunks of ${Math.round(CHUNK_SIZE / 1024 / 1024)}MB each`);
        
        // Show progress modal
        showProgressModal('Uploading Large File...', false);
        
        // Disable import button
        const importBtn = document.getElementById('importBtn');
        importBtn.disabled = true;
        
        updateProgress(5, 'Preparing chunked upload...', `Splitting file into ${totalChunks} chunks...`);
        
        // Upload chunks
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);
            
            const formData = new FormData();
            formData.append('chunk', chunk);
            formData.append('chunk_index', i);
            formData.append('total_chunks', totalChunks);
            formData.append('upload_id', uploadId);
            formData.append('file_name', file.name);
            
            // Calculate upload progress (5% to 80% for upload)
            const uploadProgress = 5 + ((i + 1) / totalChunks) * 75;
            updateProgress(uploadProgress, 'Uploading chunks...', `Uploading chunk ${i + 1} of ${totalChunks}`);
            
            const response = await fetch('/api/upload-chunk', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Failed to upload chunk ${i + 1}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(`Chunk ${i + 1} upload failed: ${result.error}`);
            }
            
            console.log(`Chunk ${i + 1}/${totalChunks} uploaded successfully`);
        }
        
        updateProgress(85, 'Finalizing upload...', 'Combining chunks and processing...');
        
        // Finalize upload
        const finalizeResponse = await fetch('/api/finalize-chunked-upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify({
                upload_id: uploadId,
                file_name: file.name,
                total_chunks: totalChunks
            })
        });
        
        if (!finalizeResponse.ok) {
            throw new Error(`Failed to finalize upload: ${finalizeResponse.statusText}`);
        }
        
        const result = await finalizeResponse.json();
        
        if (result.success) {
            updateProgress(100, 'Import completed!', 'File processed successfully');
            showNotification(`Import erfolgreich! ${result.items_imported || 0} Einträge wurden wiederhergestellt.`, 'success');
            
            // Refresh the page to show imported data
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            throw new Error(result.error || 'Import failed');
        }
        
    } catch (error) {
        console.error('💥 Chunked upload failed:', error);
        showNotification('Chunked upload fehlgeschlagen: ' + error.message, 'error');
        completeProgress(false, 'Chunked upload failed: ' + error.message);
    } finally {
        // Reset button state
        const importBtn = document.getElementById('importBtn');
        importBtn.disabled = false;
        
        // Clear file input
        document.getElementById('importFileInput').value = '';
    }
}

function applyImportedPreferences(preferences) {
    // Apply landscape mode (backward compatibility)
    if (preferences.landscapeMode !== undefined) {
        landscapeMode = preferences.landscapeMode;
        const landscapeToggle = document.getElementById('landscapeMode');
        if (landscapeToggle) {
            landscapeToggle.checked = landscapeMode;
        }
    }
    
    // Apply per-category landscape mode settings
    if (preferences.landscapeModeSettings) {
        landscapeModeSettings = { ...landscapeModeSettings, ...preferences.landscapeModeSettings };
        
        // Update UI toggles
        const landscapeToggles = {
            'landscapeModeGames': 'game',
            'landscapeModeSeries': 'series', 
            'landscapeModeMovies': 'movie',
            'landscapeModeGamesNew': 'games_new',
            'landscapeModeSeriesNew': 'series_new',
            'landscapeModeMoviesNew': 'movie_new'
        };
        
        Object.entries(landscapeToggles).forEach(([toggleId, category]) => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                toggle.checked = landscapeModeSettings[category] || false;
            }
        });
    }
    
    // Grid columns are now fixed at 8, no need to apply preferences
    
    // Save preferences
    saveViewPreferences();
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #ff9800, #f57c00)';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Authentication modal functions
function showLoginModal() {
    // Clear any previous errors
    const errorEl = document.getElementById("loginError");
    if (errorEl) {
        errorEl.style.display = "none";
        errorEl.textContent = "";
    }
    
    // Reset form
    const form = document.getElementById("loginForm");
    if (form) {
        form.reset();
    }
    
    // Use the new modal system
    openModal("loginModal");
    
    // Focus on email field after modal opens
    setTimeout(() => {
        const emailField = document.getElementById("loginEmail");
        if (emailField) {
            emailField.focus();
        }
    }, 100);
}

function closeLoginModal() {
    closeModal("loginModal");
}

function showRegisterModal() {
    // Clear any previous errors
    const errorEl = document.getElementById("registerError");
    if (errorEl) {
        errorEl.style.display = "none";
        errorEl.textContent = "";
    }
    
    // Reset form
    const form = document.getElementById("registerForm");
    if (form) {
        form.reset();
    }
    
    // Use the new modal system
    openModal("registerModal");
    
    // Focus on name field after modal opens
    setTimeout(() => {
        const nameField = document.getElementById("registerName");
        if (nameField) {
            nameField.focus();
        }
    }, 100);
}

function closeRegisterModal() {
    closeModal("registerModal");
}

// Close modals on backdrop click - handled by new modal system

// Import Console Functions
function showImportConsole() {
    if (window.importConsole) {
        return; // Already shown
    }
    
    const console = document.createElement('div');
    console.id = 'importConsole';
    console.className = 'import-console';
    console.innerHTML = `
        <div class="console-header">
            <h3>Import Console</h3>
            <button class="console-close" onclick="closeImportConsole()">&times;</button>
        </div>
        <div class="console-content" id="consoleContent">
            <div class="console-line">🚀 Starting import process...</div>
        </div>
    `;
    
    document.body.appendChild(console);
    window.importConsole = console;
}

function updateImportConsole(message) {
    if (!window.importConsole) return;
    
    const content = document.getElementById('consoleContent');
    const line = document.createElement('div');
    line.className = 'console-line';
    line.textContent = message;
    content.appendChild(line);
    
    // Auto-scroll to bottom
    content.scrollTop = content.scrollHeight;
    
    // Limit to 100 lines
    const lines = content.querySelectorAll('.console-line');
    if (lines.length > 100) {
        lines[0].remove();
    }
}

function closeImportConsole() {
    if (window.importConsole) {
        window.importConsole.remove();
        window.importConsole = null;
    }
}

// API Image Download Dialog
function showApiImageDialog(candidates) {
    const count = candidates.length;
    const categories = {};
    
    // Group by category
    candidates.forEach(candidate => {
        const category = candidate.category || 'unknown';
        if (!categories[category]) {
            categories[category] = 0;
        }
        categories[category]++;
    });
    
    const categoryText = Object.entries(categories)
        .map(([cat, cnt]) => `${cnt} ${cat}`)
        .join(', ');
    
    const dialog = document.createElement('div');
    dialog.className = 'modal show';
    dialog.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Bilder von API herunterladen?</h2>
                <button class="close" onclick="closeApiImageDialog()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Es wurden <strong>${count}</strong> Einträge gefunden, die kein Bild haben:</p>
                <p><strong>${categoryText}</strong></p>
                <p>Möchten Sie diese Bilder automatisch von der API herunterladen?</p>
                <div class="api-download-options">
                    <label>
                        <input type="checkbox" id="downloadImages" checked>
                        Bilder herunterladen (empfohlen)
                    </label>
                </div>
                <div class="api-download-preview">
                    <h4>Vorschau der Einträge:</h4>
                    <div class="candidates-list">
                        ${candidates.slice(0, 10).map(candidate => 
                            `<div class="candidate-item">• ${candidate.title} (${candidate.category})</div>`
                        ).join('')}
                        ${candidates.length > 10 ? `<div class="candidate-item">... und ${candidates.length - 10} weitere</div>` : ''}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeApiImageDialog()">Später</button>
                <button class="btn btn-primary" onclick="downloadApiImages(${JSON.stringify(candidates).replace(/"/g, '&quot;')})">Jetzt herunterladen</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
}

function closeApiImageDialog() {
    const dialog = document.querySelector('.modal.show');
    if (dialog) {
        dialog.remove();
    }
}

async function downloadApiImages(candidates) {
    const downloadCheckbox = document.getElementById('downloadImages');
    if (!downloadCheckbox.checked) {
        closeApiImageDialog();
        showNotification('Import erfolgreich! Bilder können später über die API heruntergeladen werden.', 'success');
        return;
    }
    
    try {
        closeApiImageDialog();
        showProgressModal('Downloading Images...', false);
        
        const headers = {
            'Content-Type': 'application/json'
        };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        updateProgress(10, 'Preparing download...', 'Sending request to API...');
        
        const response = await fetch('/api/download-api-images', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ candidates: candidates })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Download failed');
        }
        
        updateProgress(50, 'Downloading images...', 'Fetching images from API...');
        
        const result = await response.json();
        
        updateProgress(90, 'Saving images...', 'Storing downloaded images...');
        
        // Refresh the UI to show new images
        await loadData();
        renderGrid();
        updateCounts();
        
        updateProgress(100, 'Download completed!', `Successfully downloaded ${result.downloaded_count} images`);
        
        showNotification(`Bilder erfolgreich heruntergeladen! ${result.downloaded_count} von ${result.total_candidates} Bildern wurden gefunden und gespeichert.`, 'success');
        
        completeProgress(true, 'Image download completed!');
        
    } catch (error) {
        console.error('API image download failed:', error);
        showNotification(`Fehler beim Herunterladen der Bilder: ${error.message}`, 'error');
        completeProgress(false, 'Image download failed');
    }
}

// Bulk Add Modal Functions
function openBulkAddModal() {
    // Check if user is authenticated
    if (!authToken || !currentUser) {
        showNotification('Bitte loggen Sie sich ein, um Items hinzuzufügen.', 'error');
        showLoginModal();
        return;
    }
    
    // Set category based on current view
    const categoryMap = {
        'game': 'game',
        'series': 'series', 
        'movie': 'movie',
        'games_new': 'games_new',
        'series_new': 'series_new',
        'movie_new': 'movie_new'
    };
    
    const bulkCategory = document.getElementById('bulkCategory');
    if (bulkCategory && categoryMap[currentCategory]) {
        bulkCategory.value = categoryMap[currentCategory];
    }
    
    // Clear previous data
    document.getElementById('bulkTitles').value = '';
    document.getElementById('bulkProgress').style.display = 'none';
    document.getElementById('bulkResults').style.display = 'none';
    document.getElementById('bulkAddStart').disabled = false;
    
    // Show modal
    openModal('bulkAddModal');
}

function closeBulkAddModal() {
    closeModal('bulkAddModal');
}

async function startBulkAdd() {
    const category = document.getElementById('bulkCategory').value;
    const titlesText = document.getElementById('bulkTitles').value.trim();
    const fetchImages = document.getElementById('bulkFetchImages').checked;
    const skipExisting = document.getElementById('bulkSkipExisting').checked;
    
    if (!titlesText) {
        showNotification('Bitte geben Sie mindestens einen Titel ein.', 'error');
        return;
    }
    
    // Parse titles from textarea
    const titles = titlesText.split('\n')
        .map(title => title.trim())
        .filter(title => title.length > 0);
    
    if (titles.length === 0) {
        showNotification('Bitte geben Sie gültige Titel ein.', 'error');
        return;
    }
    
    // Validate category
    const validCategories = ['game', 'series', 'movie', 'games_new', 'series_new', 'movie_new'];
    if (!validCategories.includes(category)) {
        showNotification('Ungültige Kategorie ausgewählt.', 'error');
        return;
    }
    
    // Disable start button and show progress
    const startBtn = document.getElementById('bulkAddStart');
    const progressDiv = document.getElementById('bulkProgress');
    const resultsDiv = document.getElementById('bulkResults');
    const progressFill = document.getElementById('bulkProgressFill');
    const progressText = document.getElementById('bulkProgressText');
    const resultsContent = document.getElementById('bulkResultsContent');
    
    startBtn.disabled = true;
    progressDiv.style.display = 'block';
    resultsDiv.style.display = 'none';
    
    const results = {
        success: [],
        errors: [],
        skipped: []
    };
    
    try {
        // Process each title
        for (let i = 0; i < titles.length; i++) {
            const title = titles[i];
            const progress = ((i + 1) / titles.length) * 100;
            
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Processing ${i + 1} of ${titles.length}: ${title}`;
            
            try {
                // Check if title already exists (if skip existing is enabled)
                if (skipExisting) {
                    const existingItem = mediaData.find(item => 
                        item.title && item.title.toLowerCase() === title.toLowerCase() &&
                        item.category === category
                    );
                    
                    if (existingItem) {
                        results.skipped.push({
                            title: title,
                            reason: 'Already exists'
                        });
                        continue;
                    }
                }
                
                // Fetch data from API
                const response = await fetch('/api/fetch-api', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        title: title,
                        category: category
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`API request failed: ${response.status}`);
                }
                
                const apiData = await response.json();
                
                if (!apiData.success) {
                    throw new Error(apiData.error || 'API returned no data');
                }
                
                // Create new item
                const newItem = {
                    id: generateUniqueId(),
                    title: apiData.data.title,
                    release: apiData.data.release,
                    rating: 0,
                    count: 0,
                    platforms: apiData.data.platforms || '',
                    genre: apiData.data.genre || '',
                    link: apiData.data.link || '',
                    path: apiData.data.path || `images/${category === 'movie' ? 'movies' : (category === 'series' ? 'series' : 'games')}/${generateUniqueId()}.jpg`,
                    category: category,
                    discovered: new Date().toISOString().split('T')[0],
                    playtime: 0,
                    is_airing: false,
                    next_season: null,
                    next_season_release: null,
                    image_url: apiData.data.image_url || '',
                    user_id: currentUser.id,
                    __order: mediaData.length
                };
                
                // Save to database
                const saveResponse = await fetch('/api/media', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(newItem)
                });
                
                if (!saveResponse.ok) {
                    throw new Error(`Save failed: ${saveResponse.status}`);
                }
                
                const savedItem = await saveResponse.json();
                
                // Add to local data
                mediaData.push(savedItem);
                
                results.success.push({
                    title: title,
                    apiTitle: apiData.data.title,
                    id: savedItem.id
                });
                
                // Download image if requested and available
                if (fetchImages && apiData.data.image_url) {
                    try {
                        await downloadImageForItem(savedItem, apiData.data.image_url);
                    } catch (imageError) {
                        console.warn(`Failed to download image for ${title}:`, imageError);
                    }
                }
                
            } catch (error) {
                console.error(`Error processing ${title}:`, error);
                results.errors.push({
                    title: title,
                    error: error.message
                });
            }
            
            // Small delay to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Show results
        displayBulkResults(results);
        
        // Refresh the UI
        renderGrid();
        updateCounts();
        
        // Show success notification
        const successCount = results.success.length;
        const errorCount = results.errors.length;
        const skippedCount = results.skipped.length;
        
        let message = `Bulk Add abgeschlossen! ${successCount} Items erfolgreich hinzugefügt.`;
        if (errorCount > 0) message += ` ${errorCount} Fehler.`;
        if (skippedCount > 0) message += ` ${skippedCount} übersprungen.`;
        
        showNotification(message, successCount > 0 ? 'success' : 'error');
        
    } catch (error) {
        console.error('Bulk add failed:', error);
        showNotification(`Bulk Add fehlgeschlagen: ${error.message}`, 'error');
    } finally {
        startBtn.disabled = false;
        progressText.textContent = 'Completed';
    }
}

function displayBulkResults(results) {
    const resultsDiv = document.getElementById('bulkResults');
    const resultsContent = document.getElementById('bulkResultsContent');
    
    let html = '';
    
    if (results.success.length > 0) {
        html += '<div class="bulk-result-section">';
        html += '<h4 style="color: #4CAF50;">✅ Erfolgreich hinzugefügt:</h4>';
        results.success.forEach(item => {
            html += `<div class="bulk-result-item bulk-result-success">`;
            html += `• ${item.title}`;
            if (item.apiTitle !== item.title) {
                html += ` (API: ${item.apiTitle})`;
            }
            html += `</div>`;
        });
        html += '</div>';
    }
    
    if (results.skipped.length > 0) {
        html += '<div class="bulk-result-section">';
        html += '<h4 style="color: #ff9800;">⏭️ Übersprungen:</h4>';
        results.skipped.forEach(item => {
            html += `<div class="bulk-result-item bulk-result-skipped">`;
            html += `• ${item.title} (${item.reason})`;
            html += `</div>`;
        });
        html += '</div>';
    }
    
    if (results.errors.length > 0) {
        html += '<div class="bulk-result-section">';
        html += '<h4 style="color: #f44336;">❌ Fehler:</h4>';
        results.errors.forEach(item => {
            html += `<div class="bulk-result-item bulk-result-error">`;
            html += `• ${item.title}: ${item.error}`;
            html += `</div>`;
        });
        html += '</div>';
    }
    
    resultsContent.innerHTML = html;
    resultsDiv.style.display = 'block';
}

async function downloadImageForItem(item, imageUrl) {
    try {
        const response = await fetch('/api/download-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                url: imageUrl,
                path: item.path,
                title: item.title
            })
        });
        
        if (!response.ok) {
            throw new Error(`Image download failed: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Image download error:', error);
        throw error;
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    // Grid protection cleanup no longer needed
});

// Settings Management
let settings = {
    darkMode: true, // Start with dark mode as default
    autoSync: true,
    notifications: false
};

function loadSettings() {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
        try {
            settings = { ...settings, ...JSON.parse(saved) };
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
    }
    // Always apply settings, even if no saved settings exist
    applySettings();
}

function saveSettings() {
    localStorage.setItem('appSettings', JSON.stringify(settings));
}

function applySettings() {
    // Apply dark mode
    const body = document.body;
    if (settings.darkMode) {
        body.classList.remove('light-mode');
    } else {
        body.classList.add('light-mode');
    }
    
    // Update toggle states (only if elements exist)
    const darkModeToggle = document.getElementById('darkModeToggle');
    const autoSyncToggle = document.getElementById('autoSyncToggle');
    const notificationsToggle = document.getElementById('notificationsToggle');
    
    if (darkModeToggle) darkModeToggle.checked = settings.darkMode;
    if (autoSyncToggle) autoSyncToggle.checked = settings.autoSync;
    if (notificationsToggle) notificationsToggle.checked = settings.notifications;
    
    // Start auto sync if enabled
    if (settings.autoSync) {
        startAutoSync();
    }
}

function toggleDarkMode() {
    settings.darkMode = !settings.darkMode;
    applySettings();
    saveSettings();
}

function toggleAutoSync() {
    settings.autoSync = !settings.autoSync;
    applySettings();
    saveSettings();
    
    if (settings.autoSync) {
        showNotification('Auto sync enabled', 'success');
        // Start auto sync if enabled
        startAutoSync();
    } else {
        showNotification('Auto sync disabled', 'info');
        // Stop auto sync if disabled
        stopAutoSync();
    }
}

function toggleNotifications() {
    settings.notifications = !settings.notifications;
    applySettings();
    saveSettings();
    
    if (settings.notifications) {
        showNotification('Notifications enabled', 'success');
    } else {
        showNotification('Notifications disabled', 'info');
    }
}

function updateAccountModalToggles() {
    // Update toggle states in account modal to reflect current settings
    const darkModeToggle = document.getElementById('darkModeToggle');
    const autoSyncToggle = document.getElementById('autoSyncToggle');
    const notificationsToggle = document.getElementById('notificationsToggle');
    
    if (darkModeToggle) darkModeToggle.checked = settings.darkMode;
    if (autoSyncToggle) autoSyncToggle.checked = settings.autoSync;
    if (notificationsToggle) notificationsToggle.checked = settings.notifications;
}

// Auto sync functionality
let autoSyncInterval = null;

function startAutoSync() {
    if (autoSyncInterval) return; // Already running
    
    autoSyncInterval = setInterval(async () => {
        try {
            await saveData();
            console.log('Auto sync completed');
        } catch (error) {
            console.error('Auto sync failed:', error);
        }
    }, 30000); // Sync every 30 seconds
}

function stopAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
    }
}

// New UI Event Listeners
function setupNewUIEventListeners() {
    // Sidebar toggle
    const sidebarHeader = document.querySelector('.sidebar-header');
    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarHeader) {
        sidebarHeader.addEventListener('click', toggleSidebar);
    }
    
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener('click', toggleMobileSidebar);
    }
    
    // Floating action button
    const floatingAddButton = document.getElementById('floatingAddButton');
    const floatingMenu = document.getElementById('floatingMenu');
    
    if (floatingAddButton) {
        floatingAddButton.addEventListener('click', toggleFloatingMenu);
    }
    
    // Close floating menu when clicking outside
    document.addEventListener('click', function(e) {
        if (floatingMenu && !floatingMenu.contains(e.target) && !floatingAddButton.contains(e.target)) {
            closeFloatingMenu();
        }
    });
    
    // Account modal
    const accountBtn = document.getElementById('accountBtn');
    const accountModal = document.getElementById('accountModal');
    const accountCloseBtn = document.getElementById('accountCloseBtn');
    
    if (accountBtn) {
        accountBtn.addEventListener('click', () => {
            // Update toggle states when opening account modal
            updateAccountModalToggles();
            // Update profile status when opening account modal
            updateProfileStatus();
            openModal('accountModal');
        });
    }
    
    if (accountCloseBtn) {
        accountCloseBtn.addEventListener('click', () => closeModal('accountModal'));
    }
    
    // Tooltip dismiss button
    const dismissTooltipBtn = document.getElementById('dismissTooltip');
    if (dismissTooltipBtn) {
        dismissTooltipBtn.addEventListener('click', dismissTooltip);
    }
    
    // Floating menu items
    const addItemBtn = document.getElementById('addItemBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const bulkAddBtn = document.getElementById('bulkAddBtn');
    const exportTitlesBtn = document.getElementById('exportTitlesBtn');
    const loadTitlesBtn = document.getElementById('loadTitlesBtn');
    
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            closeFloatingMenu();
            openAddModal();
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            closeFloatingMenu();
            exportData();
        });
    }
    
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            closeFloatingMenu();
            document.getElementById('importFileInput').click();
        });
    }
    
    if (bulkAddBtn) {
        bulkAddBtn.addEventListener('click', () => {
            closeFloatingMenu();
            openBulkAddModal();
        });
    }
    
    if (exportTitlesBtn) {
        exportTitlesBtn.addEventListener('click', () => {
            closeFloatingMenu();
            exportTitlesList();
        });
    }
    
    if (loadTitlesBtn) {
        loadTitlesBtn.addEventListener('click', () => {
            closeFloatingMenu();
            document.getElementById('loadTitlesFileInput').click();
        });
    }
    
    // Settings toggles
    const darkModeToggle = document.getElementById('darkModeToggle');
    const autoSyncToggle = document.getElementById('autoSyncToggle');
    const notificationsToggle = document.getElementById('notificationsToggle');
    
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', toggleDarkMode);
    }
    
    if (autoSyncToggle) {
        autoSyncToggle.addEventListener('change', toggleAutoSync);
    }
    
    if (notificationsToggle) {
        notificationsToggle.addEventListener('change', toggleNotifications);
    }
    
    // About links
    const impressumLink = document.getElementById('impressumLink');
    const contactLink = document.getElementById('contactLink');
    const privacyLink = document.getElementById('privacyLink');
    const termsLink = document.getElementById('termsLink');
    
    if (impressumLink) {
        impressumLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('impressumModal');
        });
    }
    
    if (contactLink) {
        contactLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('contactModal');
        });
    }
    
    if (privacyLink) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('privacyModal');
        });
    }
    
    if (termsLink) {
        termsLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('termsModal');
        });
    }
    
    // Profile management button
    const openProfileBtn = document.getElementById('openProfileBtn');
    if (openProfileBtn) {
        openProfileBtn.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }
}

// Export titles list function
async function exportTitlesList() {
    try {
        console.log('Starting titles export...');
        
        // Check if user is logged in
        if (!authToken || !currentUser) {
            showNotification('Bitte loggen Sie sich ein, um Titel zu exportieren.', 'error');
            return;
        }
        
        // Show progress modal
        showProgressModal('Exporting Titles...', false);
        
        updateProgress(10, 'Loading data...', 'Fetching user media items...');
        
        // Load fresh data from API
        const headers = { 'Authorization': `Bearer ${authToken}` };
        const res = await fetch("/api/media_relative.json", { headers });
        
        if (!res.ok) {
            throw new Error(`Failed to load data: ${res.status} ${res.statusText}`);
        }
        
        const mediaData = await res.json();
        console.log('Media data loaded for titles export:', { itemCount: mediaData.length });
        
        updateProgress(50, 'Creating titles list...', 'Formatting titles and identifiers...');
        
        // Create titles list with unique identifiers
        const titlesList = mediaData.map(item => {
            // Use external_id if available, otherwise use id
            const identifier = item.external_id || item.id;
            return `${item.title}|${identifier}`;
        }).join('\n');
        
        updateProgress(80, 'Preparing download...', 'Creating text file...');
        
        // Create and download the text file
        const blob = new Blob([titlesList], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `media-titles-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        updateProgress(100, 'Export completed!', `Titles list downloaded successfully.`);
        
        console.log('Titles export completed successfully');
        
        // Show success message
        showNotification('Titel-Export erfolgreich! Text-Datei wurde heruntergeladen.', 'success');
        
        completeProgress(true, 'Titles export completed successfully!');
        
    } catch (error) {
        console.error('Titles export failed:', error);
        showNotification('Titel-Export fehlgeschlagen: ' + error.message, 'error');
        completeProgress(false, 'Titles export failed: ' + error.message);
    }
}

// Load titles check function
async function handleLoadTitlesFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        console.log('Starting titles check...');
        
        // Check if user is logged in
        if (!authToken || !currentUser) {
            showNotification('Bitte loggen Sie sich ein, um Titel zu überprüfen.', 'error');
            return;
        }
        
        // Show progress modal
        showProgressModal('Checking Titles...', false);
        
        updateProgress(10, 'Reading file...', 'Loading titles from text file...');
        
        // Read the file content
        const fileContent = await file.text();
        const lines = fileContent.split('\n').filter(line => line.trim());
        
        console.log('File loaded:', { lineCount: lines.length });
        
        updateProgress(30, 'Loading current data...', 'Fetching user media items...');
        
        // Load current user data
        const headers = { 'Authorization': `Bearer ${authToken}` };
        const res = await fetch("/api/media_relative.json", { headers });
        
        if (!res.ok) {
            throw new Error(`Failed to load current data: ${res.status} ${res.statusText}`);
        }
        
        const currentMediaData = await res.json();
        console.log('Current media data loaded:', { itemCount: currentMediaData.length });
        
        updateProgress(60, 'Comparing titles...', 'Checking which titles are in your account...');
        
        // Create maps for quick lookup
        const currentTitles = new Map();
        const currentIdentifiers = new Map();
        
        currentMediaData.forEach(item => {
            const identifier = item.external_id || item.id;
            currentTitles.set(item.title.toLowerCase(), item);
            currentIdentifiers.set(identifier.toString(), item);
        });
        
        // Check each line from the file
        const results = {
            found: [],
            notFound: [],
            errors: []
        };
        
        lines.forEach((line, index) => {
            try {
                const parts = line.split('|');
                if (parts.length !== 2) {
                    results.errors.push(`Line ${index + 1}: Invalid format - "${line}"`);
                    return;
                }
                
                const [title, identifier] = parts;
                const titleLower = title.toLowerCase().trim();
                
                // Check by identifier first, then by title
                let foundItem = currentIdentifiers.get(identifier.trim()) || currentTitles.get(titleLower);
                
                if (foundItem) {
                    results.found.push({
                        line: index + 1,
                        title: title.trim(),
                        identifier: identifier.trim(),
                        foundBy: currentIdentifiers.has(identifier.trim()) ? 'identifier' : 'title',
                        currentTitle: foundItem.title,
                        currentId: foundItem.id
                    });
                } else {
                    results.notFound.push({
                        line: index + 1,
                        title: title.trim(),
                        identifier: identifier.trim()
                    });
                }
            } catch (error) {
                results.errors.push(`Line ${index + 1}: Error processing - "${line}" (${error.message})`);
            }
        });
        
        updateProgress(90, 'Generating report...', 'Creating comparison results...');
        
        // Generate report
        const report = generateTitlesCheckReport(results, lines.length);
        
        updateProgress(100, 'Check completed!', `Found ${results.found.length} matches, ${results.notFound.length} not found.`);
        
        // Show results in a modal or notification
        showTitlesCheckResults(results, report);
        
        console.log('Titles check completed:', results);
        
        completeProgress(true, 'Titles check completed successfully!');
        
    } catch (error) {
        console.error('Titles check failed:', error);
        showNotification('Titel-Überprüfung fehlgeschlagen: ' + error.message, 'error');
        completeProgress(false, 'Titles check failed: ' + error.message);
    } finally {
        // Reset file input
        event.target.value = '';
    }
}

// Generate titles check report
function generateTitlesCheckReport(results, totalLines) {
    let report = `TITEL-ÜBERPRÜFUNG BERICHT\n`;
    report += `========================\n\n`;
    report += `Gesamt überprüfte Einträge: ${totalLines}\n`;
    report += `Gefunden: ${results.found.length}\n`;
    report += `Nicht gefunden: ${results.notFound.length}\n`;
    report += `Fehler: ${results.errors.length}\n\n`;
    
    if (results.found.length > 0) {
        report += `GEFUNDENE TITEL:\n`;
        report += `================\n`;
        results.found.forEach(item => {
            report += `✓ Zeile ${item.line}: "${item.title}" (${item.identifier})\n`;
            report += `  → Gefunden als: "${item.currentTitle}" (ID: ${item.currentId})\n`;
            report += `  → Gefunden durch: ${item.foundBy === 'identifier' ? 'Identifier' : 'Titel'}\n\n`;
        });
    }
    
    if (results.notFound.length > 0) {
        report += `NICHT GEFUNDENE TITEL:\n`;
        report += `=====================\n`;
        results.notFound.forEach(item => {
            report += `✗ Zeile ${item.line}: "${item.title}" (${item.identifier})\n`;
        });
        report += `\n`;
    }
    
    if (results.errors.length > 0) {
        report += `FEHLER:\n`;
        report += `=======\n`;
        results.errors.forEach(error => {
            report += `⚠ ${error}\n`;
        });
    }
    
    return report;
}

// Show titles check results
function showTitlesCheckResults(results, report) {
    // Create modal for results
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto; display: flex; flex-direction: column;">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid var(--border-color);">
                <h2 style="margin: 0; color: var(--text-primary); font-size: 1.5rem;">Titel-Überprüfung Ergebnisse</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.2s ease;">&times;</button>
            </div>
            <div class="modal-body" style="flex: 1; overflow-y: auto; padding-right: 8px;">
                <div class="results-summary">
                    <div class="summary-item found">
                        <span class="summary-icon">✓</span>
                        <span class="summary-text">Gefunden: ${results.found.length}</span>
                    </div>
                    <div class="summary-item not-found">
                        <span class="summary-icon">✗</span>
                        <span class="summary-text">Nicht gefunden: ${results.notFound.length}</span>
                    </div>
                    <div class="summary-item errors">
                        <span class="summary-icon">⚠</span>
                        <span class="summary-text">Fehler: ${results.errors.length}</span>
                    </div>
                </div>
                <div class="results-details">
                    <pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px; background: var(--background-color); padding: 15px; border-radius: 5px; max-height: 400px; overflow-y: auto; border: 1px solid var(--border-color); color: var(--text-primary);">${report}</pre>
                </div>
            </div>
            <div class="modal-actions" style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 20px; border-top: 1px solid var(--border-color); margin-top: 20px; flex-shrink: 0;">
                <button onclick="downloadTitlesCheckReport('${encodeURIComponent(report)}')" class="btn btn-primary" style="padding: 10px 20px; border-radius: 6px; border: none; background: var(--primary-color); color: white; font-weight: 500; cursor: pointer; transition: all 0.2s ease; font-size: 0.9rem;">📥 Bericht herunterladen</button>
                <button onclick="this.closest('.modal').remove()" class="btn btn-secondary" style="padding: 10px 20px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--surface-color); color: var(--text-primary); font-weight: 500; cursor: pointer; transition: all 0.2s ease; font-size: 0.9rem;">Schließen</button>
            </div>
        </div>
    `;
    
    // Add hover effects
    const closeBtn = modal.querySelector('.modal-close');
    const downloadBtn = modal.querySelector('.btn-primary');
    const closeModalBtn = modal.querySelector('.btn-secondary');
    
    if (closeBtn) {
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'var(--surface-hover)';
            closeBtn.style.color = 'var(--text-primary)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
            closeBtn.style.color = 'var(--text-secondary)';
        });
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('mouseenter', () => {
            downloadBtn.style.background = 'var(--primary-hover)';
            downloadBtn.style.transform = 'translateY(-1px)';
        });
        downloadBtn.addEventListener('mouseleave', () => {
            downloadBtn.style.background = 'var(--primary-color)';
            downloadBtn.style.transform = 'translateY(0)';
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('mouseenter', () => {
            closeModalBtn.style.background = 'var(--surface-hover)';
            closeModalBtn.style.borderColor = 'var(--primary-color)';
        });
        closeModalBtn.addEventListener('mouseleave', () => {
            closeModalBtn.style.background = 'var(--surface-color)';
            closeModalBtn.style.borderColor = 'var(--border-color)';
        });
    }
    
    document.body.appendChild(modal);
}

// Download titles check report
function downloadTitlesCheckReport(encodedReport) {
    const report = decodeURIComponent(encodedReport);
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `titles-check-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Sidebar functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebarCollapsed = !sidebarCollapsed;
    
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
    } else {
        sidebar.classList.remove('collapsed');
    }
    
    // Save state to localStorage
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
}

// Expand sidebar and switch to category
function expandAndSwitchCategory(category) {
    const sidebar = document.getElementById('sidebar');
    
    // If sidebar is collapsed, expand it first
    if (sidebarCollapsed) {
        sidebarCollapsed = false;
        sidebar.classList.remove('collapsed');
        localStorage.setItem('sidebarCollapsed', false);
    }
    
    // Switch to the category
    switchCategory(category);
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('mobile-open');
}

// Floating menu functions
function toggleFloatingMenu() {
    const floatingMenu = document.getElementById('floatingMenu');
    floatingMenuOpen = !floatingMenuOpen;
    
    if (floatingMenuOpen) {
        floatingMenu.classList.add('show');
    } else {
        floatingMenu.classList.remove('show');
    }
}

function closeFloatingMenu() {
    const floatingMenu = document.getElementById('floatingMenu');
    floatingMenuOpen = false;
    floatingMenu.classList.remove('show');
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        
        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
        
        // Add click outside to close
        modal.addEventListener('click', handleModalClickOutside);
        
        // Add ESC key to close
        document.addEventListener('keydown', handleModalEscape);
        
        // Small delay to ensure display is set before adding show class
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

// Handle clicking outside modal to close
function handleModalClickOutside(e) {
    if (e.target.classList.contains('modal')) {
        const modalId = e.target.id;
        closeModal(modalId);
    }
}

// Handle ESC key to close modal
function handleModalEscape(e) {
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            closeModal(openModal.id);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        
        // Remove event listeners
        modal.removeEventListener('click', handleModalClickOutside);
        document.removeEventListener('keydown', handleModalEscape);
        
        // Clear autocomplete results for edit modal
        if (modalId === 'editModal') {
            const resultsContainer = document.getElementById('autocompleteResults');
            if (resultsContainer) {
                resultsContainer.classList.remove('show');
                resultsContainer.innerHTML = '';
            }
        }
        
        // Reset forms and clear errors
        if (modalId === 'loginModal') {
            const form = document.getElementById('loginForm');
            const error = document.getElementById('loginError');
            if (form) form.reset();
            if (error) error.style.display = 'none';
        } else if (modalId === 'registerModal') {
            const form = document.getElementById('registerForm');
            const error = document.getElementById('registerError');
            if (form) form.reset();
            if (error) error.style.display = 'none';
        } else if (modalId === 'bulkAddModal') {
            // Reset bulk add form
            document.getElementById('bulkCategory').value = 'game';
            document.getElementById('bulkTitles').value = '';
            document.getElementById('bulkFetchImages').checked = true;
            document.getElementById('bulkSkipExisting').checked = true;
            document.getElementById('bulkProgress').style.display = 'none';
            document.getElementById('bulkResults').style.display = 'none';
            document.getElementById('bulkAddStart').disabled = false;
        }
        
        // Reset modal state after animation
        setTimeout(() => {
            modal.style.display = 'none';
            // Re-enable background scrolling
            document.body.style.overflow = '';
        }, 300);
    }
}

// Update filter checkboxes in sidebar
function updateFilterCheckboxes() {
    updatePlatformFilters();
    updateGenreFilters();
}

function updatePlatformFilters() {
    const container = document.getElementById('platformFilters');
    if (!container) return;
    
    // Get unique platforms from media data
    const platforms = [...new Set(mediaData
        .filter(item => item.platforms)
        .flatMap(item => item.platforms.split(',').map(p => p.trim()))
        .filter(p => p.length > 0)
    )].sort();
    
    const maxVisible = 5;
    const hasMore = platforms.length > maxVisible;
    
    // Create visible items
    const visiblePlatforms = platforms.slice(0, maxVisible);
    const hiddenPlatforms = platforms.slice(maxVisible);
    
    let html = visiblePlatforms.map(platform => `
        <label class="filter-option">
            <input type="checkbox" value="${platform}" ${activeFilters.includes(platform) ? 'checked' : ''}>
            <span class="checkmark"></span>
            <span class="option-text">${platform}</span>
        </label>
    `).join('');
    
    // Add hidden items with collapsible container
    if (hasMore) {
        html += `
            <div class="filter-collapsible" id="platformCollapsible" style="display: none;">
                ${hiddenPlatforms.map(platform => `
                    <label class="filter-option">
                        <input type="checkbox" value="${platform}" ${activeFilters.includes(platform) ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        <span class="option-text">${platform}</span>
                    </label>
                `).join('')}
            </div>
            <button class="filter-toggle" id="platformToggle">
                <span class="toggle-text">Show more (${hiddenPlatforms.length})</span>
                <span class="toggle-icon">▼</span>
            </button>
        `;
    }
    
    container.innerHTML = html;
    
    // Add event listeners for checkboxes
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                if (!activeFilters.includes(this.value)) {
                    activeFilters.push(this.value);
                }
            } else {
                activeFilters = activeFilters.filter(f => f !== this.value);
            }
            renderGrid();
        });
    });
    
    // Add toggle button event listener
    const toggleBtn = document.getElementById('platformToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const collapsible = document.getElementById('platformCollapsible');
            const toggleText = this.querySelector('.toggle-text');
            const toggleIcon = this.querySelector('.toggle-icon');
            
            if (collapsible.style.display === 'none') {
                collapsible.style.display = 'block';
                toggleText.textContent = `Show less`;
                toggleIcon.textContent = '▲';
            } else {
                collapsible.style.display = 'none';
                toggleText.textContent = `Show more (${hiddenPlatforms.length})`;
                toggleIcon.textContent = '▼';
            }
        });
    }
}

function updateGenreFilters() {
    const container = document.getElementById('genreFilters');
    if (!container) return;
    
    // Get unique genres from media data
    const genres = [...new Set(mediaData
        .filter(item => item.genre)
        .flatMap(item => item.genre.split(',').map(g => g.trim()))
        .filter(g => g.length > 0)
    )].sort();
    
    const maxVisible = 5;
    const hasMore = genres.length > maxVisible;
    
    // Create visible items
    const visibleGenres = genres.slice(0, maxVisible);
    const hiddenGenres = genres.slice(maxVisible);
    
    let html = visibleGenres.map(genre => `
        <label class="filter-option">
            <input type="checkbox" value="${genre}" ${activeFilters.includes(genre) ? 'checked' : ''}>
            <span class="checkmark"></span>
            <span class="option-text">${genre}</span>
        </label>
    `).join('');
    
    // Add hidden items with collapsible container
    if (hasMore) {
        html += `
            <div class="filter-collapsible" id="genreCollapsible" style="display: none;">
                ${hiddenGenres.map(genre => `
                    <label class="filter-option">
                        <input type="checkbox" value="${genre}" ${activeFilters.includes(genre) ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        <span class="option-text">${genre}</span>
                    </label>
                `).join('')}
            </div>
            <button class="filter-toggle" id="genreToggle">
                <span class="toggle-text">Show more (${hiddenGenres.length})</span>
                <span class="toggle-icon">▼</span>
            </button>
        `;
    }
    
    container.innerHTML = html;
    
    // Add event listeners for checkboxes
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                if (!activeFilters.includes(this.value)) {
                    activeFilters.push(this.value);
                }
            } else {
                activeFilters = activeFilters.filter(f => f !== this.value);
            }
            renderGrid();
        });
    });
    
    // Add toggle button event listener
    const toggleBtn = document.getElementById('genreToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const collapsible = document.getElementById('genreCollapsible');
            const toggleText = this.querySelector('.toggle-text');
            const toggleIcon = this.querySelector('.toggle-icon');
            
            if (collapsible.style.display === 'none') {
                collapsible.style.display = 'block';
                toggleText.textContent = `Show less`;
                toggleIcon.textContent = '▲';
            } else {
                collapsible.style.display = 'none';
                toggleText.textContent = `Show more (${hiddenGenres.length})`;
                toggleIcon.textContent = '▼';
            }
        });
    }
}

// Update navigation buttons
function updateNavigationButtons() {
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Add active class to current category button
    const categoryMap = {
        'game': 'btnGames',
        'series': 'btnSeries', 
        'movie': 'btnMovies',
        'games_new': 'btnGamesNew',
        'series_new': 'btnSeriesNew',
        'movie_new': 'btnMoviesNew',
        'calendar': 'btnCalendar'
    };
    
    const activeButton = document.getElementById(categoryMap[currentCategory]);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Update counts in navigation
function updateCounts() {
    const counts = {
        games: 0,
        series: 0,
        movies: 0,
        gamesNew: 0,
        seriesNew: 0,
        moviesNew: 0
    };
    
    mediaData.forEach(item => {
        if (item.category === 'game') {
            counts.games++;
        } else if (item.category === 'games_new') {
            counts.gamesNew++;
        } else if (item.category === 'series') {
            counts.series++;
        } else if (item.category === 'series_new') {
            counts.seriesNew++;
        } else if (item.category === 'movie') {
            counts.movies++;
        } else if (item.category === 'movie_new') {
            counts.moviesNew++;
        }
    });
    
    // Update count displays
    const countGames = document.getElementById('countGames');
    const countSeries = document.getElementById('countSeries');
    const countMovies = document.getElementById('countMovies');
    const countGamesNew = document.getElementById('countGamesNew');
    const countSeriesNew = document.getElementById('countSeriesNew');
    const countMoviesNew = document.getElementById('countMoviesNew');
    
    if (countGames) countGames.textContent = counts.games;
    if (countSeries) countSeries.textContent = counts.series;
    if (countMovies) countMovies.textContent = counts.movies;
    if (countGamesNew) countGamesNew.textContent = counts.gamesNew;
    if (countSeriesNew) countSeriesNew.textContent = counts.seriesNew;
    if (countMoviesNew) countMoviesNew.textContent = counts.moviesNew;
}

// Load sidebar state from localStorage
function loadSidebarState() {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
        sidebarCollapsed = true;
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.add('collapsed');
        }
    }
}

// Initialize sidebar state
loadSidebarState();

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Check authentication status first
    console.log('Checking auth status on page load:', { hasToken: !!authToken, token: authToken });
    
    // Enable buttons and show correct UI
    enableAuthButtons();
    
    if (authToken) {
        checkAuthStatus();
    } else {
        updateAuthUI();
    }
    
    // Check tooltip dismissal status
    checkTooltipDismissal();
    
    // Enable transitions after initial load to prevent FOUC
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    if (sidebar) sidebar.classList.add('ready');
    if (mainContent) mainContent.classList.add('ready');
    
    // Load settings first to ensure dark mode is applied immediately
    loadSettings();
    
    // Set up new UI event listeners (includes settings toggles)
    setupNewUIEventListeners();
    
    // Set up existing event listeners
    setupExistingEventListeners();
    
    // Set up controls (including sidebar navigation)
    setupControls();
    
    // Load preferences before loading data to ensure gridColumns is set correctly
    loadViewPreferences();
    
    // Apply settings again after all event listeners are set up
    applySettings();
    
    // Update auth UI (will be called again after auth check)
    updateAuthUI();
    
    // Load data
    loadData();
    
    // Initial toggle of playtime group based on default category
    const playtimeGroup = document.getElementById('playtimeGroup');
    if(playtimeGroup){ 
        playtimeGroup.style.display = (currentCategory === 'game' ? 'flex' : 'none'); 
    }
    
    // Initial toggle of airing group based on default category
    const airingGroup = document.getElementById('airingGroup');
    if(airingGroup){ 
        airingGroup.style.display = (currentCategory === 'series' ? 'flex' : 'none'); 
    }
    
    // Apply view mode
    applyViewMode();
    setActiveCategoryButton();
    
    console.log('App initialized successfully');
});

// Set up existing event listeners
function setupExistingEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchQuery = this.value;
            renderGrid();
        });
    }
    
    if (searchClear) {
        searchClear.addEventListener('click', function() {
            searchInput.value = '';
            searchQuery = '';
            renderGrid();
        });
    }
    
    // Sort functionality
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const [field, order] = this.value.split('_');
            sortData(field, order);
            renderGrid();
        });
    }
    
    // Per-category landscape mode toggles (duplicate initialization for safety)
    const landscapeToggles = {
        'landscapeModeGames': 'game',
        'landscapeModeSeries': 'series', 
        'landscapeModeMovies': 'movie',
        'landscapeModeGamesNew': 'games_new',
        'landscapeModeSeriesNew': 'series_new',
        'landscapeModeMoviesNew': 'movie_new'
    };
    
    Object.entries(landscapeToggles).forEach(([toggleId, category]) => {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
            toggle.addEventListener('change', function() {
                landscapeModeSettings[category] = this.checked;
                applyViewMode();
                saveViewPreferences();
            });
        }
    });
    
    // Keep old landscape mode toggle for backward compatibility
    const landscapeModeToggle = document.getElementById('landscapeMode');
    if (landscapeModeToggle) {
        landscapeModeToggle.addEventListener('change', function() {
            landscapeMode = this.checked;
            // Apply to all categories when using global toggle
            Object.keys(landscapeModeSettings).forEach(cat => {
                landscapeModeSettings[cat] = this.checked;
            });
            applyViewMode();
            saveViewPreferences();
        });
    }
    
    // Playtime filters
    const playMinInput = document.getElementById('playMin');
    const playMaxInput = document.getElementById('playMax');
    
    if (playMinInput) {
        playMinInput.addEventListener('input', function() {
            playMin = this.value ? parseInt(this.value) : null;
            renderGrid();
        });
    }
    
    if (playMaxInput) {
        playMaxInput.addEventListener('input', function() {
            playMax = this.value ? parseInt(this.value) : null;
            renderGrid();
        });
    }
    
    // Airing filters
    const airingAll = document.getElementById('airingAll');
    const airingTrue = document.getElementById('airingTrue');
    const airingFalse = document.getElementById('airingFalse');
    
    if (airingAll) {
        airingAll.addEventListener('click', () => {
            airingFilter = 'all';
            updateAiringButtons();
            renderGrid();
        });
    }
    
    if (airingTrue) {
        airingTrue.addEventListener('click', () => {
            airingFilter = 'true';
            updateAiringButtons();
            renderGrid();
        });
    }
    
    if (airingFalse) {
        airingFalse.addEventListener('click', () => {
            airingFilter = 'false';
            updateAiringButtons();
            renderGrid();
        });
    }
    
    // Authentication buttons - these are already handled in setupControls()
    // No need to duplicate the event listeners
    
    // Add cancel button functionality
    const loginCancel = document.getElementById('loginCancel');
    const registerCancel = document.getElementById('registerCancel');
    
    if (loginCancel) {
        loginCancel.addEventListener('click', () => closeModal('loginModal'));
    }
    
    if (registerCancel) {
        registerCancel.addEventListener('click', () => closeModal('registerModal'));
    }
    
    // Import file input
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
        importFileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                importData(this.files[0]);
            }
        });
    }
}

// Update airing filter buttons
function updateAiringButtons() {
    const airingAll = document.getElementById('airingAll');
    const airingTrue = document.getElementById('airingTrue');
    const airingFalse = document.getElementById('airingFalse');
    
    if (airingAll) airingAll.classList.toggle('active', airingFilter === 'all');
    if (airingTrue) airingTrue.classList.toggle('active', airingFilter === 'true');
    if (airingFalse) airingFalse.classList.toggle('active', airingFilter === 'false');
}

// Show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

// Sort data function
function sortData(field, order) {
    mediaData.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        if (field === 'title') {
            aVal = (aVal || '').toLowerCase();
            bVal = (bVal || '').toLowerCase();
        } else if (field === 'release' || field === 'discovered') {
            aVal = new Date(aVal || 0);
            bVal = new Date(bVal || 0);
        } else if (field === 'rating' || field === 'count' || field === 'spielzeit') {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
        }
        
        if (order === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });
}

// Statistics functionality
let statisticsManager = null;

function switchToStatistics() {
    // Hide grid and show statistics
    document.getElementById('grid').style.display = 'none';
    document.getElementById('statisticsView').style.display = 'block';
    
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btnStatistics').classList.add('active');
    
    // Initialize statistics if not already done
    if (!statisticsManager) {
        statisticsManager = new StatisticsManager();
    } else {
        // If data is not loaded yet, wait a bit and try again
        if (typeof mediaData === 'undefined' || !mediaData || mediaData.length === 0) {
            console.log('Data not loaded yet, waiting...');
            setTimeout(() => {
                if (statisticsManager) {
                    statisticsManager.loadStatistics();
                }
            }, 1000);
        } else {
            statisticsManager.loadStatistics();
        }
    }
}

function switchToGrid() {
    // Show grid and hide statistics
    document.getElementById('grid').style.display = 'block';
    document.getElementById('statisticsView').style.display = 'none';
    
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    // Set active button based on current category
    setActiveCategoryButton();
}

class StatisticsManager {
    constructor() {
        this.stats = {};
        this.init();
    }

    async init() {
        await this.loadStatistics();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('refreshStats');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadStatistics();
            });
        }
    }

    async loadStatistics() {
        try {
            this.showLoading();
            
            console.log('Loading statistics...');
            
            // Use the same data as the main application
            if (typeof mediaData === 'undefined' || !mediaData || mediaData.length === 0) {
                this.showError('Keine Daten gefunden. Bitte lade die Hauptseite neu oder warte, bis die Daten geladen sind.');
                return;
            }
            
            // Get collections data from localStorage or use empty array
            const collectionsData = JSON.parse(localStorage.getItem('collectionsData') || '[]');
            
            console.log('Data loaded from global mediaData:', mediaData.length, 'items');
            
            // Calculate statistics from the same data as main app
            const stats = this.calculateStatistics(mediaData, collectionsData);

            console.log('Statistics calculated:', stats);

            this.stats = stats;

            this.renderStatistics();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.showError('Fehler beim Laden der Statistiken: ' + error.message);
        }
    }

    calculateStatistics(mediaData, collectionsData) {
        // Total items
        const totalItems = mediaData.length;
        const totalCollections = collectionsData.length;
        
        // Total playtime
        const totalPlaytime = mediaData.reduce((sum, item) => sum + (parseInt(item.spielzeit) || 0), 0);
        
        // Average rating
        const ratings = mediaData.filter(item => item.rating && !isNaN(parseFloat(item.rating)));
        const avgRating = ratings.length > 0 ? ratings.reduce((sum, item) => sum + parseFloat(item.rating), 0) / ratings.length : 0;
        
        // Category distribution
        const categoryStats = {};
        mediaData.forEach(item => {
            const category = item.category || 'unknown';
            categoryStats[category] = (categoryStats[category] || 0) + 1;
        });
        const categories = Object.entries(categoryStats).map(([category, count]) => ({ category, count }));
        
        // Rating distribution
        const ratingStats = {};
        ratings.forEach(item => {
            const rating = parseFloat(item.rating);
            ratingStats[rating] = (ratingStats[rating] || 0) + 1;
        });
        const ratingsArray = Object.entries(ratingStats).map(([rating, count]) => ({ rating: parseFloat(rating), count }));
        
        // Platform distribution
        const platformStats = {};
        mediaData.forEach(item => {
            if (item.platforms) {
                const platforms = item.platforms.split(',').map(p => p.trim()).filter(p => p);
                platforms.forEach(platform => {
                    platformStats[platform] = (platformStats[platform] || 0) + 1;
                });
            }
        });
        const platforms = Object.entries(platformStats).map(([platform, count]) => ({ platform, count }));
        
        // Genre distribution
        const genreStats = {};
        mediaData.forEach(item => {
            if (item.genre) {
                const genres = item.genre.split(',').map(g => g.trim()).filter(g => g);
                genres.forEach(genre => {
                    genreStats[genre] = (genreStats[genre] || 0) + 1;
                });
            }
        });
        const genres = Object.entries(genreStats).map(([genre, count]) => ({ genre, count }));
        
        // Recent activity (last 10 items by discovered date)
        const recent = mediaData
            .filter(item => item.discovered)
            .sort((a, b) => new Date(b.discovered) - new Date(a.discovered))
            .slice(0, 10)
            .map(item => ({ title: item.title, discovered: item.discovered, category: item.category }));
        
        // Airing series
        const airing = mediaData
            .filter(item => item.category === 'series' && item.isAiring === true)
            .map(item => ({ title: item.title, next_season: item.nextSeason, next_season_release: item.nextSeasonRelease }));
        
        return {
            total: {
                totalItems,
                totalCollections,
                totalPlaytime,
                avgRating: Math.round(avgRating * 10) / 10
            },
            categories: categories.sort((a, b) => b.count - a.count),
            ratings: ratingsArray.sort((a, b) => a.rating - b.rating),
            platforms: platforms.sort((a, b) => b.count - a.count),
            genres: genres.sort((a, b) => b.count - a.count),
            recent,
            airing
        };
    }

    renderStatistics() {
        this.renderSummaryCards();
        this.renderCategoryChart();
        this.renderRatingChart();
        this.renderPlatformChart();
        this.renderGenreChart();
        this.renderRecentActivity();
        this.renderAiringSeries();
    }

    renderSummaryCards() {
        document.getElementById('totalItems').textContent = this.stats.total.totalItems || 0;
        document.getElementById('totalCollections').textContent = this.stats.total.totalCollections || 0;
        document.getElementById('totalPlaytime').textContent = this.formatPlaytime(this.stats.total.totalPlaytime || 0);
        document.getElementById('avgRating').textContent = (this.stats.total.avgRating || 0).toFixed(1);
    }

    renderCategoryChart() {
        const container = document.getElementById('categoryChart');
        container.innerHTML = '';

        if (this.stats.categories && this.stats.categories.length > 0) {
            const maxCount = Math.max(...this.stats.categories.map(cat => cat.count));
            
            this.stats.categories.forEach(category => {
                const percentage = Math.max((category.count / maxCount) * 100, 5); // Minimum 5% width
                const item = document.createElement('div');
                item.className = 'category-item';
                item.innerHTML = `
                    <span class="category-name">${category.category}</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%">
                            ${category.count}
                        </div>
                    </div>
                `;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Keine Kategorie-Daten verfügbar</p>';
        }
    }

    renderRatingChart() {
        const container = document.getElementById('ratingChart');
        container.innerHTML = '';

        if (this.stats.ratings && this.stats.ratings.length > 0) {
            const maxCount = Math.max(...this.stats.ratings.map(rating => rating.count));
            
            this.stats.ratings.forEach(rating => {
                const percentage = Math.max((rating.count / maxCount) * 100, 5);
                const item = document.createElement('div');
                item.className = 'category-item';
                item.innerHTML = `
                    <span class="category-name">${rating.rating} ⭐</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%">
                            ${rating.count}
                        </div>
                    </div>
                `;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Keine Bewertungs-Daten verfügbar</p>';
        }
    }

    renderPlatformChart() {
        const container = document.getElementById('platformChart');
        container.innerHTML = '';

        if (this.stats.platforms && this.stats.platforms.length > 0) {
            const maxCount = Math.max(...this.stats.platforms.map(platform => platform.count));
            
            this.stats.platforms.forEach(platform => {
                const percentage = Math.max((platform.count / maxCount) * 100, 5);
                const item = document.createElement('div');
                item.className = 'category-item';
                item.innerHTML = `
                    <span class="category-name">${platform.platform}</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%">
                            ${platform.count}
                        </div>
                    </div>
                `;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Keine Plattform-Daten verfügbar</p>';
        }
    }

    renderGenreChart() {
        const container = document.getElementById('genreChart');
        container.innerHTML = '';

        if (this.stats.genres && this.stats.genres.length > 0) {
            const maxCount = Math.max(...this.stats.genres.map(genre => genre.count));
            
            this.stats.genres.slice(0, 10).forEach(genre => {
                const percentage = Math.max((genre.count / maxCount) * 100, 5);
                const item = document.createElement('div');
                item.className = 'category-item';
                item.innerHTML = `
                    <span class="category-name">${genre.genre}</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%">
                            ${genre.count}
                        </div>
                    </div>
                `;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Keine Genre-Daten verfügbar</p>';
        }
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivity');
        container.innerHTML = '';

        if (this.stats.recent && this.stats.recent.length > 0) {
            this.stats.recent.forEach(activity => {
                const item = document.createElement('div');
                item.className = 'category-item';
                item.innerHTML = `
                    <span class="category-name">${activity.title}</span>
                    <span class="category-count">${this.formatDate(activity.discovered)}</span>
                `;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Keine kürzlichen Aktivitäten verfügbar</p>';
        }
    }

    renderAiringSeries() {
        const container = document.getElementById('airingSeries');
        container.innerHTML = '';

        if (this.stats.airing && this.stats.airing.length > 0) {
            this.stats.airing.forEach(series => {
                const item = document.createElement('div');
                item.className = 'category-item';
                item.innerHTML = `
                    <span class="category-name">${series.title}</span>
                    <span class="category-count">S${series.next_season}</span>
                `;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Keine laufenden Serien verfügbar</p>';
        }
    }

    formatPlaytime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE');
    }

    showLoading() {
        document.getElementById('loadingMessage').style.display = 'block';
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('statisticsContent').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('statisticsContent').style.display = 'block';
    }

    showError(message = 'Fehler beim Laden der Statistiken. Bitte versuche es erneut.') {
        document.getElementById('loadingMessage').style.display = 'none';
        const errorElement = document.getElementById('errorMessage');
        errorElement.querySelector('p').textContent = message;
        errorElement.style.display = 'block';
        document.getElementById('statisticsContent').style.display = 'none';
    }
}

// Debug Console System
class DebugConsole {
    constructor() {
        this.isOpen = false;
        this.outputContainer = null;
        this.init();
    }

    init() {
        this.outputContainer = document.getElementById('debugOutputContent');
        this.setupEventListeners();
        this.log('Debug Console initialized', 'info');
        
        // Check authentication status
        const authHeaders = this.getAuthHeaders();
        if (authHeaders) {
            this.log('User authenticated - Debug functions available', 'success');
        } else {
            this.log('User not authenticated - Please log in to use debug functions', 'warning');
        }
    }

    setupEventListeners() {
        // Toggle button
        document.getElementById('debugToggle').addEventListener('click', () => {
            this.toggle();
        });

        // Close button
        document.getElementById('debugClose').addEventListener('click', () => {
            this.close();
        });

        // Clear output button
        document.getElementById('debugClearOutput').addEventListener('click', () => {
            this.clearOutput();
        });

        // Debug function buttons
        document.getElementById('debugItemsWithoutImages').addEventListener('click', () => {
            this.runItemsWithoutImagesReport();
        });

        document.getElementById('debugDatabaseStats').addEventListener('click', () => {
            this.runDatabaseStats();
        });

        document.getElementById('debugImagePaths').addEventListener('click', () => {
            this.runImagePathsCheck();
        });

        document.getElementById('debugCheckDuplicates').addEventListener('click', () => {
            this.runCheckDuplicates();
        });

        document.getElementById('debugClearCache').addEventListener('click', () => {
            this.clearCache();
        });

        document.getElementById('debugExportLogs').addEventListener('click', () => {
            this.exportLogs();
        });

        // Add debug auth check button
        document.getElementById('debugCheckAuth').addEventListener('click', () => {
            this.checkAuthStatus();
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            const debugConsole = document.getElementById('debugConsole');
            const debugDropdown = document.getElementById('debugDropdown');
            if (this.isOpen && !debugConsole.contains(e.target)) {
                this.close();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const dropdown = document.getElementById('debugDropdown');
        dropdown.classList.add('show');
        this.isOpen = true;
        this.log('Debug console opened', 'info');
    }

    close() {
        const dropdown = document.getElementById('debugDropdown');
        dropdown.classList.remove('show');
        this.isOpen = false;
    }

    log(message, type = 'info', details = null) {
        const timestamp = new Date().toLocaleTimeString();
        const outputItem = document.createElement('div');
        outputItem.className = `debug-output-item ${type}`;
        
        let content = `
            <div class="debug-output-timestamp">${timestamp}</div>
            <div class="debug-output-message">${message}</div>
        `;
        
        if (details) {
            content += `<div class="debug-output-details">${details}</div>`;
        }
        
        outputItem.innerHTML = content;
        
        // Remove placeholder if it exists
        const placeholder = this.outputContainer.querySelector('.debug-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        this.outputContainer.appendChild(outputItem);
        this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
    }

    clearOutput() {
        this.outputContainer.innerHTML = '<p class="debug-placeholder">Debug output will appear here...</p>';
    }

    getAuthHeaders() {
        // Check for authToken (global variable) first
        if (typeof authToken !== 'undefined' && authToken) {
            return {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
        }
        
        // Fallback to currentUser.token if available
        if (currentUser && currentUser.token) {
            return {
                'Authorization': `Bearer ${currentUser.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
        }
        
        return null;
    }

    async runItemsWithoutImagesReport() {
        this.log('Starting items without images report...', 'info');
        
        try {
            const authHeaders = this.getAuthHeaders();
            if (!authHeaders) {
                this.log('User not authenticated. Please log in first.', 'error');
                return;
            }

            const response = await fetch('/api/debug/items-without-images', {
                headers: authHeaders
            });
            
            if (response.status === 401) {
                this.log('Authentication failed. Please log in again.', 'error');
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.log(`Found ${data.count} items without images out of ${data.total_items} total items`, 'success');
                
                // Show debug info
                if (data.debug_info) {
                    const debugDetails = `
Null paths: ${data.debug_info.null_paths}
Empty paths: ${data.debug_info.empty_paths}
"null" string paths: ${data.debug_info.null_string_paths}
                    `;
                    this.log('Debug Info:', 'info', debugDetails);
                }
                
                // Show sample items with paths
                if (data.sample_items_with_paths && data.sample_items_with_paths.length > 0) {
                    const sampleDetails = data.sample_items_with_paths.map(item => 
                        `• ${item.title} (${item.category}) - Path: "${item.path}"`
                    ).join('\n');
                    this.log('Sample items with paths:', 'info', sampleDetails);
                }
                
                if (data.items && data.items.length > 0) {
                    const details = data.items.map(item => 
                        `• ${item.title} (${item.category}) - ID: ${item.id} - Path: "${item.path}"`
                    ).join('\n');
                    this.log('Items without images:', 'warning', details);
                } else {
                    this.log('No items without images found', 'info');
                }
            } else {
                this.log('Failed to get items without images report', 'error', data.message);
            }
        } catch (error) {
            this.log('Error running items without images report', 'error', error.message);
        }
    }

    async runDatabaseStats() {
        this.log('Starting database statistics...', 'info');
        
        try {
            const authHeaders = this.getAuthHeaders();
            if (!authHeaders) {
                this.log('User not authenticated. Please log in first.', 'error');
                return;
            }

            const response = await fetch('/api/debug/database-stats', {
                headers: authHeaders
            });
            
            if (response.status === 401) {
                this.log('Authentication failed. Please log in again.', 'error');
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.log('Database statistics retrieved', 'success');
                const details = `
Total Items: ${data.stats.total_items}
Items with Images: ${data.stats.items_with_images}
Items without Images: ${data.stats.items_without_images}
Categories: ${JSON.stringify(data.stats.categories, null, 2)}
Collections: ${data.stats.collections}
Users: ${data.stats.users}
                `;
                this.log('Database Statistics:', 'info', details);
            } else {
                this.log('Failed to get database statistics', 'error', data.message);
            }
        } catch (error) {
            this.log('Error running database statistics', 'error', error.message);
        }
    }

    async runImagePathsCheck() {
        this.log('Starting image paths check...', 'info');
        
        try {
            const authHeaders = this.getAuthHeaders();
            if (!authHeaders) {
                this.log('User not authenticated. Please log in first.', 'error');
                return;
            }

            const response = await fetch('/api/debug/image-paths-check', {
                headers: authHeaders
            });
            
            if (response.status === 401) {
                this.log('Authentication failed. Please log in again.', 'error');
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.log('Image paths check completed', 'success');
                const details = `
Valid Paths: ${data.valid_paths}
Invalid Paths: ${data.invalid_paths}
Missing Files: ${data.missing_files}
                `;
                this.log('Image Paths Check:', 'info', details);
                
                if (data.invalid_paths > 0 || data.missing_files > 0) {
                    this.log('Found image path issues', 'warning', 'Check the details above for more information');
                }
            } else {
                this.log('Failed to run image paths check', 'error', data.message);
            }
        } catch (error) {
            this.log('Error running image paths check', 'error', error.message);
        }
    }

    clearCache() {
        this.log('Clearing application cache...', 'info');
        
        try {
            // Clear localStorage
            const keysToKeep = ['currentUser', 'noobTooltipDismissed'];
            const allKeys = Object.keys(localStorage);
            allKeys.forEach(key => {
                if (!keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            });
            
            // Clear sessionStorage
            sessionStorage.clear();
            
            this.log('Cache cleared successfully', 'success');
            this.log('Page will reload to apply changes', 'warning');
            
            // Reload page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            this.log('Error clearing cache', 'error', error.message);
        }
    }

    exportLogs() {
        this.log('Exporting debug logs...', 'info');
        
        try {
            const logs = this.outputContainer.innerHTML;
            const blob = new Blob([logs], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `debug-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.log('Debug logs exported successfully', 'success');
        } catch (error) {
            this.log('Error exporting logs', 'error', error.message);
        }
    }

    async runCheckDuplicates() {
        // Get current active category
        const activeCategory = this.getActiveCategory();
        
        // Debug information
        this.log(`Debug: currentCategory = ${typeof currentCategory !== 'undefined' ? currentCategory : 'undefined'}`, 'info');
        const activeNavBtn = document.querySelector('.nav-btn.active');
        this.log(`Debug: active nav button = ${activeNavBtn ? activeNavBtn.id : 'none'}`, 'info');
        
        if (!activeCategory) {
            this.log('No active category selected. Please select a category first.', 'error');
            return;
        }

        this.log(`Starting duplicate check for category: "${activeCategory}"`, 'info');
        
        try {
            const authHeaders = this.getAuthHeaders();
            if (!authHeaders) {
                this.log('User not authenticated. Please log in first.', 'error');
                return;
            }

            // First get the status to show initial counts
            const statusResponse = await fetch(`/api/debug/duplicate-check-status?category=${encodeURIComponent(activeCategory)}`, {
                headers: authHeaders
            });
            
            if (statusResponse.status === 401) {
                this.log('Authentication failed. Please log in again.', 'error');
                return;
            }
            
            const statusData = await statusResponse.json();
            
            if (statusData.success) {
                this.log(`Category "${activeCategory}" has ${statusData.total_items} items`, 'info');
                this.log(`Quick check found: ${statusData.duplicate_titles_count} duplicate titles, ${statusData.exact_duplicates_count} exact duplicates`, 'warning');
                
                // Now run the detailed check with progress
                await this.runDetailedDuplicateCheck(activeCategory, authHeaders);
            } else {
                this.log('Failed to get category status', 'error', statusData.message);
            }
        } catch (error) {
            this.log('Error checking for duplicates', 'error', error.message);
        }
    }

    async runDetailedDuplicateCheck(category, authHeaders) {
        this.log('Starting detailed duplicate check with progress...', 'info');
        
        let offset = 0;
        let allDuplicates = [];
        let totalItems = 0;
        let isComplete = false;
        
        // Create progress indicator
        const progressId = 'duplicate-check-progress';
        this.log(`<div id="${progressId}" class="progress-container">
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-text">0% - Starting...</div>
        </div>`, 'info');

        try {
            while (!isComplete) {
                const response = await fetch(`/api/debug/check-duplicates-in-category?category=${encodeURIComponent(category)}&offset=${offset}`, {
                    headers: authHeaders
                });
                
                if (response.status === 401) {
                    this.log('Authentication failed during check. Please log in again.', 'error');
                    return;
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    this.log('Failed to check duplicates', 'error', data.message);
                    return;
                }

                totalItems = data.total_items;
                offset = data.processed;
                isComplete = data.is_complete;
                
                // Update progress
                this.updateProgress(progressId, data.progress, data.processed, data.total_items);
                
                // Collect duplicates
                allDuplicates = allDuplicates.concat(data.duplicates);
                
                // Log progress
                this.log(`Processed ${data.processed}/${data.total_items} items (${data.progress}%)`, 'info');
                
                // Small delay to prevent overwhelming the server
                if (!isComplete) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            // Remove progress indicator
            const progressElement = document.getElementById(progressId);
            if (progressElement) {
                progressElement.remove();
            }
            
            // Show results
            this.log('Duplicate check completed!', 'success');
            this.log(`Total items checked: ${totalItems}`, 'info');
            
            if (allDuplicates.length === 0) {
                this.log('🎉 No duplicates found in this category!', 'success');
                return;
            }
            
            // Group duplicates by type
            const exactDuplicates = allDuplicates.filter(d => d.type === 'exact');
            const titleDuplicates = allDuplicates.filter(d => d.type === 'title');
            
            this.log(`Found ${exactDuplicates.length} exact duplicate groups and ${titleDuplicates.length} title duplicate groups`, 'warning');
            
            // Show exact duplicates
            if (exactDuplicates.length > 0) {
                this.log('=== EXACT DUPLICATES ===', 'error');
                exactDuplicates.forEach((dup, index) => {
                    this.log(`${index + 1}. "${dup.item.title}" (ID: ${dup.item.id})`, 'error');
                    this.log(`   Found ${dup.total_count} identical entries:`, 'error');
                    dup.duplicates.forEach(duplicate => {
                        this.log(`   - ID: ${duplicate.id}, Title: "${duplicate.title}"`, 'error');
                    });
                });
            }
            
            // Show title duplicates
            if (titleDuplicates.length > 0) {
                this.log('=== TITLE DUPLICATES ===', 'warning');
                titleDuplicates.forEach((dup, index) => {
                    this.log(`${index + 1}. "${dup.item.title}" (ID: ${dup.item.id})`, 'warning');
                    this.log(`   Found ${dup.total_count} entries with same title:`, 'warning');
                    dup.duplicates.forEach(duplicate => {
                        this.log(`   - ID: ${duplicate.id}, Title: "${duplicate.title}", Release: ${duplicate.release || 'N/A'}, Rating: ${duplicate.rating || 'N/A'}`, 'warning');
                    });
                });
            }
            
        } catch (error) {
            this.log('Error during detailed duplicate check', 'error', error.message);
        }
    }

    updateProgress(progressId, percentage, processed, total) {
        const progressElement = document.getElementById(progressId);
        if (progressElement) {
            const fillElement = progressElement.querySelector('.progress-fill');
            const textElement = progressElement.querySelector('.progress-text');
            
            if (fillElement) {
                fillElement.style.width = `${percentage}%`;
            }
            if (textElement) {
                textElement.textContent = `${percentage}% - ${processed}/${total} items processed`;
            }
        }
    }

    getActiveCategory() {
        // Check if currentCategory global variable is available
        if (typeof currentCategory !== 'undefined' && currentCategory && currentCategory !== 'all') {
            return currentCategory;
        }
        
        // Try to get from the active nav button
        const activeNavBtn = document.querySelector('.nav-btn.active');
        if (activeNavBtn) {
            const btnId = activeNavBtn.id;
            // Map button IDs to category names
            const categoryMap = {
                'btnGames': 'game',
                'btnSeries': 'series', 
                'btnMovies': 'movie',
                'btnGamesNew': 'game_new',
                'btnSeriesNew': 'series_new',
                'btnMoviesNew': 'movie_new'
            };
            
            if (categoryMap[btnId]) {
                return categoryMap[btnId];
            }
        }
        
        // Try to get from the current mediaData if available
        if (typeof mediaData !== 'undefined' && mediaData.length > 0) {
            const categories = [...new Set(mediaData.map(item => item.category))];
            if (categories.length === 1) {
                return categories[0];
            }
        }
        
        // If no specific category is active, show available categories
        if (typeof mediaData !== 'undefined' && mediaData.length > 0) {
            const categories = [...new Set(mediaData.map(item => item.category))];
            this.log(`Available categories: ${categories.join(', ')}`, 'info');
            this.log('Please select a specific category using the sidebar navigation first.', 'warning');
        }
        
        return null;
    }

    checkAuthStatus() {
        this.log('Checking authentication status...', 'info');
        
        const authHeaders = this.getAuthHeaders();
        const details = `
AuthToken available: ${typeof authToken !== 'undefined' && !!authToken}
CurrentUser available: ${!!currentUser}
CurrentUser token: ${currentUser ? !!currentUser.token : 'N/A'}
Auth headers: ${authHeaders ? 'Available' : 'Not available'}
        `;
        
        if (authHeaders) {
            this.log('Authentication status: OK', 'success', details);
        } else {
            this.log('Authentication status: FAILED', 'error', details);
        }
    }
}

// Initialize debug console when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.debugConsole = new DebugConsole();
});
