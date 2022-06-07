from cmath import inf
from re import A
from flask import request, jsonify, Flask, Blueprint, send_file
import os
import csv
import _thread
import json
import numpy as np


cluster_dir = os.path.dirname(os.path.realpath(__file__))
dependency_files_dir = os.path.dirname(cluster_dir) + '/../dependencyGraphs/'

main = Blueprint('main', __name__)

@main.route('/diff', methods=['GET', 'POST'])
def weighted_diff_graph():
    try:
        graph = json.loads(request.data) # The graph is in cytoscape format
        weightedRelationships = {
            'static': 0,
            'dynamic': 0,
            'class-names': 0,
            'class-terms': 0,
            'commits': 0,
            'contributors': 0
        }

        for key in graph["weights"]:
            weightedRelationships[key] = graph["weights"][key]

        edgeRelationships = {}
        for key in graph["relationshipTypes"]:
            edgeRelationships[key] = {'max_weight': 0, 'links': [], 'mean': np.mean(np.array(list(map(lambda dep: float(dep['weight']), graph["relationshipTypes"][key]['links'])))), 'sd': np.std(np.array(list(map(lambda dep: float(dep['weight']), graph["relationshipTypes"][key]['links']))))}
            for dependency in graph["relationshipTypes"][key]['links']:
                if float(dependency['weight']) > edgeRelationships[key]['max_weight']:
                    edgeRelationships[key]['max_weight'] = float(dependency['weight'])
                edgeRelationships[key]['links'].append([dependency['source'], dependency['target'], dependency['weight']])

        if type(graph["diffGraph"]["elements"]) == dict:
            diff_graph = graph["diffGraph"]["elements"]["nodes"]
        else:
            diff_graph = graph["diffGraph"]["elements"]
        diff_nodes = []
        common_nodes_2_partition = {}

        diff_graph_mega_cluster_map = {}

        for ele in diff_graph:
            ele = ele["data"]
            if ele["element_type"] == "common" or ele["element_type"] == "common*":
                common_nodes_2_partition[ele["label"]] = ele["partition"]
                if ele["partition"] not in diff_graph_mega_cluster_map:
                    diff_graph_mega_cluster_map[ele["partition"]] = {"nodes": [ele["label"]], "considered": {}}
                else:
                    diff_graph_mega_cluster_map[ele["partition"]]["nodes"].append(ele["label"])
            elif ele["element_type"] == "diff" and ele["showMinusSign"] == False:
                diff_nodes.append(ele)
                if ele["partition"] not in diff_graph_mega_cluster_map:
                    diff_graph_mega_cluster_map[ele["partition"]] = {"nodes": [], "considered": {}}

        copy_diff_nodes = list(set(map(lambda x: x["label"], diff_nodes.copy())))

        while True:
            links_to_mega_clusters = {}
            version = 1
            for key in edgeRelationships:

                if weightedRelationships[key] == 0:
                    continue

                for diff_node in diff_nodes:
                    mega_cluster = {}

                    # Check the diff_node is for the correct relationship-type
                    if diff_node["version"] != version:
                        continue

                    for edge_dep in edgeRelationships[key]['links']:
                        caller_class, callee_class, edgeWeight = edge_dep

                        # Find the affinity of the diff_node to its respective mega-cluster.
                        if caller_class not in common_nodes_2_partition and callee_class not in common_nodes_2_partition:
                            continue

                        # Check if the link is between the diff_node and the current megacluster it's in
                        if (callee_class == diff_node["label"] and caller_class in diff_graph_mega_cluster_map[diff_node["partition"]]["nodes"]) or (caller_class == diff_node["label"] and callee_class in diff_graph_mega_cluster_map[diff_node["partition"]]["nodes"]):
                            edgeWeight = (sigmoid( ( float(edgeWeight) - edgeRelationships[key]['mean'] ) / edgeRelationships[key]['sd'] )) * weightedRelationships[key]

                            if caller_class == diff_node["label"]:
                                if common_nodes_2_partition[callee_class] in mega_cluster:
                                    mega_cluster[common_nodes_2_partition[callee_class]]["weight"] += edgeWeight
                                    mega_cluster[common_nodes_2_partition[callee_class]]["numLinks"] += 1
                                else:
                                    mega_cluster[common_nodes_2_partition[callee_class]] = {"weight": edgeWeight, "numLinks": 1}

                                if diff_node["label"] not in diff_graph_mega_cluster_map[diff_node["partition"]]["considered"]:
                                    diff_graph_mega_cluster_map[diff_node["partition"]]["considered"][diff_node["label"]] = [callee_class]
                                else:
                                    diff_graph_mega_cluster_map[diff_node["partition"]]["considered"][diff_node["label"]].append(callee_class)

                            elif callee_class == diff_node["label"]:
                                if common_nodes_2_partition[caller_class] in mega_cluster:
                                    mega_cluster[common_nodes_2_partition[caller_class]]["weight"] += edgeWeight
                                    mega_cluster[common_nodes_2_partition[caller_class]]["numLinks"] += 1
                                else:
                                    mega_cluster[common_nodes_2_partition[caller_class]] = {"weight": edgeWeight, "numLinks": 1}

                                if diff_node["label"] not in diff_graph_mega_cluster_map[diff_node["partition"]]["considered"]:
                                    diff_graph_mega_cluster_map[diff_node["partition"]]["considered"][diff_node["label"]] = [caller_class]
                                else:
                                    diff_graph_mega_cluster_map[diff_node["partition"]]["considered"][diff_node["label"]].append(caller_class)

                    if bool(mega_cluster):
                        links_to_mega_clusters[diff_node["label"]] = mega_cluster.copy()

                version += 1
            # convert links to mega cluster into a list of dependencies
            links = []
            for satellite_node in links_to_mega_clusters:
                for partition in links_to_mega_clusters[satellite_node]:
                    links.append([satellite_node, partition, links_to_mega_clusters[satellite_node][partition]["weight"] / (links_to_mega_clusters[satellite_node][partition]["numLinks"] + len(list(set(diff_graph_mega_cluster_map[partition]["nodes"]) - set(diff_graph_mega_cluster_map[partition]["considered"][satellite_node]))))])
            links.sort(key=lambda x: x[2])
            print(links)
            if len(links) == 0:
                break
            link = links.pop()
            satellite_node = link[0]
            mega_cluster = link[1]
            common_nodes_2_partition[satellite_node] = mega_cluster

            # Add the moved diff_node into the megacluster
            diff_graph_mega_cluster_map[mega_cluster]["nodes"].append(satellite_node)

            diff_nodes = [node for node in diff_nodes if node["label"] != satellite_node]
            print(diff_nodes)

        diff_node_moves = []
        for node in common_nodes_2_partition:
            if node in copy_diff_nodes:
                diff_node_moves.append({"label": node, "target": common_nodes_2_partition[node]})
        print(diff_node_moves)
        return {"moves": diff_node_moves}
    except:
        return "ERROR: Could not retrieve json graph data...", 400


