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

  // Disable buttons after voting
  document.getElementById("vote-a").disabled = true;
  document.getElementById("vote-b").disabled = true;
}


// ✅ Receive question
socket.on("question", (q) => {
  console.log("📥 Question received:", q);
  document.getElementById("question").innerText = q;

  // Re-enable buttons when new question arrives
  document.getElementById("vote-a").disabled = false;
  document.getElementById("vote-b").disabled = false;
});


// ✅ Receive result
socket.on("result", ({ percentA, percentB }) => {
  document.getElementById("result").innerText = `A: ${percentA}%, B: ${percentB}%`;
});

socket.on("joinRejected", (msg) => {
  alert(msg);
});


// ✅ Eliminated
socket.on("eliminated", () => {
  alert("❌ You have been eliminated!");
  document.getElementById("game").style.display = "none";
});
