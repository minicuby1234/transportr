# Novi Sad Transit Webapp

A real-time public transit webapp specifically designed for Novi Sad, Serbia. This webapp provides live departure information, interactive maps, and GPS-based station search using the nsmart API.

## Features

- 🚌 **Real-time Departures**: Live departure times with automatic 10-second updates
- 🗺️ **Interactive Map**: Leaflet-based map showing stations and vehicle positions
- 📍 **GPS Integration**: Find nearest stations based on your current location
- 🔍 **Multiple Search Options**: Search by station ID, name, or GPS location
- 📱 **Mobile Responsive**: Works seamlessly on desktop and mobile devices
- ⚡ **Auto-refresh**: Configurable automatic updates with data-saving features

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Maps**: Leaflet.js with OpenStreetMap tiles
- **UI Components**: Select2 for enhanced dropdowns
- **API**: bgpp nsmart API for Novi Sad transit data
- **Styling**: Custom CSS with responsive design

## Setup and Usage

### Prerequisites

- Modern web browser with JavaScript enabled
- Internet connection for API calls and map tiles

### Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/minicuby1234/transportr.git
   cd transportr/webapp
   ```

2. **Serve the files**:
   You can use any local web server. For example:
   
   **Using Python**:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
   
   **Using Node.js**:
   ```bash
   npx serve .
   ```
   
   **Using PHP**:
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**:
   Navigate to `http://localhost:8000` in your web browser.

### Configuration

The webapp configuration can be modified in `static/js/config.js`:

```javascript
const CONFIG = {
    API_BASE_URL: 'https://bgpp.fly.dev', // bgpp server URL
    CITY_CODE: 'ns', // Novi Sad city code
    NOVI_SAD_CENTER: [45.267136, 19.833549],
    REFRESH_INTERVAL: 10000, // 10 seconds
    // ... other settings
};
```

## How to Use

### 1. Station Search

**By Station ID**:
- Select "Station ID" from the search type dropdown
- Enter the numeric station ID
- Click "Get Departures"

**By Station Name**:
- Select "Station Name" from the search type dropdown
- Choose a station from the dropdown list
- Click "Get Departures"

**By GPS Location**:
- Select "GPS Location" from the search type dropdown
- Click "Find Nearest Stations" to use your current location
- Adjust the maximum distance slider if needed
- Select a nearby station from the results
- Click "Get Departures"

### 2. Viewing Departures

Once you search for a station, you'll see:
- **Station Information**: Name and ID of the selected station
- **Departures Table**: Live departure times, line numbers, and vehicle information
- **Interactive Map**: Station location and real-time vehicle positions
- **Auto-refresh**: Automatic updates every 10 seconds (can be disabled)

### 3. Map Features

- **Station Markers** (Yellow): Show the selected station
- **Vehicle Markers** (Blue): Show real-time vehicle positions with line numbers
- **User Location** (Green): Your current location when using GPS search
- **Clickable Markers**: Click on station markers to select them
- **Tooltips**: Hover over markers for additional information

## API Integration

This webapp integrates with the [bgpp](https://github.com/minicuby1234/bgpp) API to access Novi Sad's nsmart transit data:

- **Stations Endpoint**: `/api/stations/ns/all` - Get all Novi Sad stations
- **Departures Endpoint**: `/api/stations/ns/search` - Get real-time departures for a specific station

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

This webapp is part of the [Transportr](https://github.com/minicuby1234/transportr) project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](../LICENSE) file for details.

## Acknowledgments

- **[bgpp](https://github.com/minicuby1234/bgpp)**: API provider for Novi Sad transit data
- **[Transportr](https://github.com/minicuby1234/transportr)**: Parent project and inspiration
- **[Leaflet](https://leafletjs.com/)**: Interactive map library
- **[OpenStreetMap](https://www.openstreetmap.org/)**: Map data and tiles
- **[Select2](https://select2.org/)**: Enhanced select components

## Support

For issues and questions:
1. Check the [Issues](https://github.com/minicuby1234/transportr/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your browser and the issue

---

**Note**: This webapp specifically serves Novi Sad, Serbia. For other cities, check the main [bgpp](https://github.com/minicuby1234/bgpp) project or [Transportr](https://github.com/minicuby1234/transportr) for broader transit support.
