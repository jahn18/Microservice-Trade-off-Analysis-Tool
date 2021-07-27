import React, {createRef} from "react";
import cytoscape from 'cytoscape';
import Utils from './../Utils'
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import edgehandles from 'cytoscape-edgehandles';
import automove from 'cytoscape-automove';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import storeProvider from './../../storeProvider';
import {updateCustomGraph} from './../../Actions';
import {connect} from 'react-redux';
import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';
import DeleteIcon from '@material-ui/icons/Delete';
import IconButton from '@material-ui/core/IconButton';

cytoscape.use( nodeHtmlLabel );
cytoscape.use( automove );
cytoscape.use( edgehandles );

class CustomGraph extends React.Component {
    constructor(props) {
        super(props);

        let parsedGraph = Utils.parseGraphJSONFile(this.props.graphData, true);

        this.state = {
            nodes: parsedGraph[0],
            common_elements: parsedGraph[1],
            num_of_partitions: parsedGraph[2],
            relationshipTypes: parsedGraph[3],
            relationshipTypeTable: [],
            num_of_decompositions: 2,
            evolutionaryHistory: {
                table: [],
                nodeMoveHistory: {}
            },
            elementsSelectedOnTable: [],
            removed_node: null,
            tableBodyRenderKey: 0,
        }

        this.ref = React.createRef();
    };

