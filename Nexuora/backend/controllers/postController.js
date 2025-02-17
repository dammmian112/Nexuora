const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data.json");

// Funkcja pomocnicza: Odczytaj dane
function readData() {
    if (!fs.existsSync(filePath)) {
        return { posts: [], users: [] };
    }
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData);
}

// Funkcja pomocnicza: Zapisz dane
function writeData(data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Tworzenie posta
exports.createPost = (req, res) => {
    const { content } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Brak tokena!" });
    const userId = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString()).userId;

    const data = readData();
    const newPost = {
        id: Date.now().toString(),
        userId,
        author: `Użytkownik ${userId}`,
        content,
        likes: 0
    };

    data.posts.push(newPost);
    writeData(data);
    res.status(201).json(newPost);
};

// Pobieranie postów
exports.getPosts = (req, res) => {
    const data = readData();

    // Dodaj nazwę i avatar użytkownika do każdego posta
    const postsWithAvatars = data.posts.map(post => {
        const user = data.users.find(u => u.id === post.userId);
        return {
            ...post,
            avatar: user && user.avatar ? user.avatar : null, // Jeśli użytkownik ma avatar, zwróć go
            username: user ? `${user.firstName} ${user.lastName}` : "Anonim"
        };
    });

    res.json(postsWithAvatars);
};


// Lajkowanie posta
exports.likePost = (req, res) => {
    const { postId } = req.body;
    const data = readData();

    const post = data.posts.find(p => p.id === postId);
    if (!post) return res.status(404).json({ error: "Post nie istnieje" });

    post.likes += 1;
    writeData(data);
    res.json(post);
};

// Usuwanie posta
exports.deletePost = (req, res) => {
    const { postId } = req.params;

    // Pobierz token z nagłówka i sprawdź czy został przesłany
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
         return res.status(401).json({ message: "Brak tokena!" });
    }

    let payload;
    try {
         payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    } catch (error) {
         return res.status(401).json({ message: "Błędny token!" });
    }
    const userId = payload.userId;

    let data = readData();

    // Znajdź post do usunięcia
    const postIndex = data.posts.findIndex(post => post.id === postId);
    if (postIndex === -1) {
        return res.status(404).json({ message: "Post nie istnieje" });
    }

    // Sprawdź, czy użytkownik usuwający jest autorem posta
    if (data.posts[postIndex].userId !== userId) {
         return res.status(403).json({ message: "Nie masz uprawnień do usunięcia tego posta" });
    }

    // Usuń post
    data.posts.splice(postIndex, 1);
    writeData(data);

    res.json({ message: "✅ Post został usunięty!" });
};

