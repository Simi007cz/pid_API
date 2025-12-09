// --- CONFIGURATION ---
const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your actual Golemio API key
const BASE_URL = 'https://api.golemio.cz/v2/pid'; 
const DEPARTURES_ENDPOINT = '/departureboards/';

// The specific ID for the "Tyršův dům" stop
const STOP_ID = 'U138Z2P'; 

// --- HELPER FUNCTION ---
function formatDeparture(departure) {
    const line = departure.route.short_name;
    const destination = departure.trip.headsign;
    
    // The Golemio API provides a predicted departure timestamp (in seconds)
    const predictedTime = new Date(departure.departure_timestamp.predicted * 1000);
    
    // Calculate minutes until departure
    const now = new Date();
    const minutesToDeparture = Math.floor((predictedTime.getTime() - now.getTime()) / 60000);

    // Get the formatted time string (e.g., "15:30")
    const formattedTime = predictedTime.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });

    let status = '';
    if (minutesToDeparture <= 1) {
        status = '• NOW';
    } else if (minutesToDeparture < 10) {
        status = `(${minutesToDeparture} min)`;
    } else {
        status = `${formattedTime}`;
    }

    return `
        <div class="departure-item">
            <span class="line-number line-${line}">${line}</span>
            <span class="destination">${destination}</span>
            <span class="time">${status}</span>
        </div>
    `;
}


// --- MAIN API CALL FUNCTION ---
async function getDepartures() {
    // The endpoint requires the stop ID to be passed as a query parameter 'ids'
    const url = `${BASE_URL}${DEPARTURES_ENDPOINT}?ids=${STOP_ID}&limit=10`;
    const boardDiv = document.getElementById('departure-board');

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Token': API_KEY 
            }
        });

        if (!response.ok) {
            // Check for common error codes (like 401 Unauthorized for bad API key)
            if (response.status === 401) {
                throw new Error('Unauthorized. Please check your X-Access-Token.');
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        // Data contains an array of departure boards, grab the departures list
        const departures = data.departures || [];
        
        if (departures.length === 0) {
            boardDiv.innerHTML = '<p>No upcoming departures found.</p>';
            return;
        }

        // Generate the HTML content
        let htmlContent = departures.map(formatDeparture).join('');
        boardDiv.innerHTML = htmlContent;
        
        } catch (error) {
        console.error('Error fetching departure data:', error);
        boardDiv.innerHTML = `<p style="color: red;">Failed to load departures. Error: ${error.message}</p>`;
        }
    }

    // Execute the function once
    getDepartures();