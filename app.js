// ==========================================
// 1. STARE GLOBALĂ ȘI TEMĂ
// ==========================================
let currentUnit = localStorage.getItem('tempUnit') || 'C';
let currentTheme = localStorage.getItem('appTheme') || 'auto';
let lastWeatherData = null;
let lastLocName = '';
let lastCountry = '';

function applyTheme() {
    const html = document.documentElement;
    const isDark = currentTheme === 'dark' || (currentTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) html.classList.add('dark');
    else html.classList.remove('dark');

    const btnIcon = document.getElementById('theme-icon');
    if(btnIcon) {
        if(currentTheme === 'light') btnIcon.className = 'fa-solid fa-sun text-amber-500 drop-shadow-md transition-transform duration-300 cursor-pointer';
        else if(currentTheme === 'dark') btnIcon.className = 'fa-solid fa-moon text-blue-400 drop-shadow-md transition-transform duration-300 cursor-pointer';
        else btnIcon.className = 'fa-solid fa-circle-half-stroke text-slate-500 dark:text-slate-400 drop-shadow-md transition-transform duration-300 cursor-pointer';
    }
}

function cycleTheme() {
    if(currentTheme === 'auto') currentTheme = 'light';
    else if(currentTheme === 'light') currentTheme = 'dark';
    else currentTheme = 'auto';
    
    localStorage.setItem('appTheme', currentTheme);
    applyTheme();
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if(currentTheme === 'auto') applyTheme();
});
applyTheme();

// ==========================================
// 2. WMO CODES & UTILITARE
// ==========================================
const WMO_CODES = {
    0: { desc: 'Cer senin', icon: 'fa-sun', color: 'text-yellow-400' },
    1: { desc: 'Preponderent senin', icon: 'fa-sun', color: 'text-yellow-400' },
    2: { desc: 'Parțial înnorat', icon: 'fa-cloud-sun', color: 'text-sky-400 dark:text-sky-300' },
    3: { desc: 'Înnorat', icon: 'fa-cloud', color: 'text-slate-400 dark:text-white' },
    45: { desc: 'Ceață', icon: 'fa-smog', color: 'text-slate-400 dark:text-slate-300' },
    48: { desc: 'Ceață înghețată', icon: 'fa-smog', color: 'text-slate-400 dark:text-slate-300' },
    51: { desc: 'Burniță ușoară', icon: 'fa-cloud-rain', color: 'text-blue-400 dark:text-blue-300' },
    53: { desc: 'Burniță moderată', icon: 'fa-cloud-rain', color: 'text-blue-500 dark:text-blue-400' },
    55: { desc: 'Burniță densă', icon: 'fa-cloud-rain', color: 'text-blue-600 dark:text-blue-500' },
    56: { desc: 'Burniță înghețată', icon: 'fa-cloud-rain', color: 'text-cyan-400 dark:text-cyan-300' },
    57: { desc: 'Burniță densă', icon: 'fa-cloud-rain', color: 'text-cyan-500 dark:text-cyan-400' },
    61: { desc: 'Ploaie ușoară', icon: 'fa-cloud-rain', color: 'text-blue-400' },
    63: { desc: 'Ploaie moderată', icon: 'fa-cloud-rain', color: 'text-blue-500' },
    65: { desc: 'Ploaie puternică', icon: 'fa-cloud-showers-heavy', color: 'text-indigo-500 dark:text-indigo-400' },
    66: { desc: 'Ploaie înghețată', icon: 'fa-cloud-rain', color: 'text-cyan-500 dark:text-cyan-400' },
    67: { desc: 'Ploaie puternică', icon: 'fa-cloud-showers-heavy', color: 'text-cyan-600 dark:text-cyan-500' },
    71: { desc: 'Ninsoare ușoară', icon: 'fa-snowflake', color: 'text-indigo-300 dark:text-indigo-200' },
    73: { desc: 'Ninsoare moderată', icon: 'fa-snowflake', color: 'text-indigo-400 dark:text-indigo-300' },
    75: { desc: 'Ninsoare puternică', icon: 'fa-snowflake', color: 'text-indigo-500 dark:text-indigo-400' },
    77: { desc: 'Grindină fină', icon: 'fa-snowflake', color: 'text-indigo-300 dark:text-indigo-200' },
    80: { desc: 'Averse ușoare', icon: 'fa-cloud-rain', color: 'text-blue-400' },
    81: { desc: 'Averse moderate', icon: 'fa-cloud-showers-heavy', color: 'text-blue-500' },
    82: { desc: 'Averse violente', icon: 'fa-cloud-showers-heavy', color: 'text-indigo-500' },
    85: { desc: 'Averse ninsoare', icon: 'fa-snowflake', color: 'text-indigo-300 dark:text-indigo-200' },
    86: { desc: 'Averse ninsoare', icon: 'fa-snowflake', color: 'text-indigo-400 dark:text-indigo-300' },
    95: { desc: 'Furtună', icon: 'fa-cloud-bolt', color: 'text-purple-500 dark:text-purple-400' },
    96: { desc: 'Furtună grindină', icon: 'fa-cloud-bolt', color: 'text-purple-600 dark:text-purple-500' },
    99: { desc: 'Furtună severă', icon: 'fa-cloud-bolt', color: 'text-purple-700 dark:text-purple-600' }
};

const daysRO = ['Dum.', 'Lun.', 'Mar.', 'Mie.', 'Joi', 'Vin.', 'Sâm.'];

function formatTemp(tempC) { 
    return currentUnit === 'F' ? Math.round((tempC * 9/5) + 32) : Math.round(tempC); 
}

function updateDateTime() {
    const now = new Date();
    const optionsDate = { weekday: 'long', day: 'numeric', month: 'long' };
    let dateStr = now.toLocaleDateString('ro-RO', optionsDate);
    const timeStr = now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', hour12: false });
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    document.getElementById('current-datetime').innerHTML = `${dateStr} &bull; ${timeStr}`;
}
setInterval(updateDateTime, 1000);
updateDateTime();

