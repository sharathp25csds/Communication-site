const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');

// @desc    Process Speech-to-Text
// @route   POST /api/ai/stt
const processSTT = async (req, res, next) => {
  try {
    // Logic for STT (e.g., using Google Cloud Speech-to-Text or similar)
    // For now, returning a placeholder
    res.json({ text: "Sample transcribed text from AI" });
  } catch (error) {
    next(error);
  }
};

// @desc    Process Text-to-Speech
// @route   POST /api/ai/tts
const processTTS = async (req, res, next) => {
  try {
    // Logic for TTS
    // For now, returning a placeholder
    res.json({ audioUrl: "https://example.com/sample-audio.mp3" });
  } catch (error) {
    next(error);
  }
};

// @desc    Chat with Gemini AI
// @route   POST /api/ai/chat
const chatWithAI = async (req, res, next) => {
  try {
    const { message, language } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    const apiKey = process.env.Gemini_API_Key || process.env.AI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ success: false, error: "AI API key not configured" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `You are an accessibility communication assistant for VoiceBridge, a platform for people with speech and hearing disabilities.
Your goals:
- Be polite, helpful, short, and clear.
- Provide concise responses.
- Use accessible language.
- Provide communication support and accessibility help.
- Respond in the language requested or inferred from the input. Target language: ${language || 'Auto-detect'}.

User Message: ${message}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Save chat to database — req.user is guaranteed by protect middleware
    if (req.user && req.user.id) {
      try {
        await db.execute(
          'INSERT INTO ai_chats (user_id, message, reply) VALUES (?, ?, ?)',
          [req.user.id, message, responseText]
        );
        console.log('✅ [AI Controller] Chat saved to DB for user:', req.user.id);
      } catch (dbErr) {
        console.error('❌ [AI Controller] Failed to save AI chat to DB:', {
          userId: req.user.id,
          error: dbErr.message,
          code: dbErr.code
        });
      }
    } else {
      console.warn('⚠️ [AI Controller] req.user missing — chat not saved. Token may have failed silently.');
    }

    res.json({
      success: true,
      reply: responseText
    });
  } catch (error) {
    console.error('❌ [AI Controller] Gemini API Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to communicate with AI Assistant' });
  }
};

module.exports = { processSTT, processTTS, chatWithAI };
