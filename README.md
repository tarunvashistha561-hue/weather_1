# AeroSky - Premium Weather Insights Dashboard

AeroSky is a responsive, client-side weather forecasting dashboard featuring a glassmorphism theme. It provides real-time atmospheric metrics, interactive trend analysis, location-based auto-detection, and voice search commands.

Developed using semantic HTML5, modern vanilla CSS3, and modular ES6 JavaScript, AeroSky integrates the OpenWeatherMap API and displays weather trends using Chart.js. It features a simulation fallback engine, allowing the app to run out-of-the-box without requiring an API key.

---

## 🌟 Key Features

*   **Glassmorphism UI**: High-blur translucent card panels with light reflections and subtle box-shadow depth.
*   **Dual Mode Color Theming**: Toggles between Dark Mode and Light Mode with theme transitions.
*   **Detailed Atmospheric Indicators**: Live readings for Feels Like, Humidity, Wind Speed, Pressure, Visibility, Sunrise, Sunset, UV Index, and Air Quality (AQI) indicators.
*   **Weather Trend Charts**: Interactive line charts using Chart.js showing hourly temperature forecasts.
*   **5-Day / 3-Hour Forecasts**: Multi-day weather forecasts dynamically parsed from API feeds.
*   **Advanced Browser Services**:
    *   *Geolocation API*: Auto-detects local coordinates on load and fetches local weather.
    *   *Web Speech Recognition API*: Allows voice search queries by speaking city names.
*   **Local Caches (`localStorage`)**: Stores favorite cities and recent search history.
*   **Connection Resilience**: Displays a notification banner when offline.
*   **Simulation Engine**: Mock data fallback simulator allows testing searched cities offline.

---

## 🛠️ Tech Stack & Technologies

*   **Structure**: HTML5 (Semantic document outline)
*   **Aesthetics**: CSS3 Custom Variables, CSS Grid, Flexbox, Keyframes, Backdrop Filters
*   **Logic**: JavaScript (ES6+), Fetch API, Geolocation API, SpeechRecognition API, Web Storage API (`localStorage`)
*   **Visual Charts**: Chart.js (via CDN)
*   **Icon Sets**: FontAwesome v6 (via CDN)
*   **Fonts**: Google Fonts (Outfit Typeface)

---

## 📁 Directory Structure

```
Weather-Dashboard/
├── index.html         # Document Skeleton & Layout
├── style.css          # Styling & Animations
├── script.js          # Core JavaScript Logic
├── README.md          # Setup & Documentation
└── assets/            # Static Media Assets
    ├── icons/
    ├── images/
    └── animations/
```

---

## 🚀 Installation & Local Launch

### Step 1: Clone or Download the Workspace
Extract this folder to your desktop or desired folder path.

### Step 2: Open in Browser
AeroSky does not require compile steps or server environments. You can run it by:
1.  Double-clicking `index.html` in your file manager to open it in any web browser.
2.  Alternatively, in **VS Code**, install the **Live Server** extension, click **Go Live** on the bottom status bar, and run it on `http://127.0.0.1:5500/index.html`.

---

## 🔑 OpenWeatherMap API Key Setup

By default, the dashboard runs in **Simulation Mode** (generating realistic mock weather data). To connect it to real-world live weather data:

