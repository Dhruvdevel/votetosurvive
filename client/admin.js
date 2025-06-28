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
 const tbody = document.querySelector("#survivor-table tbody");
  tbody.innerHTML = ""; // Clear previous rows

  list.forEach((user, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${user.name}</td>
      <td>${user.id}</td>
    `;
    tbody.appendChild(row);
  });
});
