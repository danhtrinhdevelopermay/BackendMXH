const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function improveText(text) {
  try {
    const prompt = `Bạn là một chuyên gia viết nội dung mạng xã hội. Hãy cải thiện đoạn văn sau để nó hấp dẫn, sinh động và thu hút hơn, nhưng vẫn giữ nguyên ý nghĩa và giọng điệu của người viết. Viết bằng tiếng Việt tự nhiên.

Văn bản gốc: "${text}"

Chỉ trả về văn bản đã được cải thiện, không thêm bất kỳ giải thích nào.`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    return response.text || text;
  } catch (error) {
    console.error('Error improving text with Gemini:', error);
    throw new Error('Không thể cải thiện văn bản. Vui lòng thử lại.');
  }
}

async function generateText(prompt) {
  try {
    const fullPrompt = `Bạn là một chuyên gia viết nội dung mạng xã hội. Hãy tạo một bài viết hấp dẫn, sinh động dựa trên yêu cầu sau. Viết bằng tiếng Việt tự nhiên, phù hợp để đăng lên Facebook.

Yêu cầu: "${prompt}"

Chỉ trả về nội dung bài viết, không thêm bất kỳ tiêu đề hay giải thích nào.`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: fullPrompt,
    });

    return response.text || '';
  } catch (error) {
    console.error('Error generating text with Gemini:', error);
    throw new Error('Không thể tạo văn bản. Vui lòng thử lại.');
  }
}

module.exports = {
  improveText,
  generateText,
};
