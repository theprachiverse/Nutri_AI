export function normalizeQuery(query: string): string {
  // 1. NFKC normalization (Spec 10.2)
  let normalized = query.normalize('NFKC').toLowerCase();

  // Strip emojis and non-alphanumeric (keep spaces, basic punctuation)
  // @ts-ignore: TS1501 (Next.js forces ES5 target, but Node supports ES6 regex flags)
  normalized = normalized.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  
  // 2. Handle spacing tricks (e.g., "c a l o r i e s" -> "calories")
  normalized = normalized.replace(/(?<=\b[a-z])\s+(?=[a-z]\b)/g, '');

  // 3. Targeted leetspeak (Fixes the numeric destruction bug)
  normalized = normalized.replace(/c[4a]l[0o]r[1i]3s?/g, 'calories');
  normalized = normalized.replace(/w3[1i]ght/g, 'weight');

  // 4. Expanded Abbreviations (Added lbs, kgs from Spec 10.2)
  const abbreviations: Record<string, string> = {
    'cals': 'calories',
    'cal': 'calories',
    'kcals': 'calories',
    'kcal': 'calories',
    'g': 'grams',
    'mg': 'milligrams',
    'mcg': 'micrograms',
    'lbs': 'pounds',
    'lb': 'pounds',
    'kgs': 'kilograms',
    'kg': 'kilograms',
    'vit': 'vitamin',
    'vits': 'vitamins',
    'veg': 'vegetables',
    'veggies': 'vegetables',
    'carb': 'carbohydrates',
    'carbs': 'carbohydrates',
  };

  const words = normalized.split(/\s+/);
  const replaced = words.map(word => {
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (abbreviations[cleanWord]) {
       return word.replace(cleanWord, abbreviations[cleanWord]);
    }
    return word;
  });

  return replaced.join(' ').trim();
}