@main.route('/<projectname>/cluster', methods=['GET', 'POST'])
def recluster_graph(projectname):
    try:
        #graph = request.json
        graph = json.loads(request.data)

        # If the dependency graphs for the application do not exist then generate csv files of them.
        if os.path.isdir( dependency_files_dir + projectname ) is False:
            print('Generating dependency graphs for new project at', dependency_files_dir + projectname)
            os.makedirs(dependency_files_dir + projectname)

        # Get all edges within the json graph.
        edgeRelationships = {}
        for dependency in graph['links']:
            if dependency['source'] in edgeRelationships:
                edgeRelationships[dependency['source']][dependency['target']] = int(float(dependency['weight']) * 100)
            else:
                edgeRelationships[dependency['source']] = {}

        # Write the edge graph to an mdg file with combined relationship types
        dependency_graph_file_name = dependency_files_dir + projectname + ".mdg"
        with open(dependency_graph_file_name, "w") as f:
            writer = csv.writer(f, delimiter=" ")
            for caller in edgeRelationships:
                for callee in edgeRelationships[caller]:
                    writer.writerow([caller, callee, edgeRelationships[caller][callee]])

        # Generate the BUNCH file configuration.
        output_dir = dependency_files_dir + projectname + "/" + "bunch"
        if os.path.isdir( output_dir ) is False:
            print('Generating bunch graph for new project at', output_dir)
            os.makedirs(output_dir)

        weight_graph_scripts_dir = cluster_dir + "/../../" + "weightGraphScripts" + "/"
        os.system("javac -cp " + weight_graph_scripts_dir + "Bunch.jar " + weight_graph_scripts_dir + "RunBunch.java")
        cmd = "java -cp " + weight_graph_scripts_dir + "Bunch.jar:" + weight_graph_scripts_dir + "." + " RunBunch " + dependency_graph_file_name + " " + output_dir + "/"
        os.system(cmd)

        print('Finished generating decomposition...')

        # Now convert the generated decomposition into json format and return it back to the client.
        decomposition_file_name = output_dir + "/" + projectname + ".mdg.bunch"
        print(decomposition_file_name)
        partitions = {}

        existing_class_names = []
        with open(decomposition_file_name, 'r') as bunchFile:
            lines = bunchFile.readlines()
            i = 0
            for line in lines:
                clusterNameSeparatedFromEntities = line.split(' = ')
                clusterName, entities = clusterNameSeparatedFromEntities

                clusterName = clusterName.replace('SS(', '')
                clusterName = clusterName.replace(')', '')

                partitions['partition{}'.format(i)] = []

                entities = entities.split(', ')
                for entity in entities:
                    entity = entity.replace('\n', '')
                    partitions['partition{}'.format(i)].append({"id": entity})
                    existing_class_names.append(entity)
                i += 1

        partitions['unobserved'] = graph['decomposition']['unobserved']

        return partitions
    except:
        return "ERROR: Could not retrieve json graph data...", 400