// ==========================================
// 3. API FETCH
// ==========================================
async function getCoordinates(city) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&addressdetails=1&limit=1&accept-language=ro`);
        const data = await res.json();
        if (data && data.length > 0) {
            const place = data[0];
            const addr = place.address || {};
            const cityName = addr.city || addr.town || addr.village || addr.municipality || place.name || city;
            return {
                name: cityName,
                latitude: parseFloat(place.lat),
                longitude: parseFloat(place.lon),
                country_code: addr.country_code ? addr.country_code.toUpperCase() : ''
            };
        }
        return null;
    } catch (err) { return null; }
}

async function getExactCityName(lat, lon) {
    try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ro`);
        const data = await res.json();
        return data.city || data.locality || "Locație necunoscută";
    } catch (err) { return "Locație necunoscută"; }
}

async function getFullData(lat, lon) {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,weather_code,surface_pressure,wind_speed_10m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max,wind_speed_10m_max&past_days=3&timezone=auto`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5&timezone=auto`;
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction&timezone=auto`;

    const [weatherRes, aqiRes, marineRes] = await Promise.allSettled([
        fetch(weatherUrl).then(r => r.json()),
        fetch(aqiUrl).then(r => r.json()),
        fetch(marineUrl).then(r => r.json())
    ]);

    return {
        weather: weatherRes.status === 'fulfilled' ? weatherRes.value : null,
        aqi: aqiRes.status === 'fulfilled' ? aqiRes.value : null,
        marine: marineRes.status === 'fulfilled' ? marineRes.value : null
    };
}

async function loadCity(city) {
    const location = await getCoordinates(city);
    if(location) {
        localStorage.setItem('lastCity', location.name);
        const fullData = await getFullData(location.latitude, location.longitude);
        updateUI(fullData, location.name, location.country_code);
    } else { alert("Orașul nu a fost găsit."); }
}

// ==========================================
// 4. FUNCȚIA DISPECER UI
// ==========================================
function updateUI(fullData, locationName, country) {
    lastWeatherData = fullData;
    lastLocName = locationName;
    lastCountry = country;

    const weather = fullData.weather;
    if(!weather) return;

    const todayStr = weather.current.time.split('T')[0];
    let todayIdx = weather.daily.time.indexOf(todayStr);
    if(todayIdx === -1) todayIdx = 3;

    updateHeaderInfo(locationName, country);
    updateCurrentWeather(weather);
    renderWeatherAnimations(weather.current.weather_code);
    drawPressureChart(weather, todayIdx);
    updateAQI(fullData.aqi);
    updateMarine(fullData.marine);
    updateWardrobeAssistant(weather, todayIdx);
    updateCarWashIndex(weather, todayIdx);
    renderHourlyForecast(weather);
    renderDailyForecast(weather, todayIdx);
}

// ==========================================
// 5. MODULE UI SPECIFICE
// ==========================================
function updateHeaderInfo(locationName, country) {
    document.getElementById('city-name').textContent = country ? `${locationName}, ${country}` : locationName;
    
    document.getElementById('unit-label').textContent = `°${currentUnit}`;
    const heroUnit = document.getElementById('hero-unit');
    if (heroUnit) heroUnit.textContent = `°${currentUnit}`;
}

function updateCurrentWeather(weather) {
    document.getElementById('current-temp').textContent = formatTemp(weather.current.temperature_2m);
    document.getElementById('feels-like').textContent = formatTemp(weather.current.apparent_temperature);
    document.getElementById('wind-speed').textContent = Math.round(weather.current.wind_speed_10m);
    document.getElementById('humidity').textContent = weather.current.relative_humidity_2m;
    document.getElementById('precip').textContent = weather.current.precipitation;
    document.getElementById('current-pressure').textContent = Math.round(weather.current.surface_pressure);
    
    const codeInfo = WMO_CODES[weather.current.weather_code] || WMO_CODES[0];
    document.getElementById('current-desc').textContent = codeInfo.desc;
    
    // Iconita din Hero animata cu group-hover de la nivelul cardului colapsabil
    document.getElementById('current-icon').className = `fa-solid ${codeInfo.icon} text-6xl ${codeInfo.color} drop-shadow-[0_0_15px_currentColor] transition-transform duration-300 group-hover:scale-110 group-active:scale-95`;
}

function renderWeatherAnimations(code) {
    const container = document.getElementById('weather-animations');
    container.innerHTML = ''; 
    if(code !== 0 && code !== 1) {
        for(let i=0; i<4; i++) {
            const cloud = document.createElement('i');
            cloud.className = 'fa-solid fa-cloud cloud-anim';
            cloud.style.top = `${Math.random() * 40}%`;
            cloud.style.fontSize = `${Math.random() * 6 + 4}rem`;
            cloud.style.animationDuration = `${Math.random() * 30 + 30}s`;
            cloud.style.animationDelay = `-${Math.random() * 30}s`;
            container.appendChild(cloud);
        }
    }
    if([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code)) {
        for(let i=0; i<20; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-anim';
            drop.style.left = `${Math.random() * 100}vw`;
            drop.style.animationDuration = `${Math.random() * 0.5 + 0.5}s`;
            drop.style.animationDelay = `${Math.random()}s`;
            container.appendChild(drop);
        }
    }
    if([71,73,75,77,85,86].includes(code)) {
        for(let i=0; i<25; i++) {
            const flake = document.createElement('div');
            flake.className = 'snow-anim bg-white/80';
            flake.style.left = `${Math.random() * 100}vw`;
            flake.style.animationDuration = `${Math.random() * 3 + 2}s`;
            flake.style.animationDelay = `${Math.random() * 2}s`;
            container.appendChild(flake);
        }
    }
}

function updateAQI(aqiData) {
    const valEl = document.getElementById('aqi-val');
    const descEl = document.getElementById('aqi-desc');
    if(!aqiData || !aqiData.current) {
        valEl.textContent = '--'; 
        descEl.innerHTML = ''; 
        return;
    }
    const aqi = aqiData.current.european_aqi;
    valEl.textContent = aqi;
    document.getElementById('aqi-pm25').textContent = aqiData.current.pm2_5.toFixed(1);
    document.getElementById('aqi-pm10').textContent = aqiData.current.pm10.toFixed(1);
    
    let color = 'text-emerald-500 dark:text-emerald-400'; 
    let icon = '<i class="fa-solid fa-thumbs-up"></i>';
    if(aqi > 20) { color = 'text-yellow-500 dark:text-yellow-400'; icon = '<i class="fa-solid fa-thumbs-up"></i>'; }
    if(aqi > 40) { color = 'text-orange-500 dark:text-orange-400'; icon = '<i class="fa-solid fa-thumbs-down"></i>'; }
    if(aqi > 60) { color = 'text-rose-600 dark:text-rose-500'; icon = '<i class="fa-solid fa-thumbs-down"></i>'; }
    if(aqi > 80) { color = 'text-purple-600 dark:text-purple-500'; icon = '<i class="fa-solid fa-thumbs-down"></i>'; }
    
    descEl.innerHTML = icon;
    descEl.className = `text-xl ${color} drop-shadow-md transition-colors duration-300`;
}

function updateMarine(marineData) {
    const module = document.getElementById('marine-module');
    if(!marineData || !marineData.current || marineData.current.wave_height === null) {
        module.classList.add('hidden');
        return;
    }
    module.classList.remove('hidden');
    document.getElementById('marine-wave').textContent = marineData.current.wave_height.toFixed(1);
    const dir = marineData.current.wave_direction;
    document.getElementById('marine-dir').textContent = dir;
    document.getElementById('marine-dir-icon').style.transform = `rotate(${dir}deg)`;
}

function drawPressureChart(weather, todayIdx) {
    const pData = [];
    const labels = [];
    for(let i = todayIdx - 3; i <= todayIdx + 3; i++) {
        if(!weather.daily.time[i]) continue;
        const dDate = new Date(weather.daily.time[i] + "T12:00:00");
        labels.push(i === todayIdx ? 'Azi' : daysRO[dDate.getDay()]);
        const targetTime = weather.daily.time[i] + "T12:00";
        let hIdx = weather.hourly.time.indexOf(targetTime);
        if(hIdx === -1) hIdx = i * 24 + 12; 
        pData.push(weather.hourly.surface_pressure[hIdx]);
    }
    const minP = Math.min(...pData) - 1;
    const maxP = Math.max(...pData) + 1;
    const svg = document.getElementById('pressure-svg');
    svg.setAttribute('viewBox', '0 0 100 40');
    
    let points = '';
    pData.forEach((val, idx) => {
        const x = (idx / (pData.length - 1)) * 100;
        const y = 40 - ((val - minP) / (maxP - minP)) * 36 - 2; 
        points += `${x},${y} `;
    });
    const polyline = `<polyline points="${points.trim()}" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />`;
    
    let dots = '';
    pData.forEach((val, idx) => {
        const x = (idx / (pData.length - 1)) * 100;
        const y = 40 - ((val - minP) / (maxP - minP)) * 36 - 2;
        const isToday = idx === 3;
        dots += `<circle cx="${x}" cy="${y}" r="${isToday ? 2.5 : 1.5}" fill="${isToday ? '#0ea5e9' : '#94a3b8'}" class="drop-shadow-sm" />`;
    });
    svg.innerHTML = polyline + dots;
    document.getElementById('pressure-labels').innerHTML = labels.map((l, i) => `<div class="${i === 3 ? 'text-emerald-500 dark:text-emerald-400 font-bold scale-110' : ''}">${l}</div>`).join('');
}

// Tooltip-uri echipamente garderobă
function getEquipmentTags(temp, code, wind, precipProb, isDay = true) {
    let tags = [];
    if (temp >= 24 && [0, 1, 2].includes(code)) {
        if (isDay) { 
            tags.push({ icon: '🕶️', text: 'Ochelari', desc: 'Soare puternic, protejează-ți ochii.' }); 
            tags.push({ icon: '🧢', text: 'Pălărie', desc: 'Risc de insolație, acoperă-ți capul.' }); 
        }
        tags.push({ icon: '💧', text: 'Apă', desc: 'Temperaturi ridicate, hidratează-te.' });
    }
    if (temp < 10) tags.push({ icon: '🧥', text: 'Geacă', desc: 'Vreme rece, îmbracă-te gros.' });
    if ([95, 96, 99].includes(code)) tags.push({ icon: '⚡', text: 'Furtună', desc: 'Pericol fulgere, evită spațiile deschise.' });
    else if ([71, 73, 75, 77, 85, 86].includes(code)) tags.push({ icon: '🥾', text: 'Bocanci', desc: 'Zăpadă/Lapoviță pe jos.' });
    else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) tags.push({ icon: '☂️', text: 'Umbrelă', desc: 'Precipitații active.' });
    else if (precipProb >= 20 && precipProb < 60) tags.push({ icon: '🌂', text: 'Risc ploaie', desc: 'Șanse de ploaie în acest interval.' });
    if (wind >= 25) tags.push({ icon: '💨', text: 'Vânt', desc: 'Vânt puternic, haine strânse pe corp.' });
    if (tags.length === 0) tags.push({ icon: '👍', text: 'Lejer', desc: 'Vreme optimă, îmbracă-te normal.' });
    
    return tags.map(t => `
        <div class="relative group inline-block w-full cursor-help">
            <span class="w-full bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 text-[10px] text-slate-700 dark:text-slate-200 px-2 py-1.5 rounded-lg flex items-center shadow-sm transition-transform duration-200" onclick="this.style.transform='scale(1.1)'; setTimeout(() => this.style.transform='', 200);">
                <span class="w-4 text-center text-sm">${t.icon}</span> 
                <span class="ml-1 truncate border-b border-dashed border-slate-400/50">${t.text}</span>
            </span>
            <!-- Bubble Tooltip -->
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-800/95 dark:bg-slate-950/95 backdrop-blur-md text-white text-[10px] rounded-xl p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible active:opacity-100 active:visible transition-all duration-300 z-50 border border-slate-600 pointer-events-none text-center leading-tight">
                ${t.desc}
                <div class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-800/95 dark:border-t-slate-950/95"></div>
            </div>
        </div>
    `).join('');
}

function updateWardrobeAssistant(weather, todayIdx) {
    const uvVal = weather.daily.uv_index_max[todayIdx];
    document.getElementById('uv-val').textContent = uvVal.toFixed(1);
    let uvEl = document.getElementById('uv-desc');
    let uvColor = 'text-emerald-500 dark:text-emerald-400';
    
    if(uvVal < 3) { uvEl.textContent = 'Scăzut'; }
    else if(uvVal < 6) { uvEl.textContent = 'Moderat'; uvColor = 'text-yellow-500 dark:text-yellow-400'; }
    else if(uvVal < 8) { uvEl.textContent = 'Ridicat'; uvColor = 'text-orange-500 dark:text-orange-400'; }
    else if(uvVal < 11) { uvEl.textContent = 'F. Ridicat'; uvColor = 'text-rose-600 dark:text-rose-500'; }
    else { uvEl.textContent = 'Extrem'; uvColor = 'text-purple-600 dark:text-purple-500'; }
    uvEl.className = `text-[10px] font-bold uppercase tracking-wide pb-0.5 ${uvColor}`;

    document.getElementById('sunrise-time').textContent = weather.daily.sunrise[todayIdx].split('T')[1];
    document.getElementById('sunset-time').textContent = weather.daily.sunset[todayIdx].split('T')[1];

    const nowHour = new Date(weather.current.time).getHours();
    let sunriseHour = 6, sunsetHour = 19;
    if (weather.daily.sunrise[todayIdx]) {
        sunriseHour = parseInt(weather.daily.sunrise[todayIdx].split('T')[1].split(':')[0]);
        sunsetHour = parseInt(weather.daily.sunset[todayIdx].split('T')[1].split(':')[0]);
    }
    const isDayNow = nowHour >= sunriseHour && nowHour < sunsetHour;
    document.getElementById('equipment-now').innerHTML = getEquipmentTags(weather.current.temperature_2m, weather.current.weather_code, weather.current.wind_speed_10m, 0, isDayNow);
    
    const currentHourIdx = weather.hourly.time.findIndex(t => new Date(t) >= new Date());
    let laterTemp = weather.current.temperature_2m, laterCode = 0, laterWind = 0, laterPrecipProb = 0;
    let laterIsDay = false;
    
    if (currentHourIdx !== -1) {
        const lookahead = Math.min(8, weather.hourly.time.length - currentHourIdx); 
        let codes = [];
        for (let i = currentHourIdx + 1; i < currentHourIdx + lookahead; i++) {
            const h = new Date(weather.hourly.time[i]).getHours();
            if (h >= sunriseHour && h < sunsetHour) laterIsDay = true;
            if (weather.hourly.temperature_2m[i] > laterTemp) laterTemp = weather.hourly.temperature_2m[i];
            if (weather.hourly.wind_speed_10m[i] > laterWind) laterWind = weather.hourly.wind_speed_10m[i];
            codes.push(weather.hourly.weather_code[i]);
        }
        laterCode = Math.max(...codes);
        let badCode = codes.find(c => c >= 50);
        if (badCode) laterCode = badCode;
        laterPrecipProb = weather.daily.precipitation_probability_max[todayIdx]; 
    }
    document.getElementById('equipment-later').innerHTML = getEquipmentTags(laterTemp, laterCode, laterWind, laterPrecipProb, laterIsDay);
    
    const tmrwIdx = todayIdx + 1;
    if(weather.daily.time[tmrwIdx]) {
        document.getElementById('equipment-tomorrow').innerHTML = getEquipmentTags(weather.daily.temperature_2m_max[tmrwIdx], weather.daily.weather_code[tmrwIdx], weather.daily.wind_speed_10m_max[tmrwIdx], weather.daily.precipitation_probability_max[tmrwIdx], true);
    }
}

function updateCarWashIndex(weather, todayIdx) {
    const probToday = weather.daily.precipitation_probability_max[todayIdx] || 0;
    const probTmrw = weather.daily.precipitation_probability_max[todayIdx + 1] || 0;
    const probDay3 = weather.daily.precipitation_probability_max[todayIdx + 2] || 0;
    
    const iconWash = document.getElementById('car-wash-icon');
    const statusWash = document.getElementById('car-wash-status');
    const cardWash = iconWash.closest('.glass-card');
    
    iconWash.className = 'fa-solid fa-car-side text-2xl transition-colors duration-500 cursor-pointer transition-transform duration-200';
    iconWash.setAttribute('onclick', "this.style.transform='scale(1.3)'; setTimeout(() => this.style.transform='', 200);");
    
    cardWash.className = 'glass-card bg-white/40 dark:bg-slate-800/40 rounded-2xl p-5 border-l-4 transition-colors duration-500 shadow-md border-t border-r border-b border-slate-300 dark:border-slate-600';

    if (probToday > 20 || probTmrw > 20) {
        iconWash.classList.add('text-rose-500'); cardWash.classList.add('border-l-rose-500');
        statusWash.textContent = 'Nefavorabil. Precipitații în 24h.';
    } else if (probDay3 > 20) {
        iconWash.classList.add('text-orange-500'); cardWash.classList.add('border-l-orange-500');
        statusWash.textContent = 'Acceptabil. Risc ploaie în 2-3 zile.';
    } else {
        iconWash.classList.add('text-emerald-500'); cardWash.classList.add('border-l-emerald-500');
        statusWash.textContent = 'Vreme excelentă! Fără ploaie 3 zile.';
    }
}

function renderHourlyForecast(weather) {
    const hourlyContainer = document.getElementById('hourly-container');
    hourlyContainer.innerHTML = '';
    const currentHourIdx = weather.hourly.time.findIndex(t => new Date(t) >= new Date());
    
    for(let i = currentHourIdx; i < currentHourIdx + 24; i+=1) { 
        if(!weather.hourly.time[i]) break;
        const timeObj = new Date(weather.hourly.time[i]);
        const hourStr = timeObj.getHours().toString().padStart(2, '0') + ':00';
        const temp = formatTemp(weather.hourly.temperature_2m[i]);
        const hCodeInfo = WMO_CODES[weather.hourly.weather_code[i]] || { icon: 'fa-circle-question', color: 'text-slate-500' };
        
        hourlyContainer.innerHTML += `
            <div class="shrink-0 bg-white/60 dark:bg-slate-900/30 rounded-xl p-3 min-w-[65px] flex flex-col items-center justify-center space-y-2 border border-slate-300 dark:border-slate-700 shadow-sm hover:bg-white/80 dark:hover:bg-slate-800/60 transition cursor-default">
                <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">${hourStr}</div>
                <i class="fa-solid ${hCodeInfo.icon} ${hCodeInfo.color} drop-shadow-md text-xl cursor-pointer transition-transform duration-200" onclick="this.style.transform='scale(1.3)'; setTimeout(() => this.style.transform='', 200);"></i>
                <div class="font-bold text-sm text-slate-800 dark:text-white">${temp}°</div>
            </div>
        `;
    }
}

function renderDailyForecast(weather, todayIdx) {
    const dailyContainer = document.getElementById('daily-container');
    dailyContainer.innerHTML = '';
    for(let i = todayIdx; i < todayIdx + 7; i++) {
        if(!weather.daily.time[i]) break;
        const dateObj = new Date(weather.daily.time[i] + "T12:00:00");
        const isToday = i === todayIdx;
        const dayName = isToday ? 'Astăzi' : daysRO[dateObj.getDay()];
        const minTemp = formatTemp(weather.daily.temperature_2m_min[i]);
        const maxTemp = formatTemp(weather.daily.temperature_2m_max[i]);
        const precipProb = weather.daily.precipitation_probability_max[i] || 0;
        const dCodeInfo = WMO_CODES[weather.daily.weather_code[i]] || { icon: 'fa-circle-question', color: 'text-rose-500' };
        const windMax = weather.daily.wind_speed_10m_max[i] ? Math.round(weather.daily.wind_speed_10m_max[i]) : '--';
        const uvMax = weather.daily.uv_index_max[i] ? weather.daily.uv_index_max[i].toFixed(1) : '--';
        const sunriseTime = weather.daily.sunrise[i] ? weather.daily.sunrise[i].split('T')[1] : '--:--';
        const sunsetTime = weather.daily.sunset[i] ? weather.daily.sunset[i].split('T')[1] : '--:--';

        let uvColorDrop = 'text-emerald-500 dark:text-emerald-400';
        if(uvMax !== '--') {
            if(uvMax < 3) uvColorDrop = 'text-emerald-500 dark:text-emerald-400';
            else if(uvMax < 6) uvColorDrop = 'text-yellow-500 dark:text-yellow-400';
            else if(uvMax < 8) uvColorDrop = 'text-orange-500 dark:text-orange-400';
            else if(uvMax < 11) uvColorDrop = 'text-rose-600 dark:text-rose-500';
            else uvColorDrop = 'text-purple-600 dark:text-purple-500';
        }
        
        dailyContainer.innerHTML += `
            <div class="bg-white/40 dark:bg-slate-900/20 rounded-xl border border-slate-300 dark:border-slate-600 overflow-hidden transition-all duration-300">
                <div class="flex items-center justify-between text-sm p-3 hover:bg-white/60 dark:hover:bg-slate-800/40 cursor-pointer transition" onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('.chevron').classList.toggle('rotate-180')">
                    <div class="w-16 font-semibold ${isToday ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'} flex items-center">
                        ${dayName} <i class="fa-solid fa-chevron-down text-[9px] ml-1.5 text-slate-400 dark:text-slate-500 chevron transition-transform duration-300"></i>
                    </div>
                    <div class="w-8 flex justify-center"><i class="fa-solid ${dCodeInfo.icon} ${dCodeInfo.color} drop-shadow-md text-lg transition-transform duration-200" onclick="event.stopPropagation(); this.style.transform='scale(1.3)'; setTimeout(() => this.style.transform='', 200);"></i></div>
                    <div class="w-14 text-center text-[10px] text-blue-600 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/20 rounded-md py-0.5 font-medium"><i class="fa-solid fa-droplet text-[9px] mr-1 text-blue-500 dark:text-blue-400"></i>${precipProb}%</div>
                    <div class="w-24 text-right font-bold text-slate-800 dark:text-white">${maxTemp}° <span class="text-slate-500 font-medium ml-1">/ ${minTemp}°</span></div>
                </div>
                <div class="hidden bg-slate-100/50 dark:bg-slate-800/30 px-4 pb-3 pt-2 border-t border-slate-300 dark:border-slate-700">
                    <div class="grid grid-cols-2 gap-3 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                        <div class="flex items-center"><i class="fa-solid fa-wind w-4 text-cyan-500 dark:text-cyan-400 drop-shadow-[0_0_2px_rgba(34,211,238,0.4)]"></i> Rafale: ${windMax} km/h</div>
                        <div class="flex items-center"><i class="fa-solid fa-glasses w-4 ${uvColorDrop} drop-shadow-[0_0_2px_currentColor]"></i> UV Max: ${uvMax}</div>
                        <div class="flex items-center"><i class="fa-solid fa-sun w-4 text-amber-500 dark:text-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.4)]"></i> Răsărit: ${sunriseTime}</div>
                        <div class="flex items-center"><i class="fa-solid fa-moon w-4 text-indigo-500 dark:text-indigo-400 drop-shadow-[0_0_2px_rgba(129,140,248,0.4)]"></i> Apus: ${sunsetTime}</div>
                    </div>
                </div>
            </div>
        `;
    }
}

// ==========================================
// 6. EVENT LISTENERS
// ==========================================
document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const city = document.getElementById('search-input').value.trim();
    if(city) { loadCity(city); document.getElementById('search-input').value = ''; }
});

document.getElementById('btn-unit').addEventListener('click', () => {
    currentUnit = currentUnit === 'C' ? 'F' : 'C';
    localStorage.setItem('tempUnit', currentUnit);
    
    document.getElementById('unit-label').textContent = `°${currentUnit}`;
    const heroUnit = document.getElementById('hero-unit');
    if (heroUnit) heroUnit.textContent = `°${currentUnit}`;

    if (lastWeatherData) updateUI(lastWeatherData, lastLocName, lastCountry);
});

document.getElementById('btn-theme').addEventListener('click', cycleTheme);

document.getElementById('btn-location').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                document.getElementById('city-name').textContent = "Se obține locația...";
                const [fullData, exactCityName] = await Promise.all([
                    getFullData(lat, lon), getExactCityName(lat, lon)
                ]);
                localStorage.setItem('lastCity', exactCityName);
                updateUI(fullData, exactCityName, "");
            } catch (err) { alert("Eroare la obținerea datelor meteo."); }
        }, () => alert("Permisiune locație refuzată."));
    }
});

// Drag & Scroll pentru containerul de ore
const hourlySlider = document.getElementById('hourly-section');
const hourlyContainer = document.getElementById('hourly-container');
if (hourlySlider && hourlyContainer) {
    let isDown = false;
    let startX;
    let scrollLeft;

    hourlySlider.addEventListener('mousedown', (e) => {
        isDown = true;
        hourlySlider.classList.add('active:cursor-grabbing');
        startX = e.pageX - hourlyContainer.offsetLeft;
        scrollLeft = hourlyContainer.scrollLeft;
    });
    hourlySlider.addEventListener('mouseleave', () => {
        isDown = false;
        hourlySlider.classList.remove('active:cursor-grabbing');
    });
    hourlySlider.addEventListener('mouseup', () => {
        isDown = false;
        hourlySlider.classList.remove('active:cursor-grabbing');
    });
    hourlySlider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - hourlyContainer.offsetLeft;
        const walk = (x - startX) * 2; 
        hourlyContainer.scrollLeft = scrollLeft - walk;
    });
}

// ==========================================
// 7. LOGICĂ AUTOCOMPLETARE ȘI MODAL PLIMBARE
// ==========================================
function attachAutocomplete(inputId, suggestId, onSelectCallback) {
    const input = document.getElementById(inputId);
    const suggest = document.getElementById(suggestId);
    let timeout;

    input.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        suggest.innerHTML = '';
        suggest.classList.add('hidden');
        
        if(inputId === 'trip-origin' || inputId === 'trip-dest') {
            selectedTrain = null;
            document.getElementById('btn-train-cfr').classList.remove('ring-2', 'ring-emerald-400');
        }

        clearTimeout(timeout);
        if (val.length < 2) return;

        timeout = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&addressdetails=1&limit=8&accept-language=ro`);
                const data = await res.json();
                
                if (data && data.length > 0) {
                    suggest.innerHTML = data.map(place => {
                        const addr = place.address || {};
                        const cityName = addr.city || addr.town || addr.village || addr.municipality || place.name || '';
                        const stateName = addr.state ? `, ${addr.state}` : '';
                        const countryName = addr.country ? ` (${addr.country})` : '';
                        
                        return `<div class="px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer transition flex items-center" data-name="${cityName || place.display_name}">
                            <i class="fa-solid fa-map-pin text-slate-400 dark:text-slate-500 mr-2 text-[10px]"></i>
                            <div class="flex-1 truncate pointer-events-none">
                                <span class="text-slate-600 dark:text-slate-400 text-sm font-medium">${cityName || place.name}</span>
                                <span class="text-slate-400 dark:text-slate-500 text-[10px] ml-1">${stateName}${countryName}</span>
                            </div>
                        </div>`;
                    }).join('');
                    suggest.classList.remove('hidden');

                    Array.from(suggest.children).forEach(item => {
                        item.addEventListener('click', () => {
                            const selectedName = item.getAttribute('data-name');
                            input.value = selectedName;
                            suggest.classList.add('hidden');
                            if(onSelectCallback) onSelectCallback(selectedName);
                        });
                    });
                }
            } catch(err) { console.error(err); }
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if(!input.contains(e.target) && !suggest.contains(e.target)) {
            suggest.classList.add('hidden');
        }
    });
}

