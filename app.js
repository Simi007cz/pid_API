// --- CONFIGURATION ---
const API_KEY = 'ADD_YOUR_API_KEY_HERE'; // Replace with your actual API key
const BASE_URL = 'https://api.golemio.cz/v2/pid'; 
const DEPARTURES_ENDPOINT = '/departureboards/';

// The specific ID for the "Tyršův dům" stop
const STOP_ID = 'U138Z2P'; 

// --- HELPER FUNCTION: DEPARTURE FORMATTING ---
function formatDeparture(departure) {
    const line = departure.route.short_name;
    const destination = departure.trip.headsign;
    
    // Use ISO 8601 string directly to create Date object (correct for Golemio API)
    const predictedTime = new Date(departure.departure_timestamp.predicted); 
    
    const now = new Date();
    
    // Calculate difference in milliseconds
    const timeDifferenceMs = predictedTime.getTime() - now.getTime();
    
    // Calculate minutes (rounded down)
    const minutesToDeparture = Math.floor(timeDifferenceMs / 60000);
    
    // Get the formatted time string (e.g., "15:30")
    const formattedTime = predictedTime.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });

    let status = '';
    if (minutesToDeparture < 0) {
        // Departure has already passed
        status = 'DEPARTED';
    } else if (minutesToDeparture < 1) {
        // Less than 1 minute, display "<1 min" (as requested)
        status = '<1 min';
    } else if (minutesToDeparture <= 10) {
        // Between 1 and 10 minutes
        status = `(${minutesToDeparture} min)`;
    } else {
        // More than 10 minutes, display absolute time
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

// --- HELPER FUNCTION: INFO TEXT DISPLAY (Retained from previous step) ---
function displayInfoTexts(infotexts) {
    const infoDiv = document.getElementById('info-texts');
    if (!infoDiv || !infotexts || infotexts.length === 0) {
        if (infoDiv) infoDiv.innerHTML = '';
        return;
    }

    // Prioritize English text (text_en) if available, otherwise use Czech text (text)
    const htmlContent = infotexts.map(info => {
        const text = info.text_en || info.text;
        if (!text) return '';
        return `<p class="alert-info">${text}</p>`; 
    }).join('');

    infoDiv.innerHTML = htmlContent;
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
            if (response.status === 401) {
                throw new Error('Unauthorized. Please check your X-Access-Token.');
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle Infotexts in the header
        displayInfoTexts(data.infotexts);

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

// --- EXECUTION: Run every 5s ---
// Execute the function once immediately, then set an interval for auto-refresh
getDepartures();
setInterval(getDepartures, 5000); // 5000 milliseconds = 5 seconds