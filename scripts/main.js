/**
 * Clearance Preview Add-In
 * Displays all security clearances and shows a MyGeotab-style preview of access permissions
 */

// Mock data for standalone demo mode
const MOCK_CLEARANCES = [
    {
        id: 'groupSecurityAdministrator',
        name: 'Administrator',
        comments: 'Full system access with all permissions enabled',
        securityFilters: [] // Empty = full access
    },
    {
        id: 'groupSecuritySupervisor',
        name: 'Supervisor',
        comments: 'Can manage drivers and view reports',
        securityFilters: [
            { securityIdentifier: 'ViewMap' },
            { securityIdentifier: 'DeviceList' },
            { securityIdentifier: 'TripsActivityReport' },
            { securityIdentifier: 'ExceptionsList' },
            { securityIdentifier: 'ZoneList' },
            { securityIdentifier: 'RouteList' },
            { securityIdentifier: 'EngineStatusDataGraph' },
            { securityIdentifier: 'FuelUsageReport' },
            { securityIdentifier: 'MaintenanceReminders' },
            { securityIdentifier: 'RiskManagement' },
            { securityIdentifier: 'DriverSafetyScorecard' },
            { securityIdentifier: 'SustainabilityReport' }
        ]
    },
    {
        id: 'groupSecurityDriver',
        name: 'Driver',
        comments: 'Limited access for drivers - view only',
        securityFilters: [
            { securityIdentifier: 'ViewMap' },
            { securityIdentifier: 'TripsActivityReport' },
            { securityIdentifier: 'HOSLogs' }
        ]
    },
    {
        id: 'groupSecurityViewOnly',
        name: 'View Only',
        comments: 'Read-only access to maps and basic reports',
        securityFilters: [
            { securityIdentifier: 'ViewMap' },
            { securityIdentifier: 'DeviceList' },
            { securityIdentifier: 'TripsActivityReport' },
            { securityIdentifier: 'Dashboard' }
        ]
    },
    {
        id: 'groupSecurityMaintenance',
        name: 'Maintenance',
        comments: 'Access to engine and maintenance features',
        securityFilters: [
            { securityIdentifier: 'ViewMap' },
            { securityIdentifier: 'DeviceList' },
            { securityIdentifier: 'EngineStatusDataGraph' },
            { securityIdentifier: 'EngineFaults' },
            { securityIdentifier: 'MaintenanceReminders' },
            { securityIdentifier: 'MaintenanceSchedule' },
            { securityIdentifier: 'ServiceHistory' }
        ]
    },
    {
        id: 'groupSecuritySafety',
        name: 'Safety Manager',
        comments: 'Access to safety and compliance features',
        securityFilters: [
            { securityIdentifier: 'ViewMap' },
            { securityIdentifier: 'DeviceList' },
            { securityIdentifier: 'CollisionRisk' },
            { securityIdentifier: 'RiskManagement' },
            { securityIdentifier: 'DriverSafetyScorecard' },
            { securityIdentifier: 'ExceptionsList' },
            { securityIdentifier: 'HOSLogs' },
            { securityIdentifier: 'DVIRLogs' },
            { securityIdentifier: 'Tachograph' }
        ]
    }
];

// Check if running inside MyGeotab or standalone
const isStandalone = typeof geotab === 'undefined';

