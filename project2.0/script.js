/**
 * ==========================================================================
 * AeroSky - Premium Weather Dashboard Application Script
 * Core: Vanilla JS (ES6+), Fetch API, Geolocation, Speech Recognition, Chart.js
 * ==========================================================================
 */

// --------------------------------------------------------------------------
// 1. Application State & Configuration
// --------------------------------------------------------------------------
const CONFIG = {
    // If you have an OpenWeatherMap API key, paste it here. 
    // Otherwise, the dashboard will run in Simulation Mode with mock values.
    API_KEY: '', 
    SIMULATION_MODE: true, // Auto-sets to false if CONFIG.API_KEY is provided
    MOCK_LAT: 27.8978,
    MOCK_LON: 77.3633
};

// Check if an API key is stored in localStorage or hardcoded
const savedApiKey = localStorage.getItem('aerosky_api_key');
if (savedApiKey) {
    CONFIG.API_KEY = savedApiKey;
}
CONFIG.SIMULATION_MODE = CONFIG.API_KEY.trim() === '';

const appState = {
    currentUnit: 'C', // 'C' or 'F'
    currentCity: 'Hodal',
    currentWeather: null,
    forecast: null,
    airQuality: null,
    recentSearches: JSON.parse(localStorage.getItem('recentSearches')) || ['Hodal', 'Delhi', 'New York'],
    favorites: JSON.parse(localStorage.getItem('favoriteCities')) || [],
    chartInstance: null
};

// --------------------------------------------------------------------------
// 2. DOM Elements Selection
// --------------------------------------------------------------------------
const DOM = {
    searchForm: document.getElementById('searchForm'),
    searchInput: document.getElementById('searchInput'),
    voiceSearchBtn: document.getElementById('voiceSearchBtn'),
    locationBtn: document.getElementById('locationBtn'),
    unitToggle: document.getElementById('unitToggle'),
    unitDisplay: document.getElementById('unitDisplay'),
    themeToggle: document.getElementById('themeToggle'),
    favoriteToggleBtn: document.getElementById('favoriteToggleBtn'),
    cityName: document.getElementById('cityName'),
    countryCode: document.getElementById('countryCode'),
    currentDateTime: document.getElementById('currentDateTime'),
    currentTemp: document.getElementById('currentTemp'),
    weatherIconWrapper: document.getElementById('weatherIconWrapper'),
    weatherDescription: document.getElementById('weatherDescription'),
    tempMin: document.getElementById('tempMin'),
    tempMax: document.getElementById('tempMax'),
    feelsLike: document.getElementById('feelsLike'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),
    pressure: document.getElementById('pressure'),
    visibility: document.getElementById('visibility'),
    uvIndex: document.getElementById('uvIndex'),
    aqiValue: document.getElementById('aqiValue'),
    aqiFill: document.getElementById('aqiFill'),
    sunriseTime: document.getElementById('sunriseTime'),
    sunsetTime: document.getElementById('sunsetTime'),
    hourlyScroller: document.getElementById('hourlyScroller'),
    fiveDayForecastGrid: document.getElementById('fiveDayForecastGrid'),
    recentList: document.getElementById('recentList'),
    favoritesList: document.getElementById('favoritesList'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    offlineNotification: document.getElementById('offlineNotification'),
    toastContainer: document.getElementById('toastContainer'),
    dynamicBg: document.getElementById('dynamicBg')
};

// --------------------------------------------------------------------------
// 3. Initialization and Event Listeners
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 1. Initial State Setup
    renderRecentSearches();
    renderFavorites();
    checkNetworkStatus();
    setupTheme();

    // 2. Event Listeners
    DOM.searchForm.addEventListener('submit', handleSearchSubmit);
    DOM.locationBtn.addEventListener('click', handleLocationClick);
    DOM.unitToggle.addEventListener('click', handleUnitToggle);
    DOM.themeToggle.addEventListener('click', handleThemeToggle);
    DOM.favoriteToggleBtn.addEventListener('click', handleFavoriteToggle);
    DOM.voiceSearchBtn.addEventListener('click', handleVoiceSearch);
    
    // Listen for network connectivity status changes
    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', checkNetworkStatus);

    // 3. Prompt for API key on load if not set (silent notice to user)
    if (CONFIG.SIMULATION_MODE) {
        showToast("Running in SIMULATION MODE. Set an OpenWeather API key to pull live weather data.", "info");
    }

    // 4. Initial Weather Load: Attempt auto-detect, fallback to last search or default
    autoDetectLocationOnLoad();
}

