require("dotenv").config();
const express = require("express");
const { Telegraf } = require("telegraf");
const cron = require("node-cron");
const wordOfDay = require("./modules/wordOfDay");

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Основная логика бота
require("./botLogic"); // ⚠️ без (bot), потому что botLogic.js уже экспортирует bot

// эндпоинт для проверки
app.get("/", (req, res) => {
  res.send("🤖 Toka Bot работает");
});

// эндпоинт для теста слова дня
app.get("/test-wod", async (req, res) => {
  await wordOfDay.sendWordOfDay(bot);
  res.send("✅ WOD отправлено");
});

// привязка вебхука
app.use(bot.webhookCallback("/telegram"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  const webhookUrl = `${process.env.RENDER_EXTERNAL_URL}/telegram`;
  await bot.telegram.setWebhook(webhookUrl);
  console.log(`🚀 Сервер запущен: ${webhookUrl}`);
});
