const { Telegraf, Markup } = require("telegraf");
const tales = require("./data/tales.json");
const bot = new Telegraf(process.env.BOT_TOKEN);

// Уровни
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
  const availableTales = tales.filter((t) => t.level === level);
  if (availableTales.length === 0) {
    ctx.reply("No hay cuentos aún en este nivel 😔");
    return;
  }
  const buttons = availableTales.map((t) => [
    Markup.button.callback(t.title, `tale_${t.slug}`),
  ]);
  ctx.reply(
    `Nivel ${level} seleccionado.\nElige un cuento:`,
    Markup.inlineKeyboard(buttons)
  );
});

bot.action(/tale_(.+)/, (ctx) => {
  const slug = ctx.match[1];
  const tale = tales.find((t) => t.slug === slug);
  if (!tale) return ctx.answerCbQuery("No encontrado");
  ctx.reply(
    tale.text,
    Markup.inlineKeyboard([
      [Markup.button.callback("🔊 Escuchar", `audio_${slug}`)],
      [Markup.button.callback("⬅️ Volver", `volver`)],
    ])
  );
});

bot.action(/audio_(.+)/, async (ctx) => {
  const slug = ctx.match[1];
  const tale = tales.find((t) => t.slug === slug);
  if (!tale || !tale.audio_url) return ctx.reply("Audio no disponible");
  await ctx.replyWithVoice({ url: tale.audio_url });
});

bot.action("volver", (ctx) => {
  const level = userLevels.get(ctx.from.id);
  const availableTales = tales.filter((t) => t.level === level);
  const buttons = availableTales.map((t) => [
    Markup.button.callback(t.title, `tale_${t.slug}`),
  ]);
  ctx.editMessageText(
    `Elige un cuento (nivel ${level}):`,
    Markup.inlineKeyboard(buttons)
  );
});

module.exports = bot;
