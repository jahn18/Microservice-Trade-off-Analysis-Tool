import { CytoscapeNode } from "./CytoscapeNode";

/**
 * Class Node 
 * 
 * @class ClassNode
 * @extends {CytoscapeNode}
 */
export class ClassNode extends CytoscapeNode {
    constructor(id, label, parent) {
        super(id, label);
        this._background_color = "grey";
        this._colored = false;
        this._type = "common";
        this._parent = parent;
        this._partition = parent;  
    }

    getCytoscapeData() { 
        return {
            data: {
                id: this._id,
                label: this._label,
                background_color: this._background_color,
                colored: this._colored,
                element_type: this._type,
                parent: this._parent,
                partition: this._partition
            }
        }
    }
}