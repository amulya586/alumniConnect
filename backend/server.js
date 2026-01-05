const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { randomUUID } = require("crypto");

const app = express();
const PORT = 3000;

/* ---------- MIDDLEWARE ---------- */
app.use(cors());
app.use(express.json());

/* ---------- PATHS ---------- */
const FRONTEND_PATH = path.join(__dirname, "..", "frontend");
const DATA_PATH = path.join(__dirname, "data");

/* ---------- SERVE FRONTEND ---------- */
app.use(express.static(FRONTEND_PATH));

/* ---------- HELPERS ---------- */
function readJSON(fileName) {
  return JSON.parse(
    fs.readFileSync(path.join(DATA_PATH, fileName), "utf8")
  );
}

function writeJSON(fileName, data) {
  fs.writeFileSync(
    path.join(DATA_PATH, fileName),
    JSON.stringify(data, null, 2)
  );
}

/* ---------- ROOT (FIX Cannot GET /) ---------- */
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

/* ---------- STUDENTS ---------- */
app.post("/api/students", (req, res) => {
  const { name, college } = req.body;
  if (!name || !college) {
    return res.status(400).json({ error: "Name and college required" });
  }

  const students = readJSON("students.json");
  const student = {
    id: randomUUID(),
    name,
    college
  };

  students.push(student);
  writeJSON("students.json", students);

  res.json(student);
});

/* ---------- ALUMNI ---------- */
app.get("/api/alumni", (req, res) => {
  res.json(readJSON("alumni.json"));
});

app.post("/api/alumni", (req, res) => {
  const alumni = readJSON("alumni.json");

  const newAlumni = {
    id: randomUUID(),
    ...req.body,
    createdAt: Date.now()
  };

  alumni.push(newAlumni);
  writeJSON("alumni.json", alumni);

  res.json(newAlumni);
});

/* ---------- ALUMNI SEARCH ---------- */
app.get("/api/alumni/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const alumni = readJSON("alumni.json");

  const result = alumni.filter(a =>
    (
      a.name +
      " " +
      (a.company || "") +
      " " +
      (a.skills || []).join(" ")
    )
      .toLowerCase()
      .includes(q)
  );

  res.json(result);
});

/* ---------- BOOKINGS ---------- */
app.get("/api/bookings", (req, res) => {
  res.json(readJSON("bookings.json"));
});

app.post("/api/bookings", (req, res) => {
  const bookings = readJSON("bookings.json");

  const booking = {
    id: randomUUID(),
    ...req.body,
    createdAt: Date.now()
  };

  bookings.push(booking);
  writeJSON("bookings.json", bookings);

  res.json(booking);
});

app.delete("/api/bookings/:id", (req, res) => {
  let bookings = readJSON("bookings.json");
  bookings = bookings.filter(b => b.id !== req.params.id);
  writeJSON("bookings.json", bookings);

  res.json({ success: true });
});

/* ---------- BOOKMARKS ---------- */
app.get("/api/bookmarks", (req, res) => {
  res.json(readJSON("bookmarks.json"));
});

app.post("/api/bookmarks", (req, res) => {
  const bookmarks = readJSON("bookmarks.json");
  bookmarks.push(req.body);
  writeJSON("bookmarks.json", bookmarks);

  res.json({ success: true });
});

app.delete("/api/bookmarks/:id", (req, res) => {
  let bookmarks = readJSON("bookmarks.json");
  bookmarks = bookmarks.filter(b => b.alumniId !== req.params.id);
  writeJSON("bookmarks.json", bookmarks);

  res.json({ success: true });
});

/* ---------- START SERVER ---------- */
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
