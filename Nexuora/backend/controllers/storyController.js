const fs = require("fs");
const path = require("path");
const multer = require("multer");
const jwt = require("jsonwebtoken");

const filePath = path.join(__dirname, "../data.json");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "../../uploads/stories");
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});



const upload = multer({ storage });

function writeData(data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

exports.createStory = (req, res) => {
    console.log("📥 Otrzymano żądanie do `createStory`");

    if (!req.file) {
        return res.status(400).json({ error: "Brak pliku!" });
    }

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Brak tokena!" });
    }

    const userId = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString()).userId;

    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const newStory = {
        id: Date.now().toString(),
        userId,
        mediaUrl: `/uploads/stories/${req.file.filename}`,
        mediaType: req.file.mimetype.startsWith("video") ? "video" : "image",
        createdAt: new Date().toISOString()
    };    

    data.stories.push(newStory);  
    writeData(data);

    res.status(201).json({ message: "✅ Relacja dodana!", story: newStory });
};

exports.getStories = (req, res) => {
    console.log("📡 Otrzymano zapytanie GET /stories");

    // Weryfikacja tokena
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Brak tokena!" });
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.error(" Błąd weryfikacji tokena:", error);
        return res.status(403).json({ error: "Nieprawidłowy token!" });
    }
    const currentUserId = payload.userId;

    // Odczyt danych z pliku
    let data;
    try {
        data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (error) {
        console.error(" Błąd odczytu danych:", error);
        return res.status(500).json({ error: "Błąd serwera" });
    }

    // Znalezienie aktualnego użytkownika
    const currentUser = data.users.find(user => user.id === currentUserId);
    if (!currentUser) {
        return res.status(404).json({ error: "Nie znaleziono użytkownika!" });
    }

    // Usuwamy relacje starsze niż 24h
    const now = new Date();
    const recentStories = data.stories.filter(story => {
        const storyTime = new Date(story.createdAt);
        return (now - storyTime) < 24 * 60 * 60 * 1000;
    });

    // Jeśli usunięto jakieś relacje, zapisujemy zmienione dane do pliku
    if (recentStories.length !== data.stories.length) {
        data.stories = recentStories;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    // Filtrujemy relacje: pokazujemy tylko te, których autor jest znajomym lub samym użytkownikiem
    const validStories = recentStories.filter(story => {
        return (story.userId === currentUserId) || (currentUser.friends && currentUser.friends.includes(story.userId));
    });

    // Dodajemy dane autora do każdej relacji
    const storiesWithAuthor = validStories.map(story => {
        const author = data.users.find(u => u.id === story.userId);
        return {
            ...story,
            author: author 
                ? { 
                    id: author.id, 
                    name: `${author.firstName} ${author.lastName}`, 
                    avatar: author.avatar 
                  } 
                : { id: null, name: "Nieznany", avatar: "" }
        };
    });

    console.log(" Aktywne relacje:", storiesWithAuthor);
    res.json({ stories: storiesWithAuthor });
};




exports.upload = upload; 