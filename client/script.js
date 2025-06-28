const socket = io("https://votetosurvive.onrender.com");

function joinGame() {
  const name = document.getElementById("name").value;
  const id = document.getElementById("id").value;
  socket.emit("join", { name, id });

  document.getElementById("login").style.display = "none";
  document.getElementById("game").style.display = "block";
}

function submitVote(option) {
  socket.emit("vote", option);
  alert(`You voted for ${option}`);
}

function getResults() {
  socket.emit("getResults");
}

function joinSession() {
  const sessionId = document.getElementById("session-id").value.trim();
  const name = document.getElementById("student-name").value.trim();
  const id = document.getElementById("student-id").value.trim();

  if (!sessionId || !name || !id) return alert("Fill all fields");
  socket.emit("join", { sessionId, name, id });
}



socket.on("eliminated", () => {
  alert("❌ You have been eliminated!");
  document.getElementById("vote-section").style.display = "none";
});



socket.on("survivors", (list) => {
  const names = list.map(u => u.name).join(", ");
  alert("🧍 Survivors: " + names);
});

socket.on("question", (q) => {
  document.getElementById("question").innerText = q;
});

socket.on("result", ({ percentA, percentB }) => {
  document.getElementById("result").innerText = `A: ${percentA}%, B: ${percentB}%`;
});