attachAutocomplete('search-input', 'main-suggestions', (name) => { loadCity(name); document.getElementById('search-input').value = ''; });
attachAutocomplete('trip-origin', 'orig-suggestions', null);
attachAutocomplete('trip-dest', 'dest-suggestions', null);

let tripMode = 'car';
let selectedTrain = null; 

// ==========================================
// 8. INITIALIZARE FLATPICKR (CALENDAR 24H)
// ==========================================
flatpickr("#trip-datetime", {
    enableTime: true,
    dateFormat: "Y-m-d\\TH:i",
    time_24hr: true,
    locale: "ro",
    onChange: function(selectedDates, dateStr, instance) {
        selectedTrain = null;
        document.getElementById('btn-train-cfr').classList.remove('ring-2', 'ring-emerald-400');
        document.getElementById('trip-summary').classList.add('hidden');
        document.getElementById('trip-results').classList.add('hidden');
    }
});

function openTripModal() {
    document.getElementById('trip-modal').classList.remove('hidden');
    
    // Setăm data și ora curentă în calendar
    const fp = document.getElementById('trip-datetime')._flatpickr;
    if(fp) fp.setDate(new Date());
    
    // Preluăm instant locația afișată pe ecranul principal
    const origInput = document.getElementById('trip-origin');
    origInput.value = lastLocName || localStorage.getItem('lastCity') || '';
}

