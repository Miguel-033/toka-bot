const { Telegraf, Markup } = require("telegraf");
const https = require("https");
const path = require("path");
const tales = require("./modules/stories");
const relatos = require("./modules/relatos");
const {
  getUserFavorites,
  addFavorite,
  removeFavorite,
} = require("./modules/favorites");
const {
  setupWordOfDay,
  subscribe,
  unsubscribe,
} = require("./modules/wordOfDay");

const agent = new https.Agent({ family: 4 });
const bot = new Telegraf(process.env.BOT_TOKEN, { telegram: { agent } });

console.log("🤖 Бот Toka УСПЕШНО ЗАПУЩЕН");

// ==========================
// Настройки
// ==========================
const levels = ["A1", "A2", "B1", "B2"];
const userLevels = new Map();

// ==========================
// /start
// ==========================
bot.start(async (ctx) => {
  await ctx.replyWithPhoto(
    { source: path.join(__dirname, "toka.jpg") },
    {
      caption: `Привет, ${ctx.from.first_name}! Я Toka 🐸\nТвой помощник для изучения испанского.`,
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Подписаться на слово дня", callback_data: "sub_word" }],
          [{ text: "❌ Отписаться", callback_data: "unsub_word" }],
        ],
      },
    }
  );

  await ctx.reply("Выбери свой уровень:", {
    reply_markup: {
      keyboard: levels
        .map((lvl, i) => (i % 2 === 0 ? [lvl, levels[i + 1]] : []))
        .filter((r) => r.length),
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

// ==========================
// Подписка на слово дня
// ==========================
bot.action("sub_word", (ctx) => {
  subscribe(ctx.chat.id);
  ctx.answerCbQuery("✅ Подписка оформлена!");
  ctx.reply("Теперь ты будешь получать слово дня 📚");
});

bot.action("unsub_word", (ctx) => {
  unsubscribe(ctx.chat.id);
  ctx.answerCbQuery("❌ Подписка отменена");
  ctx.reply("Ты отписался от рассылки слова дня.");
});

// ==========================
// Выбор уровня
// ==========================
bot.hears(levels, (ctx) => {
  const level = ctx.message.text;
  userLevels.set(ctx.from.id, level);
  ctx.reply(`✅ Уровень ${level} выбран. Выбери раздел:`, {
    reply_markup: {
      keyboard: [
        ["📚 Сказки", "🧠 Времена"],
        ["📖 Рассказы", "⭐ Избранное"],
        ["🔁 Сменить уровень"],
      ],
      resize_keyboard: true,
    },
  });
});

// ==========================
// Сказки
// ==========================
bot.hears("📚 Сказки", (ctx) => {
  const level = userLevels.get(ctx.from.id);
  if (!level) return ctx.reply("Сначала выбери уровень.");
  const talesList = tales.filter((t) => t.level === level);
  if (talesList.length === 0) return ctx.reply("Нет сказок на этом уровне 😢");

  const buttons = talesList.map((t) => [
    Markup.button.callback(t.title, `tale_${t.slug}`),
  ]);
  ctx.reply(`Вот сказки для уровня ${level}:`, Markup.inlineKeyboard(buttons));
});

// ==========================
// Рассказы
// ==========================
bot.hears("📖 Рассказы", (ctx) => {
  const level = userLevels.get(ctx.from.id);
  if (!level) return ctx.reply("Сначала выбери уровень.");
  const relatosList = relatos.filter((r) => r.level === level);
  if (relatosList.length === 0)
    return ctx.reply("Нет рассказов на этом уровне 😢");

  const buttons = relatosList.map((r) => [
    Markup.button.callback(r.title, `relato_${r.slug}`),
  ]);
  ctx.reply(
    `Вот рассказы для уровня ${level}:`,
    Markup.inlineKeyboard(buttons)
  );
});

// ==========================
// Избранное
// ==========================
bot.hears("⭐ Избранное", (ctx) => {
  const favs = getUserFavorites(ctx.from.id);
  if (!favs.length)
    return ctx.reply("У тебя нет избранных сказок или рассказов");

  const buttons = favs
    .map((item) => {
      const list = item.type === "tale" ? tales : relatos;
      const story = list.find((s) => s.slug === item.slug);
      if (!story) return null;
      const prefix = item.type === "tale" ? "tale_" : "relato_";
      return [Markup.button.callback(story.title, `${prefix}${item.slug}`)];
    })
    .filter(Boolean);

  ctx.reply("⭐ Твои избранные:", Markup.inlineKeyboard(buttons));
});

function getFavButton(userId, type, slug) {
  const favs = getUserFavorites(userId);
  const isFav = favs.some((item) => item.slug === slug && item.type === type);
  const prefix = type === "tale" ? "favTale" : "favRelato";
  const label = isFav ? "❌ Удалить из избранного" : "⭐ В избранное";
  return Markup.button.callback(label, `${prefix}_${slug}`);
}

// ==========================
// Слово дня (cron + ручной запуск)
// ==========================
const wod = setupWordOfDay(bot, {
  timezone: "Europe/Madrid",
  hour: 10,
  minute: 0,
});

bot.command("wod_now", async (ctx) => {
  await ctx.reply("Запускаю рассылку «слово дня» прямо сейчас…");
  try {
    await wod.broadcast();
    await ctx.reply("✅ Готово");
  } catch (e) {
    console.error(e);
    await ctx.reply("❌ Ошибка, смотри логи.");
  }
});

// ==========================
// Экспорт готового бота
// ==========================
module.exports = bot;
