const fs = require("fs");
const path = require("path");

const talesPath = path.join(__dirname, "../data/tales.json");
const tales = JSON.parse(fs.readFileSync(talesPath, "utf-8"));

module.exports = tales;
