import { CytoscapeNode } from "./CytoscapeNode";

/**
 * Moved Class Node  (used for the Diff View)
 * 
 * @class MovedClassNode
 * @extends {CytoscapeNode}
 */
export class MovedClassNode extends CytoscapeNode {
    constructor(id, label, newParent, prevType, prevParent) {
        super(id, label);
        this._type = "common*";
        this._parent = newParent;
        this._background_color = "grey";
        this._colored = false;
        this._partition = parent;
        this._showMinusSign = false;  
        this._prev_type = prevType;
        this._prev_parent = prevParent;
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
                prev_partition: this._prev_parent,
                prev_element_type: this._prev_type
            }
        }
    }
}