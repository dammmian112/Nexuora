function getCurrentUserId() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
    } catch (error) {
        console.error("Błąd dekodowania tokena:", error);
        return null;
    }
}

// --- Funkcja generująca wspólny klucz rozmowy na podstawie obu ID ---
function getConversationKey(contactId) {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return null;
    // Używamy mniejszego ID jako pierwszego, większego jako drugiego
    const first = Math.min(currentUserId, contactId);
    const second = Math.max(currentUserId, contactId);
    return `chat_${first}_${second}`;
}

// --- Funkcja ładująca listę kontaktów do czatu ---
async function loadChatContacts() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.warn("Brak tokena – nie można pobrać kontaktów.");
        return;
    }

    // Ukryj przycisk "X" i pole wiadomości
    document.querySelector(".close-button").style.display = "none";
    document.querySelector(".message-input").style.display = "none";

    try {
        const response = await fetch(`${API_URL}/friends/list`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            displayChatContacts(data.friends);
        } else {
            console.error("Błąd pobierania kontaktów:", response.status);
        }
    } catch (error) {
        console.error("Błąd podczas pobierania kontaktów:", error);
    }
}



// --- Funkcja wyświetlająca kontakty w panelu wiadomości ---
function displayChatContacts(contacts) {
    const messagesList = document.getElementById("messagesList");
    messagesList.innerHTML = "";
    if (!contacts || contacts.length === 0) {
        messagesList.innerHTML = "<p>Brak kontaktów do czatu.</p>";
        return;
    }
    contacts.forEach(contact => {
        const contactDiv = document.createElement("div");
        contactDiv.className = "chat-contact";
        contactDiv.style.display = "flex";
        contactDiv.style.alignItems = "center";
        contactDiv.style.cursor = "pointer";
        contactDiv.style.marginBottom = "10px";
        contactDiv.innerHTML = `
            <img src="${contact.avatar || 'assets/user-avatar.png'}" alt="Avatar" width="40" height="40" style="border-radius: 50%; margin-right: 10px;">
            <span>${contact.firstName} ${contact.lastName}</span>
        `;
        // Po kliknięciu otwórz rozmowę z tym kontaktem
        contactDiv.onclick = () => openChatWith(contact.id, `${contact.firstName} ${contact.lastName}`);
        messagesList.appendChild(contactDiv);
    });
}

function openChatWith(contactId, contactName) {
    const conversationKey = getConversationKey(contactId);
    if (!conversationKey) {
        alert("Nie udało się ustalić rozmowy.");
        return;
    }

    document.querySelector(".close-button").style.display = "flex";
    document.querySelector(".message-input").style.display = "flex";

    const messagesList = document.getElementById("messagesList");
    messagesList.innerHTML = `
        <h3 style="margin: 0; font-size: 18px; margin-bottom: 10px;">Rozmowa z ${contactName}</h3>
        <div id="chatConversation" style="flex: 1; overflow-y: auto; margin-bottom: 10px;"></div>
    `;

    window.currentChatConversationKey = conversationKey;

    // Pobierz historię rozmowy z localStorage
    const storedConversation = localStorage.getItem(conversationKey);
    const chatConversation = document.getElementById("chatConversation");
    chatConversation.innerHTML = ""; // Wyczyść poprzednią rozmowę

    if (storedConversation) {
        const messages = JSON.parse(storedConversation);
        const currentUserId = getCurrentUserId();

        messages.forEach(msg => {
            const messageElement = document.createElement("div");
            messageElement.classList.add("message");
            messageElement.style.marginBottom = "8px";

            if (msg.senderId === currentUserId) {
                messageElement.classList.add("sent");
            } else {
                messageElement.classList.add("received");
            }

            messageElement.textContent = msg.text;
            chatConversation.appendChild(messageElement);
        });

        scrollToBottom(chatConversation);
    }
}

function scrollToBottom(element) {
    requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight; 
        const lastMessage = element.lastElementChild;
        if (lastMessage) lastMessage.scrollIntoView({ behavior: "smooth", block: "end" });
    });
}









function sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();
    if (message && window.currentChatConversationKey) {
        const chatConversation = document.getElementById("chatConversation");
        if (!chatConversation) {
            alert("Najpierw wybierz kontakt z listy!");
            return;
        }
        const currentUserId = getCurrentUserId();
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");
        messageElement.classList.add("sent");  // wiadomość wysłana przez bieżącego użytkownika
        messageElement.textContent = message;
        chatConversation.appendChild(messageElement);
        messageInput.value = "";
        // Przewiń do dołu z efektem smooth
        chatConversation.scrollTo({ top: chatConversation.scrollHeight, behavior: 'smooth' });
        
        // Zapisz wiadomość w localStorage
        const conversationKey = window.currentChatConversationKey;
        let messages = [];
        const storedConversation = localStorage.getItem(conversationKey);
        if (storedConversation) {
            messages = JSON.parse(storedConversation);
        }
        messages.push({ senderId: currentUserId, text: message });
        localStorage.setItem(conversationKey, JSON.stringify(messages));
    }
}
window.sendMessage = sendMessage;





function toggleMessagesPanel() {
    console.log("toggleMessagesPanel wywołana");
    const messagesPanel = document.querySelector('.messages-panel');
    if (!messagesPanel) {
        console.error("Nie znaleziono elementu .messages-panel");
        return;
    }
    messagesPanel.classList.toggle('open');
    if (messagesPanel.classList.contains('open')) {
        window.currentChatConversationKey = null;
        loadChatContacts();
    }
}
window.toggleMessagesPanel = toggleMessagesPanel;

// Usuwamy dodatkowy event listener, aby nie duplikować wywołań.
// Jeśli w HTML masz onclick="toggleMessagesPanel()", wystarczy powyższa definicja.
