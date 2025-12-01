const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  sessionId: { type: String, required: true },
  messages: [ChatMessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes for better performance
ChatHistorySchema.index({ userId: 1, sessionId: 1 });
ChatHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);

