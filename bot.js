const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const cron = require("node-cron");

const TELEGRAM_BOT_TOKEN = "8075116249:AAG7Y1hyaskH7Lg2HOXAJwemIRe5R0F-IVM";
const OPENWEATHER_API_KEY = "351fdf5f9ea4febf5908dcc1d56262a9";

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// 📌 Viloyatlar ro‘yxati
const regions = [
  ["Toshkent", "Andijon", "Farg‘ona"],
  ["Namangan", "Samarqand", "Buxoro"],
  ["Xorazm", "Surxondaryo", "Qashqadaryo"],
  ["Jizzax", "Sirdaryo", "Navoiy"]
];

const subscribers = new Map(); // { userId: "Viloyat nomi" }

// 🌍 Asosiy menyuni yuborish funksiyasi
const sendMainMenu = (chatId, message) => {
  bot.sendMessage(chatId, message, {
    reply_markup: {
      keyboard: [["🌍 Ob-havo ma’lumoti", "🔔 Obuna"], ["🚫 Obunani bekor qilish"]],
      resize_keyboard: true,
    },
  });
};

// 📌 START – Asosiy menyu chiqadi
bot.onText(/\/start/, (msg) => {
  sendMainMenu(msg.chat.id, "✅ Xush kelibsiz! Quyidagi tugmalardan foydalaning:");
});

// 🔔 OBUNA – Viloyat tanlash tugmalari chiqadi
bot.onText(/\/subscribe/, (msg) => {
  bot.sendMessage(msg.chat.id, "📢 Obuna bo‘lish uchun viloyatingizni tanlang:", {
    reply_markup: {
      keyboard: regions,
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

// ❌ OBUNANI BEKOR QILISH
bot.onText(/\/unsubscribe/, (msg) => {
  const chatId = msg.chat.id;
  if (subscribers.has(chatId)) {
    subscribers.delete(chatId);
    bot.sendMessage(chatId, "🚫 Obuna bekor qilindi.");
  } else {
    bot.sendMessage(chatId, "⛔ Siz obuna bo‘lmagansiz.");
  }
});

// 🌦 Ob-havo ma’lumoti olish
const getWeather = async (city) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=ru`;
    const response = await axios.get(url);
    const weather = response.data;

    return `
🌍 *${weather.name}* (UZ)
🌡 *Harorat:* ${weather.main.temp}°C
🌬 *Shamol:* ${weather.wind.speed} m/s
💧 *Namlik:* ${weather.main.humidity}%
🔆 *Holat:* ${weather.weather[0].description}
    `;
  } catch (error) {
    return "❌ Ob-havo ma’lumotini olishda xatolik yuz berdi.";
  }
};

// 📌 Foydalanuvchi tugmalarni bossin
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // 🌍 Viloyat tanlash
  if (regions.flat().includes(text)) {
    const weatherMessage = await getWeather(text);
    bot.sendMessage(chatId, weatherMessage, { parse_mode: "Markdown" });

    // Obuna bo‘lsa qo‘shish
    if (subscribers.has(chatId)) {
      subscribers.set(chatId, text);
      bot.sendMessage(chatId, `✅ ${text} viloyati uchun obuna bo‘ldingiz! Har kuni 7:00 da ob-havo ma’lumoti olasiz.`);
    }
  }

  // 🌍 Ob-havo ma’lumoti tugmasi bosildi
  if (text === "🌍 Ob-havo ma’lumoti") {
    bot.sendMessage(chatId, "🌍 Viloyatingizni tanlang:", {
      reply_markup: {
        keyboard: regions,
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }

  // 🔔 Obuna tugmasi bosildi
  if (text === "🔔 Obuna") {
    bot.sendMessage(chatId, "📢 Obuna bo‘lish uchun viloyatingizni tanlang:", {
      reply_markup: {
        keyboard: regions,
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }

  // 🚫 Obunani bekor qilish
  if (text === "🚫 Obunani bekor qilish") {
    if (subscribers.has(chatId)) {
      subscribers.delete(chatId);
      bot.sendMessage(chatId, "🚫 Obuna bekor qilindi.");
    } else {
      bot.sendMessage(chatId, "⛔ Siz obuna bo‘lmagansiz.");
    }
  }
});

// ⏰ Har kuni 07:00 da ob-havo ma’lumotini jo‘natish
cron.schedule("0 7 * * *", async () => {
  for (let [chatId, city] of subscribers) {
    const weatherMessage = await getWeather(city);
    bot.sendMessage(chatId, `🌞 *Ertalabki ob-havo ma’lumoti:*\n\n${weatherMessage}`, { parse_mode: "Markdown" });
  }
});

console.log("🤖 Bot ishlayapti...");