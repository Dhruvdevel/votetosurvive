const socket = io("https://votetosurvive.onrender.com");

// ✅ Join the global room with password
function joinGame() {
  const name = document.getElementById("name").value.trim();
  const id = document.getElementById("id").value.trim();
  const roomPass = document.getElementById("room-password").value.trim();

  if (!name || !id || !roomPass) {
    alert("⚠️ Please fill all fields.");
    return;
  }

  socket.emit("join", { name, id, roomPass });
}

// ✅ Receive join response
socket.on("joinStatus", (msg) => {
  if (msg === "success") {
    document.getElementById("login").style.display = "none";
    document.getElementById("game").style.display = "block";
  } else {
    alert(msg);
  }
});

// ✅ Submit vote
function submitVote(option) {
  socket.emit("vote", option);
  alert(`✅ You voted for ${option}`);
}

// ✅ Receive question
socket.on("question", (q) => {
  console.log("📥 Question received:", q);
  document.getElementById("question").innerText = q;
});

// ✅ Receive result
socket.on("result", ({ percentA, percentB }) => {
  document.getElementById("result").innerText = `A: ${percentA}%, B: ${percentB}%`;
});

// ✅ Eliminated
socket.on("eliminated", () => {
  alert("❌ You have been eliminated!");
  document.getElementById("game").style.display = "none";
});
