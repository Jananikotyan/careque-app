const logger = require('../config/logger');

exports.chat = async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: 'Messages array is required' } });
    }

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: { message: 'AI_API_KEY is not configured' } });
    }

    const systemPrompt = {
      role: 'system',
      content: `You are a helpful, professional, and empathetic AI hospital assistant named 'MediBot'. 
Your job is to answer patient queries, help them figure out which specialist they might need based on their symptoms, and provide general hospital information. 
DO NOT give definitive medical diagnoses. Always advise them to book an appointment with a doctor for a proper diagnosis.`
    };

    const apiMessages = [systemPrompt, ...messages];

    // Using native fetch in Node 18+
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 250
      })
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('OpenAI Error: ', data);
      throw new Error(data.error?.message || 'Failed to fetch AI response');
    }

    const reply = data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    next(error);
  }
};