    componentDidMount() {
        const {
            nodes,
            num_of_partitions,
            evolutionaryHistory,
            relationshipTypes,
            num_of_decompositions
        } = this.state;

        const cy = cytoscape({
            container: this.ref,
            elements: nodes,
            style: [
                {
                    'selector': 'node',
                    'style': {
                        'background-color': 'data(background_color)',
                        'label': 'data(label)',
                        'min-zoomed-font-size': '15px',
                        'font-size': '25px'
                    }
                },
                {
                    // The compound node
                    'selector': '$node > node',
                    'style': {
                        'label': 'data(label)',
                        'shape': 'roundrectangle',
                        'padding-top': '10px',
                        'padding-left': '10px',
                        'padding-bottom': '10px',
                        'padding-right': '10px',
                        'text-valign': 'top',
                        'text-halign': 'center',
                        'background-color': function(node) {
                            if (node.data("colored"))
                                return "#f9f9f9";
                            else
                                return "white";
                        },
                        'border-style': function(node) {
                            if (node.data("colored"))
                                return "solid";
                            else
                                return "double";
                        },
                        'min-width': function(node) {
                            return node.data('width');
                        },
                        'min-height': function(node) {
                            return node.data('height');
                        }
                    }
                },
                {
                    'selector': 'edge',
                    'style': {
                        'width': 1,
                        'line-color': 'grey',
                        'target-arrow-color': 'grey',
                        'target-arrow-shape': 'vee',
                        'curve-style': 'bezier'
                    }
                },
                {
                    'selector': 'node.hide',
                    'style': {
                        'opacity': 0.0
                    }
                },
                {
                    'selector': 'node.deactivate',
                    'style': {
                        'opacity': 0.0
                    }
                },
                {
                    'selector': 'node.dimOut',
                    'style': {
                        'opacity': 0.05
                    }
                },
                {
                    selector: '.eh-handle',
                    style: {
                        'background-color': 'red',
                        'width': 13,
                        'height': 13,
                        'shape': 'ellipse',
                        'overlay-opacity': 0,
                        'border-width': 12, // makes the handle easier to hit
                        'border-opacity': 0
                    }
                },
                {
                    selector: '.eh-hover',
                    style: {
                        'background-color': 'red'
                    }
                },
                {
                    selector: '.eh-source',
                    style: {
                        'border-width': 2,
                        'border-color': 'red'
                    }
                },
                {
                    selector: '.eh-target',
                    style: {
                        'border-width': 2,
                        'border-color': 'red'
                    }
                },
                {
                    selector: '.eh-preview, .eh-ghost-edge',
                    style: {
                        'background-color': 'red',
                        'line-color': 'red',
                        'target-arrow-color': 'red',
                        'source-arrow-color': 'red'
                    }
                },
                {
                    selector: '.eh-ghost-edge.eh-preview-active',
                    style: {
                        'opacity': 0
                    }
                }
            ],
        });

        cy.nodes().forEach((ele) => {
            if(ele.data().element_type === 'invisible') {
                ele.addClass('hide');
            }
        })

        let lastRenderedState;
        let loadedEvolutionaryHistory;
        
        // If the custom graph hasn't been loaded yet then load the positions of the current diff-graph. 
        // if(Object.keys(storeProvider.getStore().getState().custom_graph).length === 0) {
        //     lastRenderedState = storeProvider.getStore().getState().diff_graph;
            loadedEvolutionaryHistory = evolutionaryHistory;
        // } else {
        //     lastRenderedState = storeProvider.getStore().getState().custom_graph.graph;
            // loadedEvolutionaryHistory = storeProvider.getStore().getState().custom_graph.evolutionaryHistory;
        //     cy.json(lastRenderedState);
        //     lastRenderedState = storeProvider.getStore().getState().diff_graph;
        // }

        /*
            Removes additional red nodes that were added because of the edge handles functionality. 
        */
        let collection = cy.elements().filter((ele) => {
            return (ele.data().element_type === undefined);
        });
        cy.remove(collection);
        let partitions = [];

        for(let i = 0; i < num_of_partitions; i++) {
            partitions.push(`partition${i}`);

            let previous_pos_x = 0; 
            let previous_pos_y = 0;   
            let ele = cy.getElementById(`partition${i}`);
            ele.children().layout({
                name: 'grid',
                boundingBox: {
                    x1: ele.position().x - ele.data().width/2,
                    x2: ele.position().x + ele.data().width/2,
                    y1: ele.position().y - ele.data().height/2,
                    y2: ele.position().y + ele.data().height/2 
                },
                condense: false
            }).run();

            for(let j = 1; j <= 2; j++) {
                ele = cy.getElementById(`diff${i}_graph_${j}`);
                ele.children().layout({
                    name: 'grid',
                    boundingBox: {
                        x1: ele.position().x - ele.data().width/2,
                        x2: ele.position().x + ele.data().width/2,
                        y1: ele.position().y - ele.data().height/2,
                        y2: ele.position().y + ele.data().height/2 
                    }
                }).run();

                let ele_partition = cy.getElementById(`partition${i}`);

                ele.position({
                    x: ele_partition.position().x,
                    y: ele_partition.position().y 
                })

                ele.shift({
                    x: (j === 1) ? (ele_partition.position().x - ele.boundingBox().x2): 
                                    (previous_pos_x - ele.boundingBox().x1),
                    y: (j === 1) ? ele_partition.boundingBox().h / 1.25: previous_pos_y - ele.boundingBox().y1,
                })
                previous_pos_x = ele.boundingBox().x2;
                previous_pos_y = ele.boundingBox().y1;
            }
        }

        // let lastRenderedNodePositions = this._getLastRenderedNodePositions(lastRenderedState);
        // for(let i = 0; i < num_of_partitions; i++) {
        //     cy.getElementById(`partition${i}`).position(
        //         {
        //             x: lastRenderedNodePositions[`partition${i}`].x,
        //             y: lastRenderedNodePositions[`partition${i}`].y
        //         }
        //     )
            // for(let j = 1; i <= num_of_decompositions; j++) {
            //     cy.getElementById(`core${i}_${j}`).position(
            //         {
            //             x: lastRenderedNodePositions[`core${i}_${j}`].x,
            //             y: lastRenderedNodePositions[`core${i}_${j}`].y
            //         }
            //     )
            // }
        // }

        // cy.pan(lastRenderedState.pan);
        // cy.zoom(lastRenderedState.zoom);

        let eh = cy.edgehandles({
            snap: false
        });
        
        cy.nodeHtmlLabel([{
                query: 'node',
                halign: 'center',
                valign: 'center',
                halignBox: 'center',
                valignBox: 'center',
                tpl: (data) => {
                    if(data.element_type === 'common*' && data.showMinusSign === false) {
                        return '<h1 style="color:white;">' + '+' + '</h1>';
                    } else if (!this._isNodeCommonBetweenDecompositions(data.element_type) && data.showMinusSign === true) {
                        return '<h1 style="color:white;">' + '-' + '</h1>';
                    }
                }
        }]);

        /*
            All event handlers.
        */
        cy.on('ehcomplete', (event, sourceNode, targetNode, addedEles) => this.onMovedNode(sourceNode, targetNode, addedEles));
        cy.on('mouseover', 'node', (e) => {
            if(!this._isNodeCommonBetweenDecompositions(e.target.data().element_type)) {
                eh.enableDrawMode();
            }
        })
        cy.on('mouseout', 'node', (e) => { eh.disableDrawMode(); })
        cy.on('tap', 'node', (e) => this.onClickedNode(e)); 
        cy.on('click', (e) => this.onUnclickNode(e));
        cy.on('mouseover', 'node', (e) => { 
            if(e.target.data().element_type === 'invisible') {
                e.target.ungrabify(); 
                eh.hide();
            }
        })
        cy.on('mouseout', 'node', (e) => { 
            if(e.target.data().element_type !== undefined) {
                e.target.grabify();
            }
        });

        let relationshipTypeTable = []

        Object.keys(relationshipTypes).map(
            (key, index) => {
                relationshipTypeTable.push(<TableRow>
                    <TableCell style={{'font-size': 'Normal'}}>
                        {key}
                    </TableCell>
                    {
                        [...Array(num_of_decompositions)].map((x, i) => 
                            <TableCell align="left">
                                {
                                    Utils.calculateNormalizedTurboMQ(
                                        relationshipTypes[key]["links"],
                                        this._getCurrentDecomposition(i + 1, cy)
                                    ).toFixed(2)
                                }
                            </TableCell>
                        )
                    }
                </TableRow>)
            }
            )

        this.setState({
            cy: cy,
            partitions: partitions,
            evolutionaryHistory: loadedEvolutionaryHistory,
            relationshipTypeTable: relationshipTypeTable
        });
    }

