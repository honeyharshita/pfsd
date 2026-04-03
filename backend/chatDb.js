import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindful-ai';

function normalizeUserEmail(userEmail) {
  if (typeof userEmail === 'string' && userEmail.trim()) {
    return userEmail.trim().toLowerCase();
  }
  return 'anonymous';
}

// Chat conversation schema
const chatConversationSchema = new mongoose.Schema({
  user_email: { type: String, required: true, index: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    emotion: { type: String, default: 'neutral' },
    sentiment_score: { type: Number, default: null },
    emotion_states: [{ type: String }],
    timestamp: { type: Date, default: Date.now }
  }],
  context_summary: { type: String, default: null },
  detected_themes: [String],
  emotional_profile: {
    last_emotion: { type: String, default: 'neutral' },
    frequent_emotion: { type: String, default: 'neutral' }
  },
  user_profile: {
    name: { type: String, default: null },
    common_problems: [{ type: String }]
  },
  memory_window_size: { type: Number, default: 15 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  is_crisis: { type: Boolean, default: false }
}, { timestamps: true });

// Index for efficient querying
chatConversationSchema.index({ user_email: 1, updated_at: -1 });

// Session analytics schema (for tracking session patterns)
const sessionAnalyticsSchema = new mongoose.Schema({
  user_email: { type: String, required: true, index: true },
  total_messages: { type: Number, default: 0 },
  average_sentiment_score: { type: Number, default: 0.5 },
  detected_themes: [String],
  crisis_count: { type: Number, default: 0 },
  last_session: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
}, { timestamps: true });

let ChatConversation = null;
let SessionAnalytics = null;
let isConnected = false;

async function connectMongoDB() {
  if (isConnected && ChatConversation) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    ChatConversation = mongoose.models.ChatConversation || mongoose.model('ChatConversation', chatConversationSchema, 'chat_conversations');
    SessionAnalytics = mongoose.models.SessionAnalytics || mongoose.model('SessionAnalytics', sessionAnalyticsSchema, 'session_analytics');
    isConnected = true;
    
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed:', error.message);
    console.warn('💾 Chat will use in-memory fallback storage');
    return false;
  }
}

// In-memory fallback
const inMemoryChats = new Map();
const inMemorySessions = new Map();

export async function getChatConversation(userEmail) {
  const safeUserEmail = normalizeUserEmail(userEmail);
  await connectMongoDB();
  
  if (isConnected && ChatConversation) {
    try {
      const conv = await ChatConversation.findOne({ user_email: safeUserEmail })
        .sort({ updated_at: -1 })
        .exec();
      return conv;
    } catch (error) {
      console.error('MongoDB query failed:', error.message);
      return inMemoryChats.get(safeUserEmail) || null;
    }
  }
  
  return inMemoryChats.get(safeUserEmail) || null;
}

export async function saveChatConversation(userEmail, messages, metadata = {}) {
  const safeUserEmail = normalizeUserEmail(userEmail);
  await connectMongoDB();
  const safeMessages = Array.isArray(messages) ? messages.slice(-200) : [];
  
  if (isConnected && ChatConversation) {
    try {
      let conv = await ChatConversation.findOne({ user_email: safeUserEmail }).exec();
      
      if (conv) {
        conv.messages = safeMessages;
        conv.updated_at = new Date();
        if (metadata.context_summary) conv.context_summary = metadata.context_summary;
        if (metadata.detected_themes) conv.detected_themes = metadata.detected_themes;
        if (metadata.is_crisis !== undefined) conv.is_crisis = metadata.is_crisis;
        if (metadata.emotional_profile) {
          conv.emotional_profile = {
            ...(conv.emotional_profile || {}),
            ...metadata.emotional_profile
          };
        }
        if (metadata.user_profile) {
          conv.user_profile = {
            ...(conv.user_profile || {}),
            ...metadata.user_profile
          };
        }
        await conv.save();
      } else {
        conv = new ChatConversation({
          user_email: safeUserEmail,
          messages: safeMessages,
          ...metadata
        });
        await conv.save();
      }
      
      // Update session analytics
      await updateSessionAnalytics(safeUserEmail, safeMessages, metadata.is_crisis);
      return conv;
    } catch (error) {
      console.error('MongoDB save failed:', error.message);
      // Fall back to in-memory
      inMemoryChats.set(safeUserEmail, { user_email: safeUserEmail, messages: safeMessages, ...metadata });
      return null;
    }
  }
  
  // Fallback to in-memory
  inMemoryChats.set(safeUserEmail, { user_email: safeUserEmail, messages: safeMessages, ...metadata });
  return null;
}

export async function updateSessionAnalytics(userEmail, messages = [], isCrisis = false) {
  const safeUserEmail = normalizeUserEmail(userEmail);
  await connectMongoDB();
  
  if (isConnected && SessionAnalytics) {
    try {
      let session = await SessionAnalytics.findOne({ user_email: safeUserEmail }).exec();
      
      if (!session) {
        session = new SessionAnalytics({ user_email: safeUserEmail });
      }
      
      session.total_messages = messages.length;
      session.last_session = new Date();
      if (isCrisis) session.crisis_count += 1;
      
      // Calculate average sentiment
      const sentiments = messages
        .filter(m => m.sentiment_score !== null && m.sentiment_score !== undefined)
        .map(m => m.sentiment_score);
      if (sentiments.length > 0) {
        session.average_sentiment_score = sentiments.reduce((a, b) => a + b) / sentiments.length;
      }
      
      await session.save();
    } catch (error) {
      console.error('Analytics update failed:', error.message);
    }
  }
}

export async function getAllConversations(userEmail) {
  const safeUserEmail = normalizeUserEmail(userEmail);
  await connectMongoDB();
  
  if (isConnected && ChatConversation) {
    try {
      return await ChatConversation.find({ user_email: safeUserEmail })
        .sort({ created_at: -1 })
        .exec();
    } catch (error) {
      console.error('MongoDB query failed:', error.message);
      const conv = inMemoryChats.get(safeUserEmail);
      return conv ? [conv] : [];
    }
  }
  
  const conv = inMemoryChats.get(safeUserEmail);
  return conv ? [conv] : [];
}

export async function deleteConversation(userEmail) {
  const safeUserEmail = normalizeUserEmail(userEmail);
  await connectMongoDB();
  
  if (isConnected && ChatConversation) {
    try {
      await ChatConversation.deleteMany({ user_email: safeUserEmail });
    } catch (error) {
      console.error('MongoDB delete failed:', error.message);
    }
  }
  
  inMemoryChats.delete(safeUserEmail);
}

export function getFrequentEmotion(messages = []) {
  const counts = new Map();
  for (const msg of messages) {
    const emotion = msg?.emotion || 'neutral';
    counts.set(emotion, (counts.get(emotion) || 0) + 1);
  }
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || 'neutral';
}

export function getInMemoryChats() {
  return inMemoryChats;
}
