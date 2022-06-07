/*
 * This is layout is used to visualize the differences between graphs that have been clustered differently.
 * 
 *  Requirements:
 *  - Graphs being compared must have the same nodes. 
 *  - A compound-node containing nodes within one cluster must have the id: 'partition{0, 1 ... n}', 
 *    and contain the attribute 'element_type: partition' within its data field. 
 *  - Nodes that are common in one partition between two clustering algorithms must contain the attribute 
 *    'element_type: common' within its data field and have parent: 'partition{0, 1 ... n}.'
 *  - Nodes that differ in one partition between two graphs must contain the attribute 
 *    'element_type: diff{1, 2 ... n}', where n corresponds to the number of graphs compared.
 *    It should also respectably have parent: 'partition{0, 1 ... n}' within its data field.    
 */

import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import noOverlap from 'cytoscape-no-overlap';

cytoscape.use( cola );
cytoscape.use( noOverlap );

/**
 * 
 * @param {*} cy the cytoscape instance with all elements fulfilling the requirements above. 
 * @param {*} options num_of_versions: number of graphs to compare, 
 *                    width: default width of appendices, 
 *                    height: default height of appendices,
 *                    partitions_per_row: when laying out the partitions, the total number of partitions per row.  
 */
function AppendixLayout( cy, options ) {
    this.cy = cy;   
    this.options = options
}

