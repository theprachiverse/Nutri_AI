import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { answerQuestion } from '@/lib/pipeline';

export async function POST(req: NextRequest) {
  const { conversationId, userMessage, documentFilter } = await req.json();

  if (!userMessage?.trim()) {
    return new Response(JSON.stringify({ error: 'userMessage is required' }), { status: 400 });
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(type: string, data: any) {
        controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const finalResponse = await answerQuestion(
          userMessage, 
          conversation.id, 
          undefined, 
          documentFilter,
          (msg) => sendEvent('status', { message: msg })
        );
        sendEvent('result', { ...finalResponse, conversationId: conversation.id });
      } catch (err: any) {
        console.error('Pipeline failed:', err);
        if (err.message === 'RATE_LIMIT_EXCEEDED') {
          sendEvent('error', { message: 'Groq rate limit exceeded. Please wait a moment and try again.' });
        } else {
          sendEvent('error', { message: `Pipeline failed: ${err.message || String(err)}` });
        }
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
