import { NextRequest, NextResponse } from 'next/server';
import { callModel } from '@/lib/model';
import { prisma } from '@/lib/db';
import { isOutOfScope, buildDeclineResponse } from '@/lib/scopeGuard';

export async function POST(req: NextRequest) {
  const { conversationId, userMessage } = await req.json();

  if (!userMessage?.trim()) {
    return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
  }

  // Scope check — before any model call
  if (isOutOfScope(userMessage)) {
    return NextResponse.json(buildDeclineResponse());
  }

  // Get or create conversation
  const conversation = await prisma.conversation.upsert({
    where:  { id: conversationId ?? '' },
    update: {},
    create: { id: conversationId ?? undefined },
  });

  // Load message history, limited to last 6 messages to preserve 8K TPM rate limit
  const history = await prisma.message.findMany({
    where:   { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  const messages = history.reverse().map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
  messages.push({ role: 'user', content: userMessage });

  // Call model
  let response;
  try {
    response = await callModel(messages);
  } catch (err: any) {
    console.error('Model call failed:', err);
    if (err.message === 'RATE_LIMIT_EXCEEDED') {
      return NextResponse.json(
        { error: 'Groq rate limit exceeded (8K TPM / 30 RPM). Please wait a moment and try again.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: `Model call failed: ${err.message || String(err)}` },
      { status: 500 }
    );
  }

  // Persist
  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'user', content: userMessage },
  });
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'assistant',
      content: response.answer_text,
      rawResponse: response,
    },
  });

  return NextResponse.json({ ...response, conversationId: conversation.id });
}
