const socket = io("https://votetosurvive.onrender.com");
let pollActive = false; // 🔁 Controls if user can vote

// ✅ Join the global room with password
function joinGame() {
  const name = document.getElementById("name").value.trim();
  const id = document.getElementById("id").value.trim();
  const roomPass = document.getElementById("room-password").value.trim();

  if (!name || !id || !roomPass) {
    alert("⚠️ Please fill all fields.");
    return;
  }

  localStorage.setItem("loggedInUser", JSON.stringify({ name, id, roomPass }));
  socket.emit("join", { name, id, roomPass });
}

// ✅ Handle join status
socket.on("joinStatus", (msg) => {
  if (msg === "success") {
    document.getElementById("login").style.display = "none";
    document.getElementById("game").style.display = "block";

    const saved = JSON.parse(localStorage.getItem("loggedInUser"));
    document.getElementById("user-info").textContent = `👤 ${saved.name} (${saved.id})`;
  } else {
    alert(msg);
    localStorage.removeItem("loggedInUser");
  }
});

// ✅ Auto rejoin on page load
window.addEventListener("load", () => {
  const saved = localStorage.getItem("loggedInUser");
  if (saved) {
    const { name, id, roomPass } = JSON.parse(saved);
    socket.emit("join", { name, id, roomPass });

    document.getElementById("user-info").textContent = `👤 ${name} (${id})`;
  }
});

// ✅ Submit vote
function submitVote(option) {
  if (!pollActive) {
    alert("🚫 Poll is not active yet!");
    return;
  }

  socket.emit("vote", option);
  alert(`✅ You voted for ${option}`);

  document.getElementById("vote-a").disabled = true;
  document.getElementById("vote-b").disabled = true;
}

// ✅ Logout
function logout() {
  localStorage.removeItem("loggedInUser");
  location.reload(); // full reset
}

// ✅ Handle question
socket.on("question", (q) => {
  console.log("📥 Question received:", q);
  document.getElementById("question").innerText = q;

  // Always disable buttons until admin starts the poll
  document.getElementById("vote-a").disabled = true;
  document.getElementById("vote-b").disabled = true;
});

// ✅ Handle result
socket.on("result", ({ percentA, percentB }) => {
  document.getElementById("result").innerText = `A: ${percentA}%, B: ${percentB}%`;
});

// ✅ Rejected join
socket.on("joinRejected", (msg) => {
  alert(msg);
  localStorage.removeItem("loggedInUser");
});

// ✅ Eliminated
socket.on("eliminated", () => {
  alert("❌ You have been eliminated!");
  document.getElementById("game").style.display = "none";
});

// ✅ Handle poll start/stop from admin
socket.on("pollStatus", (status) => {
  pollActive = status === "start";

  document.getElementById("vote-a").disabled = !pollActive;
  document.getElementById("vote-b").disabled = !pollActive;

  console.log(`📡 Poll is now ${pollActive ? "ACTIVE" : "INACTIVE"}`);
});