@main.route('/<projectname>/<path:weights>', methods=['GET', 'POST'])
def main_index(projectname, weights=None):
    try:
        #graphData = request.json
        graphData = json.loads(request.data)
        weights = weights.split("/")
        relationships = graphData.keys()
        weightedRelationships = {}
        for (i, key) in enumerate(relationships):
            weightedRelationships[key] = float(weights[i])

        # If the dependency graphs for the application do not exist then generate csv files of them.
        if os.path.isdir( dependency_files_dir + projectname ) is False:
            print('Generating dependency graphs for new project at', dependency_files_dir + projectname)
            os.makedirs(dependency_files_dir + projectname)

        # Get all edges within the json graph.
        edgeRelationships = {}
        for key in graphData:
            edgeRelationships[key] = {'max_weight': 0, 'links': [], 'mean': np.mean(np.array(list(map(lambda dep: float(dep['weight']), graphData[key]['links'])))), 'sd': np.std(np.array(list(map(lambda dep: float(dep['weight']), graphData[key]['links']))))}
            for dependency in graphData[key]['links']:
                if float(dependency['weight']) > edgeRelationships[key]['max_weight']:
                    edgeRelationships[key]['max_weight'] = float(dependency['weight'])
                edgeRelationships[key]['links'].append([dependency['source'], dependency['target'], dependency['weight']])

        filteredEdgeGraph = {}
        for key in edgeRelationships:
            if weightedRelationships[key] == 0:
                continue
            # filtered_deps = sorted(edgeRelationships[key]['links'], key=lambda x: x[2])[round(len(edgeRelationships[key]['links']) * 0.4):]
            for edge_dep in edgeRelationships[key]['links']:
                caller_class, callee_class, edgeWeight = edge_dep
                edgeWeight = (sigmoid( ( float(edgeWeight) - edgeRelationships[key]['mean'] ) / edgeRelationships[key]['sd'] )) * weightedRelationships[key]
                edgeWeight = round(edgeWeight * 1000)

                if caller_class not in filteredEdgeGraph:
                    filteredEdgeGraph[caller_class] = {}

                if callee_class not in filteredEdgeGraph[caller_class]:
                    filteredEdgeGraph[caller_class][callee_class] = edgeWeight
                else:
                    filteredEdgeGraph[caller_class][callee_class] += edgeWeight

        # Write the edge graph to an mdg file with combined relationship types
        dependency_graph_file_name = dependency_files_dir + projectname + "/"
        for weight in weights:
            dependency_graph_file_name = dependency_graph_file_name + weight + "-"
        dependency_graph_file_name = dependency_graph_file_name[:-1] + ".mdg"
        with open(dependency_graph_file_name, "w") as f:
            writer = csv.writer(f, delimiter=" ")
            for caller in filteredEdgeGraph:
                for callee in filteredEdgeGraph[caller]:
                    writer.writerow([caller, callee, filteredEdgeGraph[caller][callee]])

        # Generate the BUNCH file configuration.
        output_dir = dependency_files_dir + projectname + "/" + "bunch"
        if os.path.isdir( output_dir ) is False:
            print('Generating bunch graph for new project at', output_dir)
            os.makedirs(output_dir)

        weight_graph_scripts_dir = cluster_dir + "/../../" + "weightGraphScripts" + "/"
        os.system("javac -cp " + weight_graph_scripts_dir + "Bunch.jar " + weight_graph_scripts_dir + "RunBunch.java")
        cmd = "java -cp " + weight_graph_scripts_dir + "Bunch.jar:" + weight_graph_scripts_dir + "." + " RunBunch " + dependency_graph_file_name + " " + output_dir + "/"
        os.system(cmd)

        print('Finished generating decomposition...')

        # Now convert the generated decomposition into json format and return it back to the client.
        decomposition_file_name = output_dir + "/"
        for weight in weights:
            decomposition_file_name = decomposition_file_name + weight + "-"
        decomposition_file_name = decomposition_file_name[:-1] + ".mdg.bunch"
        partitions = {}

        existing_class_names = []
        with open(decomposition_file_name, 'r') as bunchFile:
            lines = bunchFile.readlines()
            i = 0
            for line in lines:
                clusterNameSeparatedFromEntities = line.split(' = ')
                clusterName, entities = clusterNameSeparatedFromEntities

                clusterName = clusterName.replace('SS(', '')
                clusterName = clusterName.replace(')', '')

                partitions['partition{}'.format(i)] = []

                entities = entities.split(', ')
                for entity in entities:
                    entity = entity.replace('\n', '')
                    partitions['partition{}'.format(i)].append({"id": entity})
                    existing_class_names.append(entity)
                i += 1

        class_names = []
        for key in graphData[list(graphData)[0]]['decomposition']:
            for class_entity in graphData[list(graphData)[0]]['decomposition'][key]:
                class_names.append(
                    class_entity
                )

        missing_class_names = []
        for className in class_names:
            if className["id"] not in existing_class_names:
                missing_class_names.append(className)

        partitions['unobserved'] = []
        for missing_class in missing_class_names:
            partitions['unobserved'].append(
                {
                    'id': missing_class["id"]
                }
            )

        return partitions
    except:
        return "ERROR: Could not retrieve json graph data...", 400

