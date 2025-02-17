const API_URL = "http://localhost:5001/api"; 
const UPLOADS_URL = "http://localhost:5001/uploads";

async function loadProfile() {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Musisz być zalogowany, aby zobaczyć profil!");
        window.location.href = "login.html";
        return;
    }

    // Pobranie userId z URL (jeśli jest)
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("userId"); // ID profilu znajomego (jeśli odwiedzamy cudzy profil)

    try {
        // Jeśli `userId` istnieje, pobieramy profil znajomego
        const response = await fetch(`${API_URL}/user${userId ? `?userId=${userId}` : ''}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            alert("Błąd ładowania profilu");
            return;
        }

        const user = await response.json();
        console.log(" Dane użytkownika:", user);

        if (!user || !user.username) {
            alert("Nie udało się pobrać danych użytkownika.");
            return;
        }

        // **Obsługa avatara**
        const avatarElement = document.getElementById("profile-avatar");
        if (user.avatar) {
            avatarElement.src = user.avatar.startsWith("http") ? user.avatar : `${UPLOADS_URL}/${user.avatar}`;
        } else {
            avatarElement.src = "assets/user-avatar.png"; // Domyślny avatar
        }

        document.getElementById("full-name").innerText = `${user.firstName || user.username} ${user.lastName || ""}`;
        document.getElementById("user-email").innerText = user.email || "Brak e-maila";
        document.getElementById("user-bio").innerText = user.bio || "Brak opisu";
        document.getElementById("user-age").innerText = user.age ? `${user.age} lat` : "Brak danych";
        document.getElementById("friends-count").innerText = user.friends ? `${user.friends.length} znajomych` : "Brak znajomych";

        // Jeśli to NIE JEST nasz profil, ukrywamy przyciski edycji
        if (userId) {
            document.getElementById("edit-bio-btn").style.display = "none";
            document.getElementById("save-bio-btn").style.display = "none";
            document.getElementById("bio-input").style.display = "none";
            document.getElementById("profilePicInput").style.display = "none";
            document.getElementById("delete-account-btn").style.display = "none";
        }

    } catch (error) {
        console.error("🚨 Błąd pobierania profilu:", error);
    }
}

// Usuwanie konta
document.getElementById("delete-account-btn").addEventListener("click", async () => {
    if (!confirm("Czy na pewno chcesz usunąć swoje konto?")) return;

    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/deleteAccount`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            alert("Konto zostało usunięte.");
            localStorage.removeItem("token");
            window.location.href = "register.html";
        } else {
            alert("Błąd usuwania konta.");
        }
    } catch (error) {
        console.error("🚨 Błąd usuwania konta:", error);
    }
});

// Zmiana zdjęcia profilowego
document.getElementById("profilePicInput").addEventListener("change", async function () {
    const file = this.files[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("avatar", file);

    try {
        const response = await fetch(`${API_URL}/updateAvatar`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            alert("Zdjęcie profilowe zostało zaktualizowane.");
            loadProfile();
        } else {
            alert("Błąd aktualizacji zdjęcia profilowego.");
        }
    } catch (error) {
        console.error(" Błąd aktualizacji avatara:", error);
    }
});

document.getElementById("edit-bio-btn").addEventListener("click", () => {
    document.getElementById("bio-input").style.display = "block";
    document.getElementById("save-bio-btn").style.display = "block";
    document.getElementById("edit-bio-btn").style.display = "none";
});

document.getElementById("save-bio-btn").addEventListener("click", async () => {
    const newBio = document.getElementById("bio-input").value;
    const token = localStorage.getItem("token");

    try {
        console.log(" Wysyłany token:", token);
        const response = await fetch(`${API_URL}/updateBio`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ bio: newBio })
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById("user-bio").textContent = newBio;
            document.getElementById("bio-input").style.display = "none";
            document.getElementById("save-bio-btn").style.display = "none";
            document.getElementById("edit-bio-btn").style.display = "block";
        } else {
            alert("Błąd zapisu BIO: " + data.message);
        }
    } catch (error) {
        console.error(" Błąd edycji BIO:", error);
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    console.log(" Ładowanie profilu...");

    const token = localStorage.getItem("token");
    if (!token) {
        console.warn(" Brak tokena! Przekierowanie do logowania...");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/user`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const user = await response.json();
        console.log(" Dane użytkownika:", user);
        console.log(" Avatar użytkownika:", user.avatar); //Sprawdzamy, co zwraca backend

        if (!user.username) {
            alert("Nie udało się pobrać danych użytkownika.");
            return;
        }

        // Ustawienie danych w profilu
        document.getElementById("full-name").textContent = `${user.firstName} ${user.lastName}`;
        document.getElementById("user-email").textContent = user.email;
        document.getElementById("user-age").textContent = user.age ? `${user.age} lat` : "Brak danych";
        document.getElementById("user-bio").textContent = user.bio || "Brak opisu";

        // Poprawiona obsługa avatara
        let avatarSrc = "assets/user-avatar.png"; // Domyślne zdjęcie
        if (user.avatar) {
            if (user.avatar.startsWith("http")) {
                avatarSrc = user.avatar;
            } else {
                avatarSrc = `${UPLOADS_URL}/${user.avatar}`;
            }
        }
        document.getElementById("profile-avatar").src = avatarSrc;

    } catch (error) {
        console.error(" Błąd ładowania profilu:", error);
    }
});

// Załadowanie profilu po załadowaniu strony
document.addEventListener("DOMContentLoaded", loadProfile);

console.log("✅ profile.js załadowany!");