function autoDetectLocationOnLoad() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                showToast("Auto-detected location. Loading local weather...", "success");
                fetchWeatherByCoords(latitude, longitude);
            },
            error => {
                console.log("Auto-detect location declined or failed. Loading default city.", error);
                // Fallback to recent search if available, or default London
                const fallbackCity = appState.recentSearches.length > 0 ? appState.recentSearches[0] : appState.currentCity;
                fetchWeatherByCityName(fallbackCity);
            },
            { enableHighAccuracy: false, timeout: 4000, maximumAge: 600000 } // Short timeout for auto-detect
        );
    } else {
        const fallbackCity = appState.recentSearches.length > 0 ? appState.recentSearches[0] : appState.currentCity;
        fetchWeatherByCityName(fallbackCity);
    }
}

// --------------------------------------------------------------------------
// 4. Weather API Integration & Data Fetching
// --------------------------------------------------------------------------

/**
 * Fetch weather by City name
 * Uses async/await and Fetch API
 */
async function fetchWeatherByCityName(city) {
    if (!city || city.trim() === '') {
        showToast("Please enter a valid city name.", "error");
        return;
    }

    showLoader(true);
    
    try {
        if (CONFIG.SIMULATION_MODE) {
            // Simulate API response time
            await new Promise(resolve => setTimeout(resolve, 800));
            const mockData = generateMockWeatherData(city);
            processWeatherData(mockData.weather, mockData.forecast, mockData.aqi);
            addToRecentSearches(city);
        } else {
            // Real API Call
            // 1. Fetch current weather data
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${CONFIG.API_KEY}`;
            const weatherRes = await fetch(weatherUrl);
            
            if (!weatherRes.ok) {
                if (weatherRes.status === 404) throw new Error("City not found.");
                if (weatherRes.status === 401) throw new Error("Invalid API key.");
                throw new Error("Failed to fetch weather data.");
            }
            
            const weatherData = await weatherRes.json();
            const { lat, lon } = weatherData.coord;
            
            // 2. Fetch 5-day forecast
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.API_KEY}`;
            const forecastRes = await fetch(forecastUrl);
            if (!forecastRes.ok) throw new Error("Failed to fetch forecast records.");
            const forecastData = await forecastRes.json();

            // 3. Fetch Air Quality index
            const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`;
            const aqiRes = await fetch(aqiUrl);
            let aqiData = null;
            if (aqiRes.ok) {
                aqiData = await aqiRes.json();
            }

            processWeatherData(weatherData, forecastData, aqiData);
            addToRecentSearches(weatherData.name);
        }
    } catch (error) {
        console.error("Fetch weather error:", error);
        showToast(error.message || "An unexpected network error occurred.", "error");
    } finally {
        showLoader(false);
    }
}

/**
 * Fetch weather by coordinates (Latitude / Longitude)
 */
async function fetchWeatherByCoords(lat, lon) {
    showLoader(true);
    
    try {
        if (CONFIG.SIMULATION_MODE) {
            await new Promise(resolve => setTimeout(resolve, 800));
            const mockData = generateMockWeatherData("Current Location");
            processWeatherData(mockData.weather, mockData.forecast, mockData.aqi);
        } else {
            // Real API Calls
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.API_KEY}`;
            const weatherRes = await fetch(weatherUrl);
            if (!weatherRes.ok) throw new Error("Failed to fetch coordinates weather.");
            const weatherData = await weatherRes.json();

            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.API_KEY}`;
            const forecastRes = await fetch(forecastUrl);
            if (!forecastRes.ok) throw new Error("Failed to fetch coordinate forecasts.");
            const forecastData = await forecastRes.json();

            const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`;
            const aqiRes = await fetch(aqiUrl);
            let aqiData = null;
            if (aqiRes.ok) {
                aqiData = await aqiRes.json();
            }

            processWeatherData(weatherData, forecastData, aqiData);
            addToRecentSearches(weatherData.name);
        }
    } catch (error) {
        console.error("Coords weather error:", error);
        showToast("Error retrieving geolocation weather data.", "error");
    } finally {
        showLoader(false);
    }
}

