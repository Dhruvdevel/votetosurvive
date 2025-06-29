const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

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

  // ✅ Join global room with password
  socket.on("join", ({ name, id, roomPass }) => {
  if (roomPass !== ROOM_PASSWORD) {
    socket.emit("joinRejected", "❌ Invalid room password.");
    return;
  }
  users[socket.id] = { name, id, eliminated: false };
  console.log(`✅ ${name} (${id}) joined`);
  socket.emit("joinStatus", "success"); // ✅ notify user
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
    const user = users[socket.id];
    if (user && !user.eliminated) {
      currentVotes.push({ socketId: socket.id, vote: option });
      console.log(`🗳️ Vote received from ${user.name}: ${option}`);
    }
  });

  // ✅ Admin gets results and eliminates minority
  socket.on("getResults", () => {
    const countA = currentVotes.filter(v => v.vote === 'A').length;
    const countB = currentVotes.filter(v => v.vote === 'B').length;
    const eliminate = countA > countB ? 'B' : 'A';

    currentVotes.forEach(({ socketId, vote }) => {
      const user = users[socketId];
      if (vote === eliminate && user && !user.eliminated) {
        user.eliminated = true;
        io.to(socketId).emit("eliminated");
        console.log(`❌ Eliminated ${user.name}`);
      }
    });

    Object.keys(users).forEach(socketId => {
      io.to(socketId).emit('result', {
        percentA: ((countA / (countA + countB)) * 100 || 0).toFixed(1),
        percentB: ((countB / (countA + countB)) * 100 || 0).toFixed(1),
      });
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
