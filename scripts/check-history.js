const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const messages = await prisma.message.findMany({
    where: { role: 'user', content: { contains: 'WHO guidelines' } },
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  if (messages.length > 0) {
    const asstMsg = await prisma.message.findFirst({
      where: { conversationId: messages[0].conversationId, role: 'assistant' },
      include: { retrievalLog: true, citations: true }
    });
    console.log("User query:", messages[0].content);
    console.log("Assistant msg:", asstMsg.content);
    console.log("Retrieval log:", asstMsg.retrievalLog);
  } else {
    console.log("No messages found");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
