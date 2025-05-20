// src/services/huggingface.ts
import { InferenceClient } from '@huggingface/inference';

// Create client with proper configuration
const inferenceClient = new InferenceClient(import.meta.env.VITE_HF_ACCESS_TOKEN || '');

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
  // Add randomization to prevent identical prompts
  const topics = [
    'algorithms', 'data structures', 'machine learning', 
    'web development', 'cloud computing', 'cybersecurity',
    'database design', 'mobile apps', 'game development',
    'artificial intelligence', 'blockchain', 'DevOps'
  ];
  
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  
  try {
    // Create appropriate prompt based on type
    const prompt = type === 'text' 
      ? `Generate a ${difficulty} difficulty paragraph (40-60 words) about ${randomTopic} for a typing test. Focus on proper punctuation and varied vocabulary.`
      : `Generate a ${difficulty} difficulty ${language} code snippet (15-25 lines) that demonstrates ${randomTopic} concepts. Include comments and use proper syntax.`;

    console.log(`Attempting to generate ${type} content about ${randomTopic}...`);

    // Use chat-based model interaction since that's what novita supports
    const response = await inferenceClient.chatCompletion({
      model: "meta-llama/Meta-Llama-3.1-8B-Instruct", // Better supported model
      messages: [
        { role: "system", content: "You are a helpful assistant providing text for typing practice." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 250
    });

    // Extract the response content safely
    const generatedText = response.choices &&
      response.choices[0] &&
      response.choices[0].message &&
      typeof response.choices[0].message.content === 'string'
      ? response.choices[0].message.content.trim()
      : '';

    if (generatedText && generatedText.length > 20) {
      console.log("Successfully generated new content");
      return generatedText;
    }
    
    throw new Error('Generated text was empty or too short');
  } catch (error) {
    console.error('Hugging Face API Error:', error);
    
    // Try alternative models if first attempt fails
    try {
      console.log("Attempting fallback with different model...");
      
      // Try using the official Hugging Face Inference API directly
      const fallbackResponse = await fetch(
        "https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_HF_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            inputs: type === 'text'
              ? `Write a paragraph about ${randomTopic} for a typing test.`
              : `Write a ${language} code snippet about ${randomTopic} with comments.`,
            parameters: {
              max_new_tokens: 200,
              temperature: 0.8,
              return_full_text: false
            }
          })
        }
      );
      
      const fallbackData = await fallbackResponse.json();
      if (fallbackData && fallbackData.generated_text) {
        console.log("Successfully generated content with fallback model");
        return fallbackData.generated_text;
      }
    } catch (fallbackError) {
      console.error("Fallback model also failed:", fallbackError);
    }
    
    // Return appropriate fallback content if all else fails
    return getRandomFallbackContent(type, language);
  }
};

// Get random fallback content to ensure variety even when API fails
function getRandomFallbackContent(type: 'text' | 'code', language?: string): string {
  if (type === 'code') {
    const codeFallbacks = [
      `// ${language} function to calculate factorial
function factorial(n) {
  // Base case: factorial of 0 or 1 is 1
  if (n <= 1) return 1;
  
  // Recursive case: n! = n * (n-1)!
  return n * factorial(n - 1);
}

// Example usage
console.log(factorial(5)); // 120`,

      `// ${language} function to check if a string is a palindrome
function isPalindrome(str) {
  // Remove non-alphanumeric characters and convert to lowercase
  const cleanStr = str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  // Compare with reversed version
  const reversedStr = cleanStr.split('').reverse().join('');
  
  return cleanStr === reversedStr;
}

// Test cases
console.log(isPalindrome("radar")); // true
console.log(isPalindrome("A man, a plan, a canal: Panama")); // true
console.log(isPalindrome("hello")); // false`,

      `// ${language} implementation of bubble sort
function bubbleSort(arr) {
  const n = arr.length;
  
  // Outer loop for passes
  for (let i = 0; i < n; i++) {
    let swapped = false;
    
    // Inner loop for comparisons
    for (let j = 0; j < n - i - 1; j++) {
      // Compare adjacent elements
      if (arr[j] > arr[j + 1]) {
        // Swap elements
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    
    // If no swapping occurred in this pass, array is sorted
    if (!swapped) break;
  }
  
  return arr;
}`
    ];
    
    return codeFallbacks[Math.floor(Math.random() * codeFallbacks.length)];
  } else {
    const textFallbacks = [
      "Artificial intelligence systems continue to transform industries with intelligent automation and predictive capabilities. Modern AI leverages neural networks to recognize patterns in vast datasets, enabling applications from natural language processing to computer vision. Ethical considerations around bias and transparency remain critical challenges.",
      
      "Cloud computing provides scalable resources for businesses without substantial hardware investments. Services range from infrastructure to platforms and software, all accessed remotely. This technology enables global collaboration, improved disaster recovery, and reduced operational costs while maintaining security through encryption and access controls.",
      
      "Cybersecurity protocols protect sensitive information from unauthorized access and evolving digital threats. Essential strategies include data encryption, multi-factor authentication, and regular security assessments. Organizations must stay vigilant against phishing attempts, ransomware, and zero-day vulnerabilities through continuous training and system updates.",
      
      "Version control systems enable developers to track code changes efficiently while facilitating team collaboration. By maintaining comprehensive history, these tools allow easy rollback to previous states when needed. Modern systems like Git provide branching capabilities that support simultaneous feature development without disrupting the main codebase.",
      
      "Database optimization techniques improve application performance through strategic indexing and query refinement. Normalized schemas reduce redundancy while maintaining data integrity across related tables. For high-traffic systems, caching mechanisms and connection pooling significantly reduce response times and resource consumption."
    ];
    
    return textFallbacks[Math.floor(Math.random() * textFallbacks.length)];
  }
}
