import json

def by_mean_temp(arg):
       mean= int(dod[arg]["mean_temp"])        #int,'98'
       return mean

fh = open('weny_dod_tiny.json')
dod = json.load(fh)                            #dict, {'1/1/16':{'date':'1/1/16', 'events':'','mean_temp': '98','precip':'0'},'1/2/16':{'date':'1/2/16',.....}

keys = sorted(dod, key=by_mean_temp)           #list, ['1/2/16','1/1/16','1/3/16']'

for key in keys:
    print(f'{key}:  {dod[key]}')