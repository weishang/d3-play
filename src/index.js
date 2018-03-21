import * as d3 from "d3";

console.log("working");

// const square = d3.selectAll("rect");
// square.style("fill", "orange");

console.log(d3.version);

const height = 500;
const width = 800;

let svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const data = [
  {
    cx: 100,
    cy: 100,
    r: 10,
    id: 1,
    text: "127.0.1.0"
  },
  {
    cx: 200,
    cy: 300,
    r: 20,
    id: 2,
    text: "root"
  },
  {
    cx: 400,
    cy: 200,
    r: 5,
    id: 3,
    text: "d131dd02c5e6eec4 "
  }
];

const lineData = [
  {
    nodeId1: 1,
    nodeId2: 2
  },
  {
    nodeId1: 1,
    nodeId2: 3
  }
];

svg
  .selectAll("line")
  .data(lineData)
  .enter()
  .append("line")
  .attr("x1", d => {
    console.log(data.filter(nodeData => nodeData.id === d.nodeId1));
    return data.filter(nodeData => nodeData.id === d.nodeId1)[0].cx;
  })
  .attr("y1", d => {
    return data.filter(nodeData => nodeData.id === d.nodeId1)[0].cy;
  })
  .attr("x2", d => {
    return data.filter(nodeData => nodeData.id === d.nodeId2)[0].cx;
  })
  .attr("y2", d => {
    return data.filter(nodeData => nodeData.id === d.nodeId2)[0].cy;
  })
  .attr("fill", "none")
  .attr("stroke", "gray")
  .attr("stroke-width", 5);

svg
  .selectAll("circle")
  .data(data)
  .enter()
  .append("circle")
  .attr("cx", d => d.cx)
  .attr("cy", d => d.cy)
  .attr("r", d => d.r)
  .attr("fill", "green")
  .call(
    d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
  );

function dragstarted(d) {
  d3
    .select(this)
    .raise()
    .classed("active", true);
}

function dragged(d) {
  d3
    .select(this)
    .attr("cx", (d.x = d3.event.x))
    .attr("cy", (d.y = d3.event.y));

  d3
    .selectAll("line")
    .filter(lineData => {
      return d.id === lineData.nodeId2;
    })
    .attr("x2", d3.event.x)
    .attr("y2", d3.event.y);

  d3
    .selectAll("line")
    .filter(lineData => {
      return d.id === lineData.nodeId1;
    })
    .attr("x1", d3.event.x)
    .attr("y1", d3.event.y);
}

function dragended(d) {
  d3.select(this).classed("active", false);
}