/**
 * Consolidate data state and invoke DOM renderings
 */
function processWeatherData(weather, forecast, aqi) {
    appState.currentWeather = weather;
    appState.forecast = forecast;
    appState.airQuality = aqi;
    appState.currentCity = weather.name;

    renderCurrentWeather();
    renderHighlights();
    renderHourlyForecast();
    renderFiveDayForecast();
    updateWeatherChart();
    updateDynamicBackground();
    updateFavoriteIconState();
}

// --------------------------------------------------------------------------
// 5. DOM Rendering Methods
// --------------------------------------------------------------------------

function renderCurrentWeather() {
    const data = appState.currentWeather;
    if (!data) return;

    DOM.cityName.textContent = data.name;
    DOM.countryCode.textContent = data.sys.country;
    
    // Format local date and time
    const localTime = new Date((new Date().getTime()) + (data.timezone * 1000) - (3600000 * 5.5)); // Convert timezone offset to milliseconds (adjusting for execution locale if necessary)
    const options = { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    DOM.currentDateTime.textContent = new Date().toLocaleDateString('en-US', options);

    // Temperature display conversion
    const tempValue = Math.round(data.main.temp);
    DOM.currentTemp.textContent = convertTemp(tempValue);
    DOM.tempMin.textContent = convertTempString(Math.round(data.main.temp_min));
    DOM.tempMax.textContent = convertTempString(Math.round(data.main.temp_max));

    // Description
    DOM.weatherDescription.textContent = data.weather[0].description;

    // Weather Icon
    DOM.weatherIconWrapper.innerHTML = getWeatherIconHTML(data.weather[0].icon, data.weather[0].id);
}

function renderHighlights() {
    const weather = appState.currentWeather;
    const aqi = appState.airQuality;
    if (!weather) return;

    // Feels like
    DOM.feelsLike.textContent = convertTempString(Math.round(weather.main.feels_like));
    
    // Humidity
    DOM.humidity.textContent = `${weather.main.humidity}%`;
    
    // Wind Speed
    const windSpeedKmH = Math.round(weather.wind.speed * 3.6); // m/s to km/h conversion
    DOM.windSpeed.textContent = `${windSpeedKmH} km/h`;
    
    // Pressure
    DOM.pressure.textContent = `${weather.main.pressure} hPa`;
    
    // Visibility
    const visibilityKm = (weather.visibility / 1000).toFixed(1);
    DOM.visibility.textContent = `${visibilityKm} km`;

    // Sun Times
    const timezoneOffset = weather.timezone; // Offset in seconds
    DOM.sunriseTime.textContent = formatSunTime(weather.sys.sunrise, timezoneOffset);
    DOM.sunsetTime.textContent = formatSunTime(weather.sys.sunset, timezoneOffset);

    // UV Index (Simulated from weather profile details if live One Call is unavailable)
    const mockUv = calculateUvIndex(weather.coord.lat, weather.weather[0].id);
    DOM.uvIndex.textContent = getUvLabel(mockUv);

    // Air Quality Index
    if (aqi && aqi.list && aqi.list[0]) {
        const aqiVal = aqi.list[0].main.aqi; // values 1 - 5
        const labels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
        const percentage = aqiVal * 20;
        
        DOM.aqiValue.textContent = `${aqiVal} - ${labels[aqiVal - 1]}`;
        DOM.aqiFill.style.width = `${percentage}%`;
        
        // Color aqi bar indicator
        const colors = ["var(--success)", "#a3e635", "var(--warning)", "#fb923c", "var(--error)"];
        DOM.aqiFill.style.background = colors[aqiVal - 1];
    } else {
        DOM.aqiValue.textContent = "N/A";
        DOM.aqiFill.style.width = "0%";
    }
}

function renderHourlyForecast() {
    const forecast = appState.forecast;
    if (!forecast || !forecast.list) return;

    DOM.hourlyScroller.innerHTML = '';
    
    // Take the first 8 items (representing 24 hours of 3-hour blocks)
    const hourlyItems = forecast.list.slice(0, 8);
    
    hourlyItems.forEach(item => {
        const time = formatTimeHour(item.dt, forecast.city.timezone);
        const temp = convertTempString(Math.round(item.main.temp));
        const iconHTML = getWeatherIconHTML(item.weather[0].icon, item.weather[0].id, "1.5rem");

        const element = document.createElement('div');
        element.className = 'hourly-item';
        element.innerHTML = `
            <span>${time}</span>
            ${iconHTML}
            <strong>${temp}</strong>
        `;
        DOM.hourlyScroller.appendChild(element);
    });
}

function renderFiveDayForecast() {
    const forecast = appState.forecast;
    if (!forecast || !forecast.list) return;

    DOM.fiveDayForecastGrid.innerHTML = '';

    // OpenWeather API returns 40 records (5 days, every 3 hours).
    // Filter to capture 1 reading per day (e.g. at 12:00 PM)
    const dailyRecords = forecast.list.filter(item => item.dt_txt.includes("12:00:00"));

    dailyRecords.forEach(item => {
        const dateObj = new Date(item.dt * 1000);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const tempMin = convertTempString(Math.round(item.main.temp_min - 2)); // Dynamic estimate adjustment
        const tempMax = convertTempString(Math.round(item.main.temp_max + 1));
        const iconHTML = getWeatherIconHTML(item.weather[0].icon, item.weather[0].id, "1.25rem");
        const weatherDesc = item.weather[0].main;

        const row = document.createElement('div');
        row.className = 'forecast-day-row';
        row.innerHTML = `
            <span class="day-name">${dayName}</span>
            <div class="forecast-state">
                ${iconHTML}
                <span>${weatherDesc}</span>
            </div>
            <span class="forecast-temp-range">${tempMin} - ${tempMax}</span>
        `;
        DOM.fiveDayForecastGrid.appendChild(row);
    });
}

// --------------------------------------------------------------------------
// 6. Interactive Weather Chart using Chart.js
// --------------------------------------------------------------------------
function updateWeatherChart() {
    const forecast = appState.forecast;
    if (!forecast || !forecast.list) return;

    const canvas = document.getElementById('tempChart');
    if (!canvas) return;

    const hourlyData = forecast.list.slice(0, 8);
    const labels = hourlyData.map(item => formatTimeHour(item.dt, forecast.city.timezone));
    const temps = hourlyData.map(item => {
        const val = Math.round(item.main.temp);
        return appState.currentUnit === 'C' ? val : Math.round((val * 9/5) + 32);
    });

    const isDarkMode = document.body.classList.contains('dark-mode');
    const themeColor = isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 41, 59, 0.7)';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    if (appState.chartInstance) {
        appState.chartInstance.destroy();
    }

    // Gradient filling under line
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 140);
    if (isDarkMode) {
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
    } else {
        gradient.addColorStop(0, 'rgba(2, 132, 199, 0.3)');
        gradient.addColorStop(1, 'rgba(2, 132, 199, 0.0)');
    }

    appState.chartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature',
                data: temps,
                borderColor: isDarkMode ? '#38bdf8' : '#0284c7',
                borderWidth: 2.5,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: isDarkMode ? '#38bdf8' : '#0284c7',
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.parsed.y}°${appState.currentUnit}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: themeColor, font: { family: 'Outfit', size: 10 } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: themeColor, font: { family: 'Outfit', size: 10 } }
                }
            }
        }
    });
}

