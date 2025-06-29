const socket = io("https://votetosurvive.onrender.com");

// ✅ Admin login
function loginAdmin() {
  const pass = document.getElementById("admin-password").value;
  if (pass === "nss123") {
    document.getElementById("admin-controls").style.display = "block";
    document.getElementById("admin-password").style.display = "none";
    document.getElementById("login-error").textContent = "";
    alert("✅ Admin Access Granted");
  } else {
    document.getElementById("login-error").textContent = "❌ Incorrect Password!";
  }
}

// ✅ Send question to all active users
function sendQuestion() {
  const q = document.getElementById("question-input").value.trim();

  if (!q) {
    alert("⚠️ Enter a question to send.");
    return;
  }

  console.log("📤 Sending question:", q);
  socket.emit("newQuestion", q);
}

// ✅ Get and eliminate minority
function getResults() {
  console.log("📤 Admin requested getResults");
  socket.emit("getResults");
}

// ✅ Show survivors
function getSurvivors() {
  socket.emit("getSurvivors");
}

// ✅ Manually eliminate someone
function eliminateUser(id) {
  const confirmElim = confirm(`Are you sure you want to eliminate ${id}?`);
  if (confirmElim) {
    socket.emit("eliminateUser", id);
  }
}

// ✅ Live vote results
socket.on("result", ({ percentA, percentB }) => {
  document.getElementById("percent-a").textContent = percentA;
  document.getElementById("percent-b").textContent = percentB;
});

// ✅ Show survivor list
socket.on("survivors", (list) => {
  const tbody = document.querySelector("#survivor-table tbody");
  tbody.innerHTML = "";

  list.forEach((user, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${user.name}</td>
      <td>${user.id}</td>
      <td><button onclick="eliminateUser('${user.id}')">❌ Eliminate</button></td>
    `;
    tbody.appendChild(row);
  });
});
