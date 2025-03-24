const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const TELEGRAM_BOT_TOKEN = "8075116249:AAG7Y1hyaskH7Lg2HOXAJwemIRe5R0F-IVM";
const OPENWEATHER_API_KEY = "351fdf5f9ea4febf5908dcc1d56262a9";


const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

async function getWeather(chatId, city = "Toshkent") {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=ru`;
        const response = await axios.get(url);
        const weather = response.data;

        const weatherMessage = `
🌍 *${weather.name}* (UZ)
🌡 *Harorat:* ${weather.main.temp}°C
🌬 *Shamol:* ${weather.wind.speed} m/s
💧 *Namlik:* ${weather.main.humidity}%
🔆 *Holat:* ${weather.weather[0].description}
        `;

        bot.sendMessage(chatId, weatherMessage, { parse_mode: "Markdown" });
    } catch (error) {
        bot.sendMessage(chatId, "❌ Ob-havo ma’lumotini olishda xatolik yuz berdi.");
    }
}

bot.onText(/\/start/, (msg) => {
    getWeather(msg.chat.id); // Toshkent shahrining ob-havosini chiqarish
});
