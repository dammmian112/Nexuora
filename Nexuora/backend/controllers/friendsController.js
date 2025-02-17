const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const dataPath = path.join(__dirname, "../data.json");
const SECRET_KEY = process.env.JWT_SECRET || "super_tajny_klucz_123";

function readData() {
    try {
        const jsonData = fs.readFileSync(dataPath, "utf8");
        return JSON.parse(jsonData);
    } catch (err) {
        return { users: [] };
    }
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 4), "utf8");
}

// Wyszukiwanie użytkowników
exports.searchFriends = (req, res) => {
    const query = req.query.query?.toLowerCase();
    if (!query) {
        return res.status(400).json({ message: "Brak zapytania!" });
    }

    const data = readData();

    const results = data.users.filter(user =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query)
    );

    res.json(results);
};

// Pobieranie znajomych online
exports.getOnlineFriends = (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Brak tokena!" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        let data = readData();
        const user = data.users.find(u => u.id === decoded.userId);

        if (!user) return res.status(404).json({ message: "Użytkownik nie znaleziony!" });

        // Pobieramy znajomych użytkownika
        const onlineFriends = user.friends
            .map(friendId => data.users.find(u => u.id === friendId))
            .filter(friend => friend) // Usuwa null, gdyby znajomy nie istniał
            .map(friend => ({
                id: friend.id,
                name: `${friend.firstName} ${friend.lastName}`,
                avatar: friend.avatar ? `http://localhost:5001${friend.avatar}` : "assets/user-avatar.png"
            }));

        res.json({ onlineFriends });
    } catch (error) {
        console.error(" Błąd pobierania znajomych online:", error);
        res.status(500).json({ message: "Błąd serwera" });
    }
};




exports.getFriendRequests = (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        console.error(" Brak tokena!");
        return res.status(401).json({ message: "Brak tokena!" });
    }
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.userId;
        let data = readData();
        const user = data.users.find(u => u.id === userId);
        if (!user) {
            console.error(" Użytkownik nie znaleziony!");
            return res.status(404).json({ message: "Użytkownik nie znaleziony!" });
        }
        // Pobierz listę zaproszeń jako tablicę obiektów
        const friendRequestsIds = user.friendRequests || [];
        const friendRequests = friendRequestsIds.map(id => {
            const sender = data.users.find(u => u.id === id);
            return sender
                ? {
                      id: sender.id,
                      firstName: sender.firstName,
                      lastName: sender.lastName,
                      avatar: sender.avatar ? `http://localhost:5001${sender.avatar}` : "assets/user-avatar.png"
                  }
                : { id };
        });
        console.log(" Zaproszenia do znajomych:", friendRequests);
        res.json({ friendRequests });
    } catch (error) {
        console.error(" Błąd weryfikacji tokena:", error);
        return res.status(401).json({ message: "Nieprawidłowy token!" });
    }
};

// Wysyłanie zaproszenia do znajomego
exports.sendFriendRequest = (req, res) => {
    console.log(" Otrzymane dane w żądaniu:", req.body);

    // Pobieramy token użytkownika
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Brak tokena!" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.userId; // ID zalogowanego użytkownika
        const { friendId } = req.body;

        if (!friendId) {
            console.error(" Błąd: Nie podano friendId!");
            return res.status(400).json({ message: "Błąd: brak friendId!" });
        }

        const friendIdNum = Number(friendId);

        // Sprawdzenie, czy użytkownik nie próbuje dodać siebie
        if (userId === friendIdNum) {
            console.error("⚠️ Nie można wysłać zaproszenia do samego siebie!");
            return res.status(400).json({ message: "Nie możesz wysłać zaproszenia do samego siebie!" });
        }

        // Wczytujemy aktualne dane
        let data = readData();
        const user = data.users.find(u => u.id === userId);
        const friend = data.users.find(u => u.id === friendIdNum);

        if (!user || !friend) {
            console.error(" Użytkownik nie znaleziony!");
            return res.status(404).json({ message: "Użytkownik nie znaleziony!" });
        }

        if (!friend.friendRequests) friend.friendRequests = [];

        // Sprawdzenie, czy zaproszenie już zostało wysłane
        if (friend.friendRequests.includes(userId)) {
            console.error(" Zaproszenie już wysłane!");
            return res.status(400).json({ message: "Już wysłano zaproszenie!" });
        }

        // Dodanie zaproszenia do listy
        friend.friendRequests.push(userId);
        saveData(data);

        console.log(`✅ Zaproszenie od ${userId} do ${friendIdNum} wysłane!`);
        return res.json({ message: "Zaproszenie wysłane!" });

    } catch (error) {
        console.error(" Błąd wysyłania zaproszenia:", error);
        return res.status(500).json({ message: "Błąd serwera" });
    }
};



