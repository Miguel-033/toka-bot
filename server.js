require("dotenv").config();
const express = require("express");
const bot = require("./botLogic");
const { setupWordOfDay } = require("./modules/wordOfDay");

const app = express();
const PORT = process.env.PORT || 3000;

// Поддержка JSON
app.use(express.json());

// Webhook для Telegram
app.post(`/telegram/${process.env.BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body, res);
});

// Тестовый роут для проверки бота
app.get("/", (req, res) => res.send("✅ Toka Bot работает"));

// ==========================
// 🔹 Новый эндпоинт: тест «Слово дня»
// ==========================
const wod = setupWordOfDay(bot, {
  timezone: "Europe/Madrid",
  hour: 10,
  minute: 0,
});

app.get("/test-wod", async (req, res) => {
  try {
    await wod.broadcast();
    res.send("✅ Тестовая рассылка «Слово дня» отправлена");
  } catch (err) {
    console.error("Ошибка тестовой рассылки:", err);
    res.status(500).send("❌ Ошибка при отправке тестового слова дня");
  }
});

// ==========================
// Запуск сервера
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
