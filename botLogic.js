const { Telegraf, Markup } = require("telegraf");
const https = require("https");
const path = require("path");
const fs = require("fs");
const tales = require("./modules/stories");
const relatos = require("./modules/relatos");
const {
  getUserFavorites,
  addFavorite,
  removeFavorite,
} = require("./modules/favorites");
const { setupWordOfDay } = require("./modules/wordOfDay");

const agent = new https.Agent({ family: 4 });
const bot = new Telegraf(process.env.BOT_TOKEN, { telegram: { agent } });

console.log("🤖 Бот Toka УСПЕШНО ЗАПУЩЕН");

const levels = ["A1", "A2", "B1", "B2"];
const userLevels = new Map();

bot.start(async (ctx) => {
  // 1) Фото + inline-кнопка подписки
  await ctx.replyWithPhoto(
    { source: path.join(__dirname, "toka.jpg") },
    {
      caption: `Привет, ${ctx.from.first_name}! Я Toka 🐸\nТвой помощник для изучения испанского.`,
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Подписаться на слово дня", callback_data: "wod:on" }],
        ],
      },
    }
  );

  // 2) Сообщение с клавиатурой уровней (ReplyKeyboard)
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

bot.hears("🔁 Сменить уровень", (ctx) => {
  ctx.reply("Выбери новый уровень:", {
    reply_markup: {
      keyboard: levels
        .map((lvl, i) => (i % 2 === 0 ? [lvl, levels[i + 1]] : []))
        .filter((r) => r.length),
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

bot.hears("🧠 Времена", (ctx) => {
  ctx.reply("Здесь будет объяснение грамматических времён 😊");
});

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

const { subscribe, unsubscribe } = require("./modules/wordOfDay");

module.exports = (bot) => {
  bot.start((ctx) => {
    ctx.reply(
      "👋 Привет! Я TokaBot. Хочешь получать *Слово дня* каждый день?",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ Подписаться", callback_data: "sub_word" }],
            [{ text: "❌ Отписаться", callback_data: "unsub_word" }],
          ],
        },
      }
    );
  });

  bot.action("sub_word", (ctx) => {
    subscribe(ctx.chat.id);
    ctx.answerCbQuery("✅ Вы подписались на Слово дня!");
    ctx.reply("Отлично! Теперь вы будете получать слово каждый день 📚");
  });

  bot.action("unsub_word", (ctx) => {
    unsubscribe(ctx.chat.id);
    ctx.answerCbQuery("❌ Подписка отменена");
    ctx.reply("Вы отписались от рассылки слова дня.");
  });
};

// Tales

bot.action(/tale_(.+)/, (ctx) => {
  const slug = ctx.match[1];
  const tale = tales.find((t) => t.slug === slug);
  if (!tale) return ctx.answerCbQuery("Не найдено");

  const favBtn = getFavButton(ctx.from.id, "tale", slug);

  ctx.replyWithMarkdownV2(
    `*${tale.title}*`,
    Markup.inlineKeyboard([
      [Markup.button.callback("📖 Читать", `readTale_${slug}`)],
      [Markup.button.callback("🔊 Слушать", `audio_${slug}`)],
      [favBtn],
      [Markup.button.callback("⬅️ Назад", "volverTales")],
    ])
  );
});

bot.action(/readTale_(.+)/, (ctx) => {
  const slug = ctx.match[1];
  const tale = tales.find((t) => t.slug === slug);
  if (!tale) return ctx.answerCbQuery("Не найдено");
  ctx.reply(tale.text);
});

bot.action(/favTale_(.+)/, async (ctx) => {
  const slug = ctx.match[1];
  const tale = tales.find((t) => t.slug === slug);
  if (!tale) return ctx.answerCbQuery("Не найдено");

  const favs = getUserFavorites(ctx.from.id);
  const exists = favs.some(
    (item) => item.slug === slug && item.type === "tale"
  );

  if (exists) {
    removeFavorite(ctx.from.id, { slug, type: "tale" });
  } else {
    addFavorite(ctx.from.id, { slug, type: "tale" });
  }

  const updatedBtn = getFavButton(ctx.from.id, "tale", slug);
  await ctx.editMessageReplyMarkup(
    Markup.inlineKeyboard([
      [Markup.button.callback("📖 Читать", `readTale_${slug}`)],
      [Markup.button.callback("🔊 Слушать", `audio_${slug}`)],
      [updatedBtn],
      [Markup.button.callback("⬅️ Назад", "volverTales")],
    ])
  );
});

// Relatos

bot.action(/relato_(.+)/, (ctx) => {
  const slug = ctx.match[1];
  const relato = relatos.find((r) => r.slug === slug);
  if (!relato) return ctx.answerCbQuery("Не найдено");

  const favBtn = getFavButton(ctx.from.id, "relato", slug);

  ctx.replyWithMarkdownV2(
    `*${relato.title}*`,
    Markup.inlineKeyboard([
      [Markup.button.callback("📖 Читать", `readRelato_${slug}`)],
      [Markup.button.callback("🔊 Слушать", `audioRelato_${slug}`)],
      [favBtn],
      [Markup.button.callback("⬅️ Назад", "volverRelatos")],
    ])
  );
});

bot.action(/readRelato_(.+)/, (ctx) => {
  const slug = ctx.match[1];
  const relato = relatos.find((r) => r.slug === slug);
  if (!relato) return ctx.answerCbQuery("Не найдено");
  ctx.reply(relato.text);
});

bot.action(/favRelato_(.+)/, async (ctx) => {
  const slug = ctx.match[1];
  const relato = relatos.find((r) => r.slug === slug);
  if (!relato) return ctx.answerCbQuery("Не найдено");

  const favs = getUserFavorites(ctx.from.id);
  const exists = favs.some(
    (item) => item.slug === slug && item.type === "relato"
  );

  if (exists) {
    removeFavorite(ctx.from.id, { slug, type: "relato" });
  } else {
    addFavorite(ctx.from.id, { slug, type: "relato" });
  }

  const updatedBtn = getFavButton(ctx.from.id, "relato", slug);
  await ctx.editMessageReplyMarkup(
    Markup.inlineKeyboard([
      [Markup.button.callback("📖 Читать", `readRelato_${slug}`)],
      [Markup.button.callback("🔊 Слушать", `audioRelato_${slug}`)],
      [updatedBtn],
      [Markup.button.callback("⬅️ Назад", "volverRelatos")],
    ])
  );
});

// Audio

bot.action(/audio_(.+)/, async (ctx) => {
  const slug = ctx.match[1];
  const tale = tales.find((t) => t.slug === slug);
  if (!tale || !tale.audio_id)
    return ctx.answerCbQuery("Аудио пока недоступно");
  await ctx.answerCbQuery();
  await ctx.telegram.sendVoice(ctx.chat.id, tale.audio_id);
});

bot.action(/audioRelato_(.+)/, async (ctx) => {
  const slug = ctx.match[1];
  const relato = relatos.find((r) => r.slug === slug);
  if (!relato || !relato.audio_id)
    return ctx.answerCbQuery("Аудио пока недоступно");
  await ctx.answerCbQuery();
  await ctx.telegram.sendVoice(ctx.chat.id, relato.audio_id);
});

// Назад

bot.action("volverTales", (ctx) => {
  const level = userLevels.get(ctx.from.id);
  const talesList = tales.filter((t) => t.level === level);
  const buttons = talesList.map((t) => [
    Markup.button.callback(t.title, `tale_${t.slug}`),
  ]);
  ctx.editMessageText(
    `Сказки уровня ${level}:`,
    Markup.inlineKeyboard(buttons)
  );
});

bot.action("volverRelatos", (ctx) => {
  const level = userLevels.get(ctx.from.id);
  const relatosList = relatos.filter((r) => r.level === level);
  const buttons = relatosList.map((r) => [
    Markup.button.callback(r.title, `relato_${r.slug}`),
  ]);
  ctx.editMessageText(
    `Рассказы уровня ${level}:`,
    Markup.inlineKeyboard(buttons)
  );
});

// Получение file_id для аудио

bot.on("voice", (ctx) => {
  const fileId = ctx.message.voice.file_id;
  console.log("VOICE file_id:", fileId);
  ctx.reply(`file_id: ${fileId}`);
});

// Слово дня
const wod = setupWordOfDay(bot, {
  timezone: "Europe/Madrid",
  hour: 10,
  minute: 0,
});

// Dev-команда, чтобы не ждать времени по крону
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

module.exports = bot;
