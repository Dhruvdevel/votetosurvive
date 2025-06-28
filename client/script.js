const socket = io("https://votetosurvive.onrender.com");

function joinGame() {
  const sessionId = document.getElementById("session-id").value.trim();
  const name = document.getElementById("name").value.trim();
  const id = document.getElementById("id").value.trim();

  if (!sessionId || !name || !id) {
    alert("⚠️ Please fill all fields.");
    return;
  }

  socket.emit("join", { sessionId, name, id });

  document.getElementById("login").style.display = "none";
  document.getElementById("game").style.display = "block";
}

function submitVote(option) {
  socket.emit("vote", option);
  alert(`✅ You voted for ${option}`);
}

// ✅ This function is only for admin, REMOVE from user script
// function getResults() {
//   socket.emit("getResults");
// }

socket.on("question", (q) => {
  document.getElementById("question").innerText = q;
});

socket.on("eliminated", () => {
  alert("❌ You have been eliminated!");
  document.getElementById("game").style.display = "none";
});

// Optional: If you want to show survivors to the participant (not usually needed)
socket.on("survivors", (list) => {
  const names = list.map(u => u.name).join(", ");
  alert("🧍 Survivors: " + names);
});

socket.on("result", ({ percentA, percentB }) => {
  document.getElementById("result").innerText = `A: ${percentA}%, B: ${percentB}%`;
});
