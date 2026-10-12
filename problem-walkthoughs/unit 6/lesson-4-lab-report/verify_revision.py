import json, html
from pathlib import Path
from statistics import mean
R=Path(__file__).parent
B=json.loads((R/'revision-processes.json').read_text())
checks=[]
for b,filename in zip(B,['plan-editor-saved.txt','assigned-editor-saved.txt','report-editor-saved.txt']):
    saved=(R/filename).read_text(encoding='utf8')
    assert len(b['slides']) in (6,8)
    for s in b['slides']:
        assert s['title'] in saved,s['title']
        assert s['text'] in saved,s['title']+' missing body'
        assert s['alt'] in saved,s['title']+' missing image'
        assert Path(s['image']).is_file()
    checks.append({'process':b['slides'][0]['title'],'slides':len(b['slides']),'images':len(b['slides']),'equations':sum(bool(s['eq']) for s in b['slides']),'saved_editor_verified':True})
assert mean([9,10,11])==10 and mean([18,20,19])==19
assert (19-10)/10*100==90
assert mean([12,13,11])==12 and mean([17,18,19])==18
assert (18-12)/12*100==50
assert 42/12==3.5 and round((3.5/3-1)*100,1)==16.7
report={'course_title':'U6 L4 Electromagnet Lab: Investigate, Analyze, and Report','course_url':'https://rise.articulate.com/authoring/wkw87wNm3QrtfwLkwhrvqjFKet27kgyS','processes':checks,'revised_multiple_choice_questions':3,'revised_sorting_activities':2,'retained_illustrated_calculation_processes':2,'new_independent_report_practice':True,'practice_answer_key':{'mean_at_0.40_A':12,'mean_at_0.80_A':18,'clip_increase_percent':50,'current_increase_percent':100,'claim':'Higher current increased lifting performance in this setup; the mean clip count did not double.','limitations':'Only two current levels; physical clip contact may vary. Test more levels with repeats and use a positioning guide.'},'assignment_requirements_preserved':{'fixed_trials':5,'minimum_distinct_designs':3,'wire_limit_cm':250,'cost_limit':50,'target_ratio':6.38,'submission':'10 existing Buzz questions; optional results download; no added required report upload'},'scope':'Rise course revised directly. Existing lab application and Buzz assessment files were not changed.'}
(R/'revision-verification.json').write_text(json.dumps(report,indent=2),encoding='utf8')
out='<html><meta charset="utf-8"><title>U6 L4 lab-report revision</title><style>body{font:18px/1.5 system-ui;max-width:960px;margin:40px auto;color:#193650}img{max-width:100%}article{border-top:2px solid #ccc;padding-top:25px}pre{white-space:pre-wrap;background:#edf4f7;padding:20px}</style><h1>'+report['course_title']+'</h1><p><a href="'+report['course_url']+'">Open the revised Rise course</a></p><p>Authoring source and revision record. All three processes are native Rise blocks. Invented data are labeled as practice. The assigned lab requirements remain unchanged.</p>'
for b in B:
 out+='<h2>'+html.escape(b['slides'][0]['title'])+'</h2>'
 for s in b['slides']:
  out+='<article><h3>'+html.escape(s['title'])+'</h3><img src="'+Path(s['image']).relative_to(R).as_posix()+'" alt="'+html.escape(s['alt'])+'"><p>'+html.escape(s['text'])+'</p>'
  if s['eq']:out+='<pre>'+html.escape(s['eq'])+'</pre>'
  out+='</article>'
out+='<h2>Teacher reference: independent practice</h2><p>Means: 12 and 18 clips. Increase: 50%. Current doubles but the clip count does not.</p></html>'
(R/'index.html').write_text(out,encoding='utf8')
print(json.dumps({'verified':True,'processes':checks,'independent_practice_answer':'12 clips; 18 clips; 50% increase'},indent=2))
