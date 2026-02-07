// Vercel Serverless Function for AI Chat
// This function acts as a secure proxy to the OpenAI API

export const config = {
    runtime: 'edge', // Use edge runtime for fast responses
};

export default async function handler(req) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { message, conversationHistory = [] } = await req.json();

        if (!message || typeof message !== 'string') {
            return new Response(JSON.stringify({ error: 'Message is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get API key from environment variables (set in Vercel dashboard)
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ 
                error: 'API key not configured. Please set GROQ_API_KEY in Vercel environment variables.' 
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // System prompt for the AI - customize this for your needs
        const systemPrompt = {
            role: 'system',
            content: `You are a supportive, friendly study assistant specifically designed for students with ADHD and ADD. 

Your personality:
- Encouraging and positive, never judgmental
- Understanding of ADHD and challenges related to similar disorders (executive dysfunction, time blindness, hyperfocus)
- However, do not assume anything about the conditions of the user
- Practical and action-oriented

Your approach:
- Break large tasks into tiny, manageable steps
- Suggest study techniques suitable for students with e.g. ADHD (Pomodoro, body doubling, gamification)
- Remind students to take breaks and practice self-care
- Use clear, concise language (ADHD brains appreciate brevity)
- Add emoji occasionally for visual engagement, but not too often 🎯
- Validate struggles and celebrate small wins
- Use proper spacing and dividing of text, to make the answers legible and structured

Keep responses under 150 words unless the user asks for detailed explanations.`
        };

        // Build messages array with system prompt, history, and current message
        const messages = [
            systemPrompt,
            ...conversationHistory.slice(-6), // Keep last 6 messages for context (3 exchanges)
            { role: 'user', content: message }
        ];

        // Call OpenAI API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant', // Groq's fast Llama model (FREE!)
                messages: messages,
                temperature: 0.7, // Balanced creativity
                max_tokens: 250, // Limit response length
                presence_penalty: 0.6, // Encourage diverse responses
                frequency_penalty: 0.3 // Reduce repetition
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Groq API Error:', errorData);
            
            // Handle specific errors
            if (response.status === 401) {
                return new Response(JSON.stringify({ 
                    error: 'Invalid API key. Please check your GROQ_API_KEY in Vercel settings.' 
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            if (response.status === 429) {
                return new Response(JSON.stringify({ 
                    error: 'Rate limit exceeded. Please try again in a moment.' 
                }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            throw new Error(errorData.error?.message || 'Groq API request failed');
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        return new Response(JSON.stringify({ 
            response: aiResponse,
            usage: data.usage // Return token usage for monitoring
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache' // Don't cache AI responses
            }
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to process your message. Please try again.',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
