import sys
import json
import csv


def openCSV(graphCSVFile, edgeCSVFile):
    '''
    Grabs all the classnames from a csv file.

    '''
    class_names = []
    edges = []

    graph_file = open(graphCSVFile)
    csv_reader = csv.reader(graph_file)
    for row in csv_reader:
        class_names.append(row[1])

    graph_file.close()

    edge_file = open(edgeCSVFile)
    csv_reader = csv.reader(edge_file)
    for row in csv_reader:
        edges.append((row[0], row[1]))
    edge_file.close()

    return class_names, edges

def convertToJSONFile(classNames, edges, json_file_name):
    json_graph = {
        "static_graph" : {
            "nodes" : [],
            "links" : []
        }
    }

    for name in classNames:
        json_graph["static_graph"]["nodes"].append({"id": name, "label": name})

    for edge in edges:
        json_graph["static_graph"]["links"].append({"source": edge[0], "target": edge[1]})

    with open(json_file_name, "w") as write_file:
        json.dump(json_graph, write_file)

if __name__ == "__main__":
    graphCSVFile = sys.argv[1]
    edgeCSVFile = sys.argv[2]
    json_file_name = sys.argv[3]

    classNames, edges = openCSV(graphCSVFile, edgeCSVFile)
    convertToJSONFile(classNames, edges, json_file_name)

