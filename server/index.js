const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const sessions = {};

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let currentVotes = []; // { socketId, vote }

io.on('connection', (socket) => {
 

// Send list of survivors to requesting admin
socket.on("getSurvivors", (sessionId) => {
  const session = sessions[sessionId];
  if (session) {
    const survivors = Object.values(session.users).filter(u => !u.eliminated);
    socket.emit("survivors", survivors);
  }
});

socket.on("newQuestion", ({ sessionId, question }) => {
  io.emit("question", question); // Optionally, scope to session users
});



  

socket.on("createSession", (sessionId) => {
  sessions[sessionId] = { users: {}, locked: false };
});

  socket.on("join", ({ sessionId, name, id }) => {
  const session = sessions[sessionId];
  if (!session || session.locked) {
    socket.emit("joinRejected", "Session is locked or invalid");
    return;
  }
  session.users[socket.id] = { name, id, eliminated: false };
});
  
  socket.on('vote', (option) => {
    const sessionId = Object.keys(sessions).find(sid => sessions[sid].users[socket.id]);
if (sessionId) {
  const user = sessions[sessionId].users[socket.id];
  if (!user.eliminated) {
    currentVotes.push({ sessionId, socketId: socket.id, vote: option });
  }
}

  });


socket.on("eliminateUser", ({ sessionId, id }) => {
  const session = sessions[sessionId];
  const user = Object.values(session.users).find(u => u.id === id);
  if (user) {
    user.eliminated = true;
    const targetSocketId = Object.keys(session.users).find(
      sid => session.users[sid].id === id
    );
    io.to(targetSocketId).emit("eliminated");
  }
});  

  socket.on('getResults', () => {
  const countA = currentVotes.filter(v => v.vote === 'A').length;
  const countB = currentVotes.filter(v => v.vote === 'B').length;

  const eliminate = countA > countB ? 'B' : 'A';

  currentVotes.forEach(({ sessionId, socketId, vote }) => {
    if (vote === eliminate && sessions[sessionId]) {
      sessions[sessionId].users[socketId].eliminated = true;
      io.to(socketId).emit("eliminated");
    }
  });

  io.emit('result', {
    percentA: ((countA / (countA + countB)) * 100).toFixed(1),
    percentB: ((countB / (countA + countB)) * 100).toFixed(1),
  });

  currentVotes = [];
});


 


socket.on("lockSession", (sessionId) => {
  if (sessions[sessionId]) {
    sessions[sessionId].locked = true;
    console.log(`Session ${sessionId} is now locked.`);
     io.emit("sessionStatus", { sessionId, locked: true });
  }
});


socket.on("unlockSession", (sessionId) => {
  if (sessions[sessionId]) {
    sessions[sessionId].locked = false;
    console.log(`🔓 Session ${sessionId} is now unlocked`);
    io.emit("sessionStatus", { sessionId, locked: false });
  }
});
  
  
  socket.on('disconnect', () => {
     for (const sessionId in sessions) {
    delete sessions[sessionId].users[socket.id];
    
  }
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
