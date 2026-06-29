import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are "EnglishPath Tutor", a friendly and knowledgeable virtual English teacher embedded in a Portuguese language learning app called EnglishPath. Your personality is that of an experienced travel guide — empathetic, encouraging, practical, and clear.

Your task: When the user sends you an English sentence or paragraph, you must:

1. **Correct it** — provide the grammatically correct version. If the sentence is already correct, say so.
2. **Explain the errors** — in **Portuguese (PT-PT)**, explain each correction you made and the grammar rule behind it. Be clear and pedagogical. Use simple language adapted to the user's CEFR level.
3. **Give tips** — in **Portuguese (PT-PT)**, provide 1-2 practical learning tips related to the errors found. These should be actionable and contextual.

You MUST respond with valid JSON in this exact format (no markdown, no code fences, just raw JSON):
{
  "corrected": "The corrected English sentence here",
  "isCorrect": false,
  "explanation": "Explicação em português aqui...",
  "tips": ["Dica 1 em português", "Dica 2 em português"]
}

Rules:
- If the sentence is already correct, set "isCorrect" to true, and in "explanation" congratulate the user in Portuguese and briefly explain why the sentence is good.
- Adapt your explanation complexity to the user's CEFR level (provided in the message).
- Be encouraging and empathetic. Celebrate small wins. Treat errors as learning opportunities, never as failures.
- Use the "travel guide" metaphor occasionally (e.g., "Estás no caminho certo!", "Mais um passo na tua viagem!").
- Keep tips practical and focused on real-world English usage.
- NEVER respond in any format other than the JSON above.`;

export async function POST(request: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        {
          corrected: '',
          isCorrect: false,
          explanation: '⚠️ O Professor Virtual não está configurado. Adiciona a tua GROQ_API_KEY no ficheiro .env para ativar esta funcionalidade.',
          tips: ['Visita console.groq.com para obteres uma chave API gratuita.'],
        },
        { status: 200 }
      );
    }

    const body = await request.json();
    const { text, level = 'B1' } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Por favor, envia uma frase em inglês para corrigir.' },
        { status: 400 }
      );
    }

    if (text.trim().length > 2000) {
      return NextResponse.json(
        { error: 'O texto é demasiado longo. Envia no máximo 2000 caracteres.' },
        { status: 400 }
      );
    }

    const userMessage = `[CEFR Level: ${level}]\n\nPlease correct and analyze this English text:\n"${text.trim()}"`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', response.status, errorData);
      return NextResponse.json(
        {
          corrected: '',
          isCorrect: false,
          explanation: '❌ Ocorreu um erro ao contactar o Professor Virtual. Tenta novamente em alguns segundos.',
          tips: [],
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          corrected: '',
          isCorrect: false,
          explanation: '❌ Resposta inesperada do Professor Virtual. Tenta novamente.',
          tips: [],
        },
        { status: 200 }
      );
    }

    // Parse the JSON response from the LLM
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error('Failed to parse Groq response as JSON:', content);
      return NextResponse.json(
        {
          corrected: '',
          isCorrect: false,
          explanation: content,
          tips: [],
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      corrected: parsed.corrected || '',
      isCorrect: parsed.isCorrect || false,
      explanation: parsed.explanation || '',
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
    });
  } catch (error) {
    console.error('Tutor API error:', error);
    return NextResponse.json(
      {
        corrected: '',
        isCorrect: false,
        explanation: '❌ Erro interno do servidor. Tenta novamente.',
        tips: [],
      },
      { status: 500 }
    );
  }
}
