import json
from transformers import AutoTokenizer, AutoModel
import torch

questions = [
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
]

tokenizer = AutoTokenizer.from_pretrained("BAAI/bge-small-en-v1.5")
model = AutoModel.from_pretrained("BAAI/bge-small-en-v1.5")

results = {}
for q in questions:
    inputs = tokenizer(f"Represent this sentence for searching relevant passages: {q}", return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)
        # CLS pooling
        embedding = outputs.last_hidden_state[:, 0, :]
        # Normalize
        embedding = torch.nn.functional.normalize(embedding, p=2, dim=1)
        results[q] = embedding[0].tolist()

with open("scripts/question_embeddings.json", "w") as f:
    json.dump(results, f)

print("Embeddings generated.")