exports.acceptFriendRequest = (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Brak tokena!" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.userId;
        const { friendId } = req.body;
        const friendIdNum = Number(friendId);

        let data = readData();
        const user = data.users.find(u => u.id === userId);
        const friend = data.users.find(u => u.id === friendIdNum);

        if (!user || !friend) return res.status(404).json({ message: "Użytkownik nie znaleziony!" });

        // Sprawdzenie, czy znajomość już istnieje
        if (!user.friends.includes(friendIdNum)) user.friends.push(friendIdNum);
        if (!friend.friends.includes(userId)) friend.friends.push(userId);

        // Usunięcie zaproszenia z listy
        user.friendRequests = user.friendRequests.filter(id => id !== friendIdNum);

        saveData(data);
        console.log(` ${userId} zaakceptował zaproszenie od ${friendIdNum}`);

        res.json({ message: "Zaproszenie zaakceptowane!" });

    } catch (error) {
        console.error(" Błąd akceptacji zaproszenia:", error);
        res.status(500).json({ message: "Błąd serwera" });
    }
};


// Usuwanie znajomego
exports.removeFriend = (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Brak tokena!" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.userId;
        const { friendId } = req.body;

        let data = readData();
        const user = data.users.find(u => u.id === userId);
        const friend = data.users.find(u => u.id === Number(friendId));

        if (!user || !friend) {
            return res.status(404).json({ message: "Użytkownik nie znaleziony!" });
        }

        // Usuń znajomego z listy
        user.friends = user.friends.filter(id => id !== Number(friendId));
        friend.friends = friend.friends.filter(id => id !== userId);

        saveData(data);
        res.json({ message: "Znajomy usunięty!" });

    } catch (error) {
        console.error(" Błąd usuwania znajomego:", error);
        res.status(500).json({ message: "Błąd serwera" });
    }
};


// Odrzucanie zaproszenia do znajomych
exports.rejectFriendRequest = (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Brak tokena!" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.userId;
        const { friendId } = req.body;

        let data = readData();
        const user = data.users.find(u => u.id === userId);

        if (!user) return res.status(404).json({ message: "Użytkownik nie znaleziony!" });

        // Usuń zaproszenie z listy
        user.friendRequests = user.friendRequests.filter(id => id !== Number(friendId));

        saveData(data);
        res.json({ message: "Zaproszenie odrzucone!" });

    } catch (error) {
        console.error(" Błąd:", error);
        res.status(500).json({ message: "Błąd serwera" });
    }
};
exports.getFriendsList = (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        console.error(" Brak tokena!");
        return res.status(401).json({ message: "Brak tokena!" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.userId;

        let data = readData();
        const user = data.users.find(u => u.id === userId);

        if (!user) {
            console.error(" Użytkownik nie znaleziony!");
            return res.status(404).json({ message: "Użytkownik nie znaleziony!" });
        }

        console.log(`📂 Znajomi użytkownika ${userId}:`, user.friends);

        const friends = user.friends.map(friendId => {
            const friend = data.users.find(u => u.id === friendId);
            if (friend) {
                console.log(`✅ Znaleziono znajomego: ${friend.firstName} ${friend.lastName}`);
                return {
                    id: friend.id,
                    firstName: friend.firstName,
                    lastName: friend.lastName,
                    avatar: friend.avatar ? `http://localhost:5001${friend.avatar}` : "assets/user-avatar.png"
                };
            }
            return null;
        }).filter(Boolean);

        console.log(`👫 Lista znajomych zwrócona do frontendu:`, friends);
        res.json({ friends });

    } catch (error) {
        console.error(" Błąd pobierania znajomych:", error);
        res.status(500).json({ message: "Błąd serwera" });
    }
};