AppendixLayout.prototype.run = function() {
    let cy = this.cy;
    const options = this.options;

    const cy_graph_json = cy.json();

    // Add all the partitions and common nodes first into the headless cytoscape instance. 
    const principal_elements = cy.nodes().filter( (ele) => {
        return ele.data('element_type') === 'common' 
        || ele.data('element_type') === 'partition' 
        || ele.data('element_type') === 'invisible';
    });
    const partitions = cy.nodes().filter((ele) => {
        return ele.data('element_type') === 'partition';
    }); 

    cy.elements().remove();
    cy.add(principal_elements);

    // Add appendices and move elements to their respective appendices. Returns all the appendices added.
    const addAppendices = function() {
        let appendices = [];
        for(let i = 0; i < partitions.length; i++) {
            let partition_num = partitions[i].id().match('[0-9]');
            for (let j = 1; j <= options.num_of_versions; j++) {
                cy.add([
                    {
                        data: {
                            id: `partition${partition_num}_appendix${j}`, 
                            background_color: 'grey',
                            colored: true,
                            element_type: 'appendix',
                            width: options.width,
                            height: options.height,
                            parent: `partition${partition_num}`,
                            partition: `partition${partition_num}`,
                            version: j,
                            showMinusSign: false,
                        } 
                    }
                ]);

                let diff_nodes = []
                for(let l = 0; l < cy_graph_json.elements.nodes.length; l++) {
                    let ele = cy_graph_json.elements.nodes[l];
                    if(ele.data.element_type === `diff`
                    && ele.data.version === j 
                    && ele.data.parent === `partition${partition_num}`) {
                        diff_nodes.push(ele);
                    }
                }
                // Move all diff_nodes to the respective appendices, 
                // If no diff_nodes exist for this appendix then add an invisible node so the compound box is still visualized.
                if(diff_nodes.length !== 0) {
                    for(let k = 0; k < diff_nodes.length; k++) {
                        let data = diff_nodes[k].data;
                        data.parent = `partition${partition_num}_appendix${j}`;
                        cy.add([{ data: data }]);
                    }
                } else {
                    cy.add([
                        {
                            data: {
                                id: `invisible_node_partition${partition_num}_appendix${j}`,
                                label: `invisible_node${j}`,
                                element_type: 'invisible',
                                partition: `partition${i}`,
                                background_color: 'grey',
                                colored: false,
                                showMinusSign: false, 
                                parent: `partition${partition_num}_appendix${j}`
                            },
                        } 
                    ]);
                }
                appendices.push(cy.getElementById(`partition${partition_num}_appendix${j}`));
            }
        }
        return appendices;
    }

    const partitionLayoutOptions = {
        name: 'grid',
        nodeDimensionsIncludeLabels: true,
        avoidOverlap: true,
        condense: true,
    };
    const appendixLayoutOptions = {
        name: 'cola',
        animate: false,
        edgeJaccardLength: 40,
        avoidOverlap: true,
        nodeDimensionsIncludeLabels: true,
        unconstrIter: 20,
        userConstIter: 40,
        animate: false,
        allConstIter: 10,
        infinity: false 
    }

    // Run a layout on each partition in the headless cytoscape instance
    for(let i = 0; i < partitions.length; i++) {
        partitions[i].children().layout(partitionLayoutOptions).run();
    }

    // Get info of the appendices within each partition:
    // total_width = the total width of all appendices in the partition.
    // largest_height = the tallest appendix in the given partition.  
    const getAppendicesInfo = function() {
        let info = {};
        for(let i = 0; i < partitions.length; i++) {
            let partition_num = partitions[i].id().match('[0-9]');
            let partition_appendices = cy.filter((ele) => {
                return ele.data('parent') === `partition${partition_num}` && ele.data('element_type') === 'appendix';
            })
            let total_width = 0;
            for(let j = 0; j < partition_appendices.length; j++) {
                total_width += partition_appendices[j].width();
                partition_appendices[j].data().width = partition_appendices[j].width();
            }

            info[`partition${partition_num}`] = {
                total_width: total_width,
                largest_height: cy.collection(partition_appendices).max((ele) => {return ele.boundingBox().h})
            }
        }
        return info;
    } 

    const setRenderedPositions = async function(elements) {
        return new Promise((resolve, reject) => {
            const delay = 10;
            setTimeout(() => {
                if(elements === null || elements === undefined) {
                    reject('Elements could not be found...')
                } else {
                    let positions = {};
                    elements.forEach((ele) => {
                        const position = {
                            x: ele.position().x,
                            y: ele.position().y
                        }
                        positions[ele.data().id] = position;
                    });
                    resolve(positions);
                }
            }, delay);
        })
    };

    // Gets the bounding box of all the common nodes within the partition. This information will be used when shifting the appendices accordingly. 
    const getBoundingBoxOfCommonNodes = function(cy_partition_node) {
        let common_nodes = cy_partition_node.children().filter((ele) => {
            return (ele.data('element_type') === 'common' || ele.data('element_type') === 'invisible');
        });
        
        let boundingBox = {
            x1: common_nodes[0].boundingBox().x1,
            x2: common_nodes[0].boundingBox().x2,
            y1: common_nodes[0].boundingBox().y1,
            y2: common_nodes[0].boundingBox().y2,
        }
        let center_point = {
            x1: common_nodes[0].position().x,
            x2: common_nodes[0].position().x,
            y1: common_nodes[0].position().y,
            y2: common_nodes[0].position().y,
        }

        for(let i = 1; i < common_nodes.length; i++) {
            if (common_nodes[i].boundingBox().x1 < boundingBox.x1) {
                boundingBox.x1 = common_nodes[i].boundingBox().x1; 
                center_point.x1 = common_nodes[i].position().x; 
            } else if (common_nodes[i].boundingBox().x2 > boundingBox.x2) {
                boundingBox.x2 = common_nodes[i].boundingBox().x2; 
                center_point.x2 = common_nodes[i].position().x; 
            }

            if (common_nodes[i].boundingBox().y1 < boundingBox.y1) {
                boundingBox.y1 = common_nodes[i].boundingBox().y1; 
                center_point.y1 = common_nodes[i].position().y; 
            } else if (common_nodes[i].boundingBox().y2 > boundingBox.y2) {
                boundingBox.y2 = common_nodes[i].boundingBox().y2; 
                center_point.y2 = common_nodes[i].position().y; 
            }
        }

        boundingBox['center_point'] = {
            x: boundingBox.x1 + (boundingBox.x2 - boundingBox.x1) / 2,
            y: boundingBox.y1 + (boundingBox.y2 - boundingBox.y1) / 2 
        }

        return boundingBox;
    }

    // Now shift all partitions and position them accordingly to the appendix view.
    const shiftAppendices = function(appendix_info) {
        for(let i = 0; i < partitions.length; i++) {
            let partition_num = partitions[i].id().match('[0-9]');
            let boundingBox = getBoundingBoxOfCommonNodes(cy.getElementById(`partition${partition_num}`));
            let last_appendix_x_pos = boundingBox['center_point'].x + ( appendix_info[`partition${partition_num}`].total_width / 2);
            for(let j = options.num_of_versions; j > 0; j--) {
                let appendix = cy.getElementById(`partition${partition_num}_appendix${j}`);
                appendix.shift({
                    x: last_appendix_x_pos - appendix.boundingBox().x2,
                    y: (boundingBox.y2 - appendix.boundingBox().y1) + 50
                });
                last_appendix_x_pos = appendix.boundingBox().x1; 
            }
        }
    } 

    const adjustDimensionsOfAppendices = function(appendix_info) {
        let adjusted_appendix_info = {};
        for(let partition in appendix_info) {
            let appendices = cy.filter((ele) => {
                return ele.data('parent') === partition && ele.data('element_type') === 'appendix';
            })
            let added_width = 0;

            for(let j = 0; j < appendices.length; j++) {
                appendices[j].data().height = appendix_info[partition].largest_height.value;
                if(cy.getElementById(partition).width() > appendix_info[partition].total_width) {
                    let remaining_width = cy.getElementById(partition).width() - appendix_info[partition].total_width;
                    appendices[j].data().width += (remaining_width / 2); // **Adjust this to add more width to the appendices
                    added_width += (remaining_width / 2);
                }
            }

            adjusted_appendix_info[partition] = {
                total_width: appendix_info[partition].total_width + added_width,
                largest_height: appendix_info[partition].largest_height.value
            } 
        }
        return adjusted_appendix_info;
    }

    const adjustPartitionPositions = function() {
        const partitions_per_row = options.partitions_per_row;
        let previous_partition_position = {
            x: 0,
            y: 0,
            first_row_x1_pos: 0, 
            first_row_y2_pos: 0
        }

        for(let i = 0; i < partitions.length; i++ ) {
            let partition = cy.getElementById(partitions[i].id());
            if(i % partitions_per_row === 0) {
                partition.shift({
                    x: previous_partition_position.first_row_x1_pos - partition.boundingBox().x1,
                    y: previous_partition_position.first_row_y2_pos - partition.boundingBox().y1 + 100
                });
                previous_partition_position.first_row_x1_pos = partition.boundingBox().x1;
                previous_partition_position.first_row_y2_pos = partition.boundingBox().y2;
            } else {
                partition.shift({
                    x: previous_partition_position.x - partition.boundingBox().x1 + 100,
                    y: previous_partition_position.y - partition.boundingBox().y1
                });
            }
            previous_partition_position.x = partition.boundingBox().x2; 
            previous_partition_position.y = partition.boundingBox().y1; 
            if(partition.boundingBox().y2 > previous_partition_position.first_row_y2_pos) {
                previous_partition_position.first_row_y2_pos = partition.boundingBox().y2;
            }
        }

        cy.fit();
    }

    const runLayout = async function() {
        let appendices = addAppendices();
        let promiseCollection = [];
        let renderedPositions = {};

        // Add the current positions of all nodes into the renderedPositions graph. This will later be replaced. 
        cy.elements().forEach((ele) => {
            if(!(ele.id() in renderedPositions)) {
                const position = {
                    x: ele.position().x,
                    y: ele.position().y
                }
                renderedPositions[ele.id()] = position
            }
        })
        // Run a layout on each appendix in the headless cytoscape instance
        for(let i = 0; i < appendices.length; i++) {
            let layout = appendices[i].children().layout(appendixLayoutOptions);
            layout.run();
            layout.on('layoutstop', setRenderedPositions(layout.options.eles)
                                        .catch(error => console.log(error)));
            promiseCollection.push(setRenderedPositions(layout.options.eles));
        }
        await Promise.all(promiseCollection).then((values) => {
                                                for(let node_positions of values) {
                                                    for(let key in node_positions) {
                                                        renderedPositions[key] = node_positions[key];
                                                    }
                                                }
                                            });
        
        let appendix_info = getAppendicesInfo();
        // Adjust the appendices to ensure they all have consistent height and width. 
        appendix_info = adjustDimensionsOfAppendices(appendix_info);

        const graph_state = cy.json();
        cy.elements().remove();

        // We have to add partitions into the cytoscape first otherwise some nodes may not have a parent. 
        let add_partitions = [];
        for(let l = 0; l < graph_state.elements.nodes.length; l++) {
            let ele = graph_state.elements.nodes[l];
            if(ele.data.element_type === 'partition') {
                add_partitions.push({
                    data: ele.data
                });
            }
        }
        cy.add(add_partitions);
        cy.json({elements: graph_state.elements.nodes}).layout({name: 'preset', position: (ele) => {return renderedPositions[ele.id()]}, animate: false}).run();

        shiftAppendices(appendix_info);

        adjustPartitionPositions();

    }

    runLayout();
}

