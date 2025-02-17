const API_URL = "http://localhost:5001/api";

// Wyszukiwanie znajomych po imieniu lub nazwisku
async function searchFriends() {
    const query = document.getElementById("searchFriendsInput").value.trim();
    if (!query) return;

    try {
        const response = await fetch(`${API_URL}/friends/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Nie udało się pobrać wyników.");

        const users = await response.json();
        displaySearchResults(users);
    } catch (error) {
        console.error(" Błąd wyszukiwania:", error);
    }
}

// 🖥 Wyświetlanie wyników wyszukiwania
function displaySearchResults(users) {
    const searchResults = document.getElementById("searchResults");
    searchResults.innerHTML = "";

    if (users.length === 0) {
        searchResults.innerHTML = "<li>Brak wyników.</li>";
        return;
    }

    users.forEach(user => {
        const li = document.createElement("li");
        li.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${user.avatar || 'assets/default-avatar.png'}" alt="Avatar" width="40" height="40" style="border-radius: 50%;">
                <span>${user.firstName} ${user.lastName}</span>
            </div>
            <button onclick="sendFriendRequest('${user.id}')">Dodaj</button>
        `;
        searchResults.appendChild(li);
    });
}

// Wysyłanie zaproszenia do znajomego
async function sendFriendRequest(friendId) {
    console.log(" Wysyłanie żądania do:", `${API_URL}/friends/request`);
    const token = localStorage.getItem("token");
    if (!token) return alert("Musisz być zalogowany!");

    try {
        const response = await fetch(`${API_URL}/friends/request`, { 
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ friendId })
        });

        if (!response.ok) throw new Error("Nie udało się wysłać zaproszenia.");

        alert(" Zaproszenie wysłane!");
    } catch (error) {
        console.error(" Błąd wysyłania zaproszenia:", error);
        alert(" Błąd wysyłania zaproszenia.");
    }
}

// Pobieranie zaproszeń do znajomych
async function getFriendRequests() {
    console.log(" Pobieranie zaproszeń...");
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/friends/requests`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Nie udało się pobrać zaproszeń.");

        const data = await response.json();
        console.log(" Otrzymane zaproszenia:", data.friendRequests);
        displayFriendRequests(data.friendRequests);

    } catch (error) {
        console.error("🚨 Błąd pobierania zaproszeń:", error);
    }
}

function displayFriendRequests(friendRequests) {
    const requestList = document.getElementById("friendRequestsList");
    requestList.innerHTML = "";

    if (!friendRequests || friendRequests.length === 0) {
        requestList.innerHTML = "<li>Brak zaproszeń do znajomych.</li>";
        return;
    }

    friendRequests.forEach(request => {
        const li = document.createElement("li");
        li.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <img src="${request.avatar}" alt="Avatar" width="40" height="40" style="border-radius: 50%;">
                <div style="flex: 1;">
                    <span>${request.firstName} ${request.lastName} wysłał(a) Ci zaproszenie.</span>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button class="accept-btn" onclick="acceptFriendRequest('${request.id}')">Akceptuj</button>
                    <button class="decline-btn" onclick="rejectFriendRequest('${request.id}')">Odrzuć</button>
                    <button class="profile-btn" onclick="viewFriendProfile('${request.id}')">Zobacz profil</button>
                </div>
            </div>
        `;
        requestList.appendChild(li);
    });
}



// Wywołanie funkcji po załadowaniu strony
document.addEventListener("DOMContentLoaded", () => {
    getFriendRequests();
});



// Akceptowanie zaproszenia do znajomych
async function acceptFriendRequest(friendId) {
    console.log(" Akceptowanie zaproszenia od:", friendId);

    const token = localStorage.getItem("token");
    if (!token) return alert("Musisz być zalogowany!");

    try {
        const response = await fetch(`${API_URL}/friends/accept`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ friendId })
        });

        if (!response.ok) throw new Error("Nie udało się zaakceptować zaproszenia.");

        alert(" Zaproszenie zaakceptowane!");
        getFriendRequests(); // Odśwież listę zaproszeń

    } catch (error) {
        console.error("🚨 Błąd akceptacji zaproszenia:", error);
        alert(" Błąd akceptacji zaproszenia.");
    }
}

