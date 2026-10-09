import os
import json
from collections import Counter

CORPUS_DIR = os.path.join(os.path.dirname(__file__), '..', 'corpus')
CHUNKS_DIR = os.path.join(CORPUS_DIR, 'chunks')
CHUNKS_FILE = os.path.join(CHUNKS_DIR, 'chunks.jsonl')
REPORT_FILE = os.path.join(CHUNKS_DIR, 'report.md')

def generate_report():
    if not os.path.exists(CHUNKS_FILE):
        print(f"Chunks file not found at {CHUNKS_FILE}")
        return

    total_chunks = 0
    doc_chunk_counts = Counter()
    token_sizes = []
    detected_headings = set()
    table_orphans = []
    
    with open(CHUNKS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            chunk = json.loads(line)
            total_chunks += 1
            doc_chunk_counts[chunk['doc_id']] += 1
            token_sizes.append(chunk['token_count'])
            
            section = chunk.get('section', '')
            if section and section != "General":
                detected_headings.add(f"{chunk['doc_id']}: {section}")
                
            text = chunk.get('text', '')
            if '|' in text and '\n' in text:
                lines = text.strip().split('\n')
                # A basic check: if it looks like a table row but no separator is present
                if len(lines) > 1 and lines[0].strip().startswith('|') and lines[1].strip().startswith('|'):
                    if '|---' not in lines[1].replace(' ', ''):
                        table_orphans.append(chunk['chunk_id'])

    if not token_sizes:
        print("No chunks to report on.")
        return

    # Basic stats
    avg_tokens = sum(token_sizes) / len(token_sizes)
    max_tokens = max(token_sizes)
    min_tokens = min(token_sizes)
    
    # Simple histogram logic (bins of 50)
    bins = Counter()
    for size in token_sizes:
        bin_idx = (size // 50) * 50
        bins[bin_idx] += 1

    report_lines = [
        "# Chunking Validation Report",
        "",
        f"**Total Chunks:** {total_chunks}",
        f"**Average Size:** {avg_tokens:.1f} tokens",
        f"**Min Size:** {min_tokens} tokens",
        f"**Max Size:** {max_tokens} tokens",
        "",
        "## Chunks per Document",
        ""
    ]
    for doc_id, count in sorted(doc_chunk_counts.items()):
        report_lines.append(f"- **{doc_id}**: {count} chunks")
        
    report_lines.extend(["", "## Size Distribution", ""])
    for bin_val in sorted(bins.keys()):
        report_lines.append(f"- {bin_val} to {bin_val+49} tokens: {bins[bin_val]} chunks")

    report_lines.extend(["", "## Table Orphan Checks", ""])
    if table_orphans:
        for chunk_id in table_orphans:
            report_lines.append(f"- Orphaned table chunk: {chunk_id}")
    else:
        report_lines.append("- No orphaned tables detected.")

    report_lines.extend(["", "## Detected Headings", ""])
    for heading in sorted(detected_headings):
        report_lines.append(f"- {heading}")

    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write("\n".join(report_lines))

    print(f"Report generated at {REPORT_FILE}")

if __name__ == '__main__':
    generate_report()
