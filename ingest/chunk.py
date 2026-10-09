import os
import json
import re
import hashlib
import warnings
from transformers import AutoTokenizer
from population import extract_population_tags

os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'
warnings.filterwarnings('ignore')

CORPUS_DIR = os.path.join(os.path.dirname(__file__), '..', 'corpus')
PARSED_DIR = os.path.join(CORPUS_DIR, 'parsed')
CHUNKS_DIR = os.path.join(CORPUS_DIR, 'chunks')
MANIFEST_PATH = os.path.join(CORPUS_DIR, 'manifest.json')

MIN_TOKENS = 80
MAX_TOKENS = 450
TOKENIZER_NAME = "BAAI/bge-small-en-v1.5"

def parse_blocks(text):
    lines = text.split('\n')
    blocks = []
    current_table = []
    current_list = []
    current_para = []
    
    def flush_para():
        if current_para:
            content = '\n'.join(current_para).strip()
            if content:
                blocks.append({'type': 'text', 'content': content})
            current_para.clear()
            
    def flush_list():
        if current_list:
            item_lines = []
            for line in current_list:
                if re.match(r'^(\d+\.|[\*\-\+])\s+', line.strip()) and item_lines:
                    blocks.append({'type': 'list_item', 'content': '\n'.join(item_lines).strip()})
                    item_lines = [line]
                else:
                    item_lines.append(line)
            if item_lines:
                blocks.append({'type': 'list_item', 'content': '\n'.join(item_lines).strip()})
            current_list.clear()
            
    def flush_table():
        if current_table:
            content = '\n'.join(current_table).strip()
            if content:
                blocks.append({'type': 'table', 'content': content})
            current_table.clear()

    # Clean page markers
    lines = [re.sub(r'<!-- page: \d+ -->', '', line) for line in lines]

    for line in lines:
        stripped = line.strip()
        
        # Heading
        if re.match(r'^#{1,6}\s+', stripped):
            flush_para()
            flush_list()
            flush_table()
            level = len(re.match(r'^(#{1,6})', stripped).group(1))
            heading_text = re.sub(r'^#{1,6}\s+', '', stripped)
            blocks.append({'type': 'heading', 'level': level, 'content': heading_text})
            continue
            
        # Table row
        if stripped.startswith('|') and stripped.endswith('|'):
            flush_para()
            flush_list()
            current_table.append(line)
            continue
            
        if current_table:
            flush_table()
            
        # List item start
        if re.match(r'^(\d+\.|[\*\-\+])\s+', stripped):
            flush_para()
            current_list.append(line)
            continue
            
        # List continuation
        if current_list and (line.startswith('  ') or line.startswith('\t') or not stripped):
            current_list.append(line)
            continue
            
        if current_list:
            flush_list()
            
        if not stripped:
            flush_para()
            continue
            
        current_para.append(line)
        
    flush_para()
    flush_list()
    flush_table()
    
    return blocks