    _getLastRenderedNodePositions(lastRenderedGraph) {
        let previous_graph_positions = {};
        for(let node_i in lastRenderedGraph.elements.nodes) {
            let element_name = lastRenderedGraph.elements.nodes[node_i].data.id;
            previous_graph_positions[element_name] = lastRenderedGraph.elements.nodes[node_i].position;
        }
        return previous_graph_positions;
    }

    _isNodeCommonBetweenDecompositions(element_type) {
        const {
            num_of_decompositions
        } = this.state;

        for(let i = 0; i < num_of_decompositions; i++) {
            if(element_type === `graph_${i+1}`) {
                return false;
            }
        }
        return true;
    }

    onClickedNode(ele) {
        if(ele.target.data().element_type === undefined) {
            return;
        }

        const {
            cy,
            num_of_decompositions
        } = this.state; 

        let sel = ele.target;
        let selected_elements = cy.collection([sel, sel.parent()]); 
        console.log(selected_elements);

        switch(sel.data().element_type) {
            case 'common*':
                if(sel.data().prev_element_type !== 'common') {
                    for(let i = 0; i < num_of_decompositions; i++) {
                        let graph_node = cy.getElementById(`graph_${i+1}_${sel.id()}`)
                        selected_elements = selected_elements.union(
                            cy.collection([graph_node, cy.getElementById(graph_node.data().partition), graph_node.parent()])
                        );
                        cy.add([{
                            group: 'edges',
                            data: {
                                target: sel.id(),
                                source: `graph_${i+1}_${sel.id()}`
                            }
                        }])
                    }
                } else {
                    selected_elements = selected_elements.union(cy.getElementById(sel.data().prev_partition));
                    cy.add([{
                        group: 'edges',
                        data: {
                            target: sel.id(),
                            source: sel.data().prev_partition
                        }
                    }]);
                }
                break;
            case 'diff_graph':
                selected_elements = selected_elements.union(sel.children()).union(
                    cy.getElementById(sel.data().partition)
                );
                break;
            case 'partition':
                selected_elements = selected_elements.union(sel.children()).union(
                    cy.elements().filter((ele)=> {
                        return (ele.data().partition === sel.id());
                    }),
                )
                break;
            case 'common':
                selected_elements = selected_elements.union(cy.getElementById(sel.data().partition)); 
                break;
            default: 
                for(let i = 1; i <= num_of_decompositions; i++) {
                    let graph_node = cy.getElementById(`graph_${i}_${sel.data().label}`)
                    selected_elements = selected_elements.union(
                        cy.collection([graph_node, cy.getElementById(graph_node.data().partition), graph_node.parent()])
                    );
                }
        }

        let unselected_elements = cy.elements().difference(selected_elements);
        unselected_elements.forEach((ele) => {
            if(this._isNodeCommonBetweenDecompositions(ele.data().element_type)) {
                ele.data().showMinusSign = true; 
            }
        })
        unselected_elements.addClass('deactivate');
    }

