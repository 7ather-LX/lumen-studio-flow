import json, re
from pathlib import Path
root=Path(r'F:\DSH WORKSPACE\lumen-flow')
src=root/'training/_staging/bili_columns/catalog.json'
rows=json.loads(src.read_text(encoding='utf-8-sig'))
out=[]
for r in rows:
    text=(r.get('title') or '')+' '+(r.get('summary') or '')
    if re.search(r'2\.5D|2.5d|写实|厚涂|半写实|光影|质感|立体|CG|3D',text):
        label='2_5d_semi'
    elif re.search(r'短漫|漫画',text):
        label='manga'
    elif re.search(r'萌|可爱|萝莉|Q版',text):
        label='moe_2d'
    elif re.search(r'画师推荐|画师画集|图集|画集',text):
        label='flat_cel'
    else:
        label='unknown'
    out.append({'id':r['id'],'title':r['title'],'label':label,'publish':r.get('publish'),'summary':(r.get('summary') or '')[:300],'url':f"https://www.bilibili.com/read/cv{r['id']}"})
(root/'training/bilibili_columns.json').write_text(json.dumps({'source':'未名之时 B站画师推荐合集','uid':298252208,'count':len(out),'columns':out},ensure_ascii=False,indent=2),encoding='utf-8-sig')
from collections import Counter
print(len(out),Counter(x['label'] for x in out))
for x in out:
    if x['label']=='2_5d_semi': print(x['title'],x['url'])

