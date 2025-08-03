require("dotenv").config();
const express = require("express");
const { Telegraf } = require("telegraf");
const bot = require("./botLogic"); // импортируем логику

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Для Render: webhook от Telegram
app.post("/telegram", (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Toka está en línea 🐸");
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
