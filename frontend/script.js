const API_URL = "http://localhost:5000/api";

async function registerUser() {
  const name = document.getElementById("registerName")?.value;
  const email = document.getElementById("registerEmail")?.value;
  const password = document.getElementById("registerPassword")?.value;

  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  alert(data.message);

  if (res.ok) window.location.href = "login.html";
}

async function loginUser() {
  const email = document.getElementById("loginEmail")?.value;
  const password = document.getElementById("loginPassword")?.value;

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    if (data.user.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }
  } else {
    alert(data.message);
  }
}

function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

async function createPost() {
  const title = document.getElementById("postTitle")?.value;
  const content = document.getElementById("postContent")?.value;
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, content }),
  });

  const data = await res.json();

  if (res.ok) {
    alert("Post created successfully");
    window.location.href = "dashboard.html";
  } else {
    alert(data.message);
  }
}

async function loadPosts() {
  const container = document.getElementById("postsContainer");
  if (!container) return;

  const res = await fetch(`${API_URL}/posts`);
  const posts = await res.json();

  container.innerHTML = "";

  if (posts.length === 0) {
    container.innerHTML = "<p>No blog posts available.</p>";
    return;
  }

  posts.forEach((post) => {
    const div = document.createElement("div");
    div.className = "card";
    div.id = `post-${post._id}`;

    div.innerHTML = `
      <h3 id="title-${post._id}">${post.title}</h3>
      <p id="content-${post._id}">${post.content}</p>
      <small>Author: ${post.author?.name || "Unknown"}</small>
      <br><br>

      <button onclick="enableEdit('${post._id}')">Edit</button>
      <button onclick="deletePost('${post._id}')">Delete</button>
    `;

    container.appendChild(div);
  });
}

function enableEdit(id) {
  const titleEl = document.getElementById(`title-${id}`);
  const contentEl = document.getElementById(`content-${id}`);
  const card = document.getElementById(`post-${id}`);

  const oldTitle = titleEl.innerText;
  const oldContent = contentEl.innerText;

  card.innerHTML = `
    <input id="editTitle-${id}" value="${oldTitle}">
    <textarea id="editContent-${id}" rows="5">${oldContent}</textarea>

    <button onclick="saveEdit('${id}')">Save</button>
    <button onclick="loadPosts()">Cancel</button>
  `;
}

async function saveEdit(id) {
  const title = document.getElementById(`editTitle-${id}`).value;
  const content = document.getElementById(`editContent-${id}`).value;
  const token = localStorage.getItem("token");

  if (!title || !content) {
    alert("Title and content are required");
    return;
  }

  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, content }),
  });

  const data = await res.json();

  if (res.ok) {
    alert("Post updated successfully");
    loadPosts();
  } else {
    alert(data.message);
  }
}

async function deletePost(id) {
  const confirmDelete = confirm("Are you sure you want to delete this post?");
  if (!confirmDelete) return;

  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  alert(data.message);

  if (res.ok) loadPosts();
}

async function forgotPassword() {
  const email = document.getElementById("forgotEmail")?.value;

  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  alert(data.message);
}

async function resetPassword() {
  const newPassword = document.getElementById("newPassword")?.value;
  const confirmPassword = document.getElementById("confirmPassword")?.value;

  if (newPassword !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: newPassword }),
  });

  const data = await res.json();
  alert(data.message);

  if (res.ok) window.location.href = "login.html";
}

async function loadAdminData() {
  const statsBox = document.getElementById("adminStats");
  const usersBox = document.getElementById("adminUsers");

  if (!statsBox || !usersBox) return;

  const token = localStorage.getItem("token");

  const statsRes = await fetch(`${API_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const stats = await statsRes.json();

  if (!statsRes.ok) {
    alert(stats.message);
    window.location.href = "login.html";
    return;
  }

  statsBox.innerHTML = `
    <div class="card">👥 Total Users: ${stats.totalUsers}</div>
    <div class="card">📝 Total Blogs: ${stats.totalPosts}</div>
    <div class="card">💬 Total Comments: ${stats.totalComments}</div>
  `;

  const usersRes = await fetch(`${API_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const users = await usersRes.json();

  usersBox.innerHTML = "";

  users.forEach((user) => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <h3>${user.name}</h3>
      <p>${user.email}</p>
      <p>Role: ${user.role}</p>
      <p>Status: ${user.isBlocked ? "Blocked" : "Active"}</p>
      <button onclick="toggleBlockUser('${user._id}')">
        ${user.isBlocked ? "Unblock" : "Block"}
      </button>
    `;

    usersBox.appendChild(div);
  });
}

async function toggleBlockUser(id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/admin/users/${id}/block`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  alert(data.message);

  if (res.ok) loadAdminData();
}

function togglePassword(id, button) {
  const input = document.getElementById(id);

  if (input.type === "password") {
    input.type = "text";
    button.innerText = "Hide";
  } else {
    input.type = "password";
    button.innerText = "Show";
  }
}

function moveNext(event, nextId) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById(nextId).focus();
  }
}

function submitOnEnter(event, callback) {
  if (event.key === "Enter") {
    event.preventDefault();
    callback();
  }
}

loadPosts();
loadAdminData();