def sigmoid(x):
    return np.exp(-np.logaddexp(0, -x))

def filterCrossEdgeLargerGraph(graphData, edgeRelationships, weightedRelationships):
    filteredEdgeGraph = {}

    min_edges = inf
    for key in weightedRelationships:
        if weightedRelationships[key] != 0:
            min_edges = min(min_edges, len(edgeRelationships[key]['links']))

    shift = findMin(edgeRelationships, weightedRelationships)
    for key in edgeRelationships:
        if weightedRelationships[key] == 0:
            continue
        
        if len(edgeRelationships[key]['links']) == min_edges:
            external_edges = edgeRelationships[key]['links']
        else: 
            external_edges = []
            internal_edges = []
            for edge_dep in edgeRelationships[key]['links']:
                caller_class, callee_class, edgeWeight = edge_dep
                for partition in graphData[key]["decomposition"]:
                    p = [*map(lambda x: x["id"], graphData[key]["decomposition"][partition])]
                    if caller_class in p and callee_class in p:
                        internal_edges.append(edge_dep)
                    else:
                        external_edges.append(edge_dep)
                    break 

            if len(external_edges) < min_edges:
                external_edges = internal_edges
            else:
                external_edges = external_edges[(len(edgeRelationships[key]['links']) - min_edges):] 
                for edge in external_edges:
                    internal_edges.append(edge)
                external_edges = internal_edges
        for edge_dep in external_edges:
            caller_class, callee_class, edgeWeight = edge_dep
            # Normalize the edge weight
            edgeWeight = (( ( float(edgeWeight) - edgeRelationships[key]['mean'] ) / edgeRelationships[key]['sd'] ) + shift) * weightedRelationships[key]
            edgeWeight = round(edgeWeight * 100)

            if caller_class not in filteredEdgeGraph:
                filteredEdgeGraph[caller_class] = {}

            if callee_class not in filteredEdgeGraph[caller_class]:
                filteredEdgeGraph[caller_class][callee_class] = edgeWeight
            else:
                filteredEdgeGraph[caller_class][callee_class] += edgeWeight
    
    return filteredEdgeGraph


