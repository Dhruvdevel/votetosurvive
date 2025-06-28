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

// Stores all sessions
const sessions = {};

// Store current round of votes
let currentVotes = []; // { sessionId, socketId, vote }

io.on('connection', (socket) => {
  console.log(`📲 New connection: ${socket.id}`);

  // ✅ Admin creates session
  socket.on("createSession", (sessionId) => {
    sessions[sessionId] = { users: {}, locked: false };
    console.log(`🆕 Session created: ${sessionId}`);
  });

  // ✅ User joins session
  socket.on("join", ({ sessionId, name, id }) => {
    const session = sessions[sessionId];

    if (!session || session.locked) {
      socket.emit("joinRejected", "❌ Session is locked or doesn't exist.");
      return;
    }

    session.users[socket.id] = { name, id, eliminated: false };
    console.log(`✅ ${name} joined session ${sessionId}`);
  });

  // ✅ Send new question to participants
  socket.on("newQuestion", ({ sessionId, question }) => {
    const session = sessions[sessionId];
    if (session) {
      Object.keys(session.users).forEach(socketId => {
        io.to(socketId).emit("question", question);
      });
    }
  });

  // ✅ Vote from user
  socket.on('vote', (option) => {
    const sessionId = Object.keys(sessions).find(sid => sessions[sid].users[socket.id]);
    if (sessionId) {
      const user = sessions[sessionId].users[socket.id];
      if (!user.eliminated) {
        currentVotes.push({ sessionId, socketId: socket.id, vote: option });
      }
    }
  });

  // ✅ Get results and eliminate minority
  socket.on('getResults', () => {
    const countA = currentVotes.filter(v => v.vote === 'A').length;
    const countB = currentVotes.filter(v => v.vote === 'B').length;
    const eliminate = countA > countB ? 'B' : 'A';

    currentVotes.forEach(({ sessionId, socketId, vote }) => {
      if (vote === eliminate && sessions[sessionId]) {
        const user = sessions[sessionId].users[socketId];
        if (user) {
          user.eliminated = true;
          io.to(socketId).emit("eliminated");
        }
      }
    });

    io.emit('result', {
      percentA: ((countA / (countA + countB)) * 100).toFixed(1),
      percentB: ((countB / (countA + countB)) * 100).toFixed(1),
    });

    currentVotes = [];
  });

  // ✅ Eliminate specific user manually
  socket.on("eliminateUser", ({ sessionId, id }) => {
    const session = sessions[sessionId];
    if (session) {
      const userSocketId = Object.keys(session.users).find(
        sid => session.users[sid].id === id
      );
      if (userSocketId) {
        session.users[userSocketId].eliminated = true;
        io.to(userSocketId).emit("eliminated");
      }
    }
  });

  // ✅ Admin requests list of survivors
  socket.on("getSurvivors", (sessionId) => {
    const session = sessions[sessionId];
    if (session) {
      const survivors = Object.values(session.users).filter(u => !u.eliminated);
      socket.emit("survivors", survivors);
    }
  });

  // ✅ Lock session to stop further joins
  socket.on("lockSession", (sessionId) => {
    if (sessions[sessionId]) {
      sessions[sessionId].locked = true;
      console.log(`🔒 Session ${sessionId} is now locked.`);
      io.emit("sessionStatus", { sessionId, locked: true });
    }
  });

  // ✅ Unlock session to allow joins
  socket.on("unlockSession", (sessionId) => {
    if (sessions[sessionId]) {
      sessions[sessionId].locked = false;
      console.log(`🔓 Session ${sessionId} is now unlocked`);
      io.emit("sessionStatus", { sessionId, locked: false });
    }
  });

  // ✅ Cleanup on disconnect
  socket.on('disconnect', () => {
    for (const sessionId in sessions) {
      delete sessions[sessionId].users[socket.id];
    }
    console.log(`❌ Disconnected: ${socket.id}`);
  });
});

server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
