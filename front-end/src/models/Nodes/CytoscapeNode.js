
/**
 * Abstract Class Node.
 * 
 * @class Node
 */
export class CytoscapeNode {
    constructor(id, label) {
        this._id = id;
        this._label = label;
        this._type = "";
        if (this.constructor == Node) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    /**
     * Implementation required
    */
    getCytoscapeData() {
        throw new Error('You have to implement the method getCytoscapeData!');
    }

    getType() {
        return this._type; 
    }

    getId() {
        return this._id;
    }

    getLabel() {
        return this._label;
    }
} 