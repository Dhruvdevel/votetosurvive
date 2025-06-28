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
    }
  });

  // Only send results to that session's users
  Object.keys(sessions[sessionId].users).forEach(socketId => {
    io.to(socketId).emit('result', {
      percentA: ((countA / (countA + countB)) * 100 || 0).toFixed(1),
      percentB: ((countB / (countA + countB)) * 100 || 0).toFixed(1),
    });
  });

  // Clear only that session's votes
  currentVotes = currentVotes.filter(v => v.sessionId !== sessionId);
});
