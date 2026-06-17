const API_URL = "https://blog-platform-agbu.onrender.com/api";
const BACKEND_URL = "http://localhost:5000";

let allPosts = [];

/* ---------- Notifications ---------- */

function showNotification(message) {
  const div = document.createElement("div");
  div.className = "toast";
  div.innerText = message;

  document.body.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 3000);
}

/* ---------- Dark Mode ---------- */

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("darkMode", "enabled");
  } else {
    localStorage.setItem("darkMode", "disabled");
  }
}

function loadDarkMode() {
  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
  }
}

/* ---------- Auth ---------- */

async function registerUser() {
  const name = document.getElementById("registerName")?.value;
  const email = document.getElementById("registerEmail")?.value;
  const password = document.getElementById("registerPassword")?.value;

  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  showNotification(data.message);

  if (res.ok) {
    window.location.href = "login.html";
  }
}

async function loginUser() {
  const email = document.getElementById("loginEmail")?.value;
  const password = document.getElementById("loginPassword")?.value;

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    showNotification("Login successful");

    setTimeout(() => {
      if (data.user.role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "dashboard.html";
      }
    }, 800);
  } else {
    showNotification(data.message);
  }
}

function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

/* ---------- Create Blog ---------- */

async function createPost() {
  const title = document.getElementById("postTitle")?.value;
  const content = document.getElementById("postContent")?.value;
  const media = document.getElementById("postMedia")?.files[0];
  const token = localStorage.getItem("token");

  if (!title || !content) {
    showNotification("Title and content are required");
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("content", content);

  if (media) {
    formData.append("media", media);
  }

  const res = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json();

  if (res.ok) {
    showNotification("Blog published successfully");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);
  } else {
    showNotification(data.message);
  }
}

/* ---------- Load Blogs ---------- */

async function loadPosts() {
  const container = document.getElementById("postsContainer");
  if (!container) return;

  const res = await fetch(`${API_URL}/posts`);
  const posts = await res.json();

  allPosts = posts;

  renderPosts(posts);
}

function renderPosts(posts) {
  const container = document.getElementById("postsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (posts.length === 0) {
    container.innerHTML = "<p>No blog posts available.</p>";
    return;
  }

  posts.forEach((post) => {
    let mediaHTML = "";

    if (post.media && post.mediaType === "image") {
      mediaHTML = `
        <img
          src="${BACKEND_URL}/uploads/${post.media}"
          class="blog-media"
          alt="Blog image"
        >
      `;
    }

    if (post.media && post.mediaType === "video") {
      mediaHTML = `
        <video class="blog-media" controls>
          <source src="${BACKEND_URL}/uploads/${post.media}">
          Your browser does not support video.
        </video>
      `;
    }

    let commentsHTML = "<p>No comments yet.</p>";

    if (post.comments && post.comments.length > 0) {
      commentsHTML = post.comments
        .map(
          (comment) => `
            <div class="comment-box">
              <strong>${comment.user?.name || "User"}:</strong>
              <div>
                <span>${comment.text}</span>
                <br>
                <small>
                  ${new Date(comment.createdAt).toLocaleString()}
                </small>
              </div>
            </div>
          `
        )
        .join("");
    }

    const div = document.createElement("div");
    div.className = "card";
    div.id = `post-${post._id}`;

    div.innerHTML = `
      <h3 id="title-${post._id}">${post.title}</h3>

      ${mediaHTML}

      <p id="content-${post._id}">${post.content}</p>

      <small>
        Author: ${post.author?.name || "Unknown"}
      </small>

      <br>

      <small>
        📅 ${new Date(post.createdAt).toLocaleString()}
      </small>

      <br><br>

      <button onclick="enableEdit('${post._id}')">
        Edit
      </button>

      <button onclick="deletePost('${post._id}')">
        Delete
      </button>

      <button onclick="toggleComments('${post._id}')">
        💬 Comments (${post.comments?.length || 0})
      </button>

      <div
        class="comments-section"
        id="commentsSection-${post._id}"
        style="display:none"
      >
        <h4>Comments</h4>

        <div id="comments-${post._id}">
          ${commentsHTML}
        </div>

        <input
          type="text"
          id="commentInput-${post._id}"
          placeholder="Write a comment..."
          class="comment-input"
        >

        <button onclick="addComment('${post._id}')">
          Add Comment
        </button>
      </div>
    `;

    container.appendChild(div);
  });
}

