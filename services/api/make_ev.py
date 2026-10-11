import base64,pathlib  
content = open('ev_template.py').read()  
pathlib.Path('app/models/evidence.py').write_text(content, encoding='utf-8')  
print('done') 
