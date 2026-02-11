const API = "/api";
const state = {
  page: 1,
  limit: 10,
  pages: 1,
  taskCache: new Map(),
  editId: null,
  user: null
};

/* ================= TOKEN ================= */

function getToken() {
  return localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

async function loadCurrentUser() {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${API}/auth/me`, {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  if (res.status === 401) {
    logout();
    return null;
  }

  if (!res.ok) return null;

  const user = await res.json();
  state.user = user;

  const adminLink = document.getElementById("adminLink");
  if (adminLink && user.role === "admin") {
    adminLink.classList.remove("hidden");
  }

  const badge = document.getElementById("userBadge");
  if (badge) {
    badge.textContent = user.role === "admin" ? "Admin" : "User";
    badge.classList.remove("hidden");
    badge.classList.add(user.role === "admin" ? "admin" : "user");
  }

  return user;
}

/* ================= AUTH ================= */

async function register() {
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const res = await fetch(API + "/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Registration error");
    return;
  }

  alert("Registration successful!");
  window.location.href = "login.html";
}

async function login() {
  const loginValue = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const res = await fetch(API + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: loginValue,
      password
    })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Login error");
    return;
  }

  localStorage.setItem("token", data.token);

  const payload = JSON.parse(atob(data.token.split(".")[1]));

  if (payload.role === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "dashboard.html";
  }
}

/* ================= TASK CRUD ================= */

async function loadTasks() {
  const res = await fetch(
    `${API}/tasks?page=${state.page}&limit=${state.limit}`,
    {
      headers: {
        Authorization: "Bearer " + getToken()
      }
    }
  );

  if (res.status === 401) {
    alert("Session expired");
    logout();
    return;
  }

  const data = await res.json();
  const tasks = data.items || [];
  state.pages = data.pages || 1;
  state.taskCache = new Map(tasks.map(t => [t._id, t]));

  const list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach(task => {
    const li = document.createElement("li");
    const left = document.createElement("div");
    const right = document.createElement("div");

    const title = document.createElement("strong");
    title.textContent = task.title;

    const desc = document.createElement("small");
    desc.textContent = task.description || "";

    const status = document.createElement("span");
    status.className = `status ${task.status}`;
    status.textContent = task.status;

    const priority = document.createElement("span");
    priority.className = `priority ${task.priority}`;
    priority.textContent = task.priority;

    const due = document.createElement("small");
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      due.textContent = `Due: ${d.toISOString().slice(0, 10)}`;
    }

    left.appendChild(title);
    left.appendChild(document.createElement("br"));
    left.appendChild(desc);
    left.appendChild(document.createElement("br"));
    left.appendChild(status);
    left.appendChild(priority);
    if (task.dueDate) {
      left.appendChild(document.createElement("br"));
      left.appendChild(due);
    }

    const btnStatus = document.createElement("button");
    btnStatus.className = "btn-sm";
    btnStatus.textContent = "Change Status";
    btnStatus.addEventListener("click", () =>
      changeStatus(task._id, task.status)
    );

    const btnEdit = document.createElement("button");
    btnEdit.className = "btn-sm";
    btnEdit.textContent = "Edit";
    btnEdit.addEventListener("click", () => openEdit(task._id));

    const btnDelete = document.createElement("button");
    btnDelete.className = "btn-sm btn-danger";
    btnDelete.textContent = "Delete";
    btnDelete.addEventListener("click", () => deleteTask(task._id));

    right.appendChild(btnStatus);
    right.appendChild(btnEdit);
    right.appendChild(btnDelete);

    li.appendChild(left);
    li.appendChild(right);
    list.appendChild(li);
  });

  const pageInfo = document.getElementById("pageInfo");
  if (pageInfo) {
    pageInfo.textContent = `Page ${state.page} of ${state.pages}`;
  }
}


async function createTask() {
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const status = document.getElementById("status").value;
  const priority = document.getElementById("priority").value;
  const dueDate = document.getElementById("dueDate").value;

  if (title.length < 3) {
    alert("Title must be at least 3 characters");
    return;
  }

  const res = await fetch(`${API}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    },
    body: JSON.stringify({ title, description, status, priority, dueDate })
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.message || "Error creating task");
    return;
  }

  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("status").value = "pending";
  document.getElementById("priority").value = "medium";
  document.getElementById("dueDate").value = "";

  loadTasks();
}

function nextPage() {
  if (state.page < state.pages) {
    state.page += 1;
    loadTasks();
  }
}

function prevPage() {
  if (state.page > 1) {
    state.page -= 1;
    loadTasks();
  }
}

