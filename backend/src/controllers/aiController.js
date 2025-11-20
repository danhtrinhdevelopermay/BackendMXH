const geminiService = require('../services/geminiService');

const generateText = async (req, res) => {
  try {
    const { text, mode } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!mode || !['improve', 'generate'].includes(mode)) {
      return res.status(400).json({ error: 'Mode must be "improve" or "generate"' });
    }

    let result;
    if (mode === 'improve') {
      result = await geminiService.improveText(text);
    } else {
      result = await geminiService.generateText(text);
    }

    res.json({ text: result });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate text' });
  }
};

const generateIceBreaker = async (req, res) => {
  try {
    const { userName, otherUserName } = req.body;

    if (!userName || !otherUserName) {
      return res.status(400).json({ error: 'Both user names are required' });
    }

    const suggestions = await geminiService.generateIceBreaker(userName, otherUserName);

    res.json({ suggestions });
  } catch (error) {
    console.error('Ice breaker generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate ice breaker' });
  }
};

module.exports = {
  generateText,
  generateIceBreaker,
};
