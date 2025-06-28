const socket = io("http://localhost:3000");

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
function loginAdmin() {
  const pass = document.getElementById("admin-password").value;
  if (pass === "nss123") {
    document.getElementById("admin-controls").style.display = "block";
    alert("Admin logged in successfully!");
  } else {
    alert("❌ Incorrect password");
  }
}

function sendQuestion() {
  const question = document.getElementById("question-input").value;
  if (!question) return alert("Enter a question first");
  document.getElementById("question").innerText = question;
  socket.emit("newQuestion", question);
}

function getSurvivors() {
  socket.emit("getSurvivors");
}

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
