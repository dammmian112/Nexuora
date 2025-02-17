function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
    }
});

window.loadFriends = async function () {
    console.log("📡 Pobieranie znajomych online...");
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/friends/online`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Nie udało się pobrać znajomych online.");

        const data = await response.json();
        displayOnlineFriends(data.onlineFriends);
    } catch (error) {
        console.error("🚨 Błąd pobierania znajomych online:", error);
    }
};

function displayStories(stories) {
    const storiesContainer = document.getElementById("storiesContainer");
    storiesContainer.innerHTML = "";

    if (!stories || stories.length === 0) {
        console.warn("⚠️ Brak relacji do wyświetlenia.");
        storiesContainer.innerHTML = "<p>Brak relacji.</p>";
        return;
    }

    stories.forEach(story => {
        let mediaUrl = story.mediaUrl.startsWith("blob:")
            ? story.mediaUrl
            : `http://localhost:5001${story.mediaUrl}`;

        // Tworzymy wrapper dla pojedynczej relacji
        const wrapper = document.createElement("div");
        wrapper.classList.add("story-wrapper");

        // Tworzymy element z mediami
        const storyElement = document.createElement("div");
        storyElement.classList.add("story");

        let mediaContent = story.mediaType === "video"
            ? `<video src="${mediaUrl}" controls muted></video>`
            : `<img src="${mediaUrl}" alt="Story">`;

        storyElement.innerHTML = mediaContent;

        // Tworzymy element z nazwą użytkownika pod relacją
        const authorElement = document.createElement("div");
        authorElement.classList.add("story-author");
        authorElement.textContent = story.author && story.author.name ? story.author.name : "Nieznany";

        // Kliknięcie w wrapper otwiera widok fullscreen
        wrapper.onclick = () => viewStory(mediaUrl, story.mediaType, story.author);

        // Dodajemy elementy do wrappera
        wrapper.appendChild(storyElement);
        wrapper.appendChild(authorElement);

        // Dodajemy wrapper do kontenera relacji
        storiesContainer.appendChild(wrapper);
    });
}




window.loadStories = async function () {
    console.log("📡 Pobieranie relacji...");

    const token = localStorage.getItem("token");
    if (!token) {
        console.error("🚨 Brak tokena! Nie można pobrać relacji.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/stories`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        console.log("📡 Odpowiedź serwera:", response.status);
        console.log("📡 Pełna odpowiedź:", response);

        if (!response.ok) {
            throw new Error(" Nie udało się pobrać relacji!");
        }

        const data = await response.json();
        console.log(" Relacje pobrane:", data.stories);

        displayStories(data.stories);

    } catch (error) {
        console.error("🚨 Błąd pobierania relacji:", error);
        alert("Błąd ładowania relacji! Sprawdź konsolę.");
    }
};

// 🖥 Wyświetlanie znajomych online
function displayOnlineFriends(friends) {
    const friendsContainer = document.getElementById("friendsOnline");
    friendsContainer.innerHTML = "";

    if (!friends || friends.length === 0) {
        friendsContainer.innerHTML = "<p>Brak znajomych online.</p>";
        return;
    }

    friends.forEach(friend => {
        const li = document.createElement("li"); 
        li.classList.add("friend-online");
        li.innerHTML = `
            <a href="profile.html?userId=${friend.id}">
                <img src="${friend.avatar}" alt="${friend.name}">
                <span>${friend.name}</span>
            </a>
        `;
        friendsContainer.appendChild(li);
    });
}

window.uploadStory = function () {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = async function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("story", file);

        const token = localStorage.getItem("token");
        if (!token) {
            console.error(" Brak tokena!");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/stories`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) throw new Error("❌ Błąd wysyłania relacji!");

            const data = await response.json();
            console.log(" Relacja dodana:", data);

            loadStories();  
        } catch (error) {
            console.error("🚨 Błąd podczas dodawania relacji:", error);
        }
    };
    input.click();
};

function addStoryToDOM(src, type = "image") {
    const storiesContainer = document.getElementById("storiesContainer");
    const storyDiv = document.createElement("div");
    storyDiv.classList.add("story");
    storyDiv.innerHTML = type === "video"
        ? `<video src="${src}" muted></video>`
        : `<img src="${src}" alt="Story">`;
    storyDiv.onclick = () => viewStory(src, type);
    storiesContainer.appendChild(storyDiv);
}

window.viewStory = function (src, type, author) {
    const storyViewer = document.createElement("div");
    storyViewer.classList.add("fullscreen-story");
    
    // Tworzymy pasek z informacją o autorze
    const authorHTML = author && author.name 
        ? `<div class="story-author-popup">Dodane przez: ${author.name}</div>`
        : "";

    storyViewer.innerHTML = `
        <button onclick="document.body.removeChild(this.parentElement)" 
                style="position:absolute; top:20px; right:20px; font-size:20px; color:white; background:none; border:none; cursor:pointer;">
            X
        </button>
        ${authorHTML}
        ${type === 'video' ? `<video src="${src}" controls autoplay></video>` : `<img src="${src}" alt="Story">`}
    `;
    document.body.appendChild(storyViewer);
};

document.addEventListener("DOMContentLoaded", () => {
    loadFriends();
    loadStories();
});