def filterByLargerGraph(edgeRelationships, weightedRelationships):
    filteredEdgeGraph = {}

    shift = findMin(edgeRelationships, weightedRelationships)
    min_edges = inf
    for key in weightedRelationships:
        if weightedRelationships[key] != 0:
            min_edges = min(min_edges, len(edgeRelationships[key]['links']))

    for key in edgeRelationships:
        if weightedRelationships[key] == 0:
            continue
        filtered_deps = sorted(edgeRelationships[key]['links'], key=lambda x: x[2])[(len(edgeRelationships[key]['links']) - min_edges):]
        for edge_dep in filtered_deps:
            caller_class, callee_class, edgeWeight = edge_dep
            # Normalize the edge weight
            edgeWeight = (( ( float(edgeWeight) - edgeRelationships[key]['mean'] ) / edgeRelationships[key]['sd'] ) + shift) * weightedRelationships[key]
            edgeWeight = round(edgeWeight * 100)

            if caller_class not in filteredEdgeGraph:
                filteredEdgeGraph[caller_class] = {}

            if callee_class not in filteredEdgeGraph[caller_class]:
                filteredEdgeGraph[caller_class][callee_class] = edgeWeight
            else:
                filteredEdgeGraph[caller_class][callee_class] += edgeWeight
    
    return filteredEdgeGraph


def filterByPercentage(edgeRelationships, weightedRelationships):
    filteredEdgeGraph = {}

    shift = findMin(edgeRelationships, weightedRelationships)
    for key in edgeRelationships:
        if weightedRelationships[key] == 0:
            continue
        filtered_deps = sorted(edgeRelationships[key]['links'], key=lambda x: x[2])[round(len(edgeRelationships[key]['links']) * 0.4):]
        for edge_dep in filtered_deps:
            caller_class, callee_class, edgeWeight = edge_dep
            # Normalize the edge weight
            edgeWeight = (( ( float(edgeWeight) - edgeRelationships[key]['mean'] ) / edgeRelationships[key]['sd'] ) + shift) * weightedRelationships[key]
            edgeWeight = round(edgeWeight * 100)

            if caller_class not in filteredEdgeGraph:
                filteredEdgeGraph[caller_class] = {}

            if callee_class not in filteredEdgeGraph[caller_class]:
                filteredEdgeGraph[caller_class][callee_class] = edgeWeight
            else:
                filteredEdgeGraph[caller_class][callee_class] += edgeWeight
    
    return filteredEdgeGraph


def filterCrossEdges(graphData, edgeRelationships, weightedRelationships):
    filteredEdgeGraph = {}

    shift = findMin(edgeRelationships, weightedRelationships)
    for key in edgeRelationships:
        if weightedRelationships[key] == 0:
            continue
        for edge_dep in edgeRelationships[key]['links']:
            caller_class, callee_class, edgeWeight = edge_dep
            # Normalize the edge weight
            intra_edge = False
            for partition in graphData[key]["decomposition"]:
                p = [*map(lambda x: x["id"], graphData[key]["decomposition"][partition])]
                if caller_class in p and callee_class in p:
                    intra_edge = True 

            if intra_edge:
                edgeWeight = (( ( float(edgeWeight) - edgeRelationships[key]['mean'] ) / edgeRelationships[key]['sd'] ) + shift) * weightedRelationships[key]
                edgeWeight = round(edgeWeight * 100)

                if caller_class not in filteredEdgeGraph:
                    filteredEdgeGraph[caller_class] = {}

                if callee_class not in filteredEdgeGraph[caller_class]:
                    filteredEdgeGraph[caller_class][callee_class] = edgeWeight
                else:
                    filteredEdgeGraph[caller_class][callee_class] += edgeWeight
    
    return filteredEdgeGraph


def findMin(edgeRelationships, weightedRelationships):
    all_edge_deps = []
    for key in weightedRelationships:
        if weightedRelationships[key] != 0: 
            for weight in edgeRelationships[key]["links"]:
                all_edge_deps.append(((float(weight[2]) - edgeRelationships[key]['mean'] ) / edgeRelationships[key]['sd']))
    return abs(min(all_edge_deps))

@main.route('/<projectname>', methods=['GET', 'POST'])
def fetch_demo_json_file(projectname):
    demo_files_dir = cluster_dir + "/../../" + "demoJSONFiles" + "/"
    if os.path.isfile(demo_files_dir + projectname + ".json"):
        return send_file(demo_files_dir + projectname + ".json")
    else:
        return "ERROR: The demo JSON file does not exist...", 400



