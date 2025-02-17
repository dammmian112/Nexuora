const API_URL = "http://localhost:5001/api";

document.getElementById("register-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("🟢 Rozpoczynam rejestrację...");

    const formData = new FormData();
    formData.append("firstName", document.getElementById("firstName").value.trim());
    formData.append("lastName", document.getElementById("lastName").value.trim());
    formData.append("birthdate", document.getElementById("birthdate").value);
    formData.append("email", document.getElementById("email").value.trim());
    formData.append("username", document.getElementById("username").value.trim());
    formData.append("password", document.getElementById("password").value);

    console.log("📦 Dane do wysłania:", Object.fromEntries(formData.entries()));


    // Obsługa zdjęcia profilowego
    const profilePicInput = document.getElementById("profilePic");
    if (profilePicInput.files.length > 0) {
        formData.append("avatar", profilePicInput.files[0]); // Wysyłanie pliku jako `avatar`
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            body: formData // Wysyłamy `FormData` zamiast JSON
        });

        const data = await response.json();
        console.log(" Odpowiedź rejestracji:", data);

        if (response.ok) {
            alert(" Konto utworzone! Możesz się teraz zalogować.");
            window.location.href = "login.html";
        } else {
            alert(" Błąd rejestracji: " + (data.message || "Nie udało się utworzyć konta."));
        }
    } catch (error) {
        console.error(" Błąd rejestracji:", error);
        alert("Nie można połączyć się z serwerem.");
    }
});

// Funkcja do podglądu zdjęcia
document.getElementById("profilePic").addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("profile-pic-preview").src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Funkcja do konwersji obrazu
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

// Walidacja e-maila
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Obliczanie wieku
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