// --------------------------------------------------------------------------
// 7. Event & Form Handlers
// --------------------------------------------------------------------------

function handleSearchSubmit(e) {
    e.preventDefault();
    const query = DOM.searchInput.value.trim();
    if (query) {
        fetchWeatherByCityName(query);
        DOM.searchInput.value = '';
    } else {
        showToast("Please write a city name to search.", "warning");
    }
}

function handleLocationClick() {
    if (!navigator.geolocation) {
        showToast("Geolocation is not supported by your browser.", "error");
        return;
    }

    showToast("Retrieving device location coordinates...", "info");
    
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
        },
        error => {
            console.error("Geolocation error:", error);
            let errMsg = "Unable to fetch current location.";
            if (error.code === error.PERMISSION_DENIED) {
                errMsg = "Location access denied by user. Search manually or enable browser permissions.";
            }
            showToast(errMsg, "error");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
}

function handleUnitToggle() {
    appState.currentUnit = appState.currentUnit === 'C' ? 'F' : 'C';
    DOM.unitDisplay.textContent = `°${appState.currentUnit}`;
    
    // Rerender values immediately
    renderCurrentWeather();
    renderHighlights();
    renderHourlyForecast();
    renderFiveDayForecast();
    updateWeatherChart();
    
    showToast(`Switched units to Fahrenheit / Celsius.`, "info");
}