async function changeStatus(id, currentStatus) {

  const statuses = ["pending", "in_progress", "done"];

  const nextStatus =
    statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];

  const res = await fetch(`${API}/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    },
    body: JSON.stringify({
      status: nextStatus
    })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Error updating status");
    return;
  }

  loadTasks();
}


function openEdit(id) {
  const task = state.taskCache.get(id);
  if (!task) return;

  state.editId = id;

  document.getElementById("editTitle").value = task.title || "";
  document.getElementById("editDescription").value = task.description || "";
  document.getElementById("editStatus").value = task.status || "pending";
  document.getElementById("editPriority").value = task.priority || "medium";
  document.getElementById("editDueDate").value = task.dueDate
    ? new Date(task.dueDate).toISOString().slice(0, 10)
    : "";

  document.getElementById("editModal").classList.remove("hidden");
}

function closeEdit() {
  state.editId = null;
  document.getElementById("editModal").classList.add("hidden");
}

async function saveEdit() {
  if (!state.editId) return;

  const title = document.getElementById("editTitle").value.trim();
  const description = document.getElementById("editDescription").value.trim();
  const status = document.getElementById("editStatus").value;
  const priority = document.getElementById("editPriority").value;
  const dueDate = document.getElementById("editDueDate").value;

  if (title.length < 3) {
    alert("Title must be at least 3 characters");
    return;
  }

  const res = await fetch(`${API}/tasks/${state.editId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    },
    body: JSON.stringify({
      title,
      description,
      status,
      priority,
      dueDate
    })
  });

  const data = await res.json();

  if (res.status === 401) {
    alert("Session expired");
    logout();
    return;
  }

  if (res.status === 403) {
    alert("You cannot modify this task");
    return;
  }

  if (!res.ok) {
    alert(data.message || "Update error");
    return;
  }

  closeEdit();
  loadTasks();
}


async function deleteTask(id) {
  const confirmDelete = confirm("Delete this task?");
  if (!confirmDelete) return;

  const res = await fetch(`${API}/tasks/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + getToken()
    }
  });

  if (res.status === 401) {
    alert("Unauthorized");
    logout();
    return;
  }

  if (res.status === 403) {
    alert("Access denied");
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    alert(data.message || "Delete error");
    return;
  }

  loadTasks();
}

/* ================= ADMIN ================= */

async function loadAdmin() {
  const [usersRes, tasksRes] = await Promise.all([
    fetch(`${API}/admin/users`, {
      headers: {
        Authorization: "Bearer " + getToken()
      }
    }),
    fetch(`${API}/admin/tasks`, {
      headers: {
        Authorization: "Bearer " + getToken()
      }
    })
  ]);

  if (usersRes.status === 401 || tasksRes.status === 401) {
    alert("Unauthorized");
    logout();
    return;
  }

  if (usersRes.status === 403 || tasksRes.status === 403) {
    alert("Access denied - Admin only");
    return;
  }

  const users = await usersRes.json();
  const tasks = await tasksRes.json();

  const usersList = document.getElementById("usersList");
  const tasksList = document.getElementById("tasksList");

  usersList.innerHTML = "";
  tasksList.innerHTML = "";

  users.forEach(u => {
    const tr = document.createElement("tr");
    const tdUser = document.createElement("td");
    const tdEmail = document.createElement("td");
    const tdRole = document.createElement("td");
    const tdActions = document.createElement("td");

    tdUser.textContent = u.username;
    tdEmail.textContent = u.email;
    tdRole.textContent = u.role;

    const btnDelete = document.createElement("button");
    btnDelete.className = "btn-sm btn-danger";
    btnDelete.textContent = "Delete";
    btnDelete.disabled = u.role === "admin";
    btnDelete.addEventListener("click", () => deleteUser(u._id));

    tdActions.appendChild(btnDelete);
    tr.appendChild(tdUser);
    tr.appendChild(tdEmail);
    tr.appendChild(tdRole);
    tr.appendChild(tdActions);

    usersList.appendChild(tr);
  });

  tasks.forEach(t => {
    const tr = document.createElement("tr");
    const tdTitle = document.createElement("td");
    const tdStatus = document.createElement("td");
    const tdOwner = document.createElement("td");
    const tdActions = document.createElement("td");

    tdTitle.textContent = t.title;
    tdStatus.textContent = t.status;
    tdOwner.textContent = t.owner
      ? `${t.owner.username} (${t.owner.email})`
      : "Unknown";

    const btnDelete = document.createElement("button");
    btnDelete.className = "btn-sm btn-danger";
    btnDelete.textContent = "Delete";
    btnDelete.addEventListener("click", () => deleteTaskAdmin(t._id));

    tdActions.appendChild(btnDelete);
    tr.appendChild(tdTitle);
    tr.appendChild(tdStatus);
    tr.appendChild(tdOwner);
    tr.appendChild(tdActions);

    tasksList.appendChild(tr);
  });
}

async function deleteUser(id) {
  if (!confirm("Delete this user and all their tasks?")) return;

  const res = await fetch(`${API}/admin/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + getToken()
    }
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.message || "Delete error");
    return;
  }

  loadAdmin();
}

async function deleteTaskAdmin(id) {
  if (!confirm("Delete this task?")) return;

  const res = await fetch(`${API}/admin/tasks/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + getToken()
    }
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.message || "Delete error");
    return;
  }

  loadAdmin();
}

/* ================= AUTO LOAD ================= */

document.addEventListener("DOMContentLoaded", () => {

  const token = getToken();

  if (!token && 
     (window.location.pathname.includes("dashboard") ||
      window.location.pathname.includes("admin"))) {
    alert("Please login first");
    logout();
    return;
  }

  if (token) {
    loadCurrentUser().then((user) => {
      if (window.location.pathname.includes("admin")) {
        if (!user || user.role !== "admin") {
          alert("Admin only");
          window.location.href = "dashboard.html";
          return;
        }
      }
    });
  }

  if (window.location.pathname.includes("dashboard")) {
    loadTasks();
  }

  if (window.location.pathname.includes("admin")) {
    loadAdmin();
  }

});