    onUnclickNode() {
        const {
            cy,
            removed_node
        } = this.state;

        if(removed_node !== null) {
            let current_node = cy.elements().getElementById(removed_node.data().label);
            cy.remove(current_node);
            cy.add(removed_node);
        }

        cy.elements().forEach((ele) => {
            ele.removeClass('deactivate');
            if(this._isNodeCommonBetweenDecompositions(ele.data().element_type)) {
                ele.data().showMinusSign = false;
            }
        })
        cy.remove('edge');
    }

    onHoverOverTableRow(movedElements) {
        let {
            cy,
            evolutionaryHistory,
            num_of_decompositions
        } = this.state; 
        const nodeMoveHistory = evolutionaryHistory.nodeMoveHistory;

        let selected_elements = cy.collection(); 
        let sel = cy.getElementById(movedElements[0].data().label);
        let index = this._findIndexInMoveHistory(movedElements);
        let removed_node = null;

        if(!this._checkIfLastMoveForClass(movedElements)) {
            removed_node = cy.remove(cy.getElementById(movedElements[0].data().label));
            sel = nodeMoveHistory[movedElements[0].data().label][index + 1][0];
            sel.position({
                    x: cy.getElementById(sel.data().partition).position().x,
                    y: cy.getElementById(sel.data().partition).position().y
            });
            selected_elements = selected_elements.union(sel);
            cy.add(sel);
        }

        if(this._checkifFirstMoveForClass(movedElements)) {
            selected_elements = selected_elements.union(sel).union(movedElements[1]); 
            if(sel.data().prev_element_type !== 'common') {
                for(let i = 0; i < num_of_decompositions; i++) {
                    let graph_node = cy.getElementById(`graph_${i+1}_${sel.id()}`)
                    selected_elements = selected_elements.union(
                        cy.collection([graph_node, cy.getElementById(graph_node.data().partition), graph_node.parent()])
                    );
                    cy.add([{
                        group: 'edges',
                        data: {
                            target: sel.id(),
                            source: `graph_${i+1}_${sel.id()}`
                        }
                    }])
                }
            } else {
                selected_elements = selected_elements.union(cy.getElementById(sel.data().prev_partition));
                cy.add([{
                    group: 'edges',
                    data: {
                        target: sel.id(),
                        source: sel.data().prev_partition
                    }
                }]);
            }
        } else {
            let previous_node = nodeMoveHistory[movedElements[0].data().label][index][0];
            selected_elements = selected_elements.union(
                                        previous_node
                                    ).union(
                                        movedElements[1]
                                    ).union(
                                        cy.getElementById(previous_node.data().partition
                                    )); 
            cy.add([{
                group: 'edges',
                data: {
                    target: previous_node.id(),
                    source: previous_node.data().partition
                }
            }]);
        }

        let unselected_elements = cy.elements().difference(selected_elements);
        // Removes the plus sign when hovering over the table node.
        unselected_elements.forEach((ele) => {
            if(this._isNodeCommonBetweenDecompositions(ele.data().element_type)) {
                ele.data().showMinusSign = true; 
            }
        })
        unselected_elements.addClass('deactivate');

        this.setState({
            removed_node: removed_node
        })
    }

