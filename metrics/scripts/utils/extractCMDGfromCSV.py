
"""

Converts a CSV file of class dependencies to MDG (module dependency graph) format. 
The CSV file was generated using SCITools Understand application (Reports > Dependency > Class Dependencies > Export CSV).
The generated MDG file can then be used as an input to B. Mitchell's Bunch Clustering technique (github.com/ArchitectingSoftware/Bunch).
"""

import sys
import csv

def classDependencyCSVtoMDG(csvFilename):
    dependencies = list()
    with open(csvFilename, 'r') as csvFile: 
        lines = csv.reader(csvFile, delimiter = ',')
        for line in lines:
            #[ callerClass, calleeClass, weight, numFromRefs, numToRefs ] = line
            [ callerClass, calleeClass, weight ] = line

            if callerClass == "From Class":
                continue

            dependencies.append([callerClass,calleeClass,weight])

    mdgFilename = csvFilename.replace('.csv', '') + '.mdg'
    with open(mdgFilename, 'w') as mdgFile:
        mdgFile = csv.writer(mdgFile, delimiter=',')
        mdgFile.writerows(dependencies)

# command to run: py extractMDGfromCSV example.csv
if __name__ == "__main__":
    csvFilename = sys.argv[1]
    classDependencyCSVtoMDG(csvFilename)
