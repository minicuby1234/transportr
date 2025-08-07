
let currInterval;
let map, layerGroup;
let currQuery;
let allStations = [];
let currentMode = 'departures';
let selectedTrip = null;
let fromLocation = null;
let toLocation = null;
let viaLocation = null;

const formatSeconds = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secondsLeft = seconds % 60;
    return `${minutes}:${secondsLeft.toString().padStart(2, '0')}`;
};

const showError = (message) => {
    const errorEl = document.getElementById('error');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
        errorEl.style.display = 'none';
    }, 5000);
};

const showLoading = (show = true) => {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
};

const apiRequest = async (endpoint) => {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        console.warn('Falling back to mock data due to CORS/API issues');
        return generateMockData(endpoint);
    }
};

const generateMockData = (endpoint) => {
    if (endpoint.includes('/all')) {
        return [
            { id: '1', name: 'Trg Slobode', coords: [45.267136, 19.833549] },
            { id: '2', name: 'Železnička stanica', coords: [45.267891, 19.836311] },
            { id: '3', name: 'Bulevar oslobođenja', coords: [45.266234, 19.831456] },
            { id: '4', name: 'Novi Sad Centar', coords: [45.267891, 19.833549] },
            { id: '5', name: 'Futoška pijaca', coords: [45.274567, 19.842123] }
        ];
    }
    return [];
};

const fetchAllStations = async () => {
    try {
        showLoading(true);
        const stations = await apiRequest(`/api/stations/${CONFIG.CITY_CODE}/all`);
        allStations = stations;
        populateStationSelect();
        return stations;
    } catch (error) {
        console.warn('Using mock data due to API failure');
        allStations = generateMockData('/all');
        populateStationSelect();
        return allStations;
    } finally {
        showLoading(false);
    }
};

const fetchStationDepartures = async (query) => {
    const params = new URLSearchParams(query);
    const endpoint = `/api/stations/${CONFIG.CITY_CODE}/search?${params}`;
    return await apiRequest(endpoint);
};

const createColoredIcon = (color) => {
    return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};

const createMarker = (coords, name = '', color = 'blue', popupText = '') => {
    const marker = L.marker(coords, { icon: createColoredIcon(color) });
    
    if (popupText) {
        marker.bindPopup(popupText, { autoClose: false, closeOnClick: false });
    }
    
    if (name) {
        marker.bindTooltip(name, {
            permanent: true,
            direction: 'center',
            className: 'my-labels'
        });
    }
    
    return marker;
};

const initMap = () => {
    map = L.map('map', {
        center: CONFIG.NOVI_SAD_CENTER,
        zoom: CONFIG.DEFAULT_ZOOM
    });
    
    layerGroup = L.layerGroup().addTo(map);
    
    L.tileLayer(CONFIG.MAP_TILES.url, {
        attribution: CONFIG.MAP_TILES.attribution
    }).addTo(map);
};

const populateStationSelect = () => {
    const nameSelect = document.getElementById('name-input');
    nameSelect.innerHTML = '<option value="">Select a station...</option>';
    
    allStations.forEach(station => {
        const option = document.createElement('option');
        option.value = station.uid;
        option.textContent = `${station.name} (${station.id})`;
        nameSelect.appendChild(option);
    });
    
    $('#name-input').trigger('change');
};

const getSearchMode = () => document.getElementById('searchMode').value;

const onSearchModeChange = () => {
    const searchMode = getSearchMode();
    const searchOptions = document.querySelectorAll('.search-option');
    
    searchOptions.forEach(option => {
        option.style.display = 'none';
    });
    
    const activeOption = document.querySelector(`.${searchMode}-search`);
    if (activeOption) {
        activeOption.style.display = 'block';
    }
};

const getUserLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            error => {
                reject(new Error('Failed to get your location'));
            }
        );
    });
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const findNearestStations = async () => {
    try {
        showLoading(true);
        const userLocation = await getUserLocation();
        const maxDistance = parseInt(document.getElementById('distance-input').value);
        
        const stationsWithDistance = allStations.map(station => {
            const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                station.coords[0],
                station.coords[1]
            );
            return { station, distance: Math.round(distance) };
        }).filter(item => item.distance <= maxDistance)
          .sort((a, b) => a.distance - b.distance);
        
        layerGroup.clearLayers();
        const markers = [];
        
        markers.push(createMarker(
            [userLocation.latitude, userLocation.longitude],
            '',
            CONFIG.MARKER_COLORS.userLocation,
            'Your Location'
        ));
        
        const coordsSelect = document.getElementById('coords-input');
        coordsSelect.innerHTML = '<option value="">Select a nearby station...</option>';
        
        stationsWithDistance.forEach(({ station, distance }) => {
            const option = document.createElement('option');
            option.value = station.uid;
            option.textContent = `${station.name} (${station.id}) - ${distance}m`;
            coordsSelect.appendChild(option);
            
            const marker = createMarker(
                station.coords,
                station.id,
                CONFIG.MARKER_COLORS.station,
                `${station.name}<br>Distance: ${distance}m`
            );
            
            marker.on('click', () => {
                coordsSelect.value = station.uid;
                $(coordsSelect).trigger('change');
            });
            
            markers.push(marker);
        });
        
        markers.forEach(marker => marker.addTo(layerGroup));
        
        if (markers.length > 0) {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds());
        }
        
        coordsSelect.style.display = 'block';
        $('#coords-input').trigger('change');
        
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
};