def process_chunks():
    if not os.path.exists(CHUNKS_DIR):
        os.makedirs(CHUNKS_DIR, exist_ok=True)
        
    tokenizer = AutoTokenizer.from_pretrained(TOKENIZER_NAME)
    
    def get_token_count(text):
        return len(tokenizer.encode(text, add_special_tokens=False))
        
    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
        
    all_chunks = []
    
    for doc_id, meta in manifest.items():
        md_path = os.path.join(PARSED_DIR, f"{doc_id}.md")
        if not os.path.exists(md_path):
            continue
            
        print(f"Chunking {doc_id}...")
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        blocks = parse_blocks(content)
        
        doc_name = meta.get("name", "")
        publisher = meta.get("publisher", "")
        year = meta.get("year", "")
        
        heading_stack = []
        blocks_with_paths = []
        
        for b in blocks:
            if b['type'] == 'heading':
                level = b['level']
                while heading_stack and heading_stack[-1][0] >= level:
                    heading_stack.pop()
                heading_stack.append((level, b['content']))
            else:
                path_str = " > ".join([h[1] for h in heading_stack]) if heading_stack else "General"
                blocks_with_paths.append({
                    'type': b['type'],
                    'content': b['content'],
                    'path': path_str
                })

        def create_chunk_dict(text, path):
            if "nutrient numbers for individual foods" in text.lower() or "how much protein is in 100 g" in text.lower():
                return None
            context_header = f"[{doc_name} | {publisher} | {year} | {path}]"
            embed_text = f"{context_header}\n\n{text}"
            tokens = get_token_count(embed_text)
            return {
                "text": text,
                "embed_text": embed_text,
                "tokens": tokens,
                "path": path,
                "context_header": context_header
            }

        processed_blocks = []
        for b in blocks_with_paths:
            if b['type'] == 'table':
                lines = b['content'].split('\n')
                if len(lines) > 4 and '|---' in lines[1].replace(' ', ''):
                    header = lines[0]
                    separator = lines[1]
                    rows = lines[2:]
                    
                    current_group = []
                    for row in rows:
                        test_table = '\n'.join([header, separator] + current_group + [row])
                        c = create_chunk_dict(test_table, b['path'])
                        if c and c['tokens'] > MAX_TOKENS and current_group:
                            table_str = '\n'.join([header, separator] + current_group)
                            processed_blocks.append({'content': table_str, 'path': b['path']})
                            current_group = [row]
                        else:
                            current_group.append(row)
                    if current_group:
                        table_str = '\n'.join([header, separator] + current_group)
                        processed_blocks.append({'content': table_str, 'path': b['path']})
                else:
                    # Not a valid markdown table, split by lines if too large
                    c = create_chunk_dict(b['content'], b['path'])
                    if c and c['tokens'] > MAX_TOKENS:
                        lines = b['content'].split('\n')
                        current_group = []
                        for line in lines:
                            test_text = '\n'.join(current_group + [line])
                            tc = create_chunk_dict(test_text, b['path'])
                            if tc and tc['tokens'] > MAX_TOKENS and current_group:
                                processed_blocks.append({'content': '\n'.join(current_group), 'path': b['path']})
                                current_group = [line]
                            else:
                                current_group.append(line)
                        if current_group:
                            processed_blocks.append({'content': '\n'.join(current_group), 'path': b['path']})
                    else:
                        processed_blocks.append({'content': b['content'], 'path': b['path']})
            else:
                c = create_chunk_dict(b['content'], b['path'])
                if c and c['tokens'] > MAX_TOKENS:
                    # Split plain text by sentences or lines
                    # Using double newline or newline as heuristic
                    parts = re.split(r'(?<=\.)\s+|\n', b['content'])
                    current_group = []
                    for part in parts:
                        test_text = ' '.join(current_group + [part])
                        tc = create_chunk_dict(test_text, b['path'])
                        if tc and tc['tokens'] > MAX_TOKENS and current_group:
                            processed_blocks.append({'content': ' '.join(current_group), 'path': b['path']})
                            current_group = [part]
                        else:
                            current_group.append(part)
                    if current_group:
                        processed_blocks.append({'content': ' '.join(current_group), 'path': b['path']})
                else:
                    processed_blocks.append({'content': b['content'], 'path': b['path']})

        final_chunks = []
        current_merged_text = ""
        current_path = ""
        
        for pb in processed_blocks:
            path = pb['path']
            content = pb['content']
            
            if not current_merged_text:
                current_merged_text = content
                current_path = path
                continue
                
            if path == current_path:
                test_merged = current_merged_text + "\n\n" + content
                c = create_chunk_dict(test_merged, current_path)
                if c and c['tokens'] <= MAX_TOKENS:
                    current_merged_text = test_merged
                else:
                    final_chunks.append((current_merged_text, current_path))
                    current_merged_text = content
            else:
                final_chunks.append((current_merged_text, current_path))
                current_merged_text = content
                current_path = path
                
        if current_merged_text:
            final_chunks.append((current_merged_text, current_path))

        for text, path in final_chunks:
            c = create_chunk_dict(text, path)
            if not c:
                continue
                
            if c['tokens'] >= MIN_TOKENS or (c['tokens'] < MIN_TOKENS and len(final_chunks) == 1):
                # even if below min tokens, we might keep it if it's the only thing, but strict bounds:
                if c['tokens'] < MIN_TOKENS:
                    continue # enforce bounds strictly

                pop_tags = extract_population_tags(text, doc_id)
                content_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
                chunk_id = f"{doc_id}_{content_hash[:8]}"
                all_chunks.append({
                    "chunk_id": chunk_id,
                    "doc_id": doc_id,
                    "document_name": doc_name,
                    "publisher": publisher,
                    "year": year,
                    "section": path,
                    "population_tags": pop_tags,
                    "text": text,
                    "embed_text": c['embed_text'],
                    "content_hash": content_hash,
                    "token_count": c['tokens']
                })

    output_path = os.path.join(CHUNKS_DIR, 'chunks.jsonl')
    with open(output_path, 'w', encoding='utf-8') as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk) + '\n')
            
    print(f"Generated {len(all_chunks)} chunks to {output_path}")

if __name__ == '__main__':
    process_chunks()