function handleThemeToggle() {
    const body = document.body;
    body.classList.toggle('light-mode');
    body.classList.toggle('dark-mode');
    
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('themePreference', isDark ? 'dark' : 'light');
    
    // Refresh theme colors on line chart
    updateWeatherChart();
}

function setupTheme() {
    const savedTheme = localStorage.getItem('themePreference');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    }
}

// --------------------------------------------------------------------------
// 8. Search History & Favorites Management (LocalStorage)
// --------------------------------------------------------------------------

function addToRecentSearches(city) {
    if (!city) return;
    
    // Remove if already exists to move to top
    appState.recentSearches = appState.recentSearches.filter(item => item.toLowerCase() !== city.toLowerCase());
    
    // Add to top of list
    appState.recentSearches.unshift(city);
    
    // Keep max 5 searches
    if (appState.recentSearches.length > 5) {
        appState.recentSearches.pop();
    }
    
    localStorage.setItem('recentSearches', JSON.stringify(appState.recentSearches));
    renderRecentSearches();
}

function renderRecentSearches() {
    DOM.recentList.innerHTML = '';
    
    if (appState.recentSearches.length === 0) {
        DOM.recentList.innerHTML = '<p class="empty-placeholder">No recent searches yet.</p>';
        return;
    }
    
    appState.recentSearches.forEach(city => {
        const element = document.createElement('div');
        element.className = 'location-item-row';
        element.innerHTML = `
            <span>${city}</span>
            <button class="delete-item-btn" title="Remove Search History">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        
        // Click on search item fires fetch
        element.addEventListener('click', (e) => {
            if (e.target.closest('.delete-item-btn')) {
                e.stopPropagation();
                removeRecentSearch(city);
            } else {
                fetchWeatherByCityName(city);
            }
        });
        
        DOM.recentList.appendChild(element);
    });
}

function removeRecentSearch(city) {
    appState.recentSearches = appState.recentSearches.filter(item => item.toLowerCase() !== city.toLowerCase());
    localStorage.setItem('recentSearches', JSON.stringify(appState.recentSearches));
    renderRecentSearches();
}

function handleFavoriteToggle() {
    const city = appState.currentCity;
    if (!city) return;

    const isFav = appState.favorites.some(item => item.toLowerCase() === city.toLowerCase());
    
    if (isFav) {
        // Remove
        appState.favorites = appState.favorites.filter(item => item.toLowerCase() !== city.toLowerCase());
        showToast(`Removed ${city} from favorites.`, "success");
    } else {
        // Add
        appState.favorites.push(city);
        showToast(`Added ${city} to favorites.`, "success");
    }
    
    localStorage.setItem('favoriteCities', JSON.stringify(appState.favorites));
    renderFavorites();
    updateFavoriteIconState();
}

function renderFavorites() {
    DOM.favoritesList.innerHTML = '';
    
    if (appState.favorites.length === 0) {
        DOM.favoritesList.innerHTML = '<p class="empty-placeholder">No favorites saved.</p>';
        return;
    }
    
    appState.favorites.forEach(city => {
        const element = document.createElement('div');
        element.className = 'location-item-row';
        element.innerHTML = `
            <span>${city}</span>
            <i class="fa-solid fa-chevron-right text-muted"></i>
        `;
        
        element.addEventListener('click', () => {
            fetchWeatherByCityName(city);
        });
        
        DOM.favoritesList.appendChild(element);
    });
}

function updateFavoriteIconState() {
    const city = appState.currentCity;
    const isFav = appState.favorites.some(item => item.toLowerCase() === city.toLowerCase());
    
    const icon = DOM.favoriteToggleBtn.querySelector('i');
    if (isFav) {
        icon.className = 'fa-solid fa-star text-yellow';
    } else {
        icon.className = 'fa-regular fa-star';
    }
}

// --------------------------------------------------------------------------
// 9. Voice Speech Recognition Search API
// --------------------------------------------------------------------------
function handleVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        showToast("Voice recognition is not supported in this browser. Try Chrome/Edge.", "error");
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    DOM.voiceSearchBtn.classList.add('recording-active');
    DOM.voiceSearchBtn.innerHTML = '<i class="fa-solid fa-microphone-lines text-red"></i>';
    showToast("Listening... Speak a city name.", "info");
    
    recognition.start();
    
    recognition.onresult = (event) => {
        const speechToText = event.results[0][0].transcript;
        DOM.searchInput.value = speechToText;
        showToast(`Voice input received: "${speechToText}"`, "success");
        fetchWeatherByCityName(speechToText);
    };
    
    recognition.onspeechend = () => {
        recognition.stop();
        resetVoiceButtonState();
    };
    
    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        showToast("Speech recognition error. Please speak clearly or search manually.", "error");
        resetVoiceButtonState();
    };
}

function resetVoiceButtonState() {
    DOM.voiceSearchBtn.classList.remove('recording-active');
    DOM.voiceSearchBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
}

// --------------------------------------------------------------------------
// 10. General Application Utilities
// --------------------------------------------------------------------------

function showLoader(visible) {
    if (visible) {
        DOM.loadingOverlay.classList.remove('hidden');
    } else {
        DOM.loadingOverlay.classList.add('hidden');
    }
}

function checkNetworkStatus() {
    if (navigator.onLine) {
        DOM.offlineNotification.classList.add('hidden');
    } else {
        DOM.offlineNotification.classList.remove('hidden');
        showToast("No internet connection detected. AeroSky is operating offline.", "warning");
    }
}

function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-exclamation';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'info') iconClass = 'fa-circle-info';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    
    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${message}</span>
        <button class="toast-close-btn">&times;</button>
    `;
    
    // Click button to remove
    toast.querySelector('.toast-close-btn').addEventListener('click', () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    });
    
    DOM.toastContainer.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4500);
}

