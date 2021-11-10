import { CytoscapeNode } from "./CytoscapeNode";

/**
 * Common Class Node (used for the Diff view)
 * 
 * @class CommonClassNode
 * @extends {CytoscapeNode}
 */
export class CommonClassNode extends CytoscapeNode {
  constructor(id, label, parent) {
        super(id, label);
        this._type = "common";
        this._parent = parent;
        this._diffVersion = 0;
        this._background_color = "grey";
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