    onMovedNode(sourceNode, targetNode, addedEles) { 
        const {
            cy,
            partitions,
            num_of_decompositions
        } = this.state; 

        if(sourceNode.data().showMinusSign === false && 
            partitions.includes(targetNode.id()) &&
            !sourceNode.hasClass('deactivate') &&
            sourceNode.data().element_type !== 'partition') 
            {

            let prev_element = sourceNode.data().element_type;
            let prev_partition = sourceNode.data().partition; 

            if(sourceNode.data().element_type === 'common*') {
                cy.remove(sourceNode);
                prev_element = sourceNode.data().prev_element_type;
                prev_partition = sourceNode.data().prev_partition;
            }

            cy.add({
                group: 'nodes',
                data: {
                    id: sourceNode.data().label,
                    label: sourceNode.data().label,
                    parent: targetNode.id(),
                    element_type: 'common*',
                    prev_element_type: prev_element,
                    background_color: 'grey',
                    partition: targetNode.id(),
                    prev_partition: prev_partition,
                    showMinusSign: false
                },
            });

            // Should also hide common elements if they get moved. 
            if(this._isNodeCommonBetweenDecompositions(sourceNode.data().element_type)) {
                cy.remove(sourceNode);
            } else {
                for(let i = 0; i < num_of_decompositions; i++) {
                    let diff_graph_node = cy.getElementById(`graph_${i+1}_${sourceNode.data().label}`)
                    diff_graph_node.data().showMinusSign = true;
                    // let diff_graph_node_partition = diff_graph_node.data().partition;
                }
            }

            this.setState((prevState) => ({
                evolutionaryHistory: {
                    table: [[sourceNode, targetNode], ...prevState.evolutionaryHistory.table],
                    nodeMoveHistory: !(sourceNode.data().label in prevState.evolutionaryHistory.nodeMoveHistory) ? ({
                        ...prevState.evolutionaryHistory.nodeMoveHistory,
                        [sourceNode.data().label]: [[sourceNode, targetNode]]
                    }) : ({
                        ...prevState.evolutionaryHistory.nodeMoveHistory,
                        [sourceNode.data().label]: [...prevState.evolutionaryHistory.nodeMoveHistory[sourceNode.data().label], [sourceNode, targetNode]]
                    })
                }
            }));
        } 
        cy.remove(addedEles);
    }

    _getCurrentDecomposition(decomposition_version_number, cy) {
        const {
            num_of_partitions,
            num_of_decompositions
        } = this.state; 

        let decomposition_element_types = [];
        for(let i = 0; i < num_of_decompositions; i++) {
            if(i + 1 !== decomposition_version_number) {
                decomposition_element_types.push(`graph_${i + 1}`);
            }
        }

        let decomposition = [];

        for(let i = 0; i < num_of_partitions; i++) {
            let partition = []; 
            cy.nodes().forEach((ele) => {
                if(ele.data().partition === `partition${i}` && !decomposition_element_types.includes(ele.data().element_type)) {
                    partition.push(ele.data().label);
                }
            })
            decomposition.push(partition);
        }
        return decomposition;
    }

    updateRedux() {
        let {
            cy,
            evolutionaryHistory
        } = this.state;

        this.props.updateCustomGraph(
            {
                graph: cy.json(),
                evolutionaryHistory: evolutionaryHistory
            }
        );
    }

    _updateSelectedEvolutionaryList(isBoxChecked, element) {
        const {
            elementsSelectedOnTable
        } = this.state;

        if(isBoxChecked) {
            this.setState(prevState => ({
                elementsSelectedOnTable: [...prevState.elementsSelectedOnTable, element]
            }))
        } else {
            this.setState({elementsSelectedOnTable: elementsSelectedOnTable.filter((ele) => {
                return ele !== element;
            })});
        }
    }

