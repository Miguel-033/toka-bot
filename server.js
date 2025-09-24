require("dotenv").config();
const express = require("express");
const { Telegraf } = require("telegraf");
const cron = require("node-cron");
const wordOfDay = require("./modules/wordOfDay");

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Основная логика бота
require("./botLogic")(bot);

// Ендпоинт для теста вручную
app.get("/cron/word-of-day", async (req, res) => {
  try {
    await wordOfDay.sendWordOfDay(bot);
    res.send("✅ Слово дня отправлено");
  } catch (err) {
    console.error("Ошибка при отправке слова дня:", err);
    res.status(500).send("❌ Ошибка при отправке");
  }
});

// Планировщик — отправка каждый день в 10:00 по Мадриду
cron.schedule(
  "0 10 * * *",
  async () => {
    console.log("[CRON] Отправка слова дня...");
    try {
      await wordOfDay.sendWordOfDay(bot);
    } catch (err) {
      console.error("Ошибка CRON слова дня:", err);
    }
  },
  { timezone: "Europe/Madrid" }
);

// Корневой маршрут
app.get("/", (req, res) => {
  res.send("🤖 TokaBot запущен (Render)");
});

// Вебхук Telegram
app.use(bot.webhookCallback(`/telegram`));

// Устанавливаем вебхук при запуске
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  const webhookUrl = `${process.env.RENDER_EXTERNAL_URL}/telegram`;
  await bot.telegram.setWebhook(webhookUrl);
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 Webhook установлен: ${webhookUrl}`);
});
