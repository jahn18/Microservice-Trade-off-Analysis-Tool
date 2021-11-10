
import { CytoscapeNode } from "./CytoscapeNode";

/**
 * Matched Partition Node 
 * 
 * @class PartitionNode
 * @extends {CytoscapeNode}
 */
export class MatchedPartitionNode extends CytoscapeNode {
    constructor(id, partitionOneLabel, partitionTwoLabel) {
        super(id)
        this._label = this._getMatchedPartitionLabel(id, partitionOneLabel, partitionTwoLabel);
        this._background_color = "white";
        this._colored = false;
        this._type = "partition";
        this._width = 0;
        this._height = 0;
        this._showMinusSign = false;  
    }

    _getMatchedPartitionLabel(id, partitionOneLabel, partitionTwoLabel) {
        let partitionLabel; 
        if (partitionOneLabel && partitionTwoLabel) {
            partitionLabel = `M${id.match('[0-9]')} = V1-${partitionOneLabel} ᐱ V2-${partitionTwoLabel}`;
        } else if (!partitionOneLabel) {
            partitionLabel = `M${id.match('[0-9]')} = V2-${partitionTwoLabel}`;
        } else if (!partitionTwoLabel) {
            partitionLabel = `M${id.match('[0-9]')} = V1-${partitionOneLabel}`;
        }
        return partitionLabel;
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
                height: this._height,
                showMinusSign: this._showMinusSign
            }
        }
    }
}