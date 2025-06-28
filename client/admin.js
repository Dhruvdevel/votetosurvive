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
  socket.emit("newQuestion", q);
}

function getSurvivors() {
  socket.emit("getSurvivors");
}

socket.on("survivors", (list) => {
  const names = list.map(u => u.name).join(", ");
  alert("🧍 Survivors: " + names);
});
