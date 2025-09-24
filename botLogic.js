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

bot.action(/tale_(.+)/, (ctx) => {
  const slug = ctx.match[1];
  const tale = tales.find((t) => t.slug === slug);
  if (!tale) return ctx.answerCbQuery("Не найдено");

  ctx.replyWithMarkdownV2(
    `*${tale.title}*`,
    Markup.inlineKeyboard([
      [Markup.button.callback("📖 Читать", `readTale_${slug}`)],
      [Markup.button.callback("🔊 Слушать", `audio_${slug}`)],
      [Markup.button.callback("⬅️ Назад", "volverTales")],
    ])
  );
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

bot.action(/relato_(.+)/, (ctx) => {
  const slug = ctx.match[1];
  const relato = relatos.find((r) => r.slug === slug);
  if (!relato) return ctx.answerCbQuery("Не найдено");

  ctx.replyWithMarkdownV2(
    `*${relato.title}*`,
    Markup.inlineKeyboard([
      [Markup.button.callback("📖 Читать", `readRelato_${slug}`)],
      [Markup.button.callback("🔊 Слушать", `audioRelato_${slug}`)],
      [Markup.button.callback("⬅️ Назад", "volverRelatos")],
    ])
  );
});

// ==========================
// Экспорт готового бота
// ==========================
module.exports = bot;
