import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { messages: { take: 1, orderBy: { createdAt: 'asc' } } },
  });
  return NextResponse.json(conversations.map(c => ({
    id: c.id,
    createdAt: c.createdAt,
    preview: Array.from(c.messages[0]?.content ?? '').slice(0, 60).join(''),
  })));
}