function closeTripModal() {
    document.getElementById('trip-modal').classList.add('hidden');
    document.getElementById('trip-summary').classList.add('hidden');
    document.getElementById('trip-results').classList.add('hidden');
    selectedTrain = null;
}

function swapTripLocations() {
    const origInput = document.getElementById('trip-origin');
    const destInput = document.getElementById('trip-dest');
    const temp = origInput.value;
    origInput.value = destInput.value;
    destInput.value = temp;

    selectedTrain = null;
    document.getElementById('btn-train-cfr').classList.remove('ring-2', 'ring-emerald-400');
    document.getElementById('trip-summary').classList.add('hidden');
    document.getElementById('trip-results').classList.add('hidden');
}

function setTripMode(mode) {
    tripMode = mode;
    const btnCar = document.getElementById('btn-mode-car');
    const btnTransit = document.getElementById('btn-mode-transit');
    const btnCfr = document.getElementById('btn-train-cfr');
    
    if (mode === 'car') {
        btnCar.className = "flex-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/50 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center";
        btnTransit.className = "flex-1 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/60 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center";
        btnCfr.classList.add('hidden'); 
        selectedTrain = null;
    } else {
        btnTransit.className = "flex-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/50 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center";
        btnCar.className = "flex-1 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/60 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center";
        btnCfr.classList.remove('hidden'); 
    }
}

