const socket = io("https://votetosurvive.onrender.com");

function loginAdmin() {
  const pass = document.getElementById("admin-password").value;
  if (pass === "nss123") {
    document.getElementById("admin-controls").style.display = "block";
    alert("✅ Admin Access Granted");
  } else {
    alert("❌ Incorrect Password");
  }
}

function sendQuestion() {
  const q = document.getElementById("question-input").value;
   const sessionId = document.getElementById("admin-session-id").value;
  socket.emit("newQuestion",  { sessionId, question: q });
}

function getSurvivors() {
   const sessionId = document.getElementById("admin-session-id").value;
  socket.emit("getSurvivors",sessionId);
}
function eliminateUser(id) {
  const sessionId = document.getElementById("admin-session-id").value;
  const confirmElim = confirm(`Are you sure you want to eliminate ${id}?`);
  if (confirmElim) {
    socket.emit("eliminateUser", { sessionId, id });
  }
}


function lockSession() {
  const sessionId = document.getElementById("admin-session-id").value;
  socket.emit("lockSession", sessionId);
}

function unlockSession() {
  const sessionId = document.getElementById("admin-session-id").value;
  socket.emit("unlockSession", sessionId);
}
socket.on("eliminateUser", ({ sessionId, id }) => {
  // eliminates user from that session
});


socket.on("sessionStatus", ({ sessionId, locked }) => {
  const status = locked ? "locked" : "unlocked";
  console.log(`Session ${sessionId} is now ${status}`);
});



socket.on("survivors", (list) => {
 const tbody = document.querySelector("#survivor-table tbody");
  tbody.innerHTML = ""; // Clear previous rows

  list.forEach((user, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${user.name}</td>
      <td>${user.id}</td>
       <td><button onclick="eliminateUser('${user.id}')">Eliminate</button></td>
    `;
    tbody.appendChild(row);
  });
});
