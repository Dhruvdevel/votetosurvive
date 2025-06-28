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

// ✅ Send question to session
function sendQuestion() {
  const q = document.getElementById("question-input").value;
  const sessionId = document.getElementById("admin-session-id").value;

  if (!q || !sessionId) {
    alert("⚠️ Enter both question and session ID.");
    return;
  }

  console.log("📤 Sending question to session:", sessionId, q); 
  socket.emit("newQuestion", { sessionId, question: q });
}

function getResults() {
  console.log("📤 Admin requested getResults");
  socket.emit("getResults");
}


// ✅ Request survivors from backend
function getSurvivors() {
  const sessionId = document.getElementById("admin-session-id").value;
  if (!sessionId) return alert("⚠️ Enter session ID");
  socket.emit("getSurvivors", sessionId);
}

// ✅ Eliminate specific user from session
function eliminateUser(id) {
  const sessionId = document.getElementById("admin-session-id").value;
  if (!sessionId) return alert("⚠️ Enter session ID");

  const confirmElim = confirm(`Are you sure you want to eliminate ${id}?`);
  if (confirmElim) {
    socket.emit("eliminateUser", { sessionId, id });
  }
}

// ✅ Lock session to prevent joins
function lockSession() {
  const sessionId = document.getElementById("admin-session-id").value;
  if (!sessionId) return alert("⚠️ Enter session ID");
  socket.emit("lockSession", sessionId);
}

// ✅ Unlock session to allow joins
function unlockSession() {
  const sessionId = document.getElementById("admin-session-id").value;
  if (!sessionId) return alert("⚠️ Enter session ID");
  socket.emit("unlockSession", sessionId);
}

// ✅ Live vote results (%A and %B)
socket.on("result", ({ percentA, percentB }) => {
  document.getElementById("percent-a").textContent = percentA;
  document.getElementById("percent-b").textContent = percentB;
});

// ✅ Session lock/unlock status logging
socket.on("sessionStatus", ({ sessionId, locked }) => {
  const status = locked ? "🔒 locked" : "🔓 unlocked";
  console.log(`Session ${sessionId} is now ${status}`);
});

// ✅ Populate survivors table
socket.on("survivors", (list) => {
  const tbody = document.querySelector("#survivor-table tbody");
  tbody.innerHTML = ""; // Clear old rows

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