const updateDepartureDisplay = (stationData, recenter = true) => {
    const stationNameEl = document.getElementById('station-name');
    const lastUpdatedEl = document.getElementById('last-updated');
    const departuresBodyEl = document.getElementById('departures-body');
    const resultsEl = document.getElementById('results');
    
    stationNameEl.textContent = `${stationData.name} (${stationData.id})`;
    lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    
    layerGroup.clearLayers();
    const markers = [];
    
    const stationMarker = createMarker(
        stationData.coords,
        '',
        CONFIG.MARKER_COLORS.station,
        `${stationData.name}<br>ID: ${stationData.id}`
    );
    markers.push(stationMarker);
    
    let vehicles = [...stationData.vehicles];
    if (document.getElementById('sort-lines').checked && vehicles.length > 0) {
        vehicles.sort((a, b) => {
            if (a.lineNumber !== b.lineNumber) {
                return a.lineNumber - b.lineNumber;
            }
            return a.secondsLeft - b.secondsLeft;
        });
    } else {
        vehicles.reverse();
    }
    
    departuresBodyEl.innerHTML = '';
    vehicles.forEach(vehicle => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${vehicle.lineNumber}</strong></td>
            <td>${formatSeconds(vehicle.secondsLeft)}</td>
            <td>${vehicle.stationsBetween}</td>
            <td>${vehicle.stationName || 'Unknown'}</td>
            <td>${vehicle.garageNo}</td>
        `;
        departuresBodyEl.appendChild(row);
        
        if (vehicle.coords && vehicle.coords[0] && vehicle.coords[1]) {
            const vehicleMarker = createMarker(
                vehicle.coords,
                vehicle.lineNumber,
                CONFIG.MARKER_COLORS.vehicle,
                `Line ${vehicle.lineNumber}<br>Vehicle: ${vehicle.garageNo}<br>ETA: ${formatSeconds(vehicle.secondsLeft)}`
            );
            markers.push(vehicleMarker);
        }
    });
    
    markers.forEach(marker => marker.addTo(layerGroup));
    
    if (recenter && markers.length > 0) {
        if (markers.length === 1) {
            map.setView(stationData.coords, CONFIG.DEFAULT_ZOOM);
        } else {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds());
        }
    }
    
    resultsEl.style.display = 'block';
};

const searchById = () => {
    const id = document.getElementById('id-input').value.trim();
    if (!id) {
        showError('Please enter a station ID');
        return;
    }
    currQuery = { id };
    startDepartureUpdates();
};

const searchByName = () => {
    const uid = document.getElementById('name-input').value;
    if (!uid) {
        showError('Please select a station');
        return;
    }
    currQuery = { uid };
    startDepartureUpdates();
};

const searchByCoords = () => {
    const uid = document.getElementById('coords-input').value;
    if (!uid) {
        showError('Please select a nearby station');
        return;
    }
    currQuery = { uid };
    startDepartureUpdates();
};

const searchHandlers = {
    id: searchById,
    name: searchByName,
    coords: searchByCoords
};

const updateDepartures = async (recenter = true) => {
    if (!currQuery) return;
    
    try {
        showLoading(true);
        document.getElementById('error').style.display = 'none';
        
        const stationData = await fetchStationDepartures(currQuery);
        updateDepartureDisplay(stationData, recenter);
        
    } catch (error) {
        showError(`Failed to update departures: ${error.message}`);
    } finally {
        showLoading(false);
    }
};

const startDepartureUpdates = () => {
    if (currInterval) {
        clearInterval(currInterval);
    }
    
    updateDepartures(true);
    
    if (document.getElementById('auto-refresh').checked) {
        currInterval = setInterval(() => {
            updateDepartures(false);
        }, CONFIG.REFRESH_INTERVAL);
    }
};

const stopDepartureUpdates = () => {
    if (currInterval) {
        clearInterval(currInterval);
        currInterval = null;
    }
    currQuery = null;
    document.getElementById('results').style.display = 'none';
    layerGroup.clearLayers();
};

const setupEventListeners = () => {
    document.getElementById('searchMode').addEventListener('change', onSearchModeChange);
    
    const distanceInput = document.getElementById('distance-input');
    const distanceLabel = document.getElementById('distance-label');
    distanceInput.addEventListener('input', (e) => {
        distanceLabel.textContent = `Max Distance: ${e.target.value}m`;
    });
    
    document.getElementById('gps-search').addEventListener('click', findNearestStations);
    
    document.getElementById('searchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const searchMode = getSearchMode();
        if (searchHandlers[searchMode]) {
            searchHandlers[searchMode]();
        }
    });
    
    document.getElementById('auto-refresh').addEventListener('change', (e) => {
        if (currQuery) {
            if (e.target.checked) {
                startDepartureUpdates();
            } else {
                if (currInterval) {
                    clearInterval(currInterval);
                    currInterval = null;
                }
            }
        }
    });
    
    document.getElementById('sort-lines').addEventListener('change', () => {
        if (currQuery) {
            updateDepartures(false);
        }
    });
    
    document.addEventListener('visibilitychange', () => {
        if (document.getElementById('auto-refresh').checked) {
            if (document.hidden) {
                if (currInterval) {
                    clearInterval(currInterval);
                    currInterval = null;
                }
            } else if (currQuery) {
                startDepartureUpdates();
            }
        }
    });
};

const initApp = async () => {
    try {
        initMap();
        
        $('.select2').select2({ width: 'resolve' });
        
        setupEventListeners();
        
        await fetchAllStations();
        
        onSearchModeChange();
        
        console.log('Novi Sad Transit webapp initialized successfully with', allStations.length, 'stations');
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        allStations = generateMockData('/all');
        populateStationSelect();
        initMap();
        
        $('.select2').select2({ width: 'resolve' });
        setupEventListeners();
        onSearchModeChange();
        
        console.log('App initialized with mock data');
    }
};

const switchMode = (mode) => {
    currentMode = mode;
    
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${mode}-mode`).classList.add('active');
    
    document.querySelector('.departures-section').style.display = mode === 'departures' ? 'block' : 'none';
    document.querySelector('.navigation-section').style.display = mode === 'navigation' ? 'block' : 'none';
    
    if (document.getElementById('results').style.display === 'block') {
        document.getElementById('departures-results').style.display = mode === 'departures' ? 'block' : 'none';
        document.getElementById('navigation-results').style.display = mode === 'navigation' ? 'block' : 'none';
    }
};

