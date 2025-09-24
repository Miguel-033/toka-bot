const fs = require("fs");
const path = require("path");

const relatosPath = path.join(__dirname, "../data/relatos.json");
const relatos = JSON.parse(fs.readFileSync(relatosPath, "utf-8"));

module.exports = relatos;
