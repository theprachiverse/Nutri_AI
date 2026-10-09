import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { year: 'desc' },
      select: { id: true, title: true, publisherShort: true, year: true }
    });
    const formattedDocs = documents.map(d => ({
      doc_id: d.id,
      title: d.title,
      publisherShort: d.publisherShort,
      year: d.year
    }));
    return NextResponse.json({ documents: formattedDocs });
  } catch (error: any) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
