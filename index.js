// Weather app JavaScript
// Replace the value of `API_KEY` with your OpenWeatherMap API key.
// Get a free key at: https://openweathermap.org/api

const API_KEY = 'https://api.openweathermap.org/data/2.5/weather?q=kabul&appid=95edeaf586011b343ba9a850a682d917';
// Normalize the API key: if the user accidentally pasted a full URL containing
// an `appid` parameter, extract the actual key automatically.
let KEY = API_KEY;
try {
	if (typeof API_KEY === 'string' && (API_KEY.includes('api.openweathermap.org') || API_KEY.includes('appid='))) {
		const url = new URL(API_KEY);
		const params = new URLSearchParams(url.search);
		const appid = params.get('appid') || params.get('APPID');
		if (appid) KEY = appid;
	}
} catch (e) {
	// ignore parsing errors and fall back to raw value
}

const input = document.getElementById('provinceInput');
const btn = document.getElementById('searchBtn');
const messageEl = document.getElementById('message');
const weatherEl = document.getElementById('weather');
const locationEl = document.getElementById('location');
const tempEl = document.getElementById('temp');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const conditionEl = document.getElementById('condition');
const forecastEl = document.getElementById('forecast');

function showMessage(text, isError = false) {
	messageEl.textContent = text;
	messageEl.classList.toggle('error', isError);
}

function clearMessage() {
	messageEl.textContent = '';
	messageEl.classList.remove('error');
}

async function fetchJson(url) {
	const res = await fetch(url);
	if (!res.ok) {
		const err = new Error(`${res.status} ${res.statusText}`);
		err.status = res.status;
		throw err;
	}
	return res.json();
}

function pickDailyForecast(list) {
	// Group items by date (YYYY-MM-DD) and pick the entry closest to 12:00
	const byDate = {};
	list.forEach(item => {
		const date = item.dt_txt.split(' ')[0];
		if (!byDate[date]) byDate[date] = [];
		byDate[date].push(item);
	});

	const result = Object.keys(byDate).map(date => {
		const entries = byDate[date];
		// prefer 12:00:00 if present
		let pick = entries.find(e => e.dt_txt.includes('12:00:00')) || entries[Math.floor(entries.length/2)];
		return { date, temp: pick.main.temp, weather: pick.weather[0], wind: pick.wind.speed };
	});
	return result.slice(0, 5);
}

function renderCurrent(cityName, data) {
	locationEl.textContent = `${cityName}, ${data.sys.country}`;
	tempEl.textContent = Math.round(data.main.temp);
	humidityEl.textContent = data.main.humidity;
	windEl.textContent = data.wind.speed;
	const w = data.weather[0];
	conditionEl.innerHTML = ` <img src="https://openweathermap.org/img/wn/${w.icon}@2x.png" alt="${w.description}" class="weather-icon"> ${w.description}`;
}

function renderForecast(items) {
	forecastEl.innerHTML = '';
	items.forEach(item => {
		const d = document.createElement('div');
		d.className = 'forecast-day';
		const date = new Date(item.date);
		d.innerHTML = `<strong>${date.toLocaleDateString()}</strong>
			<div><img src="https://openweathermap.org/img/wn/${item.weather.icon}@2x.png" alt="${item.weather.description}" class="weather-icon-small"> ${Math.round(item.temp)} °C — ${item.weather.description}</div>`;
		forecastEl.appendChild(d);
	});
}

async function searchCity(city) {
	if (!city) {
		showMessage('Please enter a city name', true);
		return;
	}
	if (!KEY || KEY.startsWith('YOUR') ) {
		showMessage('Missing or invalid API key. Put your OpenWeatherMap API key into project2/weatherapp.js (or paste full API URL and it will be extracted)', true);
		return;
	}
	clearMessage();
	weatherEl.classList.add('hidden');
	try {
		showMessage('Loading...');
		const q = encodeURIComponent(city);
		const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${q}&units=metric&appid=${KEY}`;
		const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${q}&units=metric&appid=${KEY}`;

		const [current, forecast] = await Promise.all([fetchJson(currentUrl), fetchJson(forecastUrl)]);

		renderCurrent(current.name, current);
		const daily = pickDailyForecast(forecast.list);
		renderForecast(daily);

		weatherEl.classList.remove('hidden');
		// clear and refocus the input so it's ready for the next search
		input.value = '';
		input.focus();
		clearMessage();
	} catch (err) {
		if (err && err.status === 401) {
			showMessage('Unauthorized — your OpenWeatherMap API key is missing or invalid. Replace `API_KEY` in project2/weatherapp.js', true);
		} else {
			showMessage('Could not retrieve weather: ' + err.message, true);
		}
	}
}

btn.addEventListener('click', () => searchCity(input.value.trim()));
input.addEventListener('keydown', (e) => {
	if (e.key === 'Enter') searchCity(input.value.trim());
});


// Optionally: if you want to auto-search the user's location (requires geolocation API)
// navigator.geolocation.getCurrentPosition(async pos => { ... });

