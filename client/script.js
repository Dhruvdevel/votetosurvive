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

socket.on("result", ({ percentA, percentB }) => {
  document.getElementById("result").innerText = `A: ${percentA}%, B: ${percentB}%`;
});
