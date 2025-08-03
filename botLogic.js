const { Telegraf, Markup } = require("telegraf");
const tales = require("./data/tales.json");
const bot = new Telegraf(process.env.BOT_TOKEN);

// Возможные уровни
const levels = ["A1", "A2", "B1", "B2"];
const userLevels = new Map();

bot.start((ctx) => {
  ctx.replyWithPhoto(
    { source: "toka.jpg" },
    {
      caption: `¡Hola, ${ctx.from.first_name}! Soy Toka 🐸\nTu ayudante para aprender español con cuentos.\nSelecciona tu nivel:`,
      reply_markup: {
        keyboard: levels.map((lvl) => [lvl]),
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }
  );
});

bot.hears(levels, (ctx) => {
  const level = ctx.message.text;
  userLevels.set(ctx.from.id, level);
  ctx.reply(`✅ Nivel ${level} seleccionado. Elige una sección:`, {
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

// Обработка кнопок главного меню

bot.hears("📚 Сказки", (ctx) => {
  const level = userLevels.get(ctx.from.id);
  const talesList = tales.filter((t) => t.level === level);
  if (talesList.length === 0) {
    return ctx.reply("Нет сказок на этом уровне 😢");
  }
  const buttons = talesList.map((t) => [
    Markup.button.callback(t.title, `tale_${t.slug}`),
  ]);
  ctx.reply(`Вот сказки для уровня ${level}:`, Markup.inlineKeyboard(buttons));
});

bot.hears("🔁 Сменить уровень", (ctx) => {
  ctx.reply("Выбери новый уровень:", {
    reply_markup: {
      keyboard: levels.map((lvl) => [lvl]),
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

// Пока-заглушки для остальных пунктов
bot.hears("📖 Рассказы", (ctx) => {
  ctx.reply("Раздел с рассказами пока в разработке...");
});

bot.hears("🧠 Времена", (ctx) => {
  ctx.reply("Здесь будет объяснение грамматических времён 😊");
});

bot.hears("⭐ Избранное", (ctx) => {
  ctx.reply("Ты пока ничего не добавил в избранное ⭐");
});

// Чтение и прослушивание
bot.action(/tale_(.+)/, (ctx) => {
  const slug = ctx.match[1];
  const tale = tales.find((t) => t.slug === slug);
  if (!tale) return ctx.answerCbQuery("Не найдено");
  ctx.reply(
    tale.text,
    Markup.inlineKeyboard([
      [Markup.button.callback("🔊 Слушать", `audio_${slug}`)],
      [Markup.button.callback("⬅️ Назад", `volver`)],
    ])
  );
});

bot.action(/audio_(.+)/, async (ctx) => {
  const slug = ctx.match[1];
  const tale = tales.find((t) => t.slug === slug);
  if (!tale || !tale.audio_url) return ctx.reply("Аудио пока недоступно");
  await ctx.replyWithVoice({ url: tale.audio_url });
});

bot.action("volver", (ctx) => {
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

module.exports = bot;
