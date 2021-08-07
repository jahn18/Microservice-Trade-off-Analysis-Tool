import sys
import csv
from networkx.algorithms.matching import max_weight_matching
import networkx as nx

def create_graphs(graph_one_file, graph_two_file):
    """
    Creates a dictionary, where the key is partition i in the graph and the value is a list containing all the classes within partition i.
    """
    graph_one = {}
    graph_two = {}
    graph_file = open(graph_one_file, 'r')
    csv_reader = csv.reader(graph_file)

    # Create the graph for the first file
    for row in csv_reader:
        if row[0] in graph_one:
            graph_one[row[0]].append(row[1])
        else:
            graph_one[row[0]] = [row[1]]

    graph_file = open(graph_two_file, 'r')
    csv_reader = csv.reader(graph_file)

    # Create the graph for the second file
    for row in csv_reader:
        if row[0] in graph_two:
            graph_two[row[0]].append(row[1])
        else:
            graph_two[row[0]] = [row[1]]

    return graph_one, graph_two

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
            cluster_i = "g1:" + partition_i
            cluster_j = "g2:" + partition_j
            num_of_intersecting_elems = intersection(graph_one[partition_i], graph_two[partition_j])
            num_of_total_elems = union(graph_one[partition_i], graph_two[partition_j])
            # Normalize using the cluster with the larger number of entities
            #c2c_similarity_value = (num_of_intersecting_elems) / (max(len(graph_one[partition_i]), len(graph_two[partition_j])))
            # Normalize by unionizing the clusters
            c2c_similarity_value = num_of_intersecting_elems / num_of_total_elems
            graph_1.append(cluster_i)
            graph_2.append(cluster_j)
            edges.append((cluster_i, cluster_j, c2c_similarity_value))
            if cluster_i in bipartiteGraph:
                bipartiteGraph[cluster_i][cluster_j] = c2c_similarity_value
            else:
                bipartiteGraph[cluster_i] = {}
                bipartiteGraph[cluster_i][cluster_j] = c2c_similarity_value
    #adjust_bipartite_graph(graph_one, graph_two, bipartiteGraph)
            #print(cluster_i)
            #print(cluster_j)
            #print(c2c_similarity_value)
            graph_list.append([cluster_i, cluster_j, c2c_similarity_value])
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
def intersection(cluster1, cluster2):
    intersection = [value for value in cluster1 if value in cluster2]
    return len(intersection)

def union(cluster1, cluster2):
    union = []
    for node in cluster1:
        if node not in cluster2:
            union.append(node)
    for node in cluster2:
        union.append(node)
    return len(union)

def writeToCSV(graph):
    depFile = open("depSim.csv", 'w')
    csv_writer = csv.writer(depFile)
    for row in graph:
        csv_writer.writerow(row)
    depFile.close()

if __name__ == "__main__":
    graph_one_file = sys.argv[1]
    graph_two_file = sys.argv[2]
    graph_one, graph_two = create_graphs(graph_one_file, graph_two_file)
    G, graph = createBipartiteGraph(graph_one, graph_two)
    results = max_weight_matching(G)
    writeToCSV(graph)
    print(results)