// MyGeotab navigation structure - matches actual MyGeotab pillars and menu items
// Based on MyGeotab Product Guide and SDK documentation
const navigationStructure = [
    {
        name: 'Dashboard',
        icon: '📊',
        securityId: 'Dashboard',
        children: []
    },
    {
        name: 'Map',
        icon: '🗺️',
        securityId: 'ViewMap',
        children: []
    },
    {
        name: 'Assets',
        icon: '🚗',
        securityId: 'DeviceList',
        children: [
            { name: 'Vehicles', securityId: 'DeviceList' },
            { name: 'Trailers', securityId: 'DeviceList' },
            { name: 'Add Asset', securityId: 'DeviceAdmin' }
        ]
    },
    {
        name: 'Productivity',
        icon: '📈',
        securityId: 'TripsActivityReport',
        children: [
            { name: 'Trips History', securityId: 'TripsActivityReport' },
            { name: 'Routes', securityId: 'RouteList' },
            { name: 'Zones', securityId: 'ZoneList' },
            { name: 'Zone Visits', securityId: 'ZoneList' },
            { name: 'Speed Profile', securityId: 'SpeedProfileReport' },
            { name: 'Driver Congregation', securityId: 'DriverCongregation' }
        ]
    },
    {
        name: 'Safety',
        icon: '🛡️',
        securityId: 'RiskManagement',
        children: [
            { name: 'Collision Risk', securityId: 'CollisionRisk' },
            { name: 'Risk Management', securityId: 'RiskManagement' },
            { name: 'Driver Safety Scorecard', securityId: 'DriverSafetyScorecard' },
            { name: 'Exceptions', securityId: 'ExceptionsList' },
            { name: 'Aggressive Driving', securityId: 'AggressiveDriving' }
        ]
    },
    {
        name: 'Compliance',
        icon: '✅',
        securityId: 'HOSLogs',
        children: [
            { name: 'HOS Logs', securityId: 'HOSLogs' },
            { name: 'HOS Availability', securityId: 'HOSAvailability' },
            { name: 'DVIR Logs', securityId: 'DVIRLogs' },
            { name: 'Tachograph', securityId: 'Tachograph' },
            { name: 'IFTA/Fuel Tax', securityId: 'FuelTaxReport' },
            { name: 'Emissions Diagnostics', securityId: 'EmissionsDiagnostics' }
        ]
    },
    {
        name: 'Maintenance',
        icon: '🔧',
        securityId: 'MaintenanceReminders',
        children: [
            { name: 'Engine Status', securityId: 'EngineStatusDataGraph' },
            { name: 'Engine Faults', securityId: 'EngineFaults' },
            { name: 'Maintenance Reminders', securityId: 'MaintenanceReminders' },
            { name: 'Maintenance Schedule', securityId: 'MaintenanceSchedule' },
            { name: 'Service History', securityId: 'ServiceHistory' }
        ]
    },
    {
        name: 'Fuel & Energy',
        icon: '⛽',
        securityId: 'FuelUsageReport',
        children: [
            { name: 'Fuel Usage', securityId: 'FuelUsageReport' },
            { name: 'Fuel Economy', securityId: 'FuelEconomy' },
            { name: 'EV Battery Status', securityId: 'EVBatteryStatus' },
            { name: 'Charging Sessions', securityId: 'EVChargingSessions' },
            { name: 'Charge Monitoring', securityId: 'ChargeMonitoring' }
        ]
    },
    {
        name: 'Sustainability',
        icon: '🌱',
        securityId: 'SustainabilityReport',
        children: [
            { name: 'Sustainability Center', securityId: 'SustainabilityCenter' },
            { name: 'Sustainability Overview', securityId: 'SustainabilityReport' },
            { name: 'Emissions Report', securityId: 'EmissionsReport' },
            { name: 'Electrification Potential', securityId: 'ElectrificationPotential' },
            { name: 'Idling Trends', securityId: 'IdlingTrends' }
        ]
    },
    {
        name: 'Rules & Groups',
        icon: '📋',
        securityId: 'RuleList',
        children: [
            { name: 'Rules', securityId: 'RuleList' },
            { name: 'Groups', securityId: 'GroupList' },
            { name: 'Exception Rules', securityId: 'ExceptionRules' }
        ]
    },
    {
        name: 'Administration',
        icon: '⚙️',
        securityId: 'UserList',
        children: [
            { name: 'Users', securityId: 'UserList' },
            { name: 'Drivers', securityId: 'DriverList' },
            { name: 'Clearances', securityId: 'SecurityClearanceList' },
            { name: 'System Settings', securityId: 'SystemSettings' },
            { name: 'Add-Ins', securityId: 'ManageAddinsClearance' },
            { name: 'Audit Log', securityId: 'AuditLog' }
        ]
    }
];

// Shared state
let api = null;
let state = null;
let clearances = [];
let securityIdentifiers = [];

/**
 * Fetch clearances - uses mock data in standalone mode
 */
