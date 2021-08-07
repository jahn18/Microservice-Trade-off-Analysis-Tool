import sys
import csv

def readCSV(csvFilename):
    indexHashTable = {}
    indexFile = open(csvFilename)
    csv_reader = csv.reader(indexFile)
    for row in csv_reader:
        indexHashTable[row[1]] = row[0]
    indexFile.close()
    return indexHashTable

def convertIndexToClassName(csvDependencyFile, indexHashTable, graph_name):
    file_name = graph_name
    new_csv_file = open(file_name, 'w')
    writer = csv.writer(new_csv_file)

    dependencyGraph = open(csvDependencyFile)
    csv_reader = csv.reader(dependencyGraph)
    for row in csv_reader:
        new_row = [row[0], indexHashTable[row[1]]]
        writer.writerow(new_row)

    new_csv_file.close()

if __name__ == '__main__':
    csv_file_index = sys.argv[1]
    graph = sys.argv[2]
    graph_name = sys.argv[3]
    convertIndexToClassName(graph, readCSV(csv_file_index), graph_name)