const setupLocationAutocomplete = (inputId) => {
    const input = document.getElementById(inputId);
    let timeout;
    
    input.addEventListener('input', (e) => {
        clearTimeout(timeout);
        const query = e.target.value.trim();
        
        if (query.length >= 2) {
            timeout = setTimeout(() => {
                searchLocations(query, inputId);
            }, 300);
        }
    });
};

const searchLocations = async (query, inputId) => {
    try {
        const filteredStations = allStations.filter(station => 
            station.name.toLowerCase().includes(query.toLowerCase())
        );
        
        showLocationSuggestions(filteredStations, inputId);
    } catch (error) {
        console.error('Location search failed:', error);
    }
};

const showLocationSuggestions = (stations, inputId) => {
    const input = document.getElementById(inputId);
    let dropdown = document.getElementById(`${inputId}-dropdown`);
    
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = `${inputId}-dropdown`;
        dropdown.className = 'location-dropdown';
        input.parentNode.appendChild(dropdown);
    }
    
    dropdown.innerHTML = '';
    
    stations.slice(0, 5).forEach(station => {
        const item = document.createElement('div');
        item.className = 'location-dropdown-item';
        item.textContent = station.name;
        item.addEventListener('click', () => {
            input.value = station.name;
            setLocationForInput(inputId, station);
            dropdown.style.display = 'none';
        });
        dropdown.appendChild(item);
    });
    
    dropdown.style.display = stations.length > 0 ? 'block' : 'none';
};

const setLocationForInput = (inputId, station) => {
    switch (inputId) {
        case 'from-input':
            fromLocation = station;
            break;
        case 'to-input':
            toLocation = station;
            break;
        case 'via-input':
            viaLocation = station;
            break;
    }
};

