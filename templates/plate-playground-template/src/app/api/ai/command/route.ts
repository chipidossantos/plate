import { NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';

import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const {
    messages,
    system,
    apiKey: key,
    model = 'gpt-4o-mini',
  } = await req.json();

  const apiKey = key || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing OpenAI API key.' },
      { status: 401 }
    );
  }

  const openai = createOpenAI({ apiKey });

  console.log('model', model);

  try {
    const result = await streamText({
      maxTokens: 2048,
      messages: convertToCoreMessages(messages),
      model: openai(model),
      system: system,
    });

    return result.toDataStreamResponse();
  } catch {
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