    _onDeleteEvolvedElements() {
        const {
            cy,
            elementsSelectedOnTable, 
            evolutionaryHistory,
            tableBodyRenderKey,
            num_of_decompositions,
        } = this.state;

        const zoom = cy.zoom();
        const pan = cy.pan();

        let nodeMoveHistory = {...evolutionaryHistory.nodeMoveHistory};

        // Remove elements from the table
        for(let ele in elementsSelectedOnTable) {
            let movedElement = elementsSelectedOnTable[ele];
            const index = nodeMoveHistory[movedElement[0].data().label].length - 1;
            let previous_moved_node = nodeMoveHistory[movedElement[0].data().label].slice(-1)[0][0]
            let partitions = [movedElement[0].data().partition];

            cy.remove(cy.getElementById(movedElement[0].data().label)); 
            if(!this._checkifFirstMoveForClass(movedElement) || previous_moved_node.data().element_type === 'common') {
                cy.add(previous_moved_node);
            } else {
                if(!this._isNodeCommonBetweenDecompositions(movedElement[0].data().element_type)) {
                    for(let i = 0; i < num_of_decompositions; i++) {
                        let diff_graph_node = cy.getElementById(`graph_${i+1}_${movedElement[0].data().label}`)
                        diff_graph_node.data().showMinusSign = false;
                        partitions.push(diff_graph_node.data().partition);
                    }
                }
            }
            nodeMoveHistory[movedElement[0].data().label].splice(index, 1);
        }

        cy.pan(pan);
        cy.zoom(zoom);

        this.setState(() => ({
            evolutionaryHistory: {
                table: evolutionaryHistory.table.filter((ele) => {
                    return !elementsSelectedOnTable.includes(ele);
                }),
                nodeMoveHistory: nodeMoveHistory,
            },
            elementsSelectedOnTable: [],
            tableBodyRenderKey: tableBodyRenderKey + 1
        }));
    }

    _printEvolutionaryHistoryText(moved_element) {
        const {
            cy,
            num_of_decompositions,
            evolutionaryHistory
        } = this.state;
        const nodeMoveHistory = evolutionaryHistory.nodeMoveHistory;
        let target_node = moved_element[0].data().label;
        let previous_partitions = "";

        if(moved_element[0].data().element_type === 'common' || moved_element[0].data().prev_element_type === 'common') {
            previous_partitions = `P${moved_element[0].data().partition.match('[0-9]')}`;
        } else if (this._checkifFirstMoveForClass(moved_element)){
            for(let i = 0; i < num_of_decompositions; i++) {
                previous_partitions = previous_partitions.concat(`V${i + 1}-P${cy.getElementById(`graph_${i + 1}_${moved_element[0].data().label}`).data().partition.match('[0-9]')}`);
                if(i !== num_of_decompositions - 1) {
                    previous_partitions = previous_partitions.concat(" ᐱ ");
                }
            }
        } else {
            let index = this._findIndexInMoveHistory(moved_element);
            let previous_node = nodeMoveHistory[moved_element[0].data().label][index][0]
            previous_partitions = `P${previous_node.data().partition.match('[0-9]')}`;
        }

        let target_partition = moved_element[1].id().match('[0-9]');
        return `${target_node}: (${previous_partitions}) → P${target_partition}`;
    }

    _findIndexInMoveHistory(moved_element) {
        const {
            nodeMoveHistory
        } = this.state.evolutionaryHistory;

        const index = nodeMoveHistory[moved_element[0].data().label].findIndex(x => {
            for(let i = 0; i < moved_element.length; i++) {
                if(x[i] !== moved_element[i]) {
                    return false;
                }
            }
            return true;
        });
        return index; 
    }

    _checkIfLastMoveForClass(moved_element) {
        const {
            nodeMoveHistory
        } = this.state.evolutionaryHistory;

        return (nodeMoveHistory[moved_element[0].data().label].length - 1) === this._findIndexInMoveHistory(moved_element);
    }

