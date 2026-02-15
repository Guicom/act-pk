import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  createSession,
  getSession,
  addParticipant,
  removeParticipant,
  addStory,
  reorderStories,
  setStorySkipped,
  setVote,
  allVoted,
  clearVotesAndAdvance,
  getCurrentStory,
  FIBONACCI_VALUES,
} from './store.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true },
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// --- REST ---

// POST /api/sessions — create sprint planning
app.post('/api/sessions', (req, res) => {
  const hostName = req.body?.name;
  const sprintName = req.body?.sprintName;
  const { session, participantId } = createSession(hostName, sprintName);
  const inviteLink = `${BASE_URL.replace(/\/$/, '')}/join?session=${session.id}`;
  res.status(201).json({
    sessionId: session.id,
    sessionName: session.name,
    inviteLink,
    participantId,
  });
});

// POST /api/sessions/:id/join — join session
app.post('/api/sessions/:id/join', (req, res) => {
  const sessionId = req.params.id;
  const displayName = req.body?.displayName;
  if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
    return res.status(400).json({ error: 'displayName is required' });
  }
  const session = getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Sprint planning introuvable' });
  }
  const participantId = addParticipant(sessionId, displayName.trim());
  res.status(200).json({ participantId, sessionId, sessionName: session.name });
});

// --- Socket.IO ---

io.on('connection', (socket) => {
  socket.on('join_session', ({ sessionId, participantId }) => {
    if (!sessionId) return;
    const session = getSession(sessionId);
    if (!session) {
      socket.emit('error', { message: 'Sprint planning introuvable' });
      return;
    }
    socket.join(`session:${sessionId}`);
    socket.sessionId = sessionId;
    socket.participantId = participantId;

    const updated = getSession(sessionId);

    // Envoyer l'état complet au client qui rejoint (backlog + participants + qui a voté)
    socket.emit('backlog_updated', {
      stories: updated.stories,
      currentStoryIndex: updated.currentStoryIndex,
      participants: updated.participants,
      voterIds: Object.keys(updated.votes || {}),
    });

    // Notifier toute la room (y compris le joiner une fois dans la room) pour que tout le monde ait la même liste
    io.to(`session:${sessionId}`).emit('participants_updated', {
      participants: updated.participants,
    });
  });

  socket.on('story_added', ({ sessionId, title }) => {
    if (!sessionId || !title) return;
    const session = getSession(sessionId);
    if (!session) return;
    if (socket.participantId !== session.hostParticipantId) return;
    addStory(sessionId, title.trim());
    const updated = getSession(sessionId);
    io.to(`session:${sessionId}`).emit('backlog_updated', {
      stories: updated.stories,
      currentStoryIndex: updated.currentStoryIndex,
    });
  });

  socket.on('story_reordered', ({ sessionId, storyIds }) => {
    if (!sessionId || !Array.isArray(storyIds)) return;
    const session = getSession(sessionId);
    if (!session) return;
    if (socket.participantId !== session.hostParticipantId) return;
    reorderStories(sessionId, storyIds);
    const updated = getSession(sessionId);
    io.to(`session:${sessionId}`).emit('backlog_updated', {
      stories: updated.stories,
      currentStoryIndex: updated.currentStoryIndex,
    });
  });

  socket.on('story_skipped', ({ sessionId, storyId }) => {
    if (!sessionId || !storyId) return;
    const session = getSession(sessionId);
    if (!session) return;
    if (socket.participantId !== session.hostParticipantId) return;
    setStorySkipped(sessionId, storyId);
    const updated = getSession(sessionId);
    io.to(`session:${sessionId}`).emit('backlog_updated', {
      stories: updated.stories,
      currentStoryIndex: updated.currentStoryIndex,
    });
  });

  socket.on('vote_submitted', ({ sessionId, participantId, storyId, value }) => {
    if (!sessionId || !participantId || !storyId) return;
    if (!FIBONACCI_VALUES.includes(value)) return;
    const session = getSession(sessionId);
    if (!session) return;
    const current = getCurrentStory(sessionId);
    if (!current || current.id !== storyId) return;
    setVote(sessionId, participantId, value);
    const updatedAfterVote = getSession(sessionId);
    io.to(`session:${sessionId}`).emit('voters_updated', {
      voterIds: Object.keys(updatedAfterVote.votes || {}),
    });
    if (allVoted(sessionId)) {
      const votes = { ...updatedAfterVote.votes };
      io.to(`session:${sessionId}`).emit('votes_revealed', { storyId, votes });
    }
  });

  socket.on('next_story', ({ sessionId }) => {
    if (!sessionId) return;
    const session = getSession(sessionId);
    if (!session) return;
    if (socket.participantId !== session.hostParticipantId) return;
    const result = clearVotesAndAdvance(sessionId);
    const updated = getSession(sessionId);
    io.to(`session:${sessionId}`).emit('backlog_updated', {
      stories: updated.stories,
      currentStoryIndex: updated.currentStoryIndex,
    });
    io.to(`session:${sessionId}`).emit('voters_updated', { voterIds: [] });
    if (result.done) {
      io.to(`session:${sessionId}`).emit('session_complete', {});
    } else {
      io.to(`session:${sessionId}`).emit('current_story_updated', {
        currentStoryIndex: result.currentStoryIndex,
        storyId: result.storyId,
      });
    }
  });

  socket.on('disconnect', () => {
    const sessionId = socket.sessionId;
    const participantId = socket.participantId;
    if (!sessionId || !participantId) return;
    if (removeParticipant(sessionId, participantId)) {
      const updated = getSession(sessionId);
      if (updated) {
        io.to(`session:${sessionId}`).emit('participants_updated', {
          participants: updated.participants,
        });
      }
    }
  });
});

// --- Start ---

httpServer.listen(PORT, () => {
  console.log(`Planning Poker server at http://localhost:${PORT}`);
});