/**
 * Temperature Unit Converter Helpers
 */
function convertTemp(celsius) {
    if (appState.currentUnit === 'C') {
        return celsius;
    }
    return Math.round((celsius * 9/5) + 32);
}

function convertTempString(celsius) {
    const val = convertTemp(celsius);
    return `${val}°${appState.currentUnit}`;
}

function formatSunTime(timestamp, timezoneOffsetSecs) {
    // timestamp is in Unix seconds
    // timezoneOffsetSecs is timezone offset relative to UTC in seconds
    const date = new Date((timestamp + timezoneOffsetSecs) * 1000);
    const utcDate = new Date(timestamp * 1000);
    
    // Format to HH:MM AM/PM in localized city time
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // key index 0 should be 12
    return `${hours}:${minutes} ${ampm}`;
}

function formatTimeHour(timestamp, timezoneOffsetSecs) {
    const date = new Date((timestamp + timezoneOffsetSecs) * 1000);
    let hours = date.getUTCHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:00 ${ampm}`;
}

function calculateUvIndex(latitude, weatherId) {
    // Estimator equation for UV index
    // Closer to equator (latitude 0) = higher UV. Clear sky = higher UV.
    const absoluteLat = Math.abs(latitude);
    let maxPossibleUv = 11 - (absoluteLat / 8); // estimate based on coordinate distance
    
    // Adjust based on cloud cover/weather type (weatherId)
    // Thunderstorm, rain, drizzle, snow block UV rays.
    if (weatherId < 600) maxPossibleUv *= 0.3; // Rain / thunderstorm
    else if (weatherId < 700) maxPossibleUv *= 0.4; // Snow
    else if (weatherId < 800) maxPossibleUv *= 0.5; // Fog/mist
    else if (weatherId === 804) maxPossibleUv *= 0.4; // Overcast clouds
    else if (weatherId > 800) maxPossibleUv *= 0.75; // Broken clouds
    
    return Math.max(1, Math.min(11, Math.round(maxPossibleUv)));
}

function getUvLabel(uv) {
    if (uv <= 2) return `${uv} (Low)`;
    if (uv <= 5) return `${uv} (Mod)`;
    if (uv <= 7) return `${uv} (High)`;
    if (uv <= 10) return `${uv} (Very High)`;
    return `${uv} (Extreme)`;
}

function updateDynamicBackground() {
    const weather = appState.currentWeather;
    if (!weather) return;

    const weatherId = weather.weather[0].id;
    const body = document.body;
    const isDarkMode = body.classList.contains('dark-mode');
    
    let bgGradient = '';
    
    // Thunderstorm
    if (weatherId >= 200 && weatherId < 300) {
        bgGradient = isDarkMode 
            ? 'linear-gradient(135deg, #1e1b4b, #0f172a)' 
            : 'linear-gradient(135deg, #cbd5e1, #64748b)';
    } 
    // Drizzle / Rain
    else if (weatherId >= 300 && weatherId < 600) {
        bgGradient = isDarkMode 
            ? 'linear-gradient(135deg, #0f172a, #1e293b)' 
            : 'linear-gradient(135deg, #b8cddc, #8da6b9)';
    }
    // Snow
    else if (weatherId >= 600 && weatherId < 700) {
        bgGradient = isDarkMode 
            ? 'linear-gradient(135deg, #334155, #1e293b)' 
            : 'linear-gradient(135deg, #f1f5f9, #cbd5e1)';
    }
    // Atmosphere (Fog, Mist)
    else if (weatherId >= 700 && weatherId < 800) {
        bgGradient = isDarkMode 
            ? 'linear-gradient(135deg, #1e293b, #0f172a)' 
            : 'linear-gradient(135deg, #e2e8f0, #94a3b8)';
    }
    // Clear Sky
    else if (weatherId === 800) {
        bgGradient = isDarkMode 
            ? 'linear-gradient(135deg, #0c4a6e, #0f172a)' 
            : 'linear-gradient(135deg, #bae6fd, #e0f2fe)';
    }
    // Clouds
    else if (weatherId > 800) {
        bgGradient = isDarkMode 
            ? 'linear-gradient(135deg, #0f172a, #1c2541)' 
            : 'linear-gradient(135deg, #cbd5e1, #cbd5e1)';
    }

    DOM.dynamicBg.style.background = bgGradient;
}

/**
 * Maps OpenWeather API weather codes to solid FontAwesome visual representation icon trees
 */
function getWeatherIconHTML(iconCode, weatherId, size = "4.5rem") {
    let iconClass = 'fa-cloud-sun'; // default fallback
    let style = '';

    if (weatherId === 800) {
        // Clear sky
        iconClass = iconCode.includes('d') ? 'fa-sun text-yellow' : 'fa-moon';
    } else if (weatherId === 801) {
        // Few clouds
        iconClass = iconCode.includes('d') ? 'fa-cloud-sun' : 'fa-cloud-moon';
    } else if (weatherId === 802) {
        // Scattered clouds
        iconClass = 'fa-cloud';
    } else if (weatherId > 802) {
        // Overcast / Broken clouds
        iconClass = 'fa-cloud';
    } else if (weatherId >= 500 && weatherId < 600) {
        // Rain
        iconClass = 'fa-cloud-showers-heavy';
    } else if (weatherId >= 300 && weatherId < 400) {
        // Drizzle
        iconClass = 'fa-cloud-rain';
    } else if (weatherId >= 200 && weatherId < 300) {
        // Thunderstorm
        iconClass = 'fa-cloud-bolt';
    } else if (weatherId >= 600 && weatherId < 700) {
        // Snow
        iconClass = 'fa-snowflake';
    } else if (weatherId >= 700 && weatherId < 800) {
        // Fog/Atmosphere
        iconClass = 'fa-smog';
    }

    return `<i class="fa-solid ${iconClass}" style="font-size: ${size}; ${style}"></i>`;
}

// --------------------------------------------------------------------------
// 11. Weather Sandbox Simulation Data Engine
// --------------------------------------------------------------------------
function generateMockWeatherData(city) {
    // Generate static details representing typical cities to improve user demonstration on launch
    const name = city.charAt(0).toUpperCase() + city.slice(1);
    
    // Base temperature details on weather state calculations
    let baseTemp = 20; // Default
    let lat = 51.5074;
    let lon = -0.1278;
    let country = "US";

    if (name.toLowerCase().includes('delhi')) {
        baseTemp = 34; lat = 28.6139; lon = 77.2090; country = "IN";
    } else if (name.toLowerCase().includes('london')) {
        baseTemp = 17; lat = 51.5074; lon = -0.1278; country = "GB";
    } else if (name.toLowerCase().includes('tokyo')) {
        baseTemp = 24; lat = 35.6762; lon = 139.6503; country = "JP";
    } else if (name.toLowerCase().includes('new york')) {
        baseTemp = 22; lat = 40.7128; lon = -74.0060; country = "US";
    } else {
        // Random hashes based on string length
        baseTemp = 10 + (name.length * 2) % 25;
        lat = 10 + (name.length * 4) % 60;
        lon = -100 + (name.length * 9) % 200;
        country = name.length % 2 === 0 ? "CA" : "AU";
    }

    // Weather condition selector
    const weatherConditions = [
        { id: 800, main: "Clear", description: "clear sky", icon: "01d" },
        { id: 801, main: "Clouds", description: "few clouds", icon: "02d" },
        { id: 803, main: "Clouds", description: "broken clouds", icon: "04d" },
        { id: 500, main: "Rain", description: "light rain", icon: "10d" },
        { id: 300, main: "Drizzle", description: "light intensity drizzle", icon: "09d" },
        { id: 201, main: "Thunderstorm", description: "thunderstorm with rain", icon: "11d" }
    ];
    
    // Choose weather based on temp metrics hash
    const condIndex = Math.abs(Math.round(baseTemp)) % weatherConditions.length;
    const cond = weatherConditions[condIndex];

    const weather = {
        name: name,
        sys: { country: country, sunrise: 1774059900, sunset: 1774111900 },
        timezone: 19800, // GMT +5:30 default offset
        dt: 1774092000,
        main: {
            temp: baseTemp,
            feels_like: baseTemp - 2 + (condIndex % 3),
            temp_min: baseTemp - 4,
            temp_max: baseTemp + 4,
            humidity: 45 + (condIndex * 10),
            pressure: 1008 + condIndex,
        },
        wind: { speed: 3.5 + (condIndex * 1.2), deg: 180 },
        visibility: 10000 - (condIndex * 1200),
        weather: [cond],
        coord: { lat: lat, lon: lon }
    };

    // Generate 3-hourly forecast values
    const forecastList = [];
    for (let i = 0; i < 40; i++) {
        const dateOffset = new Date();
        dateOffset.setHours(dateOffset.getHours() + (i * 3));
        
        // Cyclic temperature shifts representing day-to-night curves
        const hour = dateOffset.getHours();
        const diurnalCycle = Math.sin((hour - 6) / 24 * 2 * Math.PI) * 5; // highest temperature in afternoon, lowest at dawn
        const randomFluct = Math.sin(i) * 1.5;
        
        forecastList.push({
            dt: Math.round(dateOffset.getTime() / 1000),
            dt_txt: dateOffset.toISOString().replace('T', ' ').substring(0, 19),
            main: {
                temp: baseTemp + diurnalCycle + randomFluct,
                temp_min: baseTemp + diurnalCycle + randomFluct - 2,
                temp_max: baseTemp + diurnalCycle + randomFluct + 2,
                pressure: 1010 + Math.cos(i) * 2,
                humidity: Math.min(100, Math.max(20, 60 - diurnalCycle * 3))
            },
            weather: [weatherConditions[(condIndex + i) % weatherConditions.length]],
            wind: { speed: 3 + Math.sin(i) }
        });
    }

    const forecast = {
        city: { name: name, country: country, timezone: 19800 },
        list: forecastList
    };

    const aqi = {
        list: [{
            main: { aqi: Math.min(5, Math.max(1, (condIndex % 4) + 1)) },
            components: { co: 250, no: 0.5, no2: 5.2, o3: 40.1, so2: 1.2, pm2_5: 12.5, pm10: 25.1, nh3: 0.8 }
        }]
    };

    return { weather, forecast, aqi };
}
