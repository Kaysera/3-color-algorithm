
import React, { Component } from 'react';
import Graph from 'react-graph-vis';
import swal from 'sweetalert';

class MyLayout extends Component {
    constructor(props) {
        super(props);
        this.state = {
            graph: this.props.graph,
            flow: Array(this.props.graph.edges.length).fill(0),
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
            started: false,
        };
        this.changeColor = this.changeColor.bind(this)
        this.doCycle = this.doCycle.bind(this)
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

    showCycle(cycle) {
        var newGraph = {
            nodes: [],
            edges: []
        }
        newGraph.nodes = this.state.graph.nodes
        newGraph.edges = this.getCycleArray(cycle)

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


    doCycle() {
        this.setState({
            started: true
        })
        if (this.state.next == 'paint') {
            if (this.isOver()) {
                swal({
                    title: "You have found a compatible flow!",
                    text: "This is the end of the algorithm",
                    icon: "success",
                  });
                this.setState({
                    finished: true,
                    next: 'Finished',
                    started: true
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
            var labels = []
            this.state.graph.edges.forEach(element => {
                if (element.label != edge.label) {
                    edges.push(element)
                }
            })
            var path
            var matrix = this.getMatrix(edges)
            if (edge.color.color == 'black') {
                path = this.getPath(matrix, edge.to - 1, edge.from - 1)
                var ed = this.getEdgesFromPath(path)
                edge.direction = 'Direct'
                ed.unshift(edge)
            } else if (edge.color.color == 'green') {
                path = this.getPath(matrix, edge.from - 1, edge.to - 1)
                var ed = this.getEdgesFromPath(path)
                edge.direction = 'Reverse'
                ed.unshift(edge)
            } else {
                path = this.getPath(matrix, edge.to - 1, edge.from - 1)
                if (path) {
                    var ed = this.getEdgesFromPath(path)
                    edge.direction = 'Direct'
                    ed.unshift(edge)
                } else {
                    path = this.getPath(matrix, edge.from - 1, edge.to - 1)
                    var ed = this.getEdgesFromPath(path)
                    edge.direction = 'Reverse'
                    ed.unshift(edge)
                }
            }
            
            ed.forEach(element => {
                labels.push(element.label)
            })
            this.showCycle(labels)

            this.setState({
                cycle: this.flowFix(ed),
                next: 'updateFlow',
                started: true

            })
        }
        if (this.state.next == 'updateFlow') {
            var min = Infinity
            this.state.cycle.forEach(elem => {
                if (elem.flowFix < min) {
                    min = elem.flowFix
                }
            })
            var newFlow = this.state.flow.slice(0);

            this.state.cycle.forEach(edge => {
                this.state.graph.edges.forEach((elem, i) => {
                    if (edge.label === elem.label) {
                        if (edge.direction === 'Direct') {
                            newFlow[i] = this.state.flow[i] + min
                        }
                        else if (edge.direction === 'Reverse') {
                            newFlow[i] = this.state.flow[i] - min
                        }
                    }
                })
            })
            this.setState({
                flow: newFlow,
                next: 'paint',
                started: true
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

    getCycleArray(cycle) {
        var array = []

        this.state.graph.edges.forEach(element => {
            var ed = {}
            ed.from = element.from
            ed.to = element.to
            ed.minFlow = element.minFlow
            ed.maxFlow = element.maxFlow
            ed.label = element.label
            ed.dashes = element.dashes
            ed.width = element.width
            if(cycle.includes(element.label)){
                ed.color = { color: 'blue' }
            }else{
                ed.color = element.color
            }
            array.push(ed)
        })

        return array
    
    }



    render() {
        return (
            <div class="container">
                <div class="content">

                    <div class="graph">
                        <div class="App-header">
                            <table class="no-shadow-table">
                                <tr>
                                    <th style={{padding: '10px'}} bgcolor='#81d4fa'>
                                        Current State:
                                    </th>
                                    <th style={{padding: '10px'}} bgcolor={this.state.started ?  'white' : '#bef67a'}>
                                        Init
                                    </th>
                                    <th style={{padding: '10px'}} bgcolor={!this.state.finished && this.state.next == 'getCycle' ? '#bef67a' : 'white'}>
                                        Paint
                                    </th>
                                    <th style={{padding: '10px'}} bgcolor={this.state.started && !this.state.finished && this.state.next == 'updateFlow' ? '#bef67a' : 'white'}>
                                        Get Cycle
                                    </th>
                                    <th style={{padding: '10px'}} bgcolor={this.state.started && !this.state.finished && this.state.next == 'paint' ? '#bef67a' : 'white'}>
                                        Update Flow
                                    </th>
                                    <th style={{padding: '10px'}} bgcolor={this.state.finished ? '#bef67a' : 'white'}>
                                        Finished
                                    </th>
                                </tr>
                            </table>
                        </div>
                        <Graph graph={this.state.graph} options={this.state.options} events={this.state.events} />
                    </div>
                    <div class="details">


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
                            </table>}
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
