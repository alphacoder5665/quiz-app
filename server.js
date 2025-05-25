const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;
const DATA_PATH = path.join(__dirname, "data", "quizzes.json");

if (!fs.existsSync("data")) fs.mkdirSync("data");
if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, "{}");

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/api/quizzes", (req, res) => {
  const data = fs.readFileSync(DATA_PATH, "utf-8");
  //   console.log("Sending quizzes data:", data);
  res.json(JSON.parse(data));
});

app.post("/api/quizzes", (req, res) => {
  let { category, quiz } = req.body;
  if (!category || !quiz)
    return res.status(400).json({ error: "Invalid data" });

  category = category.toLowerCase(); // ✅ Use lowercase

  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  if (!data[category]) data[category] = [];
  data[category].push(quiz);

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

app.post("/api/quizzes/delete", (req, res) => {
  let { category, index } = req.body;
  category = category.toLowerCase(); // ✅ Use lowercase

  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

  if (data[category] && data[category][index]) {
    data[category].splice(index, 1);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Quiz not found" });
  }
});

app.put("/api/quizzes", (req, res) => {
  let { category, index, quiz } = req.body; // ✅ FIXED
  category = category.toLowerCase();

  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

  if (data[category] && data[category][index]) {
    data[category][index] = quiz;
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Quiz not found" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