AppendixLayout.prototype.reformat = function() {
    let cy = this.cy;
    let options = this.options;

    const getAppendicesInfo = function() {
        let info = {};
        for(let i = 0; i < partitions.length; i++) {
            let partition_num = partitions[i].id().match('[0-9]');
            let partition_appendices = cy.filter((ele) => {
                return ele.data('parent') === `partition${partition_num}` && ele.data('element_type') === 'appendix';
            })
            let total_width = 0;
            for(let j = 0; j < partition_appendices.length; j++) {
                total_width += partition_appendices[j].width();
                partition_appendices[j].data().width = partition_appendices[j].width();
            }

            info[`partition${partition_num}`] = {
                total_width: total_width,
                largest_height: cy.collection(partition_appendices).max((ele) => {return ele.boundingBox().h})
            }
        }
        return info;
    } 
    const getBoundingBoxOfCommonNodes = function(cy_partition_node) {
        let common_nodes = cy_partition_node.children().filter((ele) => {
            return (ele.data('element_type') === 'common' || ele.data('element_type') === 'invisible' || ele.data('element_type') === 'common+');
        });
        
        let boundingBox = {
            x1: common_nodes[0].boundingBox().x1,
            x2: common_nodes[0].boundingBox().x2,
            y1: common_nodes[0].boundingBox().y1,
            y2: common_nodes[0].boundingBox().y2,
        }
        let center_point = {
            x1: common_nodes[0].position().x,
            x2: common_nodes[0].position().x,
            y1: common_nodes[0].position().y,
            y2: common_nodes[0].position().y,
        }

        for(let i = 1; i < common_nodes.length; i++) {
            if (common_nodes[i].boundingBox().x1 < boundingBox.x1) {
                boundingBox.x1 = common_nodes[i].boundingBox().x1; 
                center_point.x1 = common_nodes[i].position().x; 
            } else if (common_nodes[i].boundingBox().x2 > boundingBox.x2) {
                boundingBox.x2 = common_nodes[i].boundingBox().x2; 
                center_point.x2 = common_nodes[i].position().x; 
            }

            if (common_nodes[i].boundingBox().y1 < boundingBox.y1) {
                boundingBox.y1 = common_nodes[i].boundingBox().y1; 
                center_point.y1 = common_nodes[i].position().y; 
            } else if (common_nodes[i].boundingBox().y2 > boundingBox.y2) {
                boundingBox.y2 = common_nodes[i].boundingBox().y2; 
                center_point.y2 = common_nodes[i].position().y; 
            }
        }

        boundingBox['center_point'] = {
            x: boundingBox.x1 + (boundingBox.x2 - boundingBox.x1) / 2,
            y: boundingBox.y1 + (boundingBox.y2 - boundingBox.y1) / 2 
        }

        return boundingBox;
    }

    const adjustDimensionsOfAppendices = function(appendix_info) {
        let adjusted_appendix_info = {};
        for(let partition in appendix_info) {
            let appendices = cy.filter((ele) => {
                return ele.data('parent') === partition && ele.data('element_type') === 'appendix';
            })
            let added_width = 0;

            for(let j = 0; j < appendices.length; j++) {
                appendices[j].data().height = appendix_info[partition].largest_height.value;
                if(cy.getElementById(partition).width() > appendix_info[partition].total_width) {
                    let remaining_width = cy.getElementById(partition).width() - appendix_info[partition].total_width;
                    appendices[j].data().width += (remaining_width / 2); // **Adjust this to add more width to the appendices
                    added_width += (remaining_width / 2);
                }
            }

            adjusted_appendix_info[partition] = {
                total_width: appendix_info[partition].total_width + added_width,
                largest_height: appendix_info[partition].largest_height.value
            } 
        }
        return adjusted_appendix_info;
    }

    const shiftAppendices = function(appendix_info) {
        for(let i = 0; i < partitions.length; i++) {
            let partition_num = partitions[i].id().match('[0-9]');
            let boundingBox = getBoundingBoxOfCommonNodes(cy.getElementById(`partition${partition_num}`));
            let last_appendix_x_pos = boundingBox['center_point'].x + ( appendix_info[`partition${partition_num}`].total_width / 2);
            for(let j = options.num_of_versions; j > 0; j--) {
                let appendix = cy.getElementById(`partition${partition_num}_appendix${j}`);
                appendix.shift({
                    x: last_appendix_x_pos - appendix.boundingBox().x2,
                    y: (boundingBox.y2 - appendix.boundingBox().y1) + 50
                });
                last_appendix_x_pos = appendix.boundingBox().x1; 
            }
        }
    } 


    const adjustPartitionPositions = function() {
        const partitions_per_row = options.partitions_per_row;
        let previous_partition_position = {
            x: 0,
            y: 0,
            first_row_x1_pos: 0, 
            first_row_y2_pos: 0
        }

        for(let i = 0; i < partitions.length; i++ ) {
            let partition_num = partitions[i].id().match('[0-9]');
            let partition = cy.getElementById(`partition${partition_num}`);
            if(i % partitions_per_row === 0) {
                partition.shift({
                    x: previous_partition_position.first_row_x1_pos - partition.boundingBox().x1,
                    y: previous_partition_position.first_row_y2_pos - partition.boundingBox().y1 + 100
                });
                previous_partition_position.first_row_x1_pos = partition.boundingBox().x1;
                previous_partition_position.first_row_y2_pos = partition.boundingBox().y2;
            } else {
                partition.shift({
                    x: previous_partition_position.x - partition.boundingBox().x1 + 100,
                    y: previous_partition_position.y - partition.boundingBox().y1
                });
            }
            previous_partition_position.x = partition.boundingBox().x2; 
            previous_partition_position.y = partition.boundingBox().y1; 
            if(partition.boundingBox().y2 > previous_partition_position.first_row_y2_pos) {
                previous_partition_position.first_row_y2_pos = partition.boundingBox().y2;
            }
        }

        cy.fit();
    }

    const partitionLayoutOptions = {
        name: 'grid',
        nodeDimensionsIncludeLabels: true,
        avoidOverlap: true,
        condense: true,
    };
    const partitions = cy.nodes().filter((ele) => {
        return ele.data('element_type') === 'partition';
    }); 
    for(let i = 0; i < partitions.length; i++) {
        partitions[i].children().layout(partitionLayoutOptions).run();
    };
    let appendix_info = getAppendicesInfo();
    shiftAppendices(appendix_info);
    // appendix_info = adjustDimensionsOfAppendices(appendix_info);
    adjustPartitionPositions();
}

export default AppendixLayout;