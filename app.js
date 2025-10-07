import express from "express";
import path from "path";
import fs from "fs";

const app = express();

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.resolve("views/index.html"));
});

// --------------- API ---------------

app.get("/api/docs", (req, res) => {
  const data = JSON.parse(fs.readFileSync("./data/docs.json", "utf8"));
  res.json(data);
});

app.get("/api/docs/:id", (req, res) => {
  const data = JSON.parse(fs.readFileSync("./data/docs.json", "utf8"));
  const doc = data.files.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(doc);
});

const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, () => {
  console.log("Server is running on port:", PORT);
});
