// src/services/huggingface.ts
import { InferenceClient } from '@huggingface/inference';

// Create client with correct token initialization
const inferenceClient = new InferenceClient(import.meta.env.VITE_HF_ACCESS_TOKEN || '');

// Store successful generations to avoid repetition
const recentTexts = {
  text: new Set<string>(),
  code: new Map<string, Set<string>>()
};

// Maximum items to remember per category
const MAX_RECENT = 5;

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
    const prompt = type === 'text' 
      ? `Generate a ${difficulty} difficulty paragraph (40-60 words) about ${randomTopic} for a typing test. Focus on proper punctuation and varied vocabulary. The content should be educational and interesting.`
      : `Generate a ${difficulty} difficulty ${language} code snippet (15-25 lines) that demonstrates ${randomTopic} concepts. Include helpful comments and use proper syntax. Make it realistic code that might be found in a production environment.`;

    // Use more reliable models with better outputs
    const model = type === 'code' 
      ? 'bigcode/starcoder' // More reliable than Qwen for code
      : 'google/gemma-2-9b-it'; // Reliable general model with good inference API support
      
    console.log(`Attempting to generate ${type} with model: ${model}`);

    const response = await inferenceClient.textGeneration({
      model,
      inputs: prompt,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.8, // Slightly higher temperature for more diversity
        top_p: 0.92,
        do_sample: true,
        return_full_text: false,
        repetition_penalty: 1.2
      }
    });

    const generatedText = response.generated_text.trim();
    
    // If successful, add to recent texts to avoid repetition
    if (generatedText && generatedText.length > 20) {
      if (type === 'text') {
        recentTexts.text.add(generatedText);
        if (recentTexts.text.size > MAX_RECENT) {
          const oldest = recentTexts.text.values().next().value;
          if (oldest !== undefined) {
            recentTexts.text.delete(oldest);
          }
        }
      } else {
        if (!recentTexts.code.has(language)) {
          recentTexts.code.set(language, new Set());
        }
        recentTexts.code.get(language)!.add(generatedText);
        const langTexts = recentTexts.code.get(language)!;
        if (langTexts.size > MAX_RECENT) {
          const oldest = langTexts.values().next().value;
          if (oldest !== undefined) {
            langTexts.delete(oldest);
          }
        }
      }
      return generatedText;
    }
    
    throw new Error('Generated text was empty or too short');
  } catch (error) {
    console.error('Hugging Face API Error:', error);
    
    // Enhanced fallback content with randomization
    if (type === 'code') {
      return getRandomCodeFallback(language);
    } else {
      return getRandomTextFallback();
    }
  }
};

// Multiple text fallbacks for variety
function getRandomTextFallback(): string {
  const fallbacks = [
    "Programming is the process of creating instructions that tell a computer how to perform tasks. It combines logic, algorithms, and problem-solving to build software applications. Learning to program requires understanding syntax, data structures, and computational thinking.",
    
    "Version control systems like Git enable developers to track changes, collaborate efficiently, and maintain code history. Repositories store project files, while branches allow parallel development without affecting the main codebase. Pull requests facilitate code review before merging changes.",
    
    "Cloud computing provides on-demand access to computing resources over the internet. Services include storage, databases, networking, and software. This model offers scalability, reduced infrastructure costs, and flexibility for businesses of all sizes.",
    
    "Cybersecurity protects systems and networks from digital attacks. Common threats include malware, phishing, and ransomware. Defense strategies involve encryption, authentication, and regular security updates to safeguard sensitive information.",
    
    "APIs (Application Programming Interfaces) enable different software systems to communicate. RESTful APIs use HTTP requests to access and manipulate data, while GraphQL provides a more flexible query language. Well-designed APIs accelerate development and improve integration."
  ];
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// Multiple code fallbacks for variety
function getRandomCodeFallback(language: string): string {
  if (language === 'javascript' || language === 'typescript') {
    const fallbacks = [
      `// Calculate average of numbers in an array
function calculateAverage(numbers) {
  // Check if array is empty
  if (numbers.length === 0) return 0;
  
  // Sum all numbers in the array
  const sum = numbers.reduce((total, num) => total + num, 0);
  
  // Return the average
  return sum / numbers.length;
}`,

      `// Simple debounce function implementation
function debounce(func, wait) {
  // Store timeout reference
  let timeout;
  
  // Return wrapped function
  return function executedFunction(...args) {
    // Store this context
    const context = this;
    
    // Clear previous timeout
    clearTimeout(timeout);
    
    // Set new timeout
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}`,

      `// Fetch data with async/await pattern
async function fetchUserData(userId) {
  try {
    // Request user information
    const response = await fetch(\`https://api.example.com/users/\${userId}\`);
    
    // Check if request was successful
    if (!response.ok) {
      throw new Error(\`HTTP error: \${response.status}\`);
    }
    
    // Parse response as JSON
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Fetching user data failed:', error);
    throw error;
  }
}`
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  } 
  else if (language === 'python') {
    return `# Function to find prime numbers up to n
def sieve_of_eratosthenes(n):
    """
    Find all prime numbers up to n using Sieve of Eratosthenes
    """
    # Initialize sieve array with True values
    sieve = [True for _ in range(n+1)]
    p = 2
    
    # Mark multiples of each prime as non-prime
    while p * p <= n:
        if sieve[p]:
            # Update all multiples of p
            for i in range(p * p, n+1, p):
                sieve[i] = False
        p += 1
    
    # Collect prime numbers from sieve
    primes = [p for p in range(2, n+1) if sieve[p]]
    return primes

# Example usage
print(sieve_of_eratosthenes(50))`;
  } 
  else {
    // Generic fallback for other languages
    return `// Example ${language} function
// This is a placeholder since API request failed
// Function calculates sum and average of array elements

function processData(data) {
  // Initialize variables
  let sum = 0;
  let max = data.length > 0 ? data[0] : 0;
  
  // Process each data point
  for (let i = 0; i < data.length; i++) {
    // Add to running sum
    sum += data[i];
    
    // Track maximum value
    if (data[i] > max) {
      max = data[i];
    }
  }
  
  // Calculate average
  const average = data.length > 0 ? sum / data.length : 0;
  
  // Return computed values
  return {
    sum: sum,
    average: average,
    maximum: max
  };
}`;
  }
}
