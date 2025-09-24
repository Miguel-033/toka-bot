require("dotenv").config();
const express = require("express");
const wordOfDay = require("./modules/wordOfDay");

const app = express();

// Подключаем готовый бот
const bot = require("./botLogic");

// эндпоинт для проверки
app.get("/", (req, res) => {
  res.send("🤖 Toka Bot работает");
});

// эндпоинт для теста слова дня
app.get("/test-wod", async (req, res) => {
  await wordOfDay.sendWordOfDay(bot);
  res.send("✅ WOD отправлено");
});

// Привязываем вебхук
app.use(bot.webhookCallback("/telegram"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  const webhookUrl = `${process.env.RENDER_EXTERNAL_URL}/telegram`;
  await bot.telegram.setWebhook(webhookUrl);
  console.log(`🚀 Сервер запущен: ${webhookUrl}`);
});
