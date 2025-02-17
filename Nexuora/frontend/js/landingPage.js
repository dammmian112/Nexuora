document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.getElementById("loginButton");
    const registerButton = document.getElementById("registerButton");

    if (loginButton) {
        loginButton.addEventListener("click", () => {
            console.log("🔹 Przekierowanie do login.html");
            window.location.href = "login.html";
        });
    }

    if (registerButton) {
        registerButton.addEventListener("click", () => {
            console.log("🔹 Przekierowanie do register.html");
            window.location.href = "register.html";
        });
    }
});
