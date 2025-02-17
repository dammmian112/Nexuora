const UPLOADS_URL = "http://localhost:5001/uploads"; //

// Dodawanie posta
window.addPost = async function () {
    console.log("✅ addPost() została poprawnie załadowana!");
    
    const content = document.getElementById("postContent").value.trim();
    if (!content) return alert(" Nie możesz dodać pustego posta!");

    const token = localStorage.getItem("token");
    if (!token) return alert(" Musisz być zalogowany, aby dodać post!");

    let userId;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.userId;
        if (!userId) throw new Error("Brak userId w tokenie!");
    } catch (error) {
        console.error(" Błąd dekodowania tokena:", error);
        alert(" Błąd uwierzytelnienia. Spróbuj się ponownie zalogować.");
        return;
    }

    try {
        console.log(" Wysyłanie posta...", { userId, content });

        const response = await fetch(`${API_URL}/createPost`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ userId, content }) //userId
        });

        const data = await response.json();
        console.log(" Odpowiedź serwera (dodawanie posta):", data);

        if (response.ok) {
            document.getElementById("postContent").value = "";
            loadPosts();
        } else {
            alert(" Błąd przy dodawaniu posta: " + (data.error || "Nie udało się dodać posta."));
        }
    } catch (error) {
        console.error(" Błąd dodawania posta:", error);
        alert("Nie można połączyć się z serwerem.");
    }
};

// Ładowanie postów
window.loadPosts = async function () {
    console.log(" Rozpoczynam ładowanie postów...");

    const postsContainer = document.getElementById("posts");
    postsContainer.innerHTML = "<p> Ładowanie postów...</p>";

    // Pobranie bieżącego userId z tokena (jeśli użytkownik jest zalogowany)
    const token = localStorage.getItem("token");
    let currentUserId = null;
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            currentUserId = payload.userId;
        } catch (error) {
            console.error("Błąd dekodowania tokena:", error);
        }
    }

    try {
        const response = await fetch(`${API_URL}/posts`);
        
        if (!response.ok) {
            throw new Error(` Błąd ładowania postów: ${response.status}`);
        }

        const posts = await response.json();
        console.log(" Pobranie postów:", posts);

        if (!Array.isArray(posts) || posts.length === 0) {
            postsContainer.innerHTML = "<p> Brak postów do wyświetlenia.</p>";
            return;
        }

        postsContainer.innerHTML = ""; // Wyczyść listę postów

        posts.forEach(post => {
            // Obsługa avatara
            let userAvatar = "assets/user-avatar.png";
            if (post.avatar) {
                if (post.avatar.startsWith("http")) {
                    userAvatar = post.avatar;
                } else {
                    userAvatar = `${UPLOADS_URL}/${post.avatar.replace("/uploads/", "")}`;
                }
            }

            const div = document.createElement("div");
            div.className = "post";

            // Przygotowanie przycisku usuwania tylko dla autora posta
            const deleteButtonHTML = (post.userId === currentUserId)
                ? `<button class="delete-btn" onclick="deletePost('${post.id}')">🗑 Usuń</button>`
                : '';

            div.innerHTML = `
                <div class="post-header">
                    <img src="${userAvatar}" alt="Avatar" onerror="this.src='assets/user-avatar.png'">
                    <h3>${post.username || "Anonimowy użytkownik"}</h3>
                </div>
                <p class="post-content">${post.content}</p>
                <div class="post-actions">
                    <button class="like-btn" onclick="likePost('${post.id}')"> ${post.likes}</button>
                    ${deleteButtonHTML}
                </div>
            `;
            postsContainer.appendChild(div);
        });

    } catch (error) {
        console.error(" Błąd ładowania postów:", error);
        postsContainer.innerHTML = `<p> Nie udało się załadować postów.<br>${error.message}</p>`;
    }
};


window.likePost = async function (postId) {
    console.log(" Wysyłam like dla posta:", postId);

    const token = localStorage.getItem("token");
    if (!token) {
        alert(" Musisz być zalogowany, aby dawać like'i!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/likePost`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ postId })
        });

        const data = await response.json();
        console.log(" Odpowiedź serwera (like):", data);

        if (response.ok) {
            loadPosts(); 
        } else {
            alert(" Błąd przy dawaniu like: " + (data.message || "Nie udało się dodać like."));
        }
    } catch (error) {
        console.error(" Błąd like:", error);
        alert("Nie można połączyć się z serwerem.");
    }
};

// Usuwanie posta
window.deletePost = async function (postId) {
    if (!confirm("Czy na pewno chcesz usunąć ten post?")) return;

    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/deletePost/${postId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            alert(" Post został usunięty!");
            loadPosts();
        } else {
            alert(" Błąd usuwania posta.");
        }
    } catch (error) {
        console.error("🚨 Błąd usuwania posta:", error);
    }
};

// Usuwanie posta
window.deletePost = async function (postId) {
    if (!confirm("Czy na pewno chcesz usunąć ten post?")) return;

    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/deletePost/${postId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            alert(" Post został usunięty!");
            loadPosts();
        } else {
            alert(" Błąd usuwania posta.");
        }
    } catch (error) {
        console.error(" Błąd usuwania posta:", error);
    }
};

// Automatyczne ładowanie postów po uruchomieniu strony
document.addEventListener("DOMContentLoaded", () => {
    console.log(" `DOMContentLoaded` - wywołuję loadPosts()...");
    loadPosts();
});