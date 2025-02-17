async function login() {
    console.log(" Rozpoczynam logowanie...");

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log(" Odpowiedź logowania:", data);

        if (response.ok && data.token) {
            localStorage.setItem("token", data.token);
            console.log(" Token zapisany poprawnie:", data.token);

            window.location.href = "index.html";
        } else {
            alert("❌ Błąd logowania: " + (data.message || "Nieprawidłowe dane"));
        }        
    } catch (error) {
        console.error("🚨 Błąd logowania:", error);
        alert("Nie można połączyć się z serwerem.");
    }
}

// Rejestracja użytkownika
async function register() {
    console.log(" Rozpoczynam rejestrację...");

    const firstName = prompt(" Podaj swoje imię:");
    if (!firstName) return alert("Imię jest wymagane!");

    const lastName = prompt(" Podaj swoje nazwisko:");
    if (!lastName) return alert("Nazwisko jest wymagane!");

    const birthdate = prompt(" Podaj swoją datę urodzenia (YYYY-MM-DD):");
    if (!birthdate || !isValidDate(birthdate)) return alert("Nieprawidłowa data!");

    if (calculateAge(birthdate) < 13) {
        return alert("Musisz mieć co najmniej 13 lat, aby się zarejestrować!");
    }

    const email = prompt(" Podaj e-mail:");
    if (!email || !isValidEmail(email)) return alert("Nieprawidłowy e-mail!");

    const username = prompt(" Podaj nazwę użytkownika:");
    if (!username) return alert("Nazwa użytkownika jest wymagana!");

    const password = prompt(" Podaj hasło (min. 6 znaków):");
    if (!password || password.length < 6) return alert("Hasło musi mieć co najmniej 6 znaków!");

    try {
        console.log(" Wysyłanie danych rejestracji...", { firstName, lastName, birthdate, email, username });

        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, birthdate, email, username, password })
        });

        const data = await response.json();
        console.log(" Odpowiedź rejestracji:", data);

        if (response.ok) {
            alert("Konto utworzone! Możesz się teraz zalogować.");
        } else {
            alert(" Błąd rejestracji: " + (data.message || "Nie udało się utworzyć konta."));
        }
    } catch (error) {
        console.error(" Błąd rejestracji:", error);
        alert("Nie można połączyć się z serwerem.");
    }
}

// Funkcja do walidacji e-maila
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Funkcja do walidacji daty urodzenia (format YYYY-MM-DD)
function isValidDate(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// Funkcja do obliczania wieku
function calculateAge(birthdate) {
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

//  Wylogowanie użytkownika
function logout() {
    console.log("🚪 Wylogowywanie...");
    localStorage.removeItem("token");
    window.location.href = "landingPage.html"; 
}

// Sprawdzenie, czy użytkownik jest zalogowany
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    console.log("🔍 Sprawdzanie tokena:", token);

    const isLandingPage = window.location.pathname.includes("landingPage.html");
    const isLoginPage = window.location.pathname.includes("login.html");

    if (!token) {
        if (!isLandingPage && !isLoginPage) {
            console.warn("🚨 Brak tokena! Przekierowanie na landingPage...");
            window.location.href = "landingPage.html";
        }
    }
});
