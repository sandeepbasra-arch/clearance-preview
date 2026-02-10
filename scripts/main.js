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
// securityIds is an array of patterns to match against security identifiers
// Uses partial matching (case-insensitive) to handle varying naming conventions
const navigationStructure = [
    {
        name: 'Dashboard',
        icon: '📊',
        securityIds: ['Dashboard'],
        children: []
    },
    {
        name: 'Map',
        icon: '🗺️',
        securityIds: ['Map', 'ViewMap', 'LiveMap', 'AdministerLiveMap'],
        children: []
    },
    {
        name: 'Assets',
        icon: '🚗',
        securityIds: ['Device', 'Asset', 'Vehicle', 'Trailer'],
        children: [
            { name: 'Vehicles', securityIds: ['Device', 'Vehicle'] },
            { name: 'Trailers', securityIds: ['Trailer', 'Device'] },
            { name: 'Add Asset', securityIds: ['DeviceAdmin'] }
        ]
    },
    {
        name: 'Productivity',
        icon: '📈',
        securityIds: ['Trip', 'Route', 'Zone', 'Productivity'],
        children: [
            { name: 'Trips History', securityIds: ['Trip'] },
            { name: 'Routes', securityIds: ['Route'] },
            { name: 'Zones', securityIds: ['Zone'] },
            { name: 'Zone Visits', securityIds: ['Zone'] },
            { name: 'Speed Profile', securityIds: ['Speed', 'Trip'] },
            { name: 'Driver Congregation', securityIds: ['Congregation', 'Driver'] }
        ]
    },
    {
        name: 'Safety',
        icon: '🛡️',
        securityIds: ['Safety', 'Risk', 'Exception', 'Collision'],
        children: [
            { name: 'Collision Risk', securityIds: ['Collision', 'Risk'] },
            { name: 'Risk Management', securityIds: ['Risk'] },
            { name: 'Driver Safety Scorecard', securityIds: ['Safety', 'Scorecard', 'Driver'] },
            { name: 'Exceptions', securityIds: ['Exception'] },
            { name: 'Aggressive Driving', securityIds: ['Aggressive', 'Driving'] }
        ]
    },
    {
        name: 'Video',
        icon: '🎥',
        securityIds: ['Video', 'Camera', 'Media', 'Footage'],
        children: [
            { name: 'Video Events', securityIds: ['Video', 'Event'] },
            { name: 'Live Video', securityIds: ['Video', 'Live', 'Stream'] },
            { name: 'Video Requests', securityIds: ['Video', 'Request'] },
            { name: 'Camera Health', securityIds: ['Camera', 'Health'] }
        ]
    },
    {
        name: 'Compliance',
        icon: '✅',
        securityIds: ['HOS', 'DVIR', 'Tachograph', 'Compliance', 'FuelTax', 'IFTA'],
        children: [
            { name: 'HOS Logs', securityIds: ['HOS'] },
            { name: 'HOS Availability', securityIds: ['HOS'] },
            { name: 'DVIR Logs', securityIds: ['DVIR'] },
            { name: 'Tachograph', securityIds: ['Tachograph'] },
            { name: 'IFTA/Fuel Tax', securityIds: ['FuelTax', 'IFTA'] },
            { name: 'Emissions Diagnostics', securityIds: ['Emission'] }
        ]
    },
    {
        name: 'Maintenance',
        icon: '🔧',
        securityIds: ['Maintenance', 'Engine', 'Service', 'Diagnostic'],
        children: [
            { name: 'Engine Status', securityIds: ['Engine', 'Status'] },
            { name: 'Engine Faults', securityIds: ['Engine', 'Fault'] },
            { name: 'Maintenance Reminders', securityIds: ['Maintenance'] },
            { name: 'Maintenance Schedule', securityIds: ['Maintenance'] },
            { name: 'Service History', securityIds: ['Service', 'Maintenance'] }
        ]
    },
    {
        name: 'Fuel & Energy',
        icon: '⛽',
        securityIds: ['Fuel', 'Energy', 'EV', 'Charge', 'Battery'],
        children: [
            { name: 'Fuel Usage', securityIds: ['Fuel'] },
            { name: 'Fuel Economy', securityIds: ['Fuel', 'Economy'] },
            { name: 'EV Battery Status', securityIds: ['EV', 'Battery'] },
            { name: 'Charging Sessions', securityIds: ['Charge', 'EV'] },
            { name: 'Charge Monitoring', securityIds: ['Charge', 'TimeToCharge'] }
        ]
    },
    {
        name: 'Sustainability',
        icon: '🌱',
        securityIds: ['Sustainability', 'Emission', 'Electrification', 'Idling'],
        children: [
            { name: 'Sustainability Center', securityIds: ['Sustainability'] },
            { name: 'Sustainability Overview', securityIds: ['Sustainability'] },
            { name: 'Emissions Report', securityIds: ['Emission'] },
            { name: 'Electrification Potential', securityIds: ['Electrification', 'EV'] },
            { name: 'Idling Trends', securityIds: ['Idling'] }
        ]
    },
    {
        name: 'Rules & Groups',
        icon: '📋',
        securityIds: ['Rule', 'Group', 'Exception'],
        children: [
            { name: 'Rules', securityIds: ['Rule'] },
            { name: 'Groups', securityIds: ['Group'] },
            { name: 'Exception Rules', securityIds: ['Exception', 'Rule'] }
        ]
    },
    {
        name: 'Reports',
        icon: '📄',
        securityIds: ['Report', 'Export', 'Download', 'Schedule'],
        children: [
            { name: 'Report Builder', securityIds: ['Report', 'Builder', 'Custom'] },
            { name: 'Scheduled Reports', securityIds: ['Report', 'Schedule'] },
            { name: 'Excel Reports', securityIds: ['Report', 'Excel', 'Export'] },
            { name: 'Dashboard Reports', securityIds: ['Report', 'Dashboard'] }
        ]
    },
    {
        name: 'Administration',
        icon: '⚙️',
        securityIds: ['User', 'Driver', 'Security', 'Admin', 'Addin', 'Audit', 'System'],
        children: [
            { name: 'Users', securityIds: ['User'] },
            { name: 'Drivers', securityIds: ['Driver'] },
            { name: 'Clearances', securityIds: ['Security', 'Clearance'] },
            { name: 'System Settings', securityIds: ['System', 'Setting'] },
            { name: 'Add-Ins', securityIds: ['Addin'] },
            { name: 'Audit Log', securityIds: ['Audit'] }
        ]
    }
];

