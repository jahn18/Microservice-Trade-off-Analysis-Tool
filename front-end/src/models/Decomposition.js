/**
 * An adjancency list representation of a Decomposition. e.g. classNodes: [[...], [...], ...], partitions: [...]
 * 
 * @class Decomposition
 */
export class Decomposition {
    constructor(classNodeList, partitionList, version) {
        this._classNodeList = classNodeList;
        this._partitionList = partitionList;
        this._version = version;
        this._movedNodes = [];
    }

    getVersion() {
        return this._version;
    }

    getNodeById(id) {
        for (let node of this._classNodeList.concat(this._movedNodes).flat()) {
            if (node.getId() === id) {
                return node;
            }
        }
        return undefined; 
    }
    
    /**
     * Returns the ids of all partitions
     */
    getAllPartitionIds() {
        return this._partitionList.map(partition => partition.getId());
    }

    /**
     * @param {*} partitionNum - must be 0 <= 0 < maxNumOfPartitions or will throw an error otherwise 
     * @returns {PartitionNode} 
     */
    getPartitionNode(partitionNum) {
        if (partitionNum < 0 || partitionNum >= this.getNumOfPartitions()) {
            throw new Error("The partition number does not exist!");
        }
        return this._partitionList[partitionNum];
    }

    /**
     * Returns all the elements in partition number.
     * 
     * @param {number} partitionNum - must be 0 <= 0 < maxNumOfPartitions or will throw an error otherwise
     * @param {number} getIdOnly? - if true, then returns only the ids of the partition; otherwise, it will return all the node contents.           
     */
    getPartitionClassNodes(partitionNum, getIdOnly = false) {
        if (partitionNum < 0 || partitionNum >= this.getNumOfPartitions()) {
            throw new Error("The partition number does not exist!");
        }

        if (getIdOnly) {
            return this._classNodeList[partitionNum].map((classNode) => classNode.getId());
        } else {
            return this._classNodeList[partitionNum];
        }
    }

    /**
     * Returns the number of partitions in the decomposition
     */
    getNumOfPartitions() {
        return this._partitionList.length;
    }

    /**
     * Returns the decomposition with only the id's of all nodes.
     * @param {boolean} getIdOnly (Optional)  
     */
    getClassNodeList(getIdOnly = false) {
        let classNodeList = [];
        if(getIdOnly) {
            this._classNodeList.forEach((partitionClassNodes) => {
                classNodeList.push(partitionClassNodes.map((node) => node.getId()));
            })
        } else {
            classNodeList = [...this._classNodeList];
        }
        return classNodeList;
    }

    /**
     * Formats the decomposition data so that it can be used in cytoscape
     */
    getCytoscapeData() {
        return this._classNodeList.concat(this._partitionList).flat().map((node) => node.getCytoscapeData());
    }
}