function fillCurrentLocationTrip() {
    const origInput = document.getElementById('trip-origin');
    origInput.value = "Se obține...";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const name = await getExactCityName(lat, lon);
            origInput.value = name;
        }, () => { origInput.value = savedCity; });
    } else {
        origInput.value = savedCity;
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function openTrainModal() {
    const origName = document.getElementById('trip-origin').value.trim();
    const destName = document.getElementById('trip-dest').value.trim();
    const datetimeVal = document.getElementById('trip-datetime').value;
    
    if(!origName || !destName) {
        alert("Te rog completează Plecarea și Destinația întâi!");
        return;
    }
    document.getElementById('train-modal').classList.remove('hidden');
    const listContainer = document.getElementById('train-list');
    listContainer.innerHTML = '<div class="text-center text-slate-500 dark:text-slate-400 py-6"><i class="fa-solid fa-spinner fa-spin text-3xl mb-3"></i><br>Se interoghează rutele feroviare...</div>';

    try {
        const workerUrl = `https://cfr-api-infofer.spamikus01.workers.dev/?orig=${encodeURIComponent(origName)}&dest=${encodeURIComponent(destName)}&datetime=${encodeURIComponent(datetimeVal)}`;
        const res = await fetch(workerUrl);
        const data = await res.json();

        if (data.trains && data.trains.length > 0) {
            let html = '';
            data.trains.forEach((tr) => {
                const dep = new Date(tr.departureISO);
                const arr = new Date(tr.arrivalISO);
                
                const depStr = dep.toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit', hour12: false});
                const arrStr = arr.toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit', hour12: false});
                const h = Math.floor(tr.durationHrs);
                const m = Math.round((tr.durationHrs - h) * 60);

                const trainNum = tr.trainNumber || "0000";
                const dateFormatted = `${String(dep.getDate()).padStart(2, '0')}.${String(dep.getMonth() + 1).padStart(2, '0')}.${dep.getFullYear()}`;
                
                const isTransfer = tr.isTransfer === true;
                let infoferLink = "";
                
                if(isTransfer) {
                    const cleanOrig = origName.split(',')[0].trim();
                    const cleanDest = destName.split(',')[0].trim();
                    const minsInDay = dep.getHours() * 60 + dep.getMinutes();
                    
                    infoferLink = `https://mersultrenurilor.infofer.ro/ro-RO/Itineraries?DepartureStationName=${encodeURIComponent(cleanOrig)}&ArrivalStationName=${encodeURIComponent(cleanDest)}&DepartureDate=${dateFormatted}&TimeSelectionId=0&MinutesInDay=${minsInDay}&OrderingTypeId=0&ConnectionsTypeId=1&BetweenTrainsMinimumMinutes=&ChangeStationName=`;
                } else {
                    infoferLink = `https://mersultrenurilor.infofer.ro/ro-RO/Tren/${trainNum}?Date=${dateFormatted}`;
                }

                const iconClass = isTransfer ? "fa-route" : "fa-train";

                html += `
                    <div class="bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-300 dark:border-slate-600 hover:border-sky-400 dark:hover:border-sky-500/50 transition flex justify-between items-center cursor-pointer" 
                         onclick="selectCfrTrain('${tr.type}', '${tr.departureISO}', ${tr.durationHrs}, '${destName.replace(/'/g, "\\'")}', '${infoferLink}', ${isTransfer})">
                        <div>
                            <div class="${tr.color} font-bold text-sm mb-1"><i class="fa-solid ${iconClass} mr-1"></i> ${tr.type}</div>
                            <div class="text-[10px] text-slate-500 dark:text-slate-300 uppercase tracking-wide">
                                Plec: <span class="text-slate-800 dark:text-white font-bold text-xs">${depStr}</span> &bull; 
                                Sos: <span class="text-slate-800 dark:text-white font-bold text-xs">${arrStr}</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-[9px] text-slate-500 dark:text-slate-400 uppercase">Durată</div>
                            <div class="text-xs font-bold text-slate-800 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">${h}h ${m}m</div>
                        </div>
                    </div>
                `;
            });
            listContainer.innerHTML = html;
        } else {
            listContainer.innerHTML = '<div class="text-center text-rose-500 dark:text-rose-400 py-4">Eroare la procesarea rutelor.</div>';
        }
    } catch (err) {
        listContainer.innerHTML = '<div class="text-center text-rose-500 dark:text-rose-400 py-4">Eroare la preluarea rutelor.</div>';
    }
}

function closeTrainModal() {
    document.getElementById('train-modal').classList.add('hidden');
}

function selectCfrTrain(type, depIso, durationHrs, destCity, infoferLink, isTransfer) {
    const d = new Date(depIso);
    const fp = document.getElementById('trip-datetime')._flatpickr;
    if(fp) fp.setDate(d);
    
    let station = "Gara " + destCity;
    const cityLow = destCity.toLowerCase();
    if (cityLow.includes('bucure')) station = "București Nord";
    else if (cityLow.includes('timi')) station = "Timișoara Nord";
    else if (cityLow.includes('cluj')) station = "Cluj-Napoca";
    else if (cityLow.includes('iasi') || cityLow.includes('iași')) station = "Iași";
    else if (cityLow.includes('constan')) station = "Constanța";
    
    selectedTrain = { type: type, durationHrs: durationHrs, destStation: station, link: infoferLink, isTransfer: isTransfer };
    closeTrainModal();
    document.getElementById('btn-train-cfr').classList.add('ring-2', 'ring-emerald-400');
}

function getForecastAtTime(weatherData, targetMs) {
    let minDiff = Infinity;
    let closestIdx = 0;
    weatherData.hourly.time.forEach((t, i) => {
        const timeMs = new Date(t).getTime();
        const diff = Math.abs(timeMs - targetMs);
        if(diff < minDiff) { minDiff = diff; closestIdx = i; }
    });
    return {
        temp: weatherData.hourly.temperature_2m[closestIdx],
        code: weatherData.hourly.weather_code[closestIdx]
    };
}

async function processTrip() {
    const origName = document.getElementById('trip-origin').value.trim();
    const destName = document.getElementById('trip-dest').value.trim();
    const datetimeVal = document.getElementById('trip-datetime').value;
    const btn = document.getElementById('btn-process-trip');

    if(!origName || !destName || !datetimeVal) { alert("Te rog completează locațiile și data!"); return; }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Se calculează...';
    
    try {
        const origCoords = await getCoordinates(origName);
        const destCoords = await getCoordinates(destName);
        if(!origCoords || !destCoords) { alert("Nu am putut localiza orașele."); return; }

        let durationHrs = 0;
        let isTrainRoute = (tripMode === 'transit' && selectedTrain !== null);

        if (isTrainRoute) {
            if (selectedTrain.isTransfer) {
                const dist = calculateDistance(origCoords.latitude, origCoords.longitude, destCoords.latitude, destCoords.longitude);
                durationHrs = (dist / 60) + 1.5;
                selectedTrain.durationHrs = durationHrs;
            } else {
                durationHrs = selectedTrain.durationHrs;
            }
        } else {
            const dist = calculateDistance(origCoords.latitude, origCoords.longitude, destCoords.latitude, destCoords.longitude);
            const speed = tripMode === 'car' ? 75 : 50;
            durationHrs = dist / speed;
            if(tripMode === 'transit') durationHrs += 0.5; 
        }

        const depDate = new Date(datetimeVal);
        const arrDate = new Date(depDate.getTime() + durationHrs * 60 * 60 * 1000);
        
        const h = Math.floor(durationHrs);
        const m = Math.round((durationHrs - h) * 60);
        
        const trainTypeText = isTrainRoute ? ` (<a href="${selectedTrain.link}" target="_blank" class="underline text-sky-600 dark:text-sky-400 hover:text-sky-500">${selectedTrain.type} <i class="fa-solid fa-external-link text-xs ml-0.5"></i></a>)` : '';
        document.getElementById('trip-duration').innerHTML = `${h}h ${m}m <span class="text-emerald-600 dark:text-emerald-400 font-normal">${trainTypeText}</span>`;
        
        const arrOptions = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit', hour12: false };
        document.getElementById('trip-arrival').textContent = arrDate.toLocaleString('ro-RO', arrOptions);
        
        const stationTag = document.getElementById('trip-station');
        if (isTrainRoute && !selectedTrain.isTransfer) {
            document.getElementById('trip-station-name').textContent = selectedTrain.destStation;
            stationTag.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(selectedTrain.destStation);
            stationTag.classList.remove('hidden');
        } else {
            stationTag.classList.add('hidden');
        }

        document.getElementById('trip-summary').classList.remove('hidden');

        const [origWeather, destWeather] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${origCoords.latitude}&longitude=${origCoords.longitude}&hourly=temperature_2m,weather_code&timezone=auto`).then(r=>r.json()),
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${destCoords.latitude}&longitude=${destCoords.longitude}&hourly=temperature_2m,weather_code&timezone=auto`).then(r=>r.json())
        ]);

        const wOrig = getForecastAtTime(origWeather, depDate.getTime());
        const wDest = getForecastAtTime(destWeather, arrDate.getTime());

        document.getElementById('res-orig-name').textContent = origName.split(',')[0];
        document.getElementById('res-dest-name').textContent = destName.split(',')[0];

        const codeOrig = WMO_CODES[wOrig.code] || WMO_CODES[0];
        document.getElementById('res-orig-time').textContent = depDate.toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit', hour12: false});
        document.getElementById('res-orig-icon').className = `fa-solid ${codeOrig.icon} text-3xl ${codeOrig.color} drop-shadow-md mb-2`;
        document.getElementById('res-orig-temp').textContent = formatTemp(wOrig.temp);
        document.getElementById('res-orig-desc').textContent = codeOrig.desc;

        const codeDest = WMO_CODES[wDest.code] || WMO_CODES[0];
        document.getElementById('res-dest-time').textContent = arrDate.toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit', hour12: false});
        document.getElementById('res-dest-icon').className = `fa-solid ${codeDest.icon} text-3xl ${codeDest.color} drop-shadow-md mb-2`;
        document.getElementById('res-dest-temp').textContent = formatTemp(wDest.temp);
        document.getElementById('res-dest-desc').textContent = codeDest.desc;

        document.getElementById('trip-results').classList.remove('hidden');

    } catch(e) {
        alert("Eroare la procesare!");
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-bolt mr-2"></i> Procesează Datele';
    }
}

// ==========================================
// 9. LOGICĂ CAMERE WEB CFR
// ==========================================
function openWebcamModal() {
    document.getElementById('webcam-modal').classList.remove('hidden');
}

function closeWebcamModal() {
    document.getElementById('webcam-modal').classList.add('hidden');
}

// ==========================================
// 10. INITIALIZARE LA INCARCAREA PAGINII
// ==========================================
const savedCity = localStorage.getItem('lastCity') || 'Constanța';
document.getElementById('unit-label').textContent = `°${currentUnit}`;
const heroUnitInit = document.getElementById('hero-unit');
if (heroUnitInit) heroUnitInit.textContent = `°${currentUnit}`;
loadCity(savedCity);