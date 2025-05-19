import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for client-side usage
});

interface GenerateTextParams {
  type: 'text' | 'code';
  language?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export const generatePracticeText = async ({
  type,
  language = 'javascript',
  difficulty = 'medium'
}: GenerateTextParams): Promise<string> => {
  try {
    const systemPrompt = type === 'text' 
      ? `Generate a ${difficulty} difficulty paragraph (40-60 words) about programming concepts. Focus on proper punctuation and varied vocabulary.`
      : `Generate a ${difficulty} difficulty ${language} code snippet (15-25 lines) demonstrating common patterns. Include comments and realistic syntax.`;

    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a technical writing assistant for a typing test application."
        },
        {
          role: "user",
          content: systemPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 350
    });

    return completion.choices[0].message.content?.trim() || '';
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate practice content');
  }
};