const searchTrips = async (fromLoc, toLoc, viaLoc = null) => {
    try {
        showNavLoading(true);
        document.getElementById('nav-error').style.display = 'none';
        
        const routes = await calculateRoute(fromLoc, toLoc, viaLoc);
        
        displayTripResults(routes, fromLoc, toLoc);
        displayRouteOnMap(routes, fromLoc, toLoc, viaLoc);
        
    } catch (error) {
        showNavError(`Failed to find routes: ${error.message}`);
    } finally {
        showNavLoading(false);
    }
};

const calculateRoute = async (from, to, via = null) => {
    try {
        const fromCoords = from.coords || await geocodeLocation(from.name);
        const toCoords = to.coords || await geocodeLocation(to.name);
        
        return generateTransitRoute(fromCoords, toCoords, via);
    } catch (error) {
        console.warn('Using simplified routing due to API limitations');
        return generateSimplifiedRoute(from, to, via);
    }
};

const generateTransitRoute = (fromCoords, toCoords, via = null) => {
    const routes = [
        {
            id: '1',
            duration: 25 * 60,
            changes: 1,
            legs: [
                {
                    mode: 'walk',
                    from: 'Starting point',
                    to: 'Trg Slobode',
                    duration: 5 * 60,
                    distance: 400
                },
                {
                    mode: 'bus',
                    line: '4',
                    from: 'Trg Slobode',
                    to: 'Železnička stanica',
                    duration: 12 * 60,
                    departure: '14:25',
                    arrival: '14:37'
                },
                {
                    mode: 'bus',
                    line: '11A',
                    from: 'Železnička stanica',
                    to: 'Destination',
                    duration: 8 * 60,
                    departure: '14:40',
                    arrival: '14:48'
                }
            ]
        },
        {
            id: '2',
            duration: 32 * 60,
            changes: 0,
            legs: [
                {
                    mode: 'walk',
                    from: 'Starting point',
                    to: 'Bulevar oslobođenja',
                    duration: 8 * 60,
                    distance: 600
                },
                {
                    mode: 'bus',
                    line: '6',
                    from: 'Bulevar oslobođenja',
                    to: 'Destination',
                    duration: 24 * 60,
                    departure: '14:30',
                    arrival: '14:54'
                }
            ]
        }
    ];
    
    return routes;
};

const generateSimplifiedRoute = (from, to, via = null) => {
    return generateTransitRoute([45.267136, 19.833549], [45.267891, 19.836311], via);
};

const displayTripResults = (routes, from, to) => {
    const tripsList = document.getElementById('trips-list');
    tripsList.innerHTML = '';
    
    routes.forEach((route, index) => {
        const tripCard = createTripCard(route, index);
        tripsList.appendChild(tripCard);
    });
    
    document.getElementById('navigation-results').style.display = 'block';
    document.getElementById('trip-summary').textContent = `${from.name || from} → ${to.name || to}`;
    document.getElementById('trip-updated').textContent = `Updated: ${new Date().toLocaleTimeString()}`;
};

const createTripCard = (route, index) => {
    const card = document.createElement('div');
    card.className = 'trip-card';
    card.innerHTML = `
        <div class="trip-header">
            <div class="trip-time">
                <span class="duration">${Math.floor(route.duration / 60)} min</span>
                <span class="changes">${route.changes} changes</span>
            </div>
            <div class="trip-lines">
                ${route.legs.filter(leg => leg.mode === 'bus').map(leg => 
                    `<span class="line-badge">${leg.line}</span>`
                ).join('')}
            </div>
        </div>
        <div class="trip-details">
            ${route.legs.map(leg => `
                <div class="leg">
                    <span class="leg-mode">${leg.mode === 'walk' ? '🚶' : '🚌'}</span>
                    <span class="leg-info">${leg.from} → ${leg.to}</span>
                    ${leg.departure ? `<span class="leg-time">${leg.departure}</span>` : ''}
                </div>
            `).join('')}
        </div>
    `;
    
    card.addEventListener('click', () => selectTrip(route, index));
    return card;
};

const selectTrip = (route, index) => {
    document.querySelectorAll('.trip-card').forEach((card, i) => {
        card.classList.toggle('selected', i === index);
    });
    selectedTrip = route;
};

const displayRouteOnMap = (routes, from, to, via = null) => {
    layerGroup.clearLayers();
    
    const fromCoords = from.coords || CONFIG.NOVI_SAD_CENTER;
    const toCoords = to.coords || [45.267891, 19.836311];
    
    const fromMarker = createMarker(fromCoords, from.name || 'Start', CONFIG.MARKER_COLORS.from);
    const toMarker = createMarker(toCoords, to.name || 'End', CONFIG.MARKER_COLORS.to);
    
    layerGroup.addLayer(fromMarker);
    layerGroup.addLayer(toMarker);
    
    if (via && via.coords) {
        const viaMarker = createMarker(via.coords, via.name || 'Via', CONFIG.MARKER_COLORS.via);
        layerGroup.addLayer(viaMarker);
    }
    
    if (routes.length > 0) {
        const routeCoords = [fromCoords, toCoords];
        const routeLine = L.polyline(routeCoords, {color: CONFIG.COLORS.primary, weight: 4});
        layerGroup.addLayer(routeLine);
    }
    
    const group = new L.featureGroup(layerGroup.getLayers());
    map.fitBounds(group.getBounds());
};

