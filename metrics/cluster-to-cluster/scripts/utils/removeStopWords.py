import sys
import csv

def removeStopWords(csvFile):
    """
    Removes stop words found in a java dependency graph.
    Many classes names are typically linked with its packages.
    This script tries to exclude all package names to only retain
    the class-name itself.

    ex.) If a class name was shown as package1.package2.classname,
         this script will output a new csv file with just classname.
    """

    graph_dependency_file = open(csvFile)
    csv_reader = csv.reader(graph_dependency_file)
    dependency_list = []
    for dep in csv_reader:
        dependency_list.append(
            [
                dep[0].split(".")[-1],
                dep[1].split(".")[-1],
                dep[2]
            ]
        )
    graph_dependency_file.close()
    return dependency_list

def writeCSV(NewCSVFileName, dependency_list):
    with open(NewCSVFileName, "w") as f:
        writer = csv.writer(f)
        writer.writerows(dependency_list)

if __name__ == "__main__":
    csvFileName = sys.argv[1]
    newCSVFileName = sys.argv[2]
    writeCSV(newCSVFileName, removeStopWords(csvFileName))
