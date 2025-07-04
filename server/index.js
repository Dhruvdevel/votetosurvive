const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
let pollActive = false; // 🔁 Global poll state

let acceptingEntries = true; // ✅ Global switch to allow/disallow joining


const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const ROOM_PASSWORD = "nss123";

const users = {}; // socketId: { name, id, eliminated: false }
let currentVotes = []; // { socketId, vote }

io.on('connection', (socket) => {
  console.log(`📲 New connection: ${socket.id}`);

socket.on("lockEntries", () => {
  acceptingEntries = false;
  console.log("🔒 Entries locked by admin");
});

socket.on("unlockEntries", () => {
  acceptingEntries = true;
  console.log("🔓 Entries unlocked by admin");
});



  
  // ✅ Join global room with password
  socket.on("join", ({ name, id, roomPass }) => {
  if (roomPass !== ROOM_PASSWORD) {
    socket.emit("joinRejected", "❌ Invalid room password.");
    return;
  }
    const validIdPattern = /^25(ucs|ucc|uec|ume|dcs|dec)\d{3}$/i;
  if (!validIdPattern.test(id)) {
    socket.emit("joinRejected", "❌ Invalid ID format.");
    return;
  }
const alreadyExists = Object.values(users).some(u => u.id === id);
if (alreadyExists) {
  socket.emit("joinRejected", "❌ This ID is already in use.");
  return;
}


  if (!acceptingEntries) {
    socket.emit("joinRejected", "🚫 Entry is closed by admin.");
    return;
  }

  users[socket.id] = { name, id, eliminated: false };
  console.log(`✅ ${name} (${id}) joined`);
  socket.emit("joinStatus", "success");
    if (pollActive) {
  socket.emit("pollStatus", "start");
} else {
  socket.emit("pollStatus", "stop");
}

});



  // ✅ Admin sends question
  socket.on("newQuestion", (question) => {
    console.log("📥 Received question:", question);
    Object.keys(users).forEach(socketId => {
      if (!users[socketId].eliminated) {
        io.to(socketId).emit("question", question);
        console.log(`📤 Sent question to ${socketId}`);
      }
    });
  });





  

  // ✅ Voting
  socket.on("vote", (option) => {
     if (!pollActive) {
    console.log("🚫 Vote ignored: Poll is not active.");
    return;
  }
  const user = users[socket.id];
  if (user && !user.eliminated) {
    if (currentVotes.some(v => v.socketId === socket.id)) {
  console.log(`⛔ Duplicate vote ignored from ${user.name}`);
  return;
}

    currentVotes.push({ socketId: socket.id, vote: option });
    console.log(`🗳️ Vote received from ${user.name}: ${option}`);

    // 🔴 Emit live vote update
    const countA = currentVotes.filter(v => v.vote === 'A').length;
    const countB = currentVotes.filter(v => v.vote === 'B').length;

    io.emit("voteUpdate", {
      percentA: ((countA / (countA + countB)) * 100 || 0).toFixed(1),
      percentB: ((countB / (countA + countB)) * 100 || 0).toFixed(1),
    });
  }
});


// ✅ Admin starts the poll
socket.on("startPoll", () => {
  pollActive = true;
  io.emit("pollStatus", "start");
  console.log("✅ Poll started");
});

// ✅ Admin stops the poll
socket.on("stopPoll", () => {
  pollActive = false;
  io.emit("pollStatus", "stop");
  console.log("🛑 Poll stopped");
});


  
  socket.on("getResults", () => {
  const countA = currentVotes.filter(v => v.vote === 'A').length;
  const countB = currentVotes.filter(v => v.vote === 'B').length;

  let eliminate = null;
  if (countA > countB) eliminate = 'A';
  else if (countB > countA) eliminate = 'B';

  const voters = new Set(currentVotes.map(v => v.socketId));

  if (eliminate) {
    // Eliminate majority voters
    currentVotes.forEach(({ socketId, vote }) => {
      const user = users[socketId];
      if (vote === eliminate && user && !user.eliminated) {
        user.eliminated = true;
        io.to(socketId).emit("eliminated");
        console.log(`❌ Eliminated ${user.name} for voting ${eliminate}`);
      }
    });
  } else {
    console.log("⚖️ It's a tie — no one eliminated for voting");
  }

  // Eliminate users who didn't vote
  Object.keys(users).forEach(socketId => {
    const user = users[socketId];
    if (!voters.has(socketId) && user && !user.eliminated) {
      user.eliminated = true;
      io.to(socketId).emit("eliminated");
      console.log(`🚫 Eliminated ${user.name} for not voting`);
    }
  });

  // Send final vote percentage to all
  const total = countA + countB;


   io.emit('result', {
  percentA: ((countA / (countA + countB)) * 100 || 0).toFixed(1),
  percentB: ((countB / (countA + countB)) * 100 || 0).toFixed(1),
});


    currentVotes = [];
  });

  // ✅ Admin manually eliminates
  socket.on("eliminateUser", (id) => {
    const targetSocketId = Object.keys(users).find(
      sid => users[sid].id === id
    );
    if (targetSocketId) {
      users[targetSocketId].eliminated = true;
      io.to(targetSocketId).emit("eliminated");
      console.log(`⚔️ Admin eliminated ${id}`);
    }
  });

  // ✅ Admin requests survivors
  socket.on("getSurvivors", () => {
    const survivors = Object.values(users).filter(u => !u.eliminated);
    socket.emit("survivors", survivors);
    console.log(`📋 Sent survivors list`);
  });

  // ✅ Cleanup on disconnect
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      console.log(`❌ ${users[socket.id].name} (${users[socket.id].id}) disconnected`);
      delete users[socket.id];
    }
  });
});

server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
