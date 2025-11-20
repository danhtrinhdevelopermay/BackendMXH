const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '',
  apiVersion: 'v1'
});

async function improveText(text) {
  try {
    const prompt = `Bạn là một chuyên gia viết nội dung mạng xã hội. Hãy cải thiện đoạn văn sau để nó hấp dẫn, sinh động và thu hút hơn, nhưng vẫn giữ nguyên ý nghĩa và giọng điệu của người viết. Viết bằng tiếng Việt tự nhiên.

Văn bản gốc: "${text}"

Chỉ trả về văn bản đã được cải thiện, không thêm bất kỳ giải thích nào.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
      model: 'gemini-2.0-flash',
      contents: fullPrompt,
    });

    return response.text || '';
  } catch (error) {
    console.error('Error generating text with Gemini:', error);
    throw new Error('Không thể tạo văn bản. Vui lòng thử lại.');
  }
}

async function generateIceBreaker(userName, otherUserName) {
  try {
    const prompt = `Bạn là một trợ lý thông minh giúp tạo tin nhắn phá băng cho 2 người bạn mới kết bạn trên mạng xã hội.

${userName} vừa kết bạn với ${otherUserName}. Hãy tạo 3 gợi ý tin nhắn ngắn gọn, thân thiện, tự nhiên để ${userName} có thể bắt đầu cuộc trò chuyện với ${otherUserName}.

Yêu cầu:
- Mỗi gợi ý từ 5-15 từ
- Thân thiện, tự nhiên, không quá trang trọng
- Phù hợp với văn hóa Việt Nam
- Không dùng emoji

Chỉ trả về 3 gợi ý, mỗi gợi ý trên 1 dòng, không đánh số, không thêm giải thích.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const suggestions = text.split('\n').filter(line => line.trim()).slice(0, 3);
    
    return suggestions.length > 0 ? suggestions : [
      `Chào ${otherUserName}, rất vui được kết bạn với bạn!`,
      `Hi ${otherUserName}, mình thấy profile bạn thú vị quá!`,
      `Chào bạn! Chúng ta có bạn chung không nhỉ?`
    ];
  } catch (error) {
    console.error('Error generating ice breaker with Gemini:', error);
    return [
      `Chào ${otherUserName}, rất vui được kết bạn với bạn!`,
      `Hi ${otherUserName}, mình thấy profile bạn thú vị quá!`,
      `Chào bạn! Chúng ta có bạn chung không nhỉ?`
    ];
  }
}

module.exports = {
  improveText,
  generateText,
  generateIceBreaker,
};