    _checkifFirstMoveForClass(moved_element) {
        return this._findIndexInMoveHistory(moved_element) === 0;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {
            relationshipTypes,
            num_of_decompositions,
            cy
        } = this.state;

        let relationshipTypeTable = []

        Object.keys(relationshipTypes).map(
            (key, index) => {
                relationshipTypeTable.push(<TableRow>
                    <TableCell style={{'font-size': 'Normal'}}>
                        {key}
                    </TableCell>
                    {
                        [...Array(num_of_decompositions)].map((x, i) => 
                            <TableCell align="left">
                                {
                                    Utils.calculateNormalizedTurboMQ(
                                        relationshipTypes[key]["links"],
                                        this._getCurrentDecomposition(i + 1, cy)
                                    ).toFixed(2)
                                }
                            </TableCell>
                        )
                    }
                </TableRow>)
            }
            )
        if(JSON.stringify(prevState.relationshipTypeTable) !== JSON.stringify(relationshipTypeTable)) {
            this.setState({relationshipTypeTable: relationshipTypeTable});
        }
    }

    componentWillUnmount() {
        this.updateRedux();
    }

    render() {
        let {
            evolutionaryHistory,
            elementsSelectedOnTable,
            tableBodyRenderKey,
            num_of_decompositions,
            relationshipTypeTable
        } = this.state;

        const evolutionaryHistoryList = evolutionaryHistory.table.map(
            (moved_element, index) => 
            <TableRow 
                hover={true} 
                onMouseOver={(event) => {
                    this.onHoverOverTableRow(moved_element);
                }}
                onMouseOut={(event) => {
                    this.onUnclickNode();
                }}
            >
                <TableCell>
                    <Checkbox
                        onChange={(event, newValue) => this._updateSelectedEvolutionaryList(newValue, moved_element, index)}
                        disabled={!this._checkIfLastMoveForClass(moved_element)}
                    />
                    {this._printEvolutionaryHistoryText(moved_element)}
                </TableCell>
            </TableRow>
        )

        return (
            <div>
                <div className="custom-graph-container">
                    <div style={{height: '100%', width: '100%', position: 'fixed'}} ref={ref => (this.ref = ref)}></div>
                </div>
                <div className="table-container" style={{position: 'absolute', left: '68%', width: '100%', 'margin-top': '1%'}}>
                    <TableContainer 
                    component={Paper} 
                    style={
                            {
                                width: '30%',
                                border: '1px solid grey',
                                'left': '68%',
                                'margin-top': '0%',
                                position: 'fixed',
                                maxHeight: '290px'
                            }
                        } 
                    size="small">
                        <Table stickyHeader aria-label="simple table" size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="" colSpan={3} style={{'font-weight': 'bold'}}>
                                        Coupling & Cohesion (0-100%)
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>
                                        Dependencies
                                    </TableCell>
                                    {
                                        [...Array(num_of_decompositions)].map((x, i) => 
                                            <TableCell style={{'text-color': '#4169e1'}}>
                                                V{i+1}
                                            </TableCell>
                                        )
                                    }
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {relationshipTypeTable}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TableContainer 
                    component={Paper} 
                    style={
                            {
                                width: '30%',
                                border: '1px solid grey',
                                'margin-top': '295px',
                                maxHeight: '300px',
                                position: 'fixed'
                            }
                        } 
                    >
                        <Table stickyHeader aria-label="simple table" size="small" style={{maxHeight: '300px'}}>
                            <TableHead>
                                <TableRow>
                                    {elementsSelectedOnTable.length > 0 ? (
                                        <TableCell>
                                        {elementsSelectedOnTable.length} selected
                                            <Tooltip title="Delete">
                                                <IconButton 
                                                    aria-label="delete" 
                                                    onClick={(event) => this._onDeleteEvolvedElements()}
                                                >
                                                    <DeleteIcon/>
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                        ) : (
                                        <TableCell align="left" style={{'font-weight': 'bold'}}>
                                            Evolutionary History
                                        </TableCell> 
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody key={tableBodyRenderKey}>
                                {evolutionaryHistoryList}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            </div>
        );
    }
};

export default connect(null, { updateCustomGraph })(CustomGraph);
