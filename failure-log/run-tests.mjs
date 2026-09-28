import fs from 'fs';

const questions = [
  "How much iron does an adult woman need per day?",
  "What are the main food sources of Vitamin B12?",
  "How much protein does a sedentary vegetarian adult need daily?",
  "How long can cooked chicken be safely stored in the fridge?",
  "Is it safe to refreeze meat that has been thawed in the fridge?",
  "Does boiling vegetables destroy all their vitamins?",
  "What is the safest internal temperature for cooked pork?",
  "Is coffee good or bad for your health overall?",
  "Are artificial sweeteners harmful in moderate amounts?",
  "Is eating red meat a few times a week harmful long-term?"
];

async function run() {
  const results = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`Asking Q${i + 1}: ${q}`);
    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: q, conversationId: 'test-session' })
      });
      if (!res.ok) {
        console.error(`Request failed for Q${i+1}: ${res.status}`);
        const err = await res.text();
        results.push({ question: q, error: err });
      } else {
        const data = await res.json();
        results.push({ question: q, response: data });
      }
    } catch (e) {
      console.error(`Exception for Q${i+1}: ${e.message}`);
      results.push({ question: q, error: e.message });
    }
  }
  
  fs.writeFileSync('./failure-log/test-results-2.json', JSON.stringify(results, null, 2));
  console.log("Done testing. Results written to failure-log/test-results-2.json");
}

run();
