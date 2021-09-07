from flask import request, jsonify, Flask, Blueprint
import os
import csv

cluster_dir = os.path.dirname(os.path.realpath(__file__))
dependency_files_dir = os.path.dirname(cluster_dir) + '/../dependencyGraphs/'

main = Blueprint('main', __name__)

@main.route('/<projectname>/<static>/<dynamic>/<classnames>/<classterms>/<commits>/<contributors>', methods=['GET', 'POST'])
def main_index(projectname, static, dynamic, classnames, classterms, commits, contributors):
    try:
        graphData = request.json
        weightedRelationships = {
            'static': float(static),
            'dynamic': float(dynamic),
            'class-names': float(classnames),
            'class-terms': float(classterms),
            'commits': float(commits),
            'contributors': float(contributors)
        }

        # If the dependency graphs for the application do not exist then generate csv files of them.
        if os.path.isdir( dependency_files_dir + projectname ) is False:
            print('Generating dependency graphs for new project at', dependency_files_dir + projectname)
            os.makedirs(dependency_files_dir + projectname)

        # Get all edges within the json graph.
        edgeRelationships = {}
        for key in graphData:
            edgeRelationships[key] = {'max_weight': 0, 'links': []}
            for dependency in graphData[key]['links']:
                if float(dependency['weight']) > edgeRelationships[key]['max_weight']:
                    edgeRelationships[key]['max_weight'] = float(dependency['weight'])
                edgeRelationships[key]['links'].append([dependency['source'], dependency['target'], dependency['weight']])

        # Fliter out all the edges in the graph depending on the given edge weights for each relationship type.
        filteredEdgeGraph = {}
        for key in edgeRelationships:
            for edge_dep in edgeRelationships[key]['links']:
                caller_class, callee_class, edgeWeight = edge_dep
                # Normalize the edge weight
                edgeWeight = float(edgeWeight)/edgeRelationships[key]['max_weight'] * (weightedRelationships[key] * 100)
                edgeWeight = round(edgeWeight)

                if key == 'commits' or key == 'contributors':
                    edgeWeight = edgeWeight - round(edgeWeight * 0.5)
                elif key == 'classnames':
                    edgeWeight = edgeWeight - round(edgeWeight * 0.2)

                if caller_class not in filteredEdgeGraph:
                    filteredEdgeGraph[caller_class] = {}

                if callee_class not in filteredEdgeGraph[caller_class] and edgeWeight > 0:
                    filteredEdgeGraph[caller_class][callee_class] = edgeWeight
                elif edgeWeight > 0:
                    filteredEdgeGraph[caller_class][callee_class] += edgeWeight

        # Write the edge graph to an mdg file with combined relationship types
        dependency_graph_file_name = dependency_files_dir + projectname + "/" + static + "-" + dynamic + "-" + classnames + "-" + classterms + "-" + commits + "-" + contributors + ".mdg"
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
        decomposition_file_name = output_dir + "/" + static + "-" + dynamic + "-" + classnames + "-" + classterms + "-" + commits + "-" + contributors + ".mdg.bunch"
        partitions = {}
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
                    entity = entity.split('.')[-1]
                    partitions['partition{}'.format(i)].append(entity)
                i += 1

        return jsonify(partitions)
    except:
        return "ERROR: Could not retrieve json graph data...", 400
