import { json, type RequestHandler, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';

export const POST: RequestHandler = async ({ request }) => {
  if (!env.OPENAI_API_KEY) {
    throw error(500, 'OpenAI API key not configured');
  }

  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY
  });

  try {
    const { prompt, mode = 'chat' } = await request.json();

    if (!prompt) {
      throw error(400, 'Prompt is required');
    }

    let systemPrompt = '';
    switch (mode) {
      case 'practice':
        systemPrompt = `You are a French language practice partner. For each user message:

        1. Language Detection & Translation:
        - Detect if the message is in English or French
        - If the message is in English:
          🌍 English: [original text]
          🇫🇷 French: [translation]
        - If the message is in French:
          🇫🇷 French: [original text]
          🌍 English: [translation]
        
        2. Grammar Check (if French):
        ✍️ Grammar Check:
        - Point out any grammar mistakes
        - Provide corrections
        - Explain the corrections
        
        3. Response:
        💭 Response in both languages:
        🇫🇷: [your response in French]
        🌍: [same response in English]

        Keep conversations natural and flowing, maintain both languages throughout.`;
        break;
      case 'grammar':
        systemPrompt = `You are a French language teacher specializing in grammar. 
        Analyze the given French text and provide:

        1. Corrected Version (if needed):
        - Original: [original text]
        - Corrected: [corrected text]
        - Changes Made: [list each correction with explanation]

        2. Grammar Analysis:
        - Tenses Used: [identify verb tenses]
        - Structure: [analyze sentence structure]
        - Common Pitfalls: [note any typical mistakes to watch for]

        3. Style Suggestions:
        - More Natural Alternatives: [if applicable]
        - Register: [formal/informal usage notes]

        If the text is already correct, praise the good usage and explain why it works well.`;
        break;
      case 'vocabulary':
        systemPrompt = `You are a French language teacher. For the given word or phrase, provide:
        
        📝 French Word/Phrase:
        🔊 Pronunciation: 
        🌍 English Translation:
        
        📚 Example Usage:
        • French: [example sentence]
        • English: [translation]
        
        💡 Cultural Context:
        • When to use it
        • Common situations
        • Cultural significance`;
        break;
      default:
        systemPrompt = `You are an expert French language teacher. Structure your responses with clear sections:
        
        📚 Key Points:
        • [main concepts]
        
        💭 Examples:
        • [practical examples with translations]
        
        ✍️ Practice:
        • [suggested exercises]
        
        🎨 Cultural Notes:
        • [relevant cultural context]`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          "role": "system",
          "content": systemPrompt
        },
        {
          "role": "user",
          "content": prompt
        }
      ]
    });

    if (!completion.choices?.[0]?.message) {
      throw error(500, 'Invalid response from OpenAI API');
    }

    return json(completion);
  } catch (e) {
    console.error('API error:', e);
    if (e instanceof Error) {
      throw error(500, e.message);
    }
    throw error(500, 'An unexpected error occurred');
  }
};