import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { answerQuestion } from '@/lib/pipeline';

export async function POST(req: NextRequest) {
  const { conversationId, userMessage, documentFilter } = await req.json();

  if (!userMessage?.trim()) {
    return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
  }

  // Get or create conversation
  const conversation = await prisma.conversation.upsert({
    where:  { id: conversationId ?? '' },
    update: {},
    create: { id: conversationId ?? undefined },
  });

  // Persist user message first
  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'user', content: userMessage },
  });

  // Call the robust RAG pipeline (this handles Scope Guard, Retrieval, Verification, etc.)
  try {
    const finalResponse = await answerQuestion(userMessage, conversation.id, undefined, documentFilter);
    return NextResponse.json({ ...finalResponse, conversationId: conversation.id });
  } catch (err: any) {
    console.error('Pipeline failed:', err);
    if (err.message === 'RATE_LIMIT_EXCEEDED') {
      return NextResponse.json(
        { error: 'Groq rate limit exceeded (8K TPM / 30 RPM). Please wait a moment and try again.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: `Pipeline failed: ${err.message || String(err)}` },
      { status: 500 }
    );
  }
}
