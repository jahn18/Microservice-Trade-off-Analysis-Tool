import { CytoscapeNode } from "./CytoscapeNode";

/**
 * Partition Node 
 * 
 * @class PartitionNode
 * @extends {CytoscapeNode}
 */
export class PartitionNode extends CytoscapeNode {
    constructor(id, label) {
        super(id, label)
        this._background_color = "white";
        this._colored = false;
        this._type = "partition";
        this._width = 0;
        this._height = 0;
    }

    getCytoscapeData() { 
        return {
            data: {
                id: this._id,
                label: this._label,
                background_color: this._background_color,
                colored: this._colored,
                element_type: this._type,
                width: this._width,
                height: this._height
            }
        }
    }
}