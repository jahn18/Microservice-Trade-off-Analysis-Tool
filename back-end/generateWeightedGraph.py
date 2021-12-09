import requests
import json

json_graph = open('demoJSONFiles/MotivatingExample.json')
data = json.load(json_graph)

static, dynamic, className, classTerm, commits, contributors = 1, 0, 0, 0, 0, 0

r = requests.post("http://127.0.0.1:5000/MotivatingExample/{}/{}/{}/{}/{}/{}".format(static, dynamic, className, classTerm, commits, contributors), data=json.dumps(data))

print(r.status_code, r.reason)

json_graph.close()