1.  Go to [OpenWeatherMap API Portal](https://openweathermap.org/api) and sign up for a free account.
2.  Once logged in, go to the **API keys** tab and copy your auto-generated API key.
3.  Open `script.js` in a text editor.
4.  Find `CONFIG.API_KEY` (around line 10) and paste your key inside the quotes:
    ```javascript
    const CONFIG = {
        API_KEY: 'PASTE_YOUR_OPENWEATHERMAP_API_KEY_HERE',
        // ...
    };
    ```
5.  Save `script.js` and refresh your browser. The application will now pull live weather data.

---

## ☁️ Deployment Guide

### Option 1: Vercel (Recommended for fast builds)
1.  Go to [Vercel](https://vercel.com) and sign up using your GitHub account.
2.  Click **Add New** > **Project**.
3.  Import your GitHub repository containing the weather project files.
4.  Vercel automatically detects the HTML project. Click **Deploy**.
5.  Your live site URL will be ready within seconds!

### Option 2: Netlify
1.  Go to [Netlify](https://www.netlify.com).
2.  Click **Add new site** > **Deploy manually**.
3.  Drag and drop the entire `Weather-Dashboard` folder containing `index.html`, `style.css`, and `script.js` directly into the Netlify drop area.
4.  Your dashboard is instantly hosted online.

---

## 💻 GitHub Upload Guide

Run these commands in your project's root folder to publish your files to GitHub:

```bash
# 1. Initialize local repository
git init

# 2. Track all files
git add .

# 3. Create initial checkpoint commit
git commit -m "feat: complete responsive weather dashboard with glassmorphism UI"

# 4. Link to your empty GitHub repository
# (Replace with your actual GitHub repository URL)
git remote add origin https://github.com/yourusername/Weather-Dashboard.git

# 5. Rename default branch to main
git branch -M main

# 6. Push code to GitHub
git push -u origin main
```

---

## 📄 Resume Bullet Points (CSE Portfolios)

Here are bullet points you can include in your resume to describe this project:

*   **Responsive Weather Dashboard (AeroSky)** | HTML5, CSS3, JS (ES6+), OpenWeatherMap API, Chart.js
    *   Designed and built a client-side weather forecast application featuring a glassmorphism UI layout, styling properties, animations, and transitions.
    *   Integrated OpenWeatherMap API using asynchronous JavaScript (`async/await`, Promises, Fetch API) to fetch weather variables and 5-day weather records.
    *   Implemented location auto-detection on startup using the Web Geolocation API and voice search capabilities using the native SpeechRecognition API.
    *   Visualized hourly weather predictions by implementing Chart.js line charts. Used `localStorage` for caching search history and bookmarks, and added an offline detector.

---

## 🎓 CSE Lab Viva Interview Q&A

These questions and answers cover key concepts in the project, designed to help you prepare for lab viva examinations:

### Q1: What is the purpose of `<meta name="viewport" content="width=device-width, initial-scale=1.0">` in your HTML?
*   **Answer**: It controls the viewport's size. `width=device-width` instructs the browser to scale the website width to match the screen's size, while `initial-scale=1.0` sets the default zoom level. This is essential for building responsive web applications.

### Q2: What is the difference between CSS Grid and CSS Flexbox? When should you use which?
*   **Answer**: 
    *   **CSS Grid** is a **two-dimensional** layout model (handles columns and rows simultaneously). It is best suited for high-level page layouts (like our sidebar-main layout dashboard).
    *   **CSS Flexbox** is a **one-dimensional** layout model (handles rows OR columns at a time). It is best for aligning child elements within sections (like aligning items in our search bar or header).

### Q3: How did you implement Glassmorphism in CSS?
*   **Answer**: Glassmorphism is styled using `backdrop-filter: blur(12px)` to blur the background behind the card, a semi-transparent background color (`rgba(255, 255, 255, 0.45)`), thin borders (`border: 1px solid rgba(255, 255, 255, 0.08)`) to mimic glass edges, and subtle drop shadows.

### Q4: Explain the difference between `let`, `const`, and `var` variables in JavaScript.
*   **Answer**:
    *   `const` is block-scoped and cannot be reassigned after declaration.
    *   `let` is block-scoped and can be reassigned.
    *   `var` is function-scoped, can be redefined, and is hoisted, which can lead to bugs in modern development.

### Q5: What is the Fetch API and how does it work?
*   **Answer**: The Fetch API provides a global `fetch()` method that makes HTTP requests. It returns a **Promise** that resolves to the `Response` object representing the server response.

### Q6: What is a Promise in JavaScript? What are its three states?
*   **Answer**: A Promise is an object representing the eventual completion (or failure) of an asynchronous operation. Its three states are:
    1.  **Pending**: Initial state, operation is ongoing.
    2.  **Fulfilled**: Asynchronous task completed successfully.
    3.  **Rejected**: Asynchronous task failed with an error.

### Q7: What is the difference between `Promises` and `Async/Await`?
*   **Answer**: `Async/Await` is a syntax wrapper built on top of Promises. It allows us to write asynchronous code that reads sequentially like synchronous code, improving readability and error handling.

### Q8: What does the `defer` attribute do in the `<script>` tag?
*   **Answer**: The `defer` attribute tells the browser to download the JavaScript file in the background while parsing the HTML document, but wait to execute it until the HTML parsing is complete. This prevents scripts from running before the DOM elements they need to target are loaded.

### Q9: What is JSON and why do we use it in API communications?
*   **Answer**: JSON stands for **JavaScript Object Notation**. It is a lightweight, text-based data-interchange format that is language-independent. We use it because it is lightweight, easy for humans to read and write, and simple for browsers to parse into native objects.

### Q10: How did you store search history so it persists after page refreshes?
*   **Answer**: By using the **Web Storage API's `localStorage`**. Since local storage only stores strings, we convert our JavaScript array into a string using `JSON.stringify()` before saving, and retrieve it using `JSON.parse()` to restore the array.

### Q11: Why are latitude and longitude used in weather APIs instead of just city names?
*   **Answer**: City names can be ambiguous (e.g., there are multiple cities named "London" or "Springfield"). Latitude and longitude provide exact GPS coordinates, ensuring accurate weather forecasts for any location on Earth.

### Q12: How did you handle errors like "invalid city names" or "network failure" in your JS code?
*   **Answer**: By wrapping our `fetch` calls in `try...catch` blocks. We inspect the response status (`response.ok`). If it is false, we throw an error (e.g., `"City not found"`). The `catch` block intercepts this error and alerts the user using our toast notification system.

### Q13: What does the browser Geolocation API do, and how did you use it?
*   **Answer**: The Geolocation API allows the user to share their location coordinates with the application. We use `navigator.geolocation.getCurrentPosition()` to fetch their latitude and longitude, and then query the weather API with those coordinates.

### Q14: What is CSS Custom Properties and how did you use them for the theme switch?
*   **Answer**: CSS custom properties are variables declared in CSS (e.g., `--bg-primary`). We define variables inside the `:root` pseudo-class for dark mode and override them under the `.light-mode` class. Toggling the `.light-mode` class on the `<body>` element updates all variable references on the page instantly.

### Q15: What is the purpose of `encodeURIComponent()` in your weather search URL?
*   **Answer**: It encodes special characters (like spaces, ampersands, or question marks) in city names into web-safe URL formats, preventing characters from breaking the HTTP request structure.

---

## 🔮 Future Enhancements

*   **PWA Setup (Progressive Web App)**: Add service workers and manifest files to allow users to install AeroSky on mobile home screens and use basic features offline.
*   **3D Weather Effects**: Integrate canvas or WebGL particle engines to render rain, snow, or fog overlay animations directly on top of cards matching weather reports.
*   **Expanded Weather Alerts**: Integrate weather warnings (hurricanes, floods) using OpenWeatherMap alerts endpoints.
