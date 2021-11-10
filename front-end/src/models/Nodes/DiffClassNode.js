import { CytoscapeNode } from "./CytoscapeNode";

/**
 * Diff Class Node  (used for the Diff View)
 * 
 * @class DiffClassNode
 * @extends {CytoscapeNode}
 */
export class DiffClassNode extends CytoscapeNode {
    constructor(id, label, diffVersion, color, parent) {
        super(id, label);
        this._type = "diff";
        this._parent = parent;
        this._diffVersion = diffVersion;
        this._background_color = color;
        this._colored = false;
        this._partition = parent;
        this._showMinusSign = false;  
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
                partition: this._partition,
                showMinusSign: this._showMinusSign,
                version: this._diffVersion
            }
        }
    }
}