
const CONFIG = {
    API_BASE_URL: 'https://bgpp.fly.dev',
    CITY_CODE: 'ns',
    
    NOVI_SAD_CENTER: [45.267136, 19.833549],
    DEFAULT_ZOOM: 13,
    
    REFRESH_INTERVAL: 10000,
    
    MAP_TILES: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors'
    },
    
    MARKER_COLORS: {
        station: 'yellow',
        vehicle: 'blue',
        userLocation: 'green',
        from: 'green',
        to: 'red',
        via: 'orange'
    },
    
    COLORS: {
        primary: '#f44336',
        primaryDark: '#b71c1c',
        accent: '#e53935',
        cardBackground: '#FFFFFFFF'
    }
};