// Odrzucanie zaproszenia do znajomych
async function rejectFriendRequest(friendId) {
    console.log(" Odrzucanie zaproszenia od:", friendId);

    const token = localStorage.getItem("token");
    if (!token) return alert("Musisz być zalogowany!");

    try {
        const response = await fetch(`${API_URL}/friends/reject`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ friendId })
        });

        if (!response.ok) throw new Error("Nie udało się odrzucić zaproszenia.");

        alert(" Zaproszenie odrzucone!");
        getFriendRequests(); // Odśwież listę zaproszeń

    } catch (error) {
        console.error("🚨 Błąd odrzucenia zaproszenia:", error);
        alert(" Błąd odrzucenia zaproszenia.");
    }
}

// Pobieranie listy znajomych
async function getFriendsList() {
    console.log(" Pobieranie znajomych...");
    const token = localStorage.getItem("token");
    if (!token) return console.warn("🚨 Brak tokena w localStorage!");

    try {
        const response = await fetch(`${API_URL}/friends/list`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        console.log(" Odpowiedź z API /friends/list:", response.status);
        const data = await response.json();
        console.log("👫 Znalezieni znajomi:", data.friends);

        if (!data.friends || data.friends.length === 0) {
            console.warn("⚠️ API zwróciło pustą listę znajomych.");
        }

        displayFriendsList(data.friends);

    } catch (error) {
        console.error(" Błąd pobierania znajomych:", error);
    }
}


function displayFriendsList(friends) {
    const friendsList = document.getElementById("friendsList");
    friendsList.innerHTML = "";

    if (!friends || friends.length === 0) {
        friendsList.innerHTML = "<li>Brak znajomych.</li>";
        return;
    }

    friends.forEach(friend => {
        const li = document.createElement("li");
        li.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <img src="${friend.avatar || 'assets/user-avatar.png'}" alt="Avatar" width="40" height="40" style="border-radius: 50%;">
                <div style="flex: 1;">
                    <span>${friend.firstName} ${friend.lastName}</span>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button style="width: 200px; class="profile-btn" onclick="viewFriendProfile('${friend.id}')">Zobacz profil</button>
                    <button class="decline-btn" onclick="removeFriend('${friend.id}')">Usuń</button>
                </div>
            </div>
        `;
        friendsList.appendChild(li);
    });
}

// Przejście do profilu znajomego
function viewFriendProfile(friendId) {
    window.location.href = `profile.html?userId=${friendId}`;
}


// Usuwanie znajomego
async function removeFriend(friendId) {
    console.log(" Usuwanie znajomego:", friendId);

    const token = localStorage.getItem("token");
    if (!token) return alert("Musisz być zalogowany!");

    try {
        const response = await fetch(`${API_URL}/friends/remove`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ friendId })
        });

        if (!response.ok) throw new Error("Nie udało się usunąć znajomego.");

        alert(" Znajomy usunięty!");
        getFriendsList(); // Odśwież listę znajomych

    } catch (error) {
        console.error("🚨 Błąd usuwania znajomego:", error);
        alert(" Błąd usuwania znajomego.");
    }
}


async function updateFriendRequestsCount() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.warn("Użytkownik niezalogowany, licznik zaproszeń nie zostanie pobrany.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/friends/requests`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Otrzymane dane:", data);
            const count = data.friendRequests ? data.friendRequests.length : 0;
            document.getElementById("friendRequestsCount").textContent = `(${count})`;
        } else {
            console.error("Błąd pobierania zaproszeń:", response.status);
        }
    } catch (error) {
        console.error("Błąd podczas pobierania zaproszeń:", error);
    }
}

document.addEventListener("DOMContentLoaded", updateFriendRequestsCount);





let isLoaded = false;

document.addEventListener("DOMContentLoaded", () => {
    if (!isLoaded) {
        isLoaded = true;
        
        console.log("🚀 `DOMContentLoaded` - sprawdzam funkcje...");

        if (typeof getFriendsList === "function") {
            console.log(" `getFriendsList` istnieje, wywołuję...");
            getFriendsList();
        } else {
            console.warn(" `getFriendsList` NIE istnieje!");
        }

        if (typeof loadStories === "function") {
            console.log(" `loadStories` istnieje, wywołuję...");
            loadStories();
        } else {
            console.warn(" `loadStories` NIE istnieje!");
        }

        if (typeof loadPosts === "function") {
            console.log(" `loadPosts` istnieje, wywołuję...");
            loadPosts();
        } else {
            console.warn(" `loadPosts` NIE istnieje!");
        }
    }
});


window.acceptFriendRequest = acceptFriendRequest;
window.rejectFriendRequest = rejectFriendRequest;