/**
 * Check if a security identifier matches any of the patterns
 * Uses case-insensitive partial matching
 */
function matchesSecurityPattern(securityId, patterns) {
    const idLower = securityId.toLowerCase();
    return patterns.some(pattern => idLower.includes(pattern.toLowerCase()));
}

/**
 * Check if any allowed feature matches the patterns for a nav item
 */
function hasAccessToNavItem(allowedFeatures, patterns) {
    for (const feature of allowedFeatures) {
        if (matchesSecurityPattern(feature, patterns)) {
            return true;
        }
    }
    return false;
}

// Key security features organized by category - used to show enabled vs disabled
const keySecurityFeatures = [
    // Map & Dashboard
    { id: 'Dashboard', name: 'Dashboard', category: 'Core' },
    { id: 'Map', name: 'Map View', category: 'Core' },
    { id: 'LiveMap', name: 'Live Map', category: 'Core' },

    // Assets & Devices
    { id: 'DeviceList', name: 'View Devices', category: 'Assets' },
    { id: 'DeviceAdmin', name: 'Manage Devices', category: 'Assets' },
    { id: 'DeviceAdminAdvanced', name: 'Advanced Device Admin', category: 'Assets' },

    // Productivity
    { id: 'Trip', name: 'Trips', category: 'Productivity' },
    { id: 'Route', name: 'Routes', category: 'Productivity' },
    { id: 'Zone', name: 'Zones', category: 'Productivity' },

    // Safety
    { id: 'Exception', name: 'Exceptions', category: 'Safety' },
    { id: 'Risk', name: 'Risk Management', category: 'Safety' },
    { id: 'Collision', name: 'Collision Detection', category: 'Safety' },

    // Video
    { id: 'Video', name: 'Video Access', category: 'Video' },
    { id: 'Camera', name: 'Camera Management', category: 'Video' },
    { id: 'Media', name: 'Media Files', category: 'Video' },

    // Compliance
    { id: 'HOS', name: 'Hours of Service', category: 'Compliance' },
    { id: 'DVIR', name: 'DVIR Logs', category: 'Compliance' },
    { id: 'Tachograph', name: 'Tachograph', category: 'Compliance' },

    // Maintenance
    { id: 'Engine', name: 'Engine Data', category: 'Maintenance' },
    { id: 'Maintenance', name: 'Maintenance', category: 'Maintenance' },
    { id: 'Diagnostic', name: 'Diagnostics', category: 'Maintenance' },

    // Fuel & Energy
    { id: 'Fuel', name: 'Fuel Management', category: 'Fuel & Energy' },
    { id: 'EV', name: 'Electric Vehicles', category: 'Fuel & Energy' },
    { id: 'Charge', name: 'Charging', category: 'Fuel & Energy' },

    // Sustainability
    { id: 'Sustainability', name: 'Sustainability', category: 'Sustainability' },
    { id: 'Emission', name: 'Emissions', category: 'Sustainability' },
    { id: 'Idling', name: 'Idling Reports', category: 'Sustainability' },

    // Reports
    { id: 'Report', name: 'Reports', category: 'Reports' },
    { id: 'Export', name: 'Data Export', category: 'Reports' },
    { id: 'Schedule', name: 'Scheduled Reports', category: 'Reports' },

    // Administration
    { id: 'User', name: 'User Management', category: 'Admin' },
    { id: 'Driver', name: 'Driver Management', category: 'Admin' },
    { id: 'Group', name: 'Group Management', category: 'Admin' },
    { id: 'Rule', name: 'Rule Management', category: 'Admin' },
    { id: 'Audit', name: 'Audit Logs', category: 'Admin' },
    { id: 'Addin', name: 'Add-In Management', category: 'Admin' },
    { id: 'Security', name: 'Security Settings', category: 'Admin' }
];

