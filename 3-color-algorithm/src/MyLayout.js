
import React, { Component } from 'react';
import Graph from 'react-graph-vis';

class MyLayout extends Component {
    constructor(props) {
        super(props);
        this.state = {
            graph: this.props.graph,
            flow: /*this.props.flow, //Init array to zero: */Array(this.props.graph.edges.length).fill(0),
            width: 100 / this.props.flow.length,
            events: {
                select: function (event) {
                    var { nodes, edges } = event;
                }
            },
            options: {
                layout: {
                    hierarchical: false
                }
            },
            next: 'paint',
            cycle: [],
            cycleNodes: [],
            cycleGraph: { nodes: [], edges: [] },
            finished: false,
        };
        this.changeColor = this.changeColor.bind(this)
        this.doCycle = this.doCycle.bind(this)
        //this.findFirstWrongFlow = this.findFirstWrongFlow.bind(this)
    }

    getPath(graph, current, goal) {
        var stack = [];
        var visited = [];
        var parentMap = []
        var node;
        var path
        stack.push(current);
        visited[current] = true;
        while (stack.length) {
            node = stack.pop();
            if (node === goal) {
                var path = [node]
                var cur = node
                while (parentMap[cur] != undefined) {
                    path.push(parentMap[cur])
                    cur = parentMap[cur]
                }
                return path.reverse();
            }

            for (var i = 0; i < graph[node].length; i += 1) {
                if (graph[node][i] && !visited[i]) {
                    stack.push(i);
                    parentMap[i] = node
                    visited[i] = true;
                }
            }
        }
        return false;
    }

    findFirstWrongFlow() {
        var array = this.state.graph.edges
        for (var i = 0; i < array.length; i++) {
            if (array[i].minFlow > this.state.flow[i] || array[i].maxFlow < this.state.flow[i]) {
                //alert(array[i].label)
                return array[i]
            }
        }
    }

    getMatrix(edges) {
        var matrix = [];
        for (var i = 0; i < this.state.graph.nodes.length; i++) {
            matrix[i] = new Array(this.state.graph.nodes.length).fill(0);
        }
        for (var i = 0; i < edges.length; i++) {
            if (edges[i].color.color == 'black') {
                matrix[edges[i].from - 1][edges[i].to - 1] = 1
            }
            else if (edges[i].color.color == 'green') {
                matrix[edges[i].to - 1][edges[i].from - 1] = 1
            }
            else {
                matrix[edges[i].from - 1][edges[i].to - 1] = 1
                matrix[edges[i].to - 1][edges[i].from - 1] = 1

            }
        }
        return matrix
    }

    changeColor() {
        var newGraph = {
            nodes: [],
            edges: []
        }
        newGraph.nodes = this.state.graph.nodes
        newGraph.edges = this.getEdgesArray()

        this.setState({
            graph: newGraph
        })


    }

    isOver() {
        var sol = true
        this.state.graph.edges.forEach((elem, index) => {
            if (elem.minFlow > this.state.flow[index] || elem.maxFlow < this.state.flow[index]) {
                sol = false
            }
        })
        return sol
    }

    getNodesFromPath(path) {
        var nodes = []
        path.forEach(elem => {
            this.state.graph.nodes.forEach(node => {
                if (node.id == elem + 1) {
                    nodes.push(node)
                    alert(node.label)
                }
            })
        })
    }

    doCycle() {
        if (this.state.next == 'paint') {
            if (this.isOver()) {
                alert('You have found a compatible flow')
                this.setState({
                    finished: true,
                    next: 'Finished'
                })
            } else {
                this.changeColor()
                this.setState({
                    next: 'getCycle'
                })
            }

        }
        if (this.state.next == 'getCycle') {
            var edge = this.findFirstWrongFlow()
            var edges = []
            this.state.graph.edges.forEach(element => {
                if (element.label != edge.label) {
                    edges.push(element)
                }
            })
            //alert(edge.label)
            var path
            var matrix = this.getMatrix(edges)
            if (edge.color.color == 'black') {
                path = this.getPath(matrix, edge.to - 1, edge.from - 1)
                var ed = this.getEdgesFromPath(path)
                edge.direction = 'Direct'
                ed.push(edge)
            } else if (edge.color.color == 'green') {
                path = this.getPath(matrix, edge.from - 1, edge.to - 1)
                var ed = this.getEdgesFromPath(path)
                edge.direction = 'Reverse'
                ed.push(edge)
            } else {
                path = this.getPath(matrix, edge.to - 1, edge.from - 1)
                if (path) {
                    var ed = this.getEdgesFromPath(path)
                    edge.direction = 'Direct'
                    ed.push(edge)
                } else {
                    path = this.getPath(matrix, edge.from - 1, edge.to - 1)
                    var ed = this.getEdgesFromPath(path)
                    edge.direction = 'Reverse'
                    ed.push(edge)
                }
            }

            // var myNodes = this.getNodesFromPath(path)
            this.setState({
                cycle: this.flowFix(ed),
                //cycleNodes: myNodes,
                //cycleGraph: { nodes: myNodes, edges: this.flowFix(ed) },
                next: 'updateFlow'
            })
        }
        if (this.state.next == 'updateFlow') {
            var min = Infinity
            this.state.cycle.forEach(elem => {
                if (elem.flowFix < min) {
                    min = elem.flowFix
                }
            })
            //alert(min)
            var newFlow = this.state.flow.slice(0);

            this.state.cycle.forEach(edge => {
                this.state.graph.edges.forEach((elem, i) => {
                    if (edge.label === elem.label) {
                        //alert(edge.direction)
                        if (edge.direction === 'Direct') {
                            //elem.flowFix = elem.maxFlow - this.state.flow[i]
                            newFlow[i] = this.state.flow[i] + min
                        }
                        else if (edge.direction === 'Reverse') {
                            //alert(elem.label + ' ,Flow ' + this.state.flow[i] + ' , minFlow ' + elem.minFlow)
                            //elem.flowFix =  this.state.flow[i] - elem.minFlow
                            newFlow[i] = this.state.flow[i] - min
                        }
                    }
                    //newFlow[i] = this.state.flow[i]
                })
            })
            //alert(newFlow)
            this.setState({

                flow: newFlow,
                next: 'paint'
            })
        }

    }