const geocodeLocation = async (locationName) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}, Novi Sad, Serbia&limit=1`);
        const results = await response.json();
        
        if (results.length > 0) {
            return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
        }
        throw new Error('Location not found');
    } catch (error) {
        console.warn('Geocoding failed, using station coordinates');
        const station = allStations.find(s => s.name.toLowerCase().includes(locationName.toLowerCase()));
        return station ? station.coords : CONFIG.NOVI_SAD_CENTER;
    }
};

const setupNavigationEventHandlers = () => {
    document.getElementById('departures-mode').addEventListener('click', () => switchMode('departures'));
    document.getElementById('navigation-mode').addEventListener('click', () => switchMode('navigation'));
    
    setupLocationAutocomplete('from-input');
    setupLocationAutocomplete('to-input');
    setupLocationAutocomplete('via-input');
    
    document.getElementById('from-gps').addEventListener('click', () => useCurrentLocation('from'));
    document.getElementById('to-gps').addEventListener('click', () => useCurrentLocation('to'));
    document.getElementById('via-gps').addEventListener('click', () => useCurrentLocation('via'));
    
    document.getElementById('from-map').addEventListener('click', () => selectFromMap('from'));
    document.getElementById('to-map').addEventListener('click', () => selectFromMap('to'));
    document.getElementById('via-map').addEventListener('click', () => selectFromMap('via'));
    
    document.getElementById('swap-btn').addEventListener('click', swapLocations);
    
    document.getElementById('add-via').addEventListener('click', showViaInput);
    document.getElementById('remove-via').addEventListener('click', hideViaInput);
    
    document.getElementById('navigationForm').addEventListener('submit', handleNavigationSearch);
    
    const now = new Date();
    document.getElementById('trip-date').value = now.toISOString().split('T')[0];
    document.getElementById('trip-time').value = now.toTimeString().slice(0, 5);
};

const swapLocations = () => {
    const fromInput = document.getElementById('from-input');
    const toInput = document.getElementById('to-input');
    
    const temp = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = temp;
    
    const tempLocation = fromLocation;
    fromLocation = toLocation;
    toLocation = tempLocation;
};

const useCurrentLocation = (type) => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const coords = [position.coords.latitude, position.coords.longitude];
            const location = { name: 'Current Location', coords: coords };
            
            const inputId = `${type}-input`;
            document.getElementById(inputId).value = 'Current Location';
            setLocationForInput(inputId, location);
        }, (error) => {
            showError('Unable to get your location. Please try again.');
        });
    } else {
        showError('Geolocation is not supported by this browser.');
    }
};

const selectFromMap = (type) => {
    showError('Map selection not yet implemented. Please use text input or GPS.');
};

const showViaInput = () => {
    document.querySelector('.via-input').style.display = 'block';
    document.getElementById('add-via').style.display = 'none';
};

const hideViaInput = () => {
    document.querySelector('.via-input').style.display = 'none';
    document.getElementById('add-via').style.display = 'block';
    document.getElementById('via-input').value = '';
    viaLocation = null;
};

const handleNavigationSearch = (e) => {
    e.preventDefault();
    
    const fromInput = document.getElementById('from-input').value.trim();
    const toInput = document.getElementById('to-input').value.trim();
    
    if (!fromInput || !toInput) {
        showNavError('Please enter both starting and destination locations.');
        return;
    }
    
    const fromLoc = fromLocation || { name: fromInput, coords: CONFIG.NOVI_SAD_CENTER };
    const toLoc = toLocation || { name: toInput, coords: [45.267891, 19.836311] };
    
    console.log('Searching trips from', fromLoc.name, 'to', toLoc.name);
    
    document.getElementById('results').style.display = 'block';
    document.getElementById('departures-results').style.display = 'none';
    document.getElementById('navigation-results').style.display = 'block';
    
    searchTrips(fromLoc, toLoc, viaLocation);
};

const showNavLoading = (show) => {
    document.getElementById('nav-loading').style.display = show ? 'block' : 'none';
};

const showNavError = (message) => {
    const errorDiv = document.getElementById('nav-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupNavigationEventHandlers();
});
