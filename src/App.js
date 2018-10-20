import React, { Component } from 'react';
import './App.css';
import MyLayout from './MyLayout';


const graph = {
    nodes: [
        { id: 1, label: 'A', color: 'green' },
        { id: 2, label: 'B', color: 'red' },
        { id: 3, label: 'C' },
        { id: 4, label: 'D' },
        { id: 5, label: 'E' }
    ],
    edges: [
        { from: 1, to: 3, minFlow: 5, maxFlow: 15, color: { color: 'black' }, label: 'a1', dashes: false, width: 2},
        { from: 1, to: 4, minFlow: 1, maxFlow: 7, color: { color: 'black' }, label: 'a2', dashes: false, width: 2},
        { from: 1, to: 5, minFlow: 2, maxFlow: 6, color: { color: 'black' }, label: 'a3', dashes: false, width: 2},
        { from: 3, to: 4, minFlow: 0, maxFlow: 3, color: { color: 'black' }, label: 'a4', dashes: false, width: 2},
        { from: 4, to: 5, minFlow: 1, maxFlow: 4, color: { color: 'black' }, label: 'a5', dashes: false, width: 2},
        { from: 3, to: 2, minFlow: 2, maxFlow: 5, color: { color: 'black' }, label: 'a6', dashes: false, width: 2},
        { from: 4, to: 2, minFlow: 3, maxFlow: 8, color: { color: 'black' }, label: 'a7', dashes: false, width: 2},
        { from: 5, to: 2, minFlow: 2, maxFlow: 7, color: { color: 'black' }, label: 'a8', dashes: false, width: 2},
        { from: 2, to: 1, minFlow: 7, maxFlow: 20, color: { color: 'black' }, label: 'a0', dashes: true, width: 2},



        
    ]
};

const options = {
    layout: {
        hierarchical: false
    },
    edges: {
        color: "#000000"
    }
};


const events = {
    select: function (event) {
        var { nodes, edges } = event;
    }
}




class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
          text: 'Holi caracoli'
        };        
    }
    flow = [1, 2, 3, 4, 5, 6, 7]
    width = 100 / this.flow.length
    render() {
        return (
            <MyLayout graph={graph} flow={this.flow} options={options} events={events}/>
        );
    }
}

export default App;
