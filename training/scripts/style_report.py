import json
from pathlib import Path
from collections import Counter
from PIL import Image
root=Path(r'F:\DSH WORKSPACE\lumen-flow')
rows=[json.loads(x) for x in (root/'training/dataset/manifest.jsonl').read_text(encoding='utf-8').splitlines() if x.strip()]
sizes=Counter(); aspects=[]; sharp=[]
for r in rows:
 sizes[(r['width'],r['height'])]+=1; aspects.append(round(r['width']/r['height'],3)); sharp.append(r['sharpness'])
report={'count':len(rows),'labels':dict(Counter(r['label'] for r in rows)),'top_resolutions':[{'size':f'{k[0]}x{k[1]}','count':v} for k,v in sizes.most_common(8)],'aspect_ratio_avg':round(sum(aspects)/len(aspects),3),'sharpness_avg':round(sum(sharp)/len(sharp),2),'trigger':'ririko_cel_style','note':'User-provided Ririko flat-cel style references; local training only, not redistributed.'}
(root/'training/dataset/style_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
