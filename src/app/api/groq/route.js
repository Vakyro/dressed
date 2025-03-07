import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY });

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    const systemMessage = `
      You are an AI fashion assistant. Analyze the user's clothing items and prompt to generate an outfit.
      Return a JSON object with keys "top", "bottom", "shoes" containing the IDs of the selected items.
      Respond only with the JSON, no explanations.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      model: 'llama3-70b-8192',
      temperature: 0.7,
      response_format: { type: "json_object" }, // Enforce JSON output
    });

    // Return the response using the new Response API
    return new Response(
      JSON.stringify({ response: chatCompletion.choices[0].message.content }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Groq API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}