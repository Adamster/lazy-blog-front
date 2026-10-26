"""Fallback cover pass using Open Library's public bibliographic API."""
from __future__ import annotations
import concurrent.futures, hashlib, io, json, re, unicodedata, urllib.parse, urllib.request
from difflib import SequenceMatcher
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]/"public/books"; BOOKS=ROOT/"books.json"
def norm(v): return ''.join(c for c in unicodedata.normalize('NFKC',v).lower().replace('ё','е') if c.isalnum())
def fetch(u):
 req=urllib.request.Request(u,headers={'User-Agent':'LazyBlog/1.0 (cover catalog)'}); return urllib.request.urlopen(req,timeout=20).read()
def search(b):
 q=urllib.parse.urlencode({'title':b['title'],'author':b['author'],'limit':10,'fields':'title,author_name,cover_i'})
 data=json.loads(fetch('https://openlibrary.org/search.json?'+q)); title=norm(b['title']); author=norm(b['author'])
 for d in data.get('docs',[]):
  ot=norm(d.get('title','')); oa=norm(' '.join(d.get('author_name',[])))
  if SequenceMatcher(None,title,ot).ratio()<.84 or not any(w in oa for w in re.findall(r'[a-zа-яё]{5,}',author)): continue
  if not d.get('cover_i'): continue
  try:
   content=fetch(f"https://covers.openlibrary.org/b/id/{d['cover_i']}-L.jpg")
   im=Image.open(io.BytesIO(content))
   if im.width>=300 and im.height>=450: return hashlib.sha1(content).hexdigest()[:24]+'.jpg',content
  except Exception: pass
 return None
def main():
 data=json.loads(BOOKS.read_text()); targets=[]
 for c in data:
  for b in c['books']:
   if not b.get('cover') and not b.get('seriesBooks'): targets.append(b)
   targets += [p for p in b.get('seriesBooks',[]) if isinstance(p,dict) and not p.get('cover')]
 found={}; errors=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  fs={pool.submit(search,b):b for b in targets}
  for f in concurrent.futures.as_completed(fs):
   try:
    r=f.result()
    if r: found[fs[f]['id']]=r
   except Exception as e: errors.append(f"{fs[f]['title']}: {e}")
 data=json.loads(BOOKS.read_text()); n=0
 for c in data:
  for b in c['books']:
   for r in [b,*b.get('seriesBooks',[])]:
    if isinstance(r,dict) and not r.get('cover') and r['id'] in found:
     name,content=found[r['id']]; out=ROOT/'covers'/name
     if not out.exists(): out.write_bytes(content)
     r['cover']='covers/'+name; n+=1
   if not b.get('cover') and b.get('seriesBooks'): b['cover']=b['seriesBooks'][0].get('cover')
 BOOKS.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n'); (ROOT/'openlibrary-cover-errors.txt').write_text('\n'.join(errors)); print(f'Open Library covers assigned: {n}; errors: {len(errors)}')
if __name__=='__main__': main()
