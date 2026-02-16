/**
 * In-memory session store for Planning Poker.
 * Sessions keyed by session ID; participants, stories, votes in memory.
 */

const FIBONACCI_VALUES = [0, '1/2', 1, 2, 3, 5, 8, 13, 20, 40, 100, '?', '∞', 'pause_cafe'];

function shortId() {
  return crypto.randomUUID().slice(0, 8);
}

/** @type {Map<string, Session>} */
export const sessions = new Map();

/**
 * @typedef {Object} Participant
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} Story
 * @property {string} id
 * @property {string} title
 * @property {number} order
 */

/**
 * @typedef {Object} Session
 * @property {string} id
 * @property {string} name - nom du sprint planning
 * @property {string} hostParticipantId - seul le host peut réordonner / passer les stories
 * @property {Participant[]} participants
 * @property {Story[]} stories
 * @property {number} currentStoryIndex
 * @property {Record<string, string|number>} votes - participantId -> value
 */

/**
 * @param {string} [hostName]
 * @param {string} [sprintName]
 * @returns {{ session: Session, participantId: string }}
 */
export function createSession(hostName, sprintName) {
  const id = shortId();
  const participantId = shortId();
  const session = {
    id,
    name: (sprintName && sprintName.trim()) ? sprintName.trim() : 'Sprint planning',
    hostParticipantId: participantId,
    participants: [{ id: participantId, name: hostName || 'Host' }],
    stories: [],
    currentStoryIndex: 0,
    votes: {},
  };
  sessions.set(id, session);
  return { session, participantId };
}

/**
 * @param {string} sessionId
 * @returns {Session | undefined}
 */
export function getSession(sessionId) {
  return sessions.get(sessionId);
}

/**
 * @param {string} sessionId
 * @param {string} name
 * @returns {string} participantId
 */
export function addParticipant(sessionId, name) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const participantId = shortId();
  session.participants.push({ id: participantId, name });
  return participantId;
}

/**
 * Remove a participant from a session (e.g. on disconnect).
 * If the participant was the host, the first remaining participant becomes host.
 * @param {string} sessionId
 * @param {string} participantId
 * @returns {boolean} true if participant was found and removed
 */
export function removeParticipant(sessionId, participantId) {
  const session = sessions.get(sessionId);
  if (!session) return false;
  const index = session.participants.findIndex((p) => p.id === participantId);
  if (index === -1) return false;
  session.participants.splice(index, 1);
  delete session.votes[participantId];
  if (session.participants.length > 0 && session.hostParticipantId === participantId) {
    session.hostParticipantId = session.participants[0].id;
  }
  return true;
}

/**
 * @param {string} sessionId
 * @param {string} title
 * @returns {Story}
 */
export function addStory(sessionId, title) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const order = session.stories.length;
  const story = {
    id: shortId(),
    title,
    order,
  };
  session.stories.push(story);
  return story;
}

/**
 * @param {string} sessionId
 * @param {string[]} storyIds - ordered list of story ids
 */
export function reorderStories(sessionId, storyIds) {
  const session = sessions.get(sessionId);
  if (!session) return;
  const byId = new Map(session.stories.map((s) => [s.id, s]));
  const reordered = [];
  storyIds.forEach((id, index) => {
    const s = byId.get(id);
    if (s) {
      s.order = index;
      reordered.push(s);
    }
  });
  session.stories = reordered.sort((a, b) => a.order - b.order);
}

/**
 * Skip a story: remove it from the stories array.
 * If it's before or at currentStoryIndex, adjust the index so the current story stays the same.
 * @param {string} sessionId
 * @param {string} storyId
 * @returns {{ found: boolean, wasCurrentStory: boolean }}
 */
export function removeStory(sessionId, storyId) {
  const session = sessions.get(sessionId);
  if (!session) return { found: false, wasCurrentStory: false };
  const idx = session.stories.findIndex((s) => s.id === storyId);
  if (idx === -1) return { found: false, wasCurrentStory: false };

  const wasCurrentStory = idx === session.currentStoryIndex;
  session.stories.splice(idx, 1);

  if (wasCurrentStory) {
    // Clear votes since we're moving away from this story
    session.votes = {};
    // currentStoryIndex now naturally points to the next story
  } else if (idx < session.currentStoryIndex) {
    // Story was before current, adjust index to keep pointing at the same story
    session.currentStoryIndex--;
  }

  return { found: true, wasCurrentStory };
}

/**
 * @param {string} sessionId
 * @param {string} participantId
 * @param {string|number} value
 */
export function setVote(sessionId, participantId, value) {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.votes[participantId] = value;
}

/**
 * @param {string} sessionId
 * @returns {boolean}
 */
export function allVoted(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || session.participants.length === 0) return false;
  return session.participants.every((p) => session.votes[p.id] !== undefined);
}

/**
 * Clear votes and advance to the next story.
 * @param {string} sessionId
 * @returns {{ done: boolean, currentStoryIndex: number, storyId?: string }}
 */
export function clearVotesAndAdvance(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return { done: true, currentStoryIndex: -1 };
  session.votes = {};
  const nextIndex = session.currentStoryIndex + 1;
  session.currentStoryIndex = nextIndex;
  if (nextIndex >= session.stories.length) {
    return { done: true, currentStoryIndex: nextIndex };
  }
  const story = session.stories[nextIndex];
  return { done: false, currentStoryIndex: nextIndex, storyId: story.id };
}

export function getCurrentStory(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || session.currentStoryIndex >= session.stories.length) return null;
  return session.stories[session.currentStoryIndex];
}

export { FIBONACCI_VALUES };
