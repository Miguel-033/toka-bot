// modules/wordOfDay.js
const fs = require("fs");
const path = require("path");

let subscribers = new Set();
const subsFile = path.join(__dirname, "../data/wod_subs.json");

function loadSubscribers() {
  try {
    if (fs.existsSync(subsFile)) {
      subscribers = new Set(JSON.parse(fs.readFileSync(subsFile, "utf-8")));
    }
  } catch (e) {
    console.error("Ошибка загрузки подписчиков WOD:", e);
  }
}

function saveSubscribers() {
  try {
    fs.writeFileSync(subsFile, JSON.stringify([...subscribers], null, 2));
  } catch (e) {
    console.error("Ошибка сохранения подписчиков WOD:", e);
  }
}

function subscribe(chatId) {
  subscribers.add(chatId);
  saveSubscribers();
}

function unsubscribe(chatId) {
  subscribers.delete(chatId);
  saveSubscribers();
}

function getWordOfDay() {
  // Здесь можно сделать загрузку слова из базы или файла
  // Пока — тестовое слово
  return {
    word: "amanecer",
    translation: "рассвет",
    example: "El amanecer en la playa es hermoso.",
  };
}

function setupWordOfDay(
  bot,
  { timezone = "Europe/Madrid", hour = 10, minute = 0 }
) {
  loadSubscribers();

  async function broadcast() {
    const wod = getWordOfDay();
    for (const chatId of subscribers) {
      try {
        await bot.telegram.sendMessage(
          chatId,
          `📚 *Слово дня*\n\n` +
            `🇪🇸 ${wod.word}\n` +
            `🇷🇺 ${wod.translation}\n\n` +
            `💬 ${wod.example}`,
          { parse_mode: "Markdown" }
        );
      } catch (e) {
        console.error(`Ошибка отправки WOD для ${chatId}:`, e);
      }
    }
  }

  // Запуск по крону
  const now = () => new Date();
  setInterval(() => {
    const d = new Date();
    const tzDate = new Date(d.toLocaleString("en-US", { timeZone: timezone }));
    if (tzDate.getHours() === hour && tzDate.getMinutes() === minute) {
      broadcast();
    }
  }, 60 * 1000);

  return { broadcast };
}

module.exports = {
  setupWordOfDay,
  subscribe,
  unsubscribe,
};
