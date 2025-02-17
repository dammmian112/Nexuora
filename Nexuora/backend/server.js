require('dotenv').config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const filePath = path.join(__dirname, "../data.json");

// Pomocnicza funkcja do odczytu danych
function readData() {
    if (!fs.existsSync(filePath)) {
        return { posts: [], users: [], stories: [] };
    }
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData);
}

// Udostępnianie folderu frontend jako statycznego
app.use(express.static(path.join(__dirname, "../frontend")));

// 🔹 **Ustawienie landingPage.html jako domyślnej strony**
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/landingPage.html"));
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use((req, res, next) => {
    console.log(`➡ Otrzymano zapytanie: ${req.method} ${req.url}`);
    next();
});

const routes = require("./routes");
app.use("/api", routes);

const PORT = 5001;
app.listen(PORT, () => {
    console.log(` Serwer działa na http://localhost:${PORT}`);
    console.log(` Pliki zdjęć dostępne na http://localhost:${PORT}/uploads/`);
});

// Endpoint do weryfikacji tokena
app.get("/api/verifyToken", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Brak tokena!" });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ valid: true, userId: payload.userId });
    } catch (error) {
        console.error(" Nieprawidłowy token:", error);
        res.status(403).json({ error: "Nieprawidłowy token!" });
    }
});

// Obsługa błędów
app.use((err, req, res, next) => {
    console.error(" Błąd serwera:", err);
    res.status(500).json({ error: "Błąd serwera" });
});
