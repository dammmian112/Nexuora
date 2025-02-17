document.addEventListener("DOMContentLoaded", function () {
    const textElement = document.getElementById("typing-text");
    const text = "Najlepszy sposób na komunikację";
    let index = 0;

    function typeText() {
        if (index < text.length) {
            textElement.innerHTML += text.charAt(index);
            index++;
            setTimeout(typeText, 80);
        } else {
            document.getElementById("fade-text").classList.add("fade-in");

            setTimeout(() => {
                document.getElementById("cta-buttons").classList.add("fade-in");
            }, 1000);
        }
    }

    typeText();
});