/**
 * Check if a feature is enabled based on allowed features
 */
function isFeatureEnabled(allowedFeatures, featureId) {
    for (const feature of allowedFeatures) {
        if (feature.toLowerCase().includes(featureId.toLowerCase())) {
            return true;
        }
    }
    return false;
}

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

    // Real MyGeotab mode - get security clearances from users, then fetch full details
    console.log('Fetching security clearances...');

    api.call('Get', {
        typeName: 'User',
        search: {}
    }, function (users) {
        console.log('Total users:', users.length);

        // Collect all unique security group IDs from all users
        const securityGroupIds = [];
        const seenIds = new Set();

        users.forEach(user => {
            if (user.securityGroups && user.securityGroups.length > 0) {
                user.securityGroups.forEach(sg => {
                    if (sg.id && !seenIds.has(sg.id)) {
                        seenIds.add(sg.id);
                        securityGroupIds.push(sg.id);
                    }
                });
            }
        });

        console.log('Unique security group IDs:', securityGroupIds.length);

        // Build multicall to fetch all group details at once
        const calls = securityGroupIds.map(id => ['Get', { typeName: 'Group', search: { id: id } }]);

        api.multiCall(calls, function (results) {
            console.log('Multicall results:', results.length);

            clearances = [];
            results.forEach((result, index) => {
                if (result && result.length > 0) {
                    const group = result[0];
                    // Clean up name
                    let name = group.name || securityGroupIds[index];
                    name = name.replace(/^\*\*/, '').replace(/\*\*$/, '');

                    // Make built-in security IDs more readable
                    if (name.startsWith('Group') && name.endsWith('SecurityId')) {
                        name = name.replace('Group', '').replace('SecurityId', '');
                        name = name.replace(/([A-Z])/g, ' $1').trim();
                    }

                    clearances.push({
                        ...group,
                        name: name
                    });
                }
            });

            console.log('Clearances with names:', clearances.map(c => ({ id: c.id, name: c.name })));

            // Sort by name
            clearances.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            loading.style.display = 'none';
            renderClearances();

        }, function (error) {
            console.error('Failed to fetch group details:', error);
            showError('Failed to load clearance details: ' + error.message);
        });

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

    // Determine access level
    // GroupEverythingSecurityId or "Everything" filter = full access
    // GroupNothingSecurityId = no access
    const clearanceIdLower = (clearance.id || '').toLowerCase();
    const clearanceNameLower = (clearance.name || '').toLowerCase();

    const isFullAccess = clearanceIdLower === 'groupeverythingsecurityid' ||
                         clearanceIdLower.includes('everything') ||
                         clearanceNameLower.includes('everything') ||
                         allowedFeatures.has('Everything') ||
                         allowedFeatures.has('EverythingSecurity');

    const isNoAccess = clearanceIdLower === 'groupnothingsecurityid' ||
                       clearanceIdLower.includes('nothing') ||
                       clearanceNameLower.includes('nothing') ||
                       allowedFeatures.has('Nothing') ||
                       allowedFeatures.has('NothingSecurity');

    console.log('Clearance:', clearance.name, 'isFullAccess:', isFullAccess, 'isNoAccess:', isNoAccess);
    console.log('Security filters:', securityFilters);
    console.log('Allowed features:', Array.from(allowedFeatures));

    // Render navigation preview using pattern-based matching
    // isNoAccess overrides everything - if true, no access to anything
    navPreview.innerHTML = navigationStructure.map(navItem => {
        const hasAccess = !isNoAccess && (isFullAccess || hasAccessToNavItem(allowedFeatures, navItem.securityIds));
        const accessClass = hasAccess ? 'has-access' : 'no-access';

        let childrenHtml = '';
        if (navItem.children.length > 0) {
            childrenHtml = '<ul class="nav-children">' +
                navItem.children.map(child => {
                    const childHasAccess = !isNoAccess && (isFullAccess || hasAccessToNavItem(allowedFeatures, child.securityIds));
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

    // Calculate access stats using pattern-based matching
    // isNoAccess means 0 access to everything
    let totalFeatures = 0;
    let accessibleCount = 0;
    navigationStructure.forEach(item => {
        totalFeatures++;
        if (!isNoAccess && (isFullAccess || hasAccessToNavItem(allowedFeatures, item.securityIds))) accessibleCount++;
        item.children.forEach(child => {
            totalFeatures++;
            if (!isNoAccess && (isFullAccess || hasAccessToNavItem(allowedFeatures, child.securityIds))) accessibleCount++;
        });
    });
    const accessPercentage = Math.round((accessibleCount / totalFeatures) * 100);

    // Render access summary
    // Determine the access type label and icon
    let accessIcon, accessLabel, statClass;
    if (isNoAccess) {
        accessIcon = '🚫';
        accessLabel = 'No Access';
        statClass = 'stat-none';
    } else if (isFullAccess) {
        accessIcon = '👑';
        accessLabel = 'Full Access';
        statClass = 'stat-full';
    } else {
        accessIcon = '🔒';
        accessLabel = 'Restricted';
        statClass = '';
    }

    accessSummary.innerHTML = `
        <div class="summary-stats">
            <div class="stat">
                <span class="stat-value">${isFullAccess ? 'All' : (isNoAccess ? '0' : accessibleCount)}</span>
                <span class="stat-label">Features Allowed</span>
            </div>
            <div class="stat">
                <span class="stat-value">${isNoAccess ? '0' : accessPercentage}%</span>
                <span class="stat-label">Access Level</span>
            </div>
            <div class="stat ${statClass}">
                <span class="stat-value">${accessIcon}</span>
                <span class="stat-label">${accessLabel}</span>
            </div>
        </div>
        <p class="clearance-name"><strong>Clearance:</strong> ${escapeHtml(clearance.name)}</p>
        ${clearance.comments ? `<p class="clearance-comments"><strong>Description:</strong> ${escapeHtml(clearance.comments)}</p>` : ''}
    `;

    // Render feature list - show both enabled (green) and disabled (red)
    if (isNoAccess) {
        // Show all features as disabled
        const categories = [...new Set(keySecurityFeatures.map(f => f.category))];
        featureList.innerHTML = `
            <p class="no-access-message">🚫 This clearance has no access to any features.</p>
            <div class="feature-categories">
                ${categories.map(category => `
                    <div class="feature-category">
                        <h4>${category}</h4>
                        <div class="feature-grid">
                            ${keySecurityFeatures.filter(f => f.category === category).map(feature => `
                                <div class="feature-item denied">
                                    <span class="feature-icon">✕</span>
                                    <span class="feature-name">${feature.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (isFullAccess) {
        // Show all features as enabled
        const categories = [...new Set(keySecurityFeatures.map(f => f.category))];
        featureList.innerHTML = `
            <p class="full-access">👑 This clearance has full access to all features.</p>
            <div class="feature-categories">
                ${categories.map(category => `
                    <div class="feature-category">
                        <h4>${category}</h4>
                        <div class="feature-grid">
                            ${keySecurityFeatures.filter(f => f.category === category).map(feature => `
                                <div class="feature-item allowed">
                                    <span class="feature-icon">✓</span>
                                    <span class="feature-name">${feature.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        // Show mixed enabled/disabled based on security filters
        const categories = [...new Set(keySecurityFeatures.map(f => f.category))];
        featureList.innerHTML = `
            <div class="feature-categories">
                ${categories.map(category => {
                    const categoryFeatures = keySecurityFeatures.filter(f => f.category === category);
                    return `
                        <div class="feature-category">
                            <h4>${category}</h4>
                            <div class="feature-grid">
                                ${categoryFeatures.map(feature => {
                                    const enabled = isFeatureEnabled(allowedFeatures, feature.id);
                                    return `
                                        <div class="feature-item ${enabled ? 'allowed' : 'denied'}">
                                            <span class="feature-icon">${enabled ? '✓' : '✕'}</span>
                                            <span class="feature-name">${feature.name}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
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

    // Create the add-in handler function
    const createAddinHandler = function () {
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

    // Register both stable and dev versions
    geotab.addin.clearancePreview = createAddinHandler;
    geotab.addin.clearancePreviewDev = createAddinHandler;
}
