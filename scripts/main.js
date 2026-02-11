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
 * Parse a permission name into its feature component
 * Handles formats like:
 * - SecurityIdViewHOSLogsId -> ViewHOSLogs
 * - SecurityIdManageMediaId -> ManageMedia
 * - ViewSecurityId -> (meta permission, skip)
 * - ViewMap -> ViewMap
 */
function parsePermissionName(name) {
    if (!name) return null;

    // Skip meta permissions that don't grant feature access
    if (name === 'ViewSecurityId' || name === 'SecurityId') {
        return null;
    }

    // Parse SecurityId<Action><Feature>Id format
    if (name.startsWith('SecurityId') && name.endsWith('Id')) {
        return name.replace(/^SecurityId/, '').replace(/Id$/, '');
    }

    // Parse Group<Feature>SecurityId format
    if (name.startsWith('Group') && name.endsWith('SecurityId')) {
        return name.replace(/^Group/, '').replace(/SecurityId$/, '');
    }

    return name;
}

/**
 * Map parsed permission names to nav item keywords
 * More specific than partial matching
 */
const permissionToNavMapping = {
    // HOS
    'ViewHOSLogs': ['HOS'],
    'ManageHOSLogs': ['HOS'],
    // DVIR
    'ViewDVIRLogs': ['DVIR'],
    'ManageDVIRLogs': ['DVIR'],
    'CertifyDVIR': ['DVIR'],
    'RepairDVIR': ['DVIR'],
    'InspectDVIR': ['DVIR'],
    // Media/Video
    'ViewMedia': ['Video', 'Media'],
    'ManageMedia': ['Video', 'Media'],
    // Shipments
    'ViewShipments': ['Shipment'],
    'ManageShipments': ['Shipment'],
    // Trailers
    'ViewTrailers': ['Trailer'],
    'ManageTrailers': ['Trailer'],
    // Routes
    'ViewRoute': ['Route'],
    'ViewAdvancedRoute': ['Route'],
    // Driver
    'ViewDriverAnalytics': ['Driver'],
    'ViewDriverClockInOut': ['Driver'],
    // Risk
    'ViewRiskManagementReportOption': ['Risk'],
    'RiskAnalyticsViewAndDownloadAssetAndDriverReports': ['Risk', 'Safety'],
    // Vehicle Analytics
    'ViewVehicleAnalytics': ['Vehicle', 'Asset'],
    // Coaching
    'ViewCoachingSession': ['Safety', 'Driver'],
    // EV
    'ViewEVPerformanceData': ['EV', 'Electric'],
    // Add-ins
    'LaunchAddIn': ['Addin'],
    'ViewAddInData': ['Addin'],
    'ManageAddInData': ['Addin'],
    // Navigation
    'ViewNavigation': ['Map'],
    // Exceptions
    'ExceptionEventReviewParticipant': ['Exception'],
    // Map
    'ViewMap': ['Map'],
    'AdministerLiveMap': ['Map'],
    // Dashboard
    'Dashboard': ['Dashboard'],
    // Trip
    'Trip': ['Trip'],
    'TripsActivityReport': ['Trip'],
    // Zone
    'Zone': ['Zone'],
    'ZoneList': ['Zone'],
    // Device
    'Device': ['Device', 'Vehicle', 'Asset'],
    'DeviceList': ['Device', 'Vehicle', 'Asset'],
    'DeviceAdmin': ['Device', 'Vehicle', 'Asset'],
    // Engine
    'Engine': ['Engine', 'Maintenance'],
    'EngineStatusDataGraph': ['Engine', 'Maintenance'],
    // Fuel
    'Fuel': ['Fuel'],
    'FuelUsageReport': ['Fuel'],
    // User/Admin
    'User': ['User'],
    'UserAdmin': ['User'],
    // Report
    'Report': ['Report'],
    // Sustainability
    'Sustainability': ['Sustainability'],
    'SustainabilityReport': ['Sustainability'],
    // Tachograph
    'Tachograph': ['Tachograph']
};

/**
 * Check if a permission grants access to a nav item
 */
