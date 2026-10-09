import { answerQuestion } from '../lib/pipeline';
import { prisma } from '../lib/db';

async function main() {
  console.log("Testing pipeline with query: 'Is coffee good for health?'");
  try {
    const convo = await prisma.conversation.create({ data: {} });
    const result = await answerQuestion("Is coffee good for health?", convo.id);
    console.log("Pipeline result:\n", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Pipeline test failed:", error);
  }
}

main();