function fetchClearances() {
    const loading = document.getElementById('loading');
    const clearanceList = document.getElementById('clearance-list');
    const errorMessage = document.getElementById('error-message');

    loading.style.display = 'flex';
    clearanceList.innerHTML = '';
    errorMessage.style.display = 'none';

    if (isStandalone) {
        // Demo mode - use mock data
        setTimeout(() => {
            clearances = MOCK_CLEARANCES;
            loading.style.display = 'none';
            renderClearances();
            showDemoBanner();
        }, 500); // Simulate loading
        return;
    }

    // Real MyGeotab mode - get security clearances from users
    console.log('Fetching security clearances...');

    api.call('Get', {
        typeName: 'User',
        search: {}
    }, function (users) {
        console.log('Total users:', users.length);

        // Collect all unique security groups from all users
        const securityGroupMap = new Map();

        users.forEach(user => {
            if (user.securityGroups && user.securityGroups.length > 0) {
                user.securityGroups.forEach(sg => {
                    if (sg.id && !securityGroupMap.has(sg.id)) {
                        // Clean up name - remove ** wrapper
                        let name = sg.name || sg.id;
                        name = name.replace(/^\*\*/, '').replace(/\*\*$/, '');

                        // Make ID-based names more readable
                        if (name.startsWith('Group') && name.endsWith('SecurityId')) {
                            name = name.replace('Group', '').replace('SecurityId', '');
                            // Add spaces before capitals
                            name = name.replace(/([A-Z])/g, ' $1').trim();
                        }

                        securityGroupMap.set(sg.id, {
                            id: sg.id,
                            name: name,
                            comments: sg.comments || ''
                        });
                    }
                });
            }
        });

        clearances = Array.from(securityGroupMap.values());
        console.log('Security clearances found:', clearances.length);
        console.log('Clearances:', clearances);

        // Sort by name
        clearances.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        loading.style.display = 'none';
        renderClearances();

    }, function (error) {
        console.error('Failed to load users:', error);
        showError('Failed to load clearances: ' + error.message);
    });
}

/**
 * Show demo mode banner
 */
function showDemoBanner() {
    const existing = document.getElementById('demo-banner');
    if (existing) return;

    const banner = document.createElement('div');
    banner.id = 'demo-banner';
    banner.innerHTML = '🎭 <strong>Demo Mode</strong> - Showing sample clearances. Connect to MyGeotab for real data.';
    banner.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        text-align: center;
        font-size: 14px;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1001;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    document.body.prepend(banner);
    document.getElementById('app').style.paddingTop = '60px';
}

/**
 * Render the clearance cards
 */
function renderClearances() {
    const clearanceList = document.getElementById('clearance-list');

    if (clearances.length === 0) {
        clearanceList.innerHTML = '<p class="no-data">No clearances found.</p>';
        return;
    }

    clearanceList.innerHTML = clearances.map(clearance => `
        <div class="clearance-card" onclick="showPreview('${clearance.id}')">
            <div class="clearance-icon">🔐</div>
            <div class="clearance-info">
                <h3>${escapeHtml(clearance.name)}</h3>
                <p class="clearance-id">ID: ${clearance.id}</p>
                ${clearance.comments ? `<p class="clearance-desc">${escapeHtml(clearance.comments)}</p>` : ''}
            </div>
            <div class="clearance-arrow">→</div>
        </div>
    `).join('');
}

/**
 * Show the preview modal for a specific clearance
 */
window.showPreview = function (clearanceId) {
    const clearance = clearances.find(c => c.id === clearanceId);
    if (!clearance) return;

    if (isStandalone) {
        // Demo mode - use cached data directly
        openModal(clearance);
        return;
    }

    // Real mode - fetch full group details including securityFilters
    console.log('Fetching details for clearance:', clearanceId);

    api.call('Get', {
        typeName: 'Group',
        search: { id: clearanceId },
        propertySelector: {
            fields: ['id', 'name', 'comments', 'securityFilters', 'children']
        }
    }, function (result) {
        if (result && result.length > 0) {
            const fullClearance = result[0];
            console.log('Full clearance data:', fullClearance);

            // Clean up name
            fullClearance.name = (fullClearance.name || clearanceId).replace(/^\*\*/, '').replace(/\*\*$/, '');

            openModal(fullClearance);
        } else {
            openModal(clearance);
        }
    }, function (error) {
        console.error('Error fetching clearance details:', error);
        openModal(clearance);
    });
};

/**
 * Open the preview modal with clearance data
 */
function openModal(clearance) {
    const modal = document.getElementById('preview-modal');
    const modalTitle = document.getElementById('modal-title');
    const navPreview = document.getElementById('nav-preview');
    const accessSummary = document.getElementById('access-summary');
    const featureList = document.getElementById('feature-list');

    modalTitle.textContent = clearance.name + ' - Access Preview';

    // Get security filters for this clearance
    const securityFilters = clearance.securityFilters || [];
    const allowedFeatures = new Set();

    securityFilters.forEach(filter => {
        if (filter.securityIdentifier) {
            allowedFeatures.add(filter.securityIdentifier);
        }
    });

    const isFullAccess = securityFilters.length === 0;

    // Render navigation preview
    navPreview.innerHTML = navigationStructure.map(navItem => {
        const hasAccess = isFullAccess || allowedFeatures.has(navItem.securityId);
        const accessClass = hasAccess ? 'has-access' : 'no-access';

        let childrenHtml = '';
        if (navItem.children.length > 0) {
            childrenHtml = '<ul class="nav-children">' +
                navItem.children.map(child => {
                    const childHasAccess = isFullAccess || allowedFeatures.has(child.securityId);
                    const childClass = childHasAccess ? 'has-access' : 'no-access';
                    return `<li class="${childClass}">
                        ${child.name}
                        ${childHasAccess ? '<span class="child-badge">✓</span>' : '<span class="child-denied">✕</span>'}
                    </li>`;
                }).join('') +
                '</ul>';
        }

        return `
            <li class="nav-item ${accessClass}">
                <span class="nav-icon">${navItem.icon}</span>
                <span class="nav-name">${navItem.name}</span>
                ${hasAccess ? '<span class="access-badge">✓</span>' : '<span class="denied-badge">✕</span>'}
                ${childrenHtml}
            </li>
        `;
    }).join('');

    // Calculate access stats
    let totalFeatures = 0;
    let accessibleCount = 0;
    navigationStructure.forEach(item => {
        totalFeatures++;
        if (isFullAccess || allowedFeatures.has(item.securityId)) accessibleCount++;
        item.children.forEach(child => {
            totalFeatures++;
            if (isFullAccess || allowedFeatures.has(child.securityId)) accessibleCount++;
        });
    });
    const accessPercentage = Math.round((accessibleCount / totalFeatures) * 100);

    // Render access summary
    accessSummary.innerHTML = `
        <div class="summary-stats">
            <div class="stat">
                <span class="stat-value">${isFullAccess ? 'All' : accessibleCount}</span>
                <span class="stat-label">Features Allowed</span>
            </div>
            <div class="stat">
                <span class="stat-value">${accessPercentage}%</span>
                <span class="stat-label">Access Level</span>
            </div>
            <div class="stat ${isFullAccess ? 'stat-full' : ''}">
                <span class="stat-value">${isFullAccess ? '👑' : '🔒'}</span>
                <span class="stat-label">${isFullAccess ? 'Full Access' : 'Restricted'}</span>
            </div>
        </div>
        <p class="clearance-name"><strong>Clearance:</strong> ${escapeHtml(clearance.name)}</p>
        ${clearance.comments ? `<p class="clearance-comments"><strong>Description:</strong> ${escapeHtml(clearance.comments)}</p>` : ''}
    `;

    // Render feature list
    if (securityFilters.length > 0) {
        featureList.innerHTML = `
            <div class="feature-grid">
                ${securityFilters.map(filter => `
                    <div class="feature-item allowed">
                        <span class="feature-icon">✓</span>
                        <span class="feature-name">${filter.securityIdentifier || 'Unknown'}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        featureList.innerHTML = '<p class="full-access">👑 This clearance has full access to all features.</p>';
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the preview modal
 */
window.closeModal = function () {
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('open');
    document.body.style.overflow = '';
};

/**
 * Show error message
 */
function showError(message) {
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    loading.style.display = 'none';
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Set up event listeners (called after DOM is ready)
 */
function setupEventListeners() {
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    const modal = document.getElementById('preview-modal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
}

// Initialize based on mode
console.log('Clearance Preview: isStandalone =', isStandalone);
console.log('Clearance Preview: geotab object =', typeof geotab);

if (isStandalone) {
    // Standalone demo mode - auto-initialize
    console.log('Clearance Preview: Running in DEMO mode');
    document.addEventListener('DOMContentLoaded', function () {
        setupEventListeners();
        fetchClearances();
    });
} else {
    // MyGeotab mode - register add-in
    console.log('Clearance Preview: Registering with MyGeotab');
    geotab.addin.clearancePreview = function () {
        'use strict';

        return {
            initialize: function (freshApi, freshState, initializeCallback) {
                console.log('Clearance Preview: initialize() called');
                api = freshApi;
                state = freshState;
                setupEventListeners();
                initializeCallback();
            },

            focus: function (freshApi, freshState) {
                console.log('Clearance Preview: focus() called');
                api = freshApi;
                state = freshState;
                fetchClearances();
            },

            blur: function () {
                console.log('Clearance Preview: blur() called');
                closeModal();
            }
        };
    };
}
