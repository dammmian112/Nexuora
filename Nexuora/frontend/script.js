async function addPost() {
    const content = document.getElementById('postContent').value;
    const response = await fetch('http://localhost:5000/api/createPost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: '123', content })
    });
    const post = await response.json();
    loadPosts();
}

async function loadPosts() {
    document.getElementById('posts').innerHTML = ''; // Czyszczenie
    const response = await fetch('http://localhost:5000/api/posts'); // Pobranie postów
    const posts = await response.json();
    posts.forEach(post => {
        const div = document.createElement('div');
        div.className = 'post';
        div.innerHTML = `<p>${post.content}</p><button onclick="likePost('${post._id}')"> ${post.likes}</button>`;
        document.getElementById('posts').appendChild(div);
    });
}

async function likePost(postId) {
    await fetch('http://localhost:5000/api/likePost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
    });
    loadPosts();
}

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");

    // Jeśli brak tokena → przekieruj do logowania
    if (!token) {
        window.location.href = "login.html";
    }
});


loadPosts();
