import { useState } from 'react';
import { generatePracticeText } from '../../../services/openai';

export const useTextGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateText = async (type: 'text' | 'code', language?: string) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const text = await generatePracticeText({
        type,
        language,
        difficulty: 'medium'
      });
      
      if (!text) throw new Error('Empty response from API');
      return text;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate text');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateText, isGenerating, error };
};
