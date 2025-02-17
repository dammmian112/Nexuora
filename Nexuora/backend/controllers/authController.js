const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const dataPath = path.join(__dirname, "../data.json");
const SECRET_KEY = process.env.JWT_SECRET || "super_tajny_klucz_123";

const uploadsFolder = path.join(__dirname, "../../uploads"); // Przenieś pliki do głównego katalogu projektu
if (!fs.existsSync(uploadsFolder)) {
    console.log("📂 Tworzę folder uploads...");
    fs.mkdirSync(uploadsFolder, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("📂 Zapisuję do folderu:", uploadsFolder);
        cb(null, uploadsFolder);
    },
    filename: (req, file, cb) => {
        const uniqueFilename = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
        console.log("📷 Nazwa pliku:", uniqueFilename);
        cb(null, uniqueFilename);
    }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Funkcja do wczytywania danych z pliku JSON
function readData() {
    try {
        const jsonData = fs.readFileSync(dataPath, "utf8");
        return JSON.parse(jsonData);
    } catch (err) {
        console.error("❌ Błąd odczytu pliku data.json:", err);
        return { users: [] };
    }
}

// Funkcja do zapisywania danych do pliku JSON
function saveData(data) {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 4), "utf8");
    } catch (err) {
        console.error("❌ Błąd zapisu pliku data.json:", err);
    }
}

// **Zmiana zdjęcia profilowego**
exports.updateAvatar = async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Brak tokena!" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        let data = readData();
        const user = data.users.find(user => user.id === decoded.userId);
        if (!user) return res.status(404).json({ message: "Użytkownik nie znaleziony!" });

        if (!req.file) return res.status(400).json({ message: "Brak pliku!" });

        // **Poprawiona ścieżka avatara**
        user.avatar = `/uploads/${req.file.filename}`;
        saveData(data);

        res.json({ message: "Zdjęcie profilowe zostało zaktualizowane.", avatar: `http://localhost:5001${user.avatar}` });
    } catch (error) {
        console.error("🚨 Błąd zmiany avatara:", error);
        res.status(401).json({ message: "Nieprawidłowy token!" });
    }
};


// **Usuwanie konta**
exports.deleteAccount = async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Brak tokena!" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        let data = readData();
        const userIndex = data.users.findIndex(user => user.id === decoded.userId);

        if (userIndex === -1) return res.status(404).json({ message: "Użytkownik nie znaleziony!" });

        data.users.splice(userIndex, 1);
        saveData(data);

        res.json({ message: "Konto zostało usunięte." });
    } catch (error) {
        res.status(401).json({ message: "Nieprawidłowy token!" });
    }
};


/// Rejestracja użytkownika
exports.register = async (req, res) => {
    console.log("📩 Otrzymane dane w backendzie:", req.body);
    console.log("📷 Otrzymany plik:", req.file ? req.file.filename : "Brak pliku");

    const { firstName, lastName, birthdate, email, username, password } = req.body;

    if (!firstName || !lastName || !birthdate || !email || !username || !password) {
        return res.status(400).json({ message: "Wszystkie pola są wymagane!" });
    }

    let data = readData();
    const existingUser = data.users.find(user => user.email === email || user.username === username);
    if (existingUser) {
        return res.status(400).json({ message: "Użytkownik o tym e-mailu lub nazwie użytkownika już istnieje!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Obsługa avatara użytkownika
    let avatarPath = "/uploads/user-avatar.png"; // Domyślny avatar
    if (req.file) {
        avatarPath = `/uploads/${req.file.filename}`;
    }

    // Sprawdzenie, czy plik się zapisał
    const savedFilePath = path.join(uploadsFolder, req.file?.filename || "");
    if (req.file && !fs.existsSync(savedFilePath)) {
        console.error("❌ Błąd: Plik nie został zapisany w:", savedFilePath);
    } else if (req.file) {
        console.log("✅ Plik zapisany poprawnie w:", savedFilePath);
    }

    const newUser = {
        id: Date.now(),
        firstName,
        lastName,
        birthdate,
        email,
        username,
        password: hashedPassword,
        bio: "",
        age: calculateAge(birthdate),
        avatar: avatarPath, // Ustawiony avatar użytkownika
        friends: []
    };

    data.users.push(newUser);
    saveData(data);

    res.json({ message: "✅ Rejestracja zakończona sukcesem!" });
};

exports.upload = upload;

// Logowanie użytkownika
exports.login = async (req, res) => {
    const { email, password } = req.body;

    let data = readData();
    const user = data.users.find(user => user.email === email);

    if (!user) {
        return res.status(400).json({ message: "Nieprawidłowe dane logowania!" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(400).json({ message: "Nieprawidłowe dane logowania!" });
    }

    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "1h" });

    res.json({ message: "✅ Zalogowano pomyślnie!", token });
};

// Pobieranie profilu użytkownika
exports.getUserProfile = (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    const requestedUserId = req.query.userId; // Pobranie `userId` z URL

    if (!token) return res.status(401).json({ message: "Brak tokena!" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        let data = readData();

        // Jeśli `requestedUserId` istnieje, pobieramy dane innego użytkownika
        const userId = requestedUserId ? Number(requestedUserId) : decoded.userId;
        const user = data.users.find(u => u.id === userId);

        if (!user) return res.status(404).json({ message: "Użytkownik nie znaleziony!" });

        // Tworzymy pełny URL avatara, jeśli istnieje
        let avatarUrl = user.avatar ? `http://localhost:5001${user.avatar}` : "assets/user-avatar.png";

        // Nie zwracamy hasła dla bezpieczeństwa
        const { password, ...userData } = user;
        res.json({ ...userData, avatar: avatarUrl });

    } catch (error) {
        console.error("🚨 Błąd pobierania profilu:", error);
        return res.status(401).json({ message: "Nieprawidłowy token!" });
    }
};





// ✅ Eksportujemy `upload`, żeby można go było używać w `routes.js`
exports.upload = upload;

// 🔄 Aktualizacja BIO użytkownika
exports.updateBio = (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Brak tokena!" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        let data = readData();
        const user = data.users.find(user => user.id === decoded.userId);

        if (!user) {
            return res.status(404).json({ message: "Użytkownik nie znaleziony!" });
        }

        user.bio = req.body.bio;
        saveData(data);

        res.json({ message: "✅ BIO zaktualizowane!" });
    } catch (error) {
        res.status(401).json({ message: "Nieprawidłowy token!" });
    }
};

// ✅ Funkcja do obliczania wieku
function calculateAge(birthdate) {
    const birthDate = new Date(birthdate);
    const today = new Date();
    return today.getFullYear() - birthDate.getFullYear();
}

