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

module.exports = {
  generateText,
};
