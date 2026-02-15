import { tool } from "ai";
import { z } from "zod";

// Open-Meteo – completely free, no API key needed
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

async function geocode(location: string) {
    // The Open-Meteo geocoding API only searches by city name.
    // Strip out state/country info and pass just the first word(s) before a comma.
    const parts = location.split(",").map((s) => s.trim());
    const cityName = parts[0];

    // Try the full query first, then fall back to just city name
    for (const query of [location, cityName]) {
        const res = await fetch(`${GEO_URL}?name=${encodeURIComponent(query)}&count=5&language=en`);
        const data = await res.json();

        if (data.results?.length) {
            // If a state/region was specified, try to match it
            if (parts.length > 1) {
                const stateHint = parts[1].toLowerCase();
                const match = data.results.find((r: any) => r.admin1?.toLowerCase().includes(stateHint) || r.country?.toLowerCase().includes(stateHint) || r.admin1_id?.toString().includes(stateHint));
                if (match) {
                    return {
                        latitude: match.latitude,
                        longitude: match.longitude,
                        name: match.name,
                        region: match.admin1 ?? "",
                        country: match.country,
                    };
                }
            }
            // Otherwise return the first (most populated) result
            const r = data.results[0];
            return {
                latitude: r.latitude,
                longitude: r.longitude,
                name: r.name,
                region: r.admin1 ?? "",
                country: r.country,
            };
        }
    }

    return null;
}

export const getWeather = tool({
    description: "Get the current weather and 3-day forecast for a given location.",
    parameters: z.object({
        location: z.string().describe("City name, optionally with state/country (e.g. 'Springfield, Illinois')"),
    }),
    execute: async ({ location }) => {
        try {
            const geo = await geocode(location);
            if (!geo) return { error: `Could not find location: ${location}` };

            const params = new URLSearchParams({
                latitude: String(geo.latitude),
                longitude: String(geo.longitude),
                current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
                daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
                temperature_unit: "fahrenheit",
                wind_speed_unit: "mph",
                forecast_days: "3",
                timezone: "auto",
            });

            const res = await fetch(`${WEATHER_URL}?${params}`);
            if (!res.ok) {
                return { error: `Weather API returned ${res.status}` };
            }
            const data = await res.json();

            const weatherCodes: Record<number, string> = {
                0: "Clear sky",
                1: "Mainly clear",
                2: "Partly cloudy",
                3: "Overcast",
                45: "Foggy",
                48: "Depositing rime fog",
                51: "Light drizzle",
                53: "Moderate drizzle",
                55: "Dense drizzle",
                61: "Slight rain",
                63: "Moderate rain",
                65: "Heavy rain",
                71: "Slight snow",
                73: "Moderate snow",
                75: "Heavy snow",
                80: "Slight rain showers",
                81: "Moderate rain showers",
                82: "Violent rain showers",
                95: "Thunderstorm",
                96: "Thunderstorm with slight hail",
                99: "Thunderstorm with heavy hail",
            };

            const displayLocation = geo.region ? `${geo.name}, ${geo.region}, ${geo.country}` : `${geo.name}, ${geo.country}`;

            return {
                location: displayLocation,
                current: {
                    temperature: `${data.current.temperature_2m}°F`,
                    humidity: `${data.current.relative_humidity_2m}%`,
                    condition: weatherCodes[data.current.weather_code] ?? "Unknown",
                    wind_speed: `${data.current.wind_speed_10m} mph`,
                },
                forecast: data.daily.time.map((date: string, i: number) => ({
                    date,
                    high: `${data.daily.temperature_2m_max[i]}°F`,
                    low: `${data.daily.temperature_2m_min[i]}°F`,
                    condition: weatherCodes[data.daily.weather_code[i]] ?? "Unknown",
                    rain_chance: `${data.daily.precipitation_probability_max[i]}%`,
                })),
            };
        } catch (err: any) {
            return { error: `Weather lookup failed: ${err.message}` };
        }
    },
});

export const weatherTools = { getWeather };
