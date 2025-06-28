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

// All sessions storage
const sessions = {}; // { sessionId: { users: { socketId: { name, id, eliminated } }, locked: false } }
let currentVotes = []; // { sessionId, socketId, vote }

io.on('connection', (socket) => {
  console.log(`📲 New connection: ${socket.id}`);

  // ✅ Create new session
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
    console.log(`✅ ${name} (${id}) joined session ${sessionId}`);
  });

  // ✅ Admin sends new question to participants
  socket.on("newQuestion", ({ sessionId, question }) => {
    const session = sessions[sessionId];
    if (session) {
      Object.keys(session.users).forEach(socketId => {
        io.to(socketId).emit("question", question);
      });
      console.log(`❓ New question sent to session ${sessionId}: ${question}`);
    }
  });

  // ✅ Vote from participant
  socket.on('vote', (option) => {
    const sessionId = Object.keys(sessions).find(sid => sessions[sid].users[socket.id]);
    if (sessionId) {
      const user = sessions[sessionId].users[socket.id];
      if (!user.eliminated) {
        currentVotes.push({ sessionId, socketId: socket.id, vote: option });
        console.log(`🗳️ Vote received from ${user.name} in ${sessionId}: ${option}`);
      }
    }
  });

  // ✅ Admin triggers result calculation and elimination
  socket.on('getResults', () => {
    const sessionId = Object.keys(sessions).find(sid => sessions[sid].users[socket.id]);
    if (!sessionId) return;

    const votesForSession = currentVotes.filter(v => v.sessionId === sessionId);
    const countA = votesForSession.filter(v => v.vote === 'A').length;
    const countB = votesForSession.filter(v => v.vote === 'B').length;
    const eliminate = countA > countB ? 'B' : 'A';

    votesForSession.forEach(({ socketId, vote }) => {
      const user = sessions[sessionId].users[socketId];
      if (vote === eliminate && user && !user.eliminated) {
        user.eliminated = true;
        io.to(socketId).emit("eliminated");
        console.log(`❌ Eliminated ${user.name} (${user.id}) from ${sessionId}`);
      }
    });

    Object.keys(sessions[sessionId].users).forEach(socketId => {
      io.to(socketId).emit('result', {
        percentA: ((countA / (countA + countB)) * 100 || 0).toFixed(1),
        percentB: ((countB / (countA + countB)) * 100 || 0).toFixed(1),
      });
    });

    console.log(`📊 Result for ${sessionId} — A: ${countA}, B: ${countB}`);
    currentVotes = currentVotes.filter(v => v.sessionId !== sessionId);
  });

  // ✅ Admin manually eliminates a user by ID
  socket.on("eliminateUser", ({ sessionId, id }) => {
    const session = sessions[sessionId];
    if (session) {
      const userSocketId = Object.keys(session.users).find(
        sid => session.users[sid].id === id
      );
      if (userSocketId) {
        session.users[userSocketId].eliminated = true;
        io.to(userSocketId).emit("eliminated");
        console.log(`⚔️ Admin eliminated ${id} from ${sessionId}`);
      }
    }
  });

  // ✅ Admin requests survivor list
  socket.on("getSurvivors", (sessionId) => {
    const session = sessions[sessionId];
    if (session) {
      const survivors = Object.values(session.users).filter(u => !u.eliminated);
      socket.emit("survivors", survivors);
      console.log(`📋 Sent survivors list for session ${sessionId}`);
    }
  });

  // ✅ Lock session to prevent new joins
  socket.on("lockSession", (sessionId) => {
    if (sessions[sessionId]) {
      sessions[sessionId].locked = true;
      io.emit("sessionStatus", { sessionId, locked: true });
      console.log(`🔒 Session ${sessionId} locked`);
    }
  });

  // ✅ Unlock session
  socket.on("unlockSession", (sessionId) => {
    if (sessions[sessionId]) {
      sessions[sessionId].locked = false;
      io.emit("sessionStatus", { sessionId, locked: false });
      console.log(`🔓 Session ${sessionId} unlocked`);
    }
  });

  // ✅ Remove user from session on disconnect
  socket.on('disconnect', () => {
    for (const sessionId in sessions) {
      if (sessions[sessionId].users[socket.id]) {
        const user = sessions[sessionId].users[socket.id];
        delete sessions[sessionId].users[socket.id];
        console.log(`❌ ${user.name} (${user.id}) disconnected from ${sessionId}`);
      }
    }
  });
});

server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