/* ---------- Search Blogs ---------- */

function searchBlogs() {
  const searchValue =
    document.getElementById("searchInput")?.value.toLowerCase() || "";

  const filteredPosts = allPosts.filter((post) => {
    const title = post.title?.toLowerCase() || "";
    const content = post.content?.toLowerCase() || "";
    const author = post.author?.name?.toLowerCase() || "";

    return (
      title.includes(searchValue) ||
      content.includes(searchValue) ||
      author.includes(searchValue)
    );
  });

  renderPosts(filteredPosts);
}

/* ---------- Comments ---------- */

function toggleComments(postId) {
  const section = document.getElementById(`commentsSection-${postId}`);

  if (
    section.style.display === "none" ||
    section.style.display === ""
  ) {
    section.style.display = "block";
  } else {
    section.style.display = "none";
  }
}

async function addComment(postId) {
  const input = document.getElementById(`commentInput-${postId}`);
  const text = input.value;
  const token = localStorage.getItem("token");

  if (!text) {
    showNotification("Comment cannot be empty");
    return;
  }

  const res = await fetch(`${API_URL}/posts/${postId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });

  const data = await res.json();

  if (res.ok) {
    input.value = "";
    showNotification("Comment added");
    loadPosts();
  } else {
    showNotification(data.message);
  }
}

/* ---------- Edit Blog ---------- */

function enableEdit(id) {
  const titleEl = document.getElementById(`title-${id}`);
  const contentEl = document.getElementById(`content-${id}`);
  const card = document.getElementById(`post-${id}`);

  const oldTitle = titleEl.innerText;
  const oldContent = contentEl.innerText;

  card.innerHTML = `
    <input id="editTitle-${id}" value="${oldTitle}">

    <textarea id="editContent-${id}" rows="5">
${oldContent}
    </textarea>

    <button onclick="saveEdit('${id}')">
      Save
    </button>

    <button onclick="loadPosts()">
      Cancel
    </button>
  `;
}

async function saveEdit(id) {
  const title = document.getElementById(`editTitle-${id}`).value;
  const content = document.getElementById(`editContent-${id}`).value;
  const token = localStorage.getItem("token");

  if (!title || !content) {
    showNotification("Title and content are required");
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
    showNotification("Post updated successfully");
    loadPosts();
  } else {
    showNotification(data.message);
  }
}

/* ---------- Delete Blog ---------- */

async function deletePost(id) {
  const confirmDelete = confirm("Are you sure you want to delete this post?");
  if (!confirmDelete) return;

  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (res.ok) {
    showNotification(data.message);
    loadPosts();
  } else {
    showNotification(data.message);
  }
}

/* ---------- Password Reset ---------- */

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
  showNotification(data.message);
}

async function resetPassword() {
  const newPassword = document.getElementById("newPassword")?.value;
  const confirmPassword = document.getElementById("confirmPassword")?.value;

  if (newPassword !== confirmPassword) {
    showNotification("Passwords do not match");
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

  showNotification(data.message);

  if (res.ok) {
    setTimeout(() => {
      window.location.href = "login.html";
    }, 800);
  }
}

/* ---------- Admin ---------- */

async function loadAdminData() {
  const statsBox = document.getElementById("adminStats");
  const usersBox = document.getElementById("adminUsers");

  if (!statsBox || !usersBox) return;

  const token = localStorage.getItem("token");

  const statsRes = await fetch(`${API_URL}/admin/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const stats = await statsRes.json();

  if (!statsRes.ok) {
    showNotification(stats.message);

    setTimeout(() => {
      window.location.href = "login.html";
    }, 800);

    return;
  }

  statsBox.innerHTML = `
    <div class="card">
      👥 Total Users: ${stats.totalUsers}
    </div>

    <div class="card">
      📝 Total Blogs: ${stats.totalPosts}
    </div>

    <div class="card">
      💬 Total Comments: ${stats.totalComments}
    </div>
  `;

  const usersRes = await fetch(`${API_URL}/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

      <p>
        Status: ${user.isBlocked ? "Blocked" : "Active"}
      </p>

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
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  showNotification(data.message);

  if (res.ok) {
    loadAdminData();
  }
}

/* ---------- Helpers ---------- */

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

/* ---------- Initial Load ---------- */

loadDarkMode();
loadPosts();
loadAdminData();