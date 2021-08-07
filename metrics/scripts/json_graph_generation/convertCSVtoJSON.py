import sys
import json
import csv
from networkx.algorithms.matching import max_weight_matching
import networkx as nx

def openCSV(graphCSVFile_1, edgeCSVFile_1, graphCSVFile_2, edgeCSVFile_2):
    """
    Creates a dictionary, where the key is partition i in the graph and the value is a list containing all the classes within partition i.
    """
    graph_one = {}
    graph_two = {}

    graph_file = open(graphCSVFile_1, 'r')
    csv_reader = csv.reader(graph_file)

    # Create the graph for the first file
    for row in csv_reader:
        partition_name = "g1:" + row[0]
        if partition_name in graph_one:
            graph_one[partition_name].append(row[1])
        else:
            graph_one[partition_name] = [row[1]]
    graph_file.close()

    graph_file = open(graphCSVFile_2, 'r')
    csv_reader = csv.reader(graph_file)

    # Create the graph for the second file
    for row in csv_reader:
        partition_name = "g2:" + row[0]
        if partition_name in graph_two:
            graph_two[partition_name].append(row[1])
        else:
            graph_two[partition_name] = [row[1]]
    graph_file.close()

    edges_1, edges_2 = [], []

    edge_file = open(edgeCSVFile_1)
    csv_reader = csv.reader(edge_file)
    for row in csv_reader:
        edges_1.append(row)
    edge_file.close()

    edge_file = open(edgeCSVFile_2)
    csv_reader = csv.reader(edge_file)
    for row in csv_reader:
        edges_2.append(row)
    edge_file.close()

    return (graph_one, graph_two), (edges_1, edges_2)


# Uses the cluster-to-cluster metric
def createBipartiteGraph(graph_one, graph_two):
    B = nx.Graph()
    graph_1 = []
    graph_2 = []
    edges = []
    graph_list = []

    bipartiteGraph = {}
    for partition_i in graph_one:
        for partition_j in graph_two:
            num_of_intersecting_elems = intersection(graph_one[partition_i], graph_two[partition_j], True)
            num_of_total_elems = union(graph_one[partition_i], graph_two[partition_j])
            # Normalize using the cluster with the larger number of entities
            #c2c_similarity_value = (num_of_intersecting_elems) / (max(len(graph_one[partition_i]), len(graph_two[partition_j])))
            # Normalize by unionizing the clusters
            c2c_similarity_value = num_of_intersecting_elems / num_of_total_elems
            graph_1.append(partition_i)
            graph_2.append(partition_j)
            edges.append((partition_i, partition_j, c2c_similarity_value))
            if partition_i in bipartiteGraph:
                bipartiteGraph[partition_i][partition_j] = c2c_similarity_value
            else:
                bipartiteGraph[partition_i] = {}
                bipartiteGraph[partition_i][partition_j] = c2c_similarity_value
            #adjust_bipartite_graph(graph_one, graph_two, bipartiteGraph)
            #print(cluster_i)
            #print(cluster_j)
            #print(c2c_similarity_value)
            graph_list.append([partition_i, partition_j, c2c_similarity_value])
    B.add_nodes_from(graph_1, bipartite=0)
    B.add_nodes_from(graph_2, bipartite=1)
    B.add_weighted_edges_from(edges)
    return B, graph_list

def adjust_bipartite_graph(graph_one, graph_two, bipartiteGraph):
    if len(graph_one) < len(graph_two):
        for i in range(len(graph_one), len(graph_two)):
            cluster_i = "g1:partition{}"
            bipartiteGraph[cluster_i.format(i)] = {}
            for j in range(len(graph_two)):
                cluster_j = "g2:partition{}"
                bipartiteGraph[cluster_i.format(i)][cluster_j.format(j)] = 0.00001


# Returns the total number of elements that are the same between two clusters. Requires two lists.
def intersection(cluster1, cluster2, return_length=True):
    intersection = [value for value in cluster1 if value in cluster2]
    if return_length is True:
        return len(intersection)
    else:
        return intersection


def union(cluster1, cluster2):
    union = []
    for node in cluster1:
        if node not in cluster2:
            union.append(node)
    for node in cluster2:
        union.append(node)

    return len(union)


def convertToJSONFile(graph_one, edges_1, graph_two, edges_2, json_file_name):
    json_graph = {
        "static_graph" : {
           # "nodes" : [],
            "links" : []
        },
        "class_name_graph" : {
           # "nodes" : [],
            "links" : []
        },
        "diff_graph" : {}
    }

    # First graph: add nodes and edges
    #for partition in partitions_1:
    #    json_graph["static_graph"]["nodes"].append({"id": partition[1], "label": partition[1], "partition": partition[0]})

    for edge in edges_1:
        json_graph["static_graph"]["links"].append({"source": edge[0], "target": edge[1], "weight": edge[2]})

    # Second graph: add nodes and edges
    #for partition in partitions_2:
    #    json_graph["class_name_graph"]["nodes"].append({"id": partition[1], "label": partition[1], "partition": partition[0]})

    for edge in edges_2:
        json_graph["class_name_graph"]["links"].append({"source": edge[0], "target": edge[1], "weight": edge[2]})

    G, graph = createBipartiteGraph(graph_one, graph_two)
    matching = confirmAllPartitionsMatched(graph_one, graph_two, max_weight_matching(G))

    # Create the diff graph:
    for index, match in enumerate(matching):
        if match[0] in graph_one:
            common_elements = intersection(graph_one[match[0]], graph_two[match[1]], False)
            json_graph["diff_graph"][str(index)] = {
                "common": common_elements,
                "graph_one_diff": [node for node in graph_one[match[0]] if node not in common_elements],
                "graph_two_diff": [node for node in graph_two[match[1]] if node not in common_elements]
            }
        else:
            common_elements = intersection(graph_one[match[1]], graph_two[match[0]], False)
            json_graph["diff_graph"][str(index)] = {
                "common": common_elements,
                "graph_one_diff": [node for node in graph_one[match[1]] if node not in common_elements],
                "graph_two_diff": [node for node in graph_two[match[0]] if node not in common_elements]
            }

    with open(json_file_name, "w") as write_file:
        json.dump(json_graph, write_file)


def confirmAllPartitionsMatched(graph_one, graph_two, matching):
    """
    Sometimes partitions are not matched. The networkx algorithm doesn't display all matchings, so this algorithm  will try to find the partitions that have not been matched.

    """
    if len(matching) == len(graph_one.keys()):
        return matching

    graph_one_matched_partitions, graph_two_matched_partitions = [], []
    new_matching = []

    for match in matching:
        if match[0] in graph_one:
            graph_one_matched_partitions.append(match[0])
            graph_two_matched_partitions.append(match[1])
        else:
            graph_one_matched_partitions.append(match[1])
            graph_two_matched_partitions.append(match[0])
        new_matching.append(match)

    graph_one_remaining_partitions = [partition for partition in graph_one.keys() if partition not in graph_one_matched_partitions]
    graph_two_remaining_partitions = [partition for partition in graph_two.keys() if partition not in graph_two_matched_partitions]

    for i in range(len(graph_one_remaining_partitions)):
        new_matching.append( (graph_one_remaining_partitions[i], graph_two_remaining_partitions[i]) )

    return new_matching


if __name__ == "__main__":
    graph_one_file = sys.argv[1]
    graph_one_edge_file = sys.argv[2]
    graph_two_file = sys.argv[3]
    graph_two_edge_file = sys.argv[4]
    json_file_name = sys.argv[5]
    graphs, edges = openCSV(graph_one_file, graph_one_edge_file, graph_two_file, graph_two_edge_file)
    convertToJSONFile(graphs[0], edges[0], graphs[1], edges[1], json_file_name)
