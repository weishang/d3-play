import * as d3 from "d3";

const NUM_OF_NODES = 50;
const NUM_OF_EDGES = 50;

const width = 800;
const height = 800;
const padding = 50;

let svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .on("mousemove", function(d, i) {
    d3.select("#position").text("Position :" + d3.event.x + ", " + d3.event.y);
  });
// add textbox to show mouse position

let controls = d3
  .select("body")
  .append("div")
  .attr("id", "controls");

let gen_btn = controls
  .append("button")
  .html("Generate")
  .on("click", function(d, i) {
    plot.call(svg, generateData(NUM_OF_NODES, NUM_OF_EDGES));
  });

svg
  .append("text")
  .attr("id", "position")
  .attr("x", 5)
  .attr("y", height - 5)
  .text("Position: ?, ?");

svg.append("g").classed("x axis", true);
svg.append("g").classed("y axis", true);

svg.append("g").attr("id", "edges");
svg.append("g").attr("id", "nodes");

function generateData(numOfNodes, numOfEdges) {
  let params = {};

  const nodes = [];
  for (var i = 0; i < numOfNodes; i++) {
    nodes.push({
      cx: Math.round(Math.random() * 400),
      cy: Math.round(Math.random() * 250),
      r: Math.ceil(Math.random() * 10),
      id: i
    });
  }

  const edges = [];
  for (var i = 0; i < numOfEdges; i++) {
    edges.push({
      nodeId1: Math.floor(Math.random() * NUM_OF_NODES),
      nodeId2: Math.floor(Math.random() * NUM_OF_NODES),
      id: i
    });
  }

  params.nodes = nodes;
  params.edges = edges;

  return params;
}

function plot(params) {
  // create x and y scale function
  let xScale = d3
    .scaleLinear()
    .domain(d3.extent(params.nodes, d => d.cx))
    .range([padding, width - padding]);
  let yScale = d3
    .scaleLinear()
    .domain(d3.extent(params.nodes, d => d.cy))
    .range([padding, height - padding]);

  // dragging functions
  function dragstarted(d) {
    d3
      .select(this)
      .raise()
      .classed("active", true);
  }

  function dragged(d) {
    d3
      .select(this)
      .attr(
        "transform",
        "translate(" +
          (d3.event.x - xScale(d.cx)) +
          ", " +
          (d3.event.y - yScale(d.cy)) +
          ")"
      );

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

  // create x and y axis
  // enter()

  // update()
  this.select(".x.axis")
    .attr("transform", "translate(0," + (height - padding + 5) + ")")
    .call(d3.axisBottom(xScale));

  this.select(".y.axis")
    .attr("transform", "translate(" + (padding - 5) + ", 0 )")
    .call(d3.axisLeft(yScale));

  // exit()

  // enter()

  let nodeGroups = this.select("#nodes")
    .selectAll(".node")
    .data(params.nodes)
    .enter()
    .append("g")
    .classed("node", true);

  nodeGroups.append("circle");
  nodeGroups.append("text");

  this.select("#edges")
    .selectAll(".edge")
    .data(params.edges)
    .enter()
    .append("line")
    .classed("edge", true);

  // update()

  // let nodeGroups = this.selectAll(".node");
  // add circle to the node
  this.selectAll(".node")
    .call(
      // attach drag to the group that contains circle and text
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    )
    .attr("transform", null)
    .select("circle")
    .attr("cx", d => xScale(d.cx))
    .attr("cy", d => yScale(d.cy))
    .attr("r", d => d.r)
    .attr("fill", "green");

  // add text to the group
  this.selectAll(".node")
    .select("text")
    .text("test")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "hanging")
    .classed("label", true)
    .attr("x", d => xScale(d.cx))
    .attr("y", d => yScale(d.cy + d.r / 3));

  this.selectAll(".edge")
    .attr("x1", d => {
      return xScale(
        params.nodes.filter(nodeData => nodeData.id === d.nodeId1)[0].cx
      );
    })
    .attr("y1", d => {
      return yScale(
        params.nodes.filter(nodeData => nodeData.id === d.nodeId1)[0].cy
      );
    })
    .attr("x2", d => {
      return xScale(
        params.nodes.filter(nodeData => nodeData.id === d.nodeId2)[0].cx
      );
    })
    .attr("y2", d => {
      return yScale(
        params.nodes.filter(nodeData => nodeData.id === d.nodeId2)[0].cy
      );
    });

  // exit()
  this.selectAll(".node")
    .data(params.nodes)
    .exit()
    .remove();
  this.selectAll(".edge")
    .data(params.edges)
    .exit()
    .remove();

  // let nodeGroups = this.append("g")
  //   .attr("id", "nodes")
  //   .selectAll("node")
  //   .data(params.nodes)
  //   .enter()
  //   .append("g")
  //   .classed("node", true)
  //   .call(
  //     // attach drag to the group that contains circle and text
  //     d3
  //       .drag()
  //       .on("start", dragstarted)
  //       .on("drag", dragged)
  //       .on("end", dragended)
  //   );
}
plot.call(svg, generateData(NUM_OF_NODES, NUM_OF_EDGES));
