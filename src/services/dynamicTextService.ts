// src/services/dynamicTextService.ts
import { generatePracticeText } from './huggingface';

export const generateInfiniteText = async (
  language: string,
  complexity: 'easy' | 'medium' | 'hard',
  signal?: AbortSignal
): Promise<string> => {
  try {
    // Check if already aborted before starting
    if (signal?.aborted) {
      throw new DOMException("Operation aborted by the user", "AbortError");
    }

    // Generate initial text (this will use fallback if API fails)
    // Don't pass signal directly since the interface doesn't support it
    const initialText = await generatePracticeText({
      type: 'text',
      language,
      difficulty: complexity
    });
    
    // Check if aborted during text generation
    if (signal?.aborted) {
      throw new DOMException("Operation aborted by the user", "AbortError");
    }
    
    // Check if we're getting a fallback text (API limit reached)
    if (initialText.includes("Artificial intelligence systems") || 
        initialText.includes("Cloud computing provides") ||
        initialText.includes("Cybersecurity protocols") ||
        initialText.includes("Version control systems") ||
        initialText.includes("Database optimization techniques")) {
      
      console.log("API limit reached, using extended fallback text");
      
      // Get multiple fallback texts and combine them for variety
      const additionalTexts = [
        "Machine learning algorithms analyze vast amounts of data to identify patterns and make predictions without explicit programming. Neural networks, inspired by human brain structure, excel at image recognition and natural language processing. Training these models requires significant computational resources and carefully labeled datasets.",
        
        "Web development involves creating and maintaining websites using a combination of frontend and backend technologies. Modern websites use responsive design to adapt to various screen sizes and devices. Performance optimization ensures fast load times and smooth user experiences across different network conditions.",
        
        "Container orchestration platforms like Kubernetes manage the deployment and scaling of application containers. This technology enables consistent operation across different environments from development to production. Microservices architecture breaks applications into smaller, independently deployable services that communicate through APIs.",
        
        "Quantum computing leverages quantum mechanics principles to process information in fundamentally new ways. Unlike classical bits, quantum bits or qubits can exist in multiple states simultaneously through superposition. This property potentially enables exponential speedups for certain computational problems that are intractable with classical computers."
      ];
      
      // Check if aborted before combining texts
      if (signal?.aborted) {
        throw new DOMException("Operation aborted by the user", "AbortError");
      }
      
      // Randomly select 2-3 additional texts for variety
      const shuffled = [...additionalTexts].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 2 + Math.floor(Math.random() * 2));
      
      // Create a longer text by combining fallbacks
      return initialText + " " + selected.join(" ");
    }
    
    return initialText;
  } catch (error) {
    // Propagate abort errors instead of handling them
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    
    console.error("Error in generateInfiniteText:", error);
    
    // Provide a robust fallback if any errors occur
    return "The process of mastering programming languages requires consistent practice and dedication to fundamentals. Developers must understand data structures, algorithms, and system architecture to build efficient applications. Modern software engineering combines technical skill with clear communication and collaborative workflows.";
  }
};
