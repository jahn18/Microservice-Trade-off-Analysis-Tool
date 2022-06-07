# Requires bash version 4 to run.
# Path to the application directory with all dependency graphs
SCRIPTS_DIR=/Users/johnahn/Research/2021_microservice_tradeoff/code/scripts

PROJECT_NAME=$1

DEPENDENCY_GRAPH_DIR=/Users/johnahn/Research/2021_microservice_tradeoff/app-data/${PROJECT_NAME}

STATIC=static/${PROJECT_NAME}StaticGraph
DYNAMIC=dynamic/${PROJECT_NAME}DynamicGraph
CLASSTERMS=class-terms/${PROJECT_NAME}ClassTermGraph
CLASSNAMES=class-names/${PROJECT_NAME}ClassNameGraph
CONTRIBUTORS=contributors/${PROJECT_NAME}ContributorGraph
COMMITS=commits/${PROJECT_NAME}CommitGraph

CLASS_NAME_TXT=${DEPENDENCY_GRAPH_DIR}/class-names/${PROJECT_NAME}-className.txt

mkdir -p ${DEPENDENCY_GRAPH_DIR}/decompositions

dep_graphs=(
    "static:${STATIC}"
    "dynamic:${DYNAMIC}"
    "class-names:${CLASSNAMES}"
    "class-terms:${CLASSTERMS}"
    "contributors:${CONTRIBUTORS}"
    "commits:${COMMITS}"
    )

for relationshipType in "${dep_graphs[@]}" ;
do
    KEY="${relationshipType%%:*}"
    VALUE="${relationshipType##*:}"
    mkdir -p ${DEPENDENCY_GRAPH_DIR}/decompositions/${KEY}
    python3 ${SCRIPTS_DIR}/fileFormatConversionScripts/extractMDGfromCSV.py ${DEPENDENCY_GRAPH_DIR}/${VALUE}.csv

    cd ${SCRIPTS_DIR}/decompositionExtraction

    #python3 getDecomposition.py ${DEPENDENCY_GRAPH_DIR}/${VALUE}.csv ${DEPENDENCY_GRAPH_DIR}/decompositions/${VALUE}.rsf

    javac -cp "Bunch-3.5.jar:." RunBunch.java
    java -cp "Bunch-3.5.jar:." RunBunch ${DEPENDENCY_GRAPH_DIR}/${VALUE}.mdg ${DEPENDENCY_GRAPH_DIR}/decompositions/${KEY}/

    python3 ${SCRIPTS_DIR}/fileFormatConversionScripts/extractCRSFfromBunch.py ${DEPENDENCY_GRAPH_DIR}/decompositions/${VALUE}.mdg.bunch
done
