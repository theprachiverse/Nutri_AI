import fs from 'fs';

const run1 = JSON.parse(fs.readFileSync('./failure-log/test-results-1.json', 'utf8'));
const run2 = JSON.parse(fs.readFileSync('./failure-log/test-results-2.json', 'utf8'));

for (let i = 0; i < run1.length; i++) {
  const r1 = run1[i].response || run1[i].error;
  const r2 = run2[i].response || run2[i].error;
  
  console.log(`\n\n=== Q${i+1}: ${run1[i].question} ===`);
  console.log("RUN 1:");
  console.log(JSON.stringify(r1, null, 2));
  console.log("RUN 2:");
  console.log(JSON.stringify(r2, null, 2));
}