function permissionGrantsAccess(permission, navPatterns) {
    // First try direct mapping
    const mappedKeywords = permissionToNavMapping[permission];
    if (mappedKeywords) {
        return navPatterns.some(pattern =>
            mappedKeywords.some(keyword =>
                keyword.toLowerCase() === pattern.toLowerCase()
            )
        );
    }

    // Fallback: check if permission name contains any nav pattern
    // But be more strict - require the pattern to be a word boundary
    const permLower = permission.toLowerCase();
    return navPatterns.some(pattern => {
        const patternLower = pattern.toLowerCase();
        // Check for exact word match or word boundary match
        const regex = new RegExp('\\b' + patternLower + '\\b', 'i');
        return regex.test(permLower);
    });
}

/**
 * Check if any allowed feature matches the patterns for a nav item
 */
function hasAccessToNavItem(allowedFeatures, patterns) {
    for (const feature of allowedFeatures) {
        // Parse the permission name
        const parsed = parsePermissionName(feature);
        if (parsed && permissionGrantsAccess(parsed, patterns)) {
            return true;
        }
        // Also check the raw feature name
        if (permissionGrantsAccess(feature, patterns)) {
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

    // Safety - matches left nav structure
    { id: 'Collision', name: 'Collision Risk', category: 'Safety' },
    { id: 'Risk', name: 'Risk Management', category: 'Safety' },
    { id: 'DriverSafety', name: 'Driver Safety Scorecard', category: 'Safety' },
    { id: 'Exception', name: 'Exceptions', category: 'Safety' },
    { id: 'Aggressive', name: 'Aggressive Driving', category: 'Safety' },

    // Video - matches left nav structure
    { id: 'VideoEvents', name: 'Video Events', category: 'Video' },
    { id: 'LiveVideo', name: 'Live Video', category: 'Video' },
    { id: 'VideoRequests', name: 'Video Requests', category: 'Video' },
    { id: 'CameraHealth', name: 'Camera Health', category: 'Video' },

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

    // Administration - matches left nav structure
    { id: 'User', name: 'Users', category: 'Admin' },
    { id: 'Driver', name: 'Drivers', category: 'Admin' },
    { id: 'Security', name: 'Clearances', category: 'Admin' },
    { id: 'System', name: 'System Settings', category: 'Admin' },
    { id: 'Addin', name: 'Add-Ins', category: 'Admin' },
    { id: 'Audit', name: 'Audit Log', category: 'Admin' }
];

/**
 * Check if a feature is enabled based on allowed features
 * Uses the same permission parsing and mapping as nav items
 */
function isFeatureEnabled(allowedFeatures, featureId) {
    for (const feature of allowedFeatures) {
        // Parse the permission name
        const parsed = parsePermissionName(feature);
        if (parsed && permissionGrantsAccess(parsed, [featureId])) {
            return true;
        }
        // Also check the raw feature name
        if (permissionGrantsAccess(feature, [featureId])) {
            return true;
        }
    }
    return false;
}

/**
 * Check if a feature is denied based on denied features
 */
function isFeatureDenied(deniedFeatures, featureId) {
    for (const denied of deniedFeatures) {
        if (denied.toLowerCase().includes(featureId.toLowerCase())) {
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
    // Also fetch the parent groups to understand inheritance
    console.log('Fetching details for clearance:', clearanceId);

    // Fetch the clearance and all built-in security groups
    api.multiCall([
        ['Get', { typeName: 'Group', search: { id: clearanceId } }],
        ['Get', { typeName: 'Group', search: { id: 'GroupEverythingSecurityId' } }],
        ['Get', { typeName: 'Group', search: { id: 'GroupSupervisorSecurityId' } }],
        ['Get', { typeName: 'Group', search: { id: 'GroupDriveUserSecurityId' } }],
        ['Get', { typeName: 'Group', search: { id: 'GroupUserSecurityId' } }],
        ['Get', { typeName: 'Group', search: { id: 'GroupViewOnlySecurityId' } }],
        ['Get', { typeName: 'Group', search: { id: 'GroupNothingSecurityId' } }]
    ], function (results) {
        const clearanceResult = results[0];
        const builtInGroups = {
            'GroupEverythingSecurityId': { group: results[1]?.[0], level: 'full' },
            'GroupSupervisorSecurityId': { group: results[2]?.[0], level: 'supervisor' },
            'GroupDriveUserSecurityId': { group: results[3]?.[0], level: 'drive' },
            'GroupUserSecurityId': { group: results[4]?.[0], level: 'user' },
            'GroupViewOnlySecurityId': { group: results[5]?.[0], level: 'viewonly' },
            'GroupNothingSecurityId': { group: results[6]?.[0], level: 'nothing' }
        };

        if (clearanceResult && clearanceResult.length > 0) {
            const fullClearance = clearanceResult[0];
            console.log('Full clearance data:', fullClearance);

            // Clean up name
            fullClearance.name = (fullClearance.name || clearanceId).replace(/^\*\*/, '').replace(/\*\*$/, '');

            // Find which built-in group this clearance is a child/grandchild of
            function findParentLevel(targetId) {
                for (const [builtInId, info] of Object.entries(builtInGroups)) {
                    if (!info.group) continue;

                    // Check direct children
                    const children = info.group.children || [];
                    for (const child of children) {
                        if (child.id === targetId) {
                            console.log(`Found ${targetId} as direct child of ${builtInId}`);
                            return { parentId: builtInId, level: info.level, depth: 1 };
                        }
                    }
                }

                // Check grandchildren (depth 2)
                for (const [builtInId, info] of Object.entries(builtInGroups)) {
                    if (!info.group) continue;

                    const children = info.group.children || [];
                    for (const child of children) {
                        // Fetch this child's children by checking if it's in another result
                        // For now, check if it's a custom clearance that might have children
                        if (child.children) {
                            for (const grandchild of child.children) {
                                if (grandchild.id === targetId) {
                                    console.log(`Found ${targetId} as grandchild of ${builtInId}`);
                                    return { parentId: builtInId, level: info.level, depth: 2 };
                                }
                            }
                        }
                    }
                }

                return null;
            }

            let parentInfo = findParentLevel(clearanceId);
            console.log('Parent info:', parentInfo);

            // Log the parent property to understand its structure
            console.log('Clearance parent property:', fullClearance.parent);

            // If not found as direct child, check the clearance's parent property
            // This handles grandchildren (e.g., Geotab Test → Company Car → GroupDriveUserSecurityId)
            // The parent might be an object with id, or just a string ID
            const parentRef = fullClearance.parent;
            const immediateParentId = parentRef ? (parentRef.id || (typeof parentRef === 'string' ? parentRef : null)) : null;

            if (!parentInfo && immediateParentId) {
                console.log('Checking immediate parent:', immediateParentId);

                // Check if immediate parent is a built-in group
                if (builtInGroups[immediateParentId]) {
                    parentInfo = {
                        parentId: immediateParentId,
                        level: builtInGroups[immediateParentId].level,
                        depth: 1
                    };
                    console.log('Immediate parent is built-in:', immediateParentId);
                } else {
                    // Check if immediate parent is a child of a built-in group
                    const grandparentInfo = findParentLevel(immediateParentId);
                    if (grandparentInfo) {
                        console.log('Found grandparent:', grandparentInfo);
                        parentInfo = {
                            parentId: grandparentInfo.parentId,
                            level: grandparentInfo.level,
                            depth: 2,
                            intermediateParentId: immediateParentId
                        };
                    }
                }
            }

            // Function to finalize and open modal
            function finalizeAndOpen() {
                console.log('Parent level:', fullClearance.parentLevel);
                console.log('Inherits full access:', fullClearance.inheritsFullAccess);
                openModal(fullClearance);
            }

            // Determine access level based on parent
            if (parentInfo) {
                fullClearance.parentLevel = parentInfo.level;
                fullClearance.parentId = parentInfo.parentId;
                fullClearance.inheritsFullAccess = parentInfo.level === 'full' || parentInfo.level === 'supervisor';

                // Get the parent group's securityFilters for non-full-access parents
                if (!fullClearance.inheritsFullAccess && builtInGroups[parentInfo.parentId]) {
                    const parentGroup = builtInGroups[parentInfo.parentId].group;
                    const builtInFilters = parentGroup?.securityFilters || [];

                    // If there's an intermediate parent (grandchild case), fetch its filters too
                    if (parentInfo.intermediateParentId) {
                        console.log('Fetching intermediate parent filters:', parentInfo.intermediateParentId);
                        api.call('Get', {
                            typeName: 'Group',
                            search: { id: parentInfo.intermediateParentId }
                        }, function (intermediateResult) {
                            if (intermediateResult && intermediateResult.length > 0) {
                                const intermediateGroup = intermediateResult[0];
                                const intermediateFilters = intermediateGroup.securityFilters || [];
                                console.log('Intermediate parent filters:', intermediateFilters.length);

                                // Combine: built-in base + intermediate modifications
                                fullClearance.parentSecurityFilters = [...builtInFilters, ...intermediateFilters];
                                console.log('Combined parent filters:', fullClearance.parentSecurityFilters.length);
                            } else {
                                fullClearance.parentSecurityFilters = builtInFilters;
                            }
                            finalizeAndOpen();
                        }, function (error) {
                            console.error('Error fetching intermediate parent:', error);
                            fullClearance.parentSecurityFilters = builtInFilters;
                            finalizeAndOpen();
                        });
                        return; // Exit early, finalizeAndOpen will be called in callback
                    } else {
                        fullClearance.parentSecurityFilters = builtInFilters;
                        console.log('Parent security filters:', fullClearance.parentSecurityFilters.length);
                    }
                }
            } else {
                // If we can't find the parent, check if it's a built-in group itself
                if (builtInGroups[clearanceId]) {
                    fullClearance.parentLevel = builtInGroups[clearanceId].level;
                    fullClearance.inheritsFullAccess = fullClearance.parentLevel === 'full' || fullClearance.parentLevel === 'supervisor';
                } else {
                    fullClearance.parentLevel = 'unknown';
                    fullClearance.inheritsFullAccess = false;
                }
            }

            finalizeAndOpen();
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

    // Render the modal - securityId.name contains permission names directly
    renderModalContent(clearance, securityFilters);
}

/**
 * Render the modal content with security filter data
 */
function renderModalContent(clearance, securityFilters) {
    const modal = document.getElementById('preview-modal');
    const navPreview = document.getElementById('nav-preview');
    const accessSummary = document.getElementById('access-summary');
    const featureList = document.getElementById('feature-list');

    const allowedFeatures = new Set();
    const deniedFeatures = new Set();

    // Check if this clearance uses "isAdd: false" pattern (inherits from parent, removes specific items)
    // If ALL filters have isAdd: false, this is an "everything except" clearance
    // These old variables are replaced by the counting logic below
    // const hasAnyAddTrue = securityFilters.some(f => f.isAdd === true);
    // const hasAllAddFalse = securityFilters.length > 0 && securityFilters.every(f => f.isAdd === false);
    // const isExceptPattern = hasAllAddFalse && !hasAnyAddTrue;

    // Check how many filters are add-in specific vs main navigation
    const mainNavFilters = securityFilters.filter(f =>
        !f.securityId || !f.securityId.customPageName || f.securityId.customPageName === ''
    );
    const addinFilters = securityFilters.filter(f =>
        f.securityId && f.securityId.customPageName && f.securityId.customPageName !== ''
    );
    console.log('Main nav filters:', mainNavFilters.length, 'Add-in filters:', addinFilters.length);

    // Moved to after counting logic

    // Helper to extract feature names from a filter
    function extractFeatureNames(filter) {
        const names = new Set();
        if (filter.securityIdentifier) {
            names.add(filter.securityIdentifier);
        }
        if (filter.securityId) {
            if (typeof filter.securityId === 'string') {
                names.add(filter.securityId);
            } else {
                if (filter.securityId.name) {
                    let name = filter.securityId.name;
                    names.add(name);
                    if (name.startsWith('SecurityId') && name.endsWith('Id')) {
                        names.add(name.replace(/^SecurityId/, '').replace(/Id$/, ''));
                    }
                }
                if (filter.securityId.id) {
                    const id = filter.securityId.id;
                    names.add(id);
                    if (id.startsWith('SecurityId') && id.endsWith('Id')) {
                        names.add(id.replace(/^SecurityId/, '').replace(/Id$/, ''));
                    } else if (id.startsWith('Group') && id.endsWith('SecurityId')) {
                        names.add(id.replace(/^Group/, '').replace(/SecurityId$/, ''));
                    }
                }
            }
        }
        return names;
    }

    // Track camera/video specific denied permissions separately
    const deniedVideoFeatures = new Set();

    console.log('=== Processing Security Filters ===');
    console.log('First 3 raw filters:', securityFilters.slice(0, 3));

    // Count isAdd values to understand the pattern
    let addTrueCount = 0;
    let addFalseCount = 0;
    let addOtherCount = 0;

    securityFilters.forEach((filter, index) => {
        if (filter.isAdd === true) addTrueCount++;
        else if (filter.isAdd === false) addFalseCount++;
        else addOtherCount++;
    });

    console.log(`isAdd counts: true=${addTrueCount}, false=${addFalseCount}, other=${addOtherCount}`);

    // Check if this clearance inherits from a full-access parent
    // If so, use exception pattern: full access minus isAdd:false items
    const inheritsFullAccess = clearance.inheritsFullAccess || false;
    const parentLevel = clearance.parentLevel || 'unknown';
    const parentFilters = clearance.parentSecurityFilters || [];

    // For full/supervisor: exception pattern (full access minus denials)
    // For drive/user/viewonly: use parent's filters as base, apply child's overrides
    // For nothing: no access
    const actualExceptPattern = inheritsFullAccess && addFalseCount > 0;

    console.log('Filter counts:', `${addTrueCount} grants, ${addFalseCount} denials`);
    console.log('Parent level:', parentLevel);
    console.log('Parent filters count:', parentFilters.length);
    console.log('Inherits full access:', inheritsFullAccess, '-> Exception pattern:', actualExceptPattern);

    // For non-full-access parents with securityFilters, add their allowed permissions to our set
    if (!inheritsFullAccess && parentFilters.length > 0) {
        console.log('=== Processing Parent Filters ===');
        parentFilters.forEach((filter, index) => {
            // Parent's isAdd:true (or undefined) items are our base allowed permissions
            if (filter.isAdd !== false) {
                const names = extractFeatureNames(filter);
                names.forEach(name => allowedFeatures.add(name));
                if (index < 5) {
                    console.log(`Parent filter ${index + 1}: ${filter.securityIdentifier || filter.securityId?.name || 'unknown'}, isAdd: ${filter.isAdd}`);
                }
            }
        });
        console.log('After adding parent filters, allowed features:', allowedFeatures.size);
    }

    securityFilters.forEach((filter, index) => {
        const featureNames = extractFeatureNames(filter);

        // Check if this has a customPageName (add-in specific permission)
        const hasCustomPage = filter.securityId &&
                              filter.securityId.customPageName &&
                              filter.securityId.customPageName !== '';

        const filterName = filter.securityId?.name || filter.securityIdentifier || 'unknown';

        // Only log first 5 and last 2 to avoid spam
        if (index < 5 || index >= securityFilters.length - 2) {
            console.log(`Filter ${index + 1}: ${filterName}, isAdd: ${filter.isAdd}`);
        }

        // For except pattern: isAdd:false means DENIED
        // For additive pattern: isAdd:true means ALLOWED
        if (filter.isAdd === true) {
            // Explicitly granted
            featureNames.forEach(name => allowedFeatures.add(name));
        } else if (filter.isAdd === false) {
            // Check if this is a video-related denial
            if (hasCustomPage) {
                const name = filter.securityId.name || '';
                if (name === 'ViewCameraLiveVideo' || name.includes('LiveVideo')) {
                    deniedVideoFeatures.add('Live Video');
                }
            }

            // For ANY clearance with denials, remove from allowed and add to denied
            // This handles both exception pattern AND inherited permissions
            const permName = filter.securityIdentifier || filter.securityId?.name || '';
            const parsed = parsePermissionName(permName);
            if (parsed) {
                deniedFeatures.add(parsed);
                // Also remove the raw and parsed versions from allowed
                allowedFeatures.delete(permName);
                allowedFeatures.delete(parsed);
                // Try common variations
                allowedFeatures.delete('SecurityId' + parsed + 'Id');
            }
            // Remove all extracted feature names from allowed
            featureNames.forEach(name => {
                allowedFeatures.delete(name);
                const parsedName = parsePermissionName(name);
                if (parsedName) {
                    allowedFeatures.delete(parsedName);
                    deniedFeatures.add(parsedName);
                }
            });
        }
    });

    console.log('Denied main features:', Array.from(deniedFeatures));
    console.log('Denied video features:', Array.from(deniedVideoFeatures));

    // Parse and show the meaningful permission names
    const parsedAllowed = [];
    allowedFeatures.forEach(feature => {
        const parsed = parsePermissionName(feature);
        if (parsed) {
            parsedAllowed.push(parsed);
        }
    });
    console.log('Allowed features (raw):', Array.from(allowedFeatures));
    console.log('Allowed features (parsed):', parsedAllowed);
    console.log('Denied features:', Array.from(deniedFeatures));

    // Determine access level
    // GroupEverythingSecurityId or "Everything" filter = full access
    // GroupNothingSecurityId = no access
    // Exception pattern (all isAdd:false) = inherits full access from parent, with specific denials
    const clearanceIdLower = (clearance.id || '').toLowerCase();
    const clearanceNameLower = (clearance.name || '').toLowerCase();

    // If using "except" pattern (all/most filters are isAdd:false with no isAdd:true),
    // this inherits full access with exceptions
    const isFullAccess = actualExceptPattern ||
                         clearanceIdLower === 'groupeverythingsecurityid' ||
                         clearanceIdLower.includes('everything') ||
                         clearanceNameLower.includes('everything') ||
                         allowedFeatures.has('Everything') ||
                         allowedFeatures.has('EverythingSecurity');

    const isNoAccess = clearanceIdLower === 'groupnothingsecurityid' ||
                       clearanceIdLower.includes('nothing') ||
                       clearanceNameLower.includes('nothing') ||
                       allowedFeatures.has('Nothing') ||
                       allowedFeatures.has('NothingSecurity');

    console.log('actualExceptPattern:', actualExceptPattern, '(isAdd counts: true=' + addTrueCount + ', false=' + addFalseCount + ')');

    console.log('=== CLEARANCE DEBUG ===');
    console.log('Clearance:', clearance.name);
    console.log('Total security filters:', securityFilters.length);
    console.log('isAdd counts - true:', addTrueCount, 'false:', addFalseCount, 'other:', addOtherCount);
    console.log('actualExceptPattern:', actualExceptPattern);
    console.log('isFullAccess:', isFullAccess);
    console.log('isNoAccess:', isNoAccess);
    console.log('Allowed features:', Array.from(allowedFeatures));
    console.log('Denied features (parsed):', Array.from(deniedFeatures));
    console.log('Denied video features:', Array.from(deniedVideoFeatures));
    console.log('========================');

    // Helper to check if a nav item is explicitly denied
    // Uses the same permission-to-nav mapping as for allowed features
    function isDeniedNavItem(navPatterns, itemName) {
        if (!itemName) return false;

        // Check if any denied feature maps to this nav item's patterns
        for (const denied of deniedFeatures) {
            if (permissionGrantsAccess(denied, navPatterns)) {
                return true;
            }
        }

        // Check video-specific denied features
        const itemNameLower = itemName.toLowerCase().replace(/\s+/g, '');
        for (const denied of deniedVideoFeatures) {
            const deniedLower = denied.toLowerCase().replace(/\s+/g, '');
            if (itemNameLower === deniedLower) {
                return true;
            }
        }

        return false;
    }

    // Render navigation preview using pattern-based matching
    // isNoAccess overrides everything - if true, no access to anything
    // For exception pattern (full access with denials): check if item is specifically denied
    // For additive pattern (inherited permissions): only check if any permission grants access
    // NOTE: Denials only block nav items in exception pattern (inherits full access)
    //       For non-full-access inheritance, we rely on allowedFeatures which already has denials removed
    navPreview.innerHTML = navigationStructure.map(navItem => {
        // Only use denial check for full-access clearances with exceptions
        const checkDenials = actualExceptPattern || inheritsFullAccess;
        const isDenied = checkDenials && isDeniedNavItem(navItem.securityIds, navItem.name);
        const hasAccess = !isNoAccess && !isDenied && (isFullAccess || hasAccessToNavItem(allowedFeatures, navItem.securityIds));
        const accessClass = hasAccess ? 'has-access' : 'no-access';

        let childrenHtml = '';
        if (navItem.children.length > 0) {
            childrenHtml = '<ul class="nav-children">' +
                navItem.children.map(child => {
                    const childIsDenied = checkDenials && isDeniedNavItem(child.securityIds, child.name);
                    const childHasAccess = !isNoAccess && !childIsDenied && (isFullAccess || hasAccessToNavItem(allowedFeatures, child.securityIds));
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
    // Only account for denied items in "except" pattern (full access with exceptions)
    const checkDenialsForStats = actualExceptPattern || inheritsFullAccess;
    let totalFeatures = 0;
    let accessibleCount = 0;
    navigationStructure.forEach(item => {
        totalFeatures++;
        const itemDenied = checkDenialsForStats && isDeniedNavItem(item.securityIds, item.name);
        if (!isNoAccess && !itemDenied && (isFullAccess || hasAccessToNavItem(allowedFeatures, item.securityIds))) accessibleCount++;
        item.children.forEach(child => {
            totalFeatures++;
            const childDenied = checkDenialsForStats && isDeniedNavItem(child.securityIds, child.name);
            if (!isNoAccess && !childDenied && (isFullAccess || hasAccessToNavItem(allowedFeatures, child.securityIds))) accessibleCount++;
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
    } else if (actualExceptPattern) {
        accessIcon = '👑';
        accessLabel = 'Full (with exceptions)';
        statClass = 'stat-full';
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
        // Show all features as enabled, except denied ones
        const categories = [...new Set(keySecurityFeatures.map(f => f.category))];
        const hasDeniedFeatures = deniedFeatures.size > 0;
        const messageText = hasDeniedFeatures
            ? '👑 This clearance has full access with specific exceptions (shown in red).'
            : '👑 This clearance has full access to all features.';

        featureList.innerHTML = `
            <p class="full-access">${messageText}</p>
            <div class="feature-categories">
                ${categories.map(category => `
                    <div class="feature-category">
                        <h4>${category}</h4>
                        <div class="feature-grid">
                            ${keySecurityFeatures.filter(f => f.category === category).map(feature => {
                                // Check if this feature is denied - use exact name matching
                                // For Video category, also check deniedVideoFeatures
                                let isDenied = false;
                                const featureNameLower = feature.name.toLowerCase().replace(/\s+/g, '');

                                for (const denied of deniedFeatures) {
                                    if (denied.toLowerCase().replace(/\s+/g, '') === featureNameLower) {
                                        isDenied = true;
                                        break;
                                    }
                                }

                                // Also check video-specific denials for Video category
                                if (!isDenied && category === 'Video') {
                                    for (const denied of deniedVideoFeatures) {
                                        // Match "Live Video" to feature name
                                        if (denied.toLowerCase().replace(/\s+/g, '') === featureNameLower) {
                                            isDenied = true;
                                            break;
                                        }
                                    }
                                }

                                const enabled = !isDenied;
                                return `
                                    <div class="feature-item ${enabled ? 'allowed' : 'denied'}">
                                        <span class="feature-icon">${enabled ? '✓' : '✕'}</span>
                                        <span class="feature-name">${feature.name}</span>
                                    </div>
                                `;
                            }).join('')}
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
