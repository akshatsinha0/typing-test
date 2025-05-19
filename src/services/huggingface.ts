// src/services/huggingface.ts
import { InferenceClient } from '@huggingface/inference';

const inferenceClient = new InferenceClient(import.meta.env.VITE_HF_ACCESS_TOKEN);

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
    const prompt = type === 'text' 
      ? `Generate a ${difficulty} difficulty paragraph (40-60 words) about programming concepts for a typing test. Focus on proper punctuation and varied vocabulary.`
      : `Generate a ${difficulty} difficulty ${language} code snippet (15-25 lines) demonstrating common patterns. Include comments and use proper syntax.`;

    // Use different models based on task type (text vs code)
    const model = type === 'code' 
      ? 'Qwen/Qwen2.5-Coder-32B-Instruct' // Good for code generation
      : 'microsoft/phi-4'; // Good for general text

    const response = await inferenceClient.textGeneration({
      model,
      inputs: prompt,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.7,
        return_full_text: false
      }
    });

    return response.generated_text;
  } catch (error) {
    console.error('Hugging Face API Error:', error);
    
    // Return fallback content for different types
    if (type === 'code') {
      return `// Example ${language} function\nfunction calculateAverage(numbers) {\n  // Check if array is empty\n  if (numbers.length === 0) return 0;\n  \n  // Sum all numbers in the array\n  const sum = numbers.reduce((total, num) => total + num, 0);\n  \n  // Return the average\n  return sum / numbers.length;\n}`;
    } else {
      return "Programming is the process of creating instructions that tell a computer how to perform tasks. It combines logic, algorithms, and problem-solving to build software applications. Learning to program requires understanding syntax, data structures, and computational thinking.";
    }
  }
};
