import sys
import csv
import json

def writeToJSONFile(dependencyGraphCSV, json_file, graph_name_in_json_file):
    csv_file = open(dependencyGraphCSV)
    csv_reader = csv.reader(csv_file)

    json_graph = {
        graph_name_in_json_file: {
            "links": []
        }
    }

    for dep in csv_reader:
        json_graph[graph_name_in_json_file]["links"].append(
            {
                "source": dep[0],
                "target": dep[1],
                "weight": dep[2]
            }
        )
    with open(json_file, "r") as read_file:
        data = json.load(read_file)

    data[graph_name_in_json_file] = json_graph[graph_name_in_json_file]

    with open(json_file, "w") as write_file:
        json.dump(data, write_file)


if __name__ == "__main__":
    dependencyGraphCSV = sys.argv[1]
    json_file = sys.argv[2]
    graph_name_json_file = sys.argv[3]
    writeToJSONFile(dependencyGraphCSV, json_file, graph_name_json_file)