    flowFix(myEdges) {
        var sol = []
        myEdges.forEach(edge => {
            this.state.graph.edges.forEach((elem, i) => {
                if (edge.label === elem.label) {
                    if (elem.direction === 'Direct') {
                        elem.flowFix = elem.maxFlow - this.state.flow[i]
                    }
                    else if (elem.direction === 'Reverse') {
                        //alert(elem.label + ' ,Flow ' + this.state.flow[i] + ' , minFlow ' + elem.minFlow)
                        elem.flowFix = this.state.flow[i] - elem.minFlow
                    }
                    sol.push(elem)
                }

            })
        })

        return sol
    }

    getEdgesFromPath(path) {
        var sol = []
        var init
        var end
        for (var i = 0; i < path.length - 1; i++) {
            init = path[i]
            end = path[i + 1]
            this.state.graph.edges.forEach(elem => {
                if (elem.color.color == 'black') {
                    if (elem.from - 1 == init && elem.to - 1 == end) {
                        elem.direction = 'Direct'
                        sol.push(elem)
                    }
                } else if (elem.color.color === 'green') {
                    if (elem.from - 1 === end && elem.to - 1 === init) {
                        elem.direction = 'Reverse'
                        sol.push(elem)
                    }
                } else if (elem.color.color == 'red') {
                    if (elem.from - 1 == init && elem.to - 1 == end) {
                        elem.direction = 'Direct'
                        sol.push(elem)
                    }
                    if (elem.from - 1 == end && elem.to - 1 == init) {
                        elem.direction = 'Reverse'
                        sol.push(elem)
                    }
                }

            })
        }
        return sol
    }

    getEdgesArray() {
        var array = []
        for (var i = 0; i < this.state.graph.edges.length; i++) {
            var ed = {}
            ed.from = this.state.graph.edges[i].from
            ed.to = this.state.graph.edges[i].to
            ed.minFlow = this.state.graph.edges[i].minFlow
            ed.maxFlow = this.state.graph.edges[i].maxFlow
            ed.label = this.state.graph.edges[i].label
            ed.dashes = this.state.graph.edges[i].dashes
            ed.width = this.state.graph.edges[i].width
            if (this.state.flow[i] <= this.state.graph.edges[i].minFlow) {
                ed.color = { color: 'black' }
            }
            else if (this.state.flow[i] >= this.state.graph.edges[i].maxFlow) {
                ed.color = { color: 'green' }
            }
            else {
                ed.color = { color: 'red' }
            }
            array.push(ed)
        }
        return array
    }



    render() {
        return (
            <div class="container">
                <div class="content">
                    <div class="graph">
                        <Graph graph={this.state.graph} options={this.state.options} events={this.state.events} />
                    </div>
                    <div class="details">
                        <div class="App-header">
                            Next State: {this.state.next}
                        </div>

                        <div class="cycle-list">
                            {this.state.cycle.length === 0 ? "" : <table>
                                <tr>
                                    <th>Edge</th>
                                    <th>Direction</th>
                                    <th>Adjustment</th>
                                </tr>



                                {this.state.cycle.map((elem, index) => {
                                    return (
                                        <tr>
                                            <td>{elem.label}</td>
                                            <td>{elem.direction}</td>
                                            <td>{elem.flowFix}</td>
                                        </tr>

                                    )
                                })}
                            </table> }
                        </div>
                        <div>
                            <Graph graph={this.state.cycleGraph} options={this.state.options} events={this.state.events} />

                        </div>
                        <button class="Next-button" disabled={this.state.finished} onClick={this.doCycle}>Next</button>

                    </div>
                </div>
                <div class="footer">
                    <table>
                        <tr>
                            <th>
                                Edge
                            </th>
                            {
                                this.state.graph.edges.map((edge, index) => {
                                    return (
                                        <th>
                                            {edge.label}
                                        </th>
                                    )
                                })
                            }
                        </tr>
                        <tr>
                            <th>
                                Range
                            </th>
                            {
                                this.state.graph.edges.map((edge, index) => {
                                    return (
                                        <td>
                                            ({edge.minFlow},{edge.maxFlow})
                                        </td>
                                    )
                                })
                            }
                        </tr>
                        <tr>
                            <th>
                                Actual Flow
                            </th>
                            {
                                this.state.flow.map((elem, index) => {
                                    if (this.state.graph.edges[index].minFlow <= elem && elem <= this.state.graph.edges[index].maxFlow) {
                                        this.col = '#bcffa5'
            
                                    } else {
                                        this.col = 'white'
                                    }
                                    return (
                                        <td bgcolor={this.col}>
                                            {elem}
                                        </td>
                                    )
                                })
                            }
                        </tr>

                    </table>

                </div>
            </div>

        );
    }
}

export default MyLayout;
