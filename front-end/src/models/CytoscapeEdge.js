/**
 * Cytoscape Edge. 
 * 
 * @class CytoscapeEdge
 */
export class CytoscapeEdge {
    constructor(source, target, weight, color) {
        this._source = source;
        this._target = target;
        this._weight = weight;
        this._color = color; 
        this._type = "edge"; 
    }

    getCytoscapeData() {
        return {
            data: {
                source: this._source,
                target: this._target,
                weight: this._weight,
                element_type: this._type,
                color: this._color
            }
        };
    }

    getSourceNode() {
        return this._source;
    }

    getTargetNode() {
        return this._target;
    }

    getEdgeWeight() {
        return this._weight;
    }
}