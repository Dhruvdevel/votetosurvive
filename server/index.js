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

let users = {}; // socket.id -> { name, id, eliminated: false }
let currentVotes = []; // { socketId, vote }

io.on('connection', (socket) => {
  socket.on('join', ({ name, id }) => {
    users[socket.id] = { name, id, eliminated: false };
    console.log(`${name} joined`);
// Send question to everyone
socket.on("newQuestion", (q) => {
  io.emit("question", q);
});

// Send list of survivors to requesting admin
socket.on("getSurvivors", () => {
  const survivors = Object.values(users).filter(u => !u.eliminated);
  socket.emit("survivors", survivors);
});


    
  });

  socket.on('vote', (option) => {
    if (!users[socket.id].eliminated) {
      currentVotes.push({ socketId: socket.id, vote: option });
    }
  });

  socket.on('getResults', () => {
    const countA = currentVotes.filter(v => v.vote === 'A').length;
    const countB = currentVotes.filter(v => v.vote === 'B').length;

    const eliminate = countA > countB ? 'B' : 'A';

    currentVotes.forEach(({ socketId, vote }) => {
      if (vote === eliminate) {
        users[socketId].eliminated = true;
      }
    });

    io.emit('result', {
      percentA: ((countA / (countA + countB)) * 100).toFixed(1),
      percentB: ((countB / (countA + countB)) * 100).toFixed(1),
    });

    currentVotes = [];
  });

  socket.on('getSurvivors', () => {
    const survivors = Object.values(users).filter(u => !u.eliminated);
    socket.emit('survivors', survivors);
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
