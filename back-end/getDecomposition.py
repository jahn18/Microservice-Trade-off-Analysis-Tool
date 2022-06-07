from igraph import Graph
import csv
import sys


def write_decomposition_graph(clustering_graph, output_file_name):
    with open(output_file_name, "w") as f:
        csv_writer = csv.writer(f)
        i = 0
        for partition in clustering_graph:
            for class_name in partition:
                csv_writer.writerow(["contain", "partition{}".format(i), class_name])
            i += 1


def get_dependency_graph(dependency_file_name):
    dependency_graph = []
    with open(dependency_file_name, "r") as f:
        csv_reader = csv.reader(f)
        for dep in csv_reader:
            dependency_graph.append(dep)

    return dependency_graph


def create_graph(dependency_graph):
    node_dict = create_node_dict(dependency_graph)
    inv_map = {v: k for k, v in node_dict.items()}

    g = Graph()
    g.add_vertices(len(node_dict))

    highest_edge_weight = find_highest_edge_weight(dependency_graph)

    edges = []
    weights = []
    for dep in dependency_graph:
        edges.append((node_dict[dep[0]], node_dict[dep[1]]))
        weights.append((float(dep[2]) / highest_edge_weight))

    g.add_edges(edges)

    modularity = -1
    result = None
    alpha = 1
    for i in range(3):
        weights = [(x * alpha) for x in weights]
        g.es["weight"] = weights
        decomp = g.community_leiden("modularity", weights=g.es["weight"])
        if decomp.modularity > modularity:
            modularity = decomp.modularity
            result = decomp
        alpha = alpha * 10

    decomposition = []
    for k in result:
        decomposition.append([inv_map[name] for name in k])

    return decomposition


def find_highest_edge_weight(dependency_graph):
    weight = 0
    for dep in dependency_graph:
        if weight < float(dep[2]):
            weight = float(dep[2])
    return weight


def create_node_dict(dependency_graph):
    node_dict = {}
    i = 0
    for dep in dependency_graph:
        class_name_a = dep[0]
        class_name_b = dep[1]
        if class_name_a not in node_dict:
            node_dict[class_name_a] = i
            i += 1
        if class_name_b not in node_dict:
            node_dict[class_name_b] = i
            i += 1

    return node_dict


if __name__ == "__main__":
    graph_name = sys.argv[1]
    output_graph = sys.argv[2]
    dep_graph = get_dependency_graph(graph_name)
    decomposition = create_graph(dep_graph)
    write_decomposition_graph(decomposition, output_graph)