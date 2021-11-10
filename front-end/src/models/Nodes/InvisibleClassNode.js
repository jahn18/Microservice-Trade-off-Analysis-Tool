
import { CytoscapeNode } from "./CytoscapeNode";

/**
 * Invisible Class Node 
 * 
 * @class InvisibleClassNode
 * @extends {CytoscapeNode}
 */
export class InvisibleClassNode extends CytoscapeNode {
    constructor(id, label, parent) {
        super(id, label);
        this._background_color = "grey";
        this._colored = false;
        this._type = "invisible";
        this._parent = parent;
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
                showMinusSign: this._showMinusSign
            }
        }
    }
}