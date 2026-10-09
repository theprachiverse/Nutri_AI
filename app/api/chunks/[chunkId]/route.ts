import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chunkId: string }> }
) {
  try {
    const { chunkId } = await params;
    
    const chunk = await prisma.chunk.findUnique({
      where: { id: chunkId },
      include: {
        document: {
          select: {
            title: true,
            publisher: true,
            year: true,
            sourceUrl: true
          }
        }
      }
    });

    if (!chunk) {
      return NextResponse.json({ error: 'Chunk not found' }, { status: 404 });
    }

    return NextResponse.json({
      chunk_id: chunk.id,
      text: chunk.text,
      section_heading: chunk.sectionHeading,
      population: chunk.population
    });
  } catch (error: any) {
    console.error('Failed to fetch chunk:', error);
    return NextResponse.json({ error: 'Failed to fetch chunk' }, { status: 500 });
  }
}
