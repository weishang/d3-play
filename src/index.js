import * as d3 from "d3";

import {
  NodeType,
  getRandomObservations,
  getFields,
  genObservations
} from "./helper";

const NUM_OF_OBSERVATIONS = 10;

const width = 1000;
const height = 600;
const padding = 50;

const DURATION = 1000;
const AUTO_APPEND_INTERVAL = 1000;

// add textbox to show mouse position
let svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .on("mousemove", function(d, i) {
    d3.select("#position").text("Position :" + d3.event.x + ", " + d3.event.y);
  });


let controls = d3
  .select("body")
  .append("div")
  .attr("id", "controls");

controls
  .append("button")
  .html("Generate")
  .on("click", function() {
    plot.call(svg, generateData(NUM_OF_OBSERVATIONS, 1, true));
  });

  controls
  .append("button")
  .attr('mode', 'auto')
  .attr('id', 'playMode')
  .html("Auto Mode")
  .on("click", function(evt) {
    switchMode();
  });

controls
  .append("button")
  .html("Add new observations")
  .attr('id', 'append_btn')
  .on("click", function(evt) {
    plot.call(svg, appendData(svg.observations, 10, 1, true));
  });

svg
  .append("text")
  .attr("id", "position")
  .attr("x", 5)
  .attr("y", height - 5)
  .text("Position: ?, ?");

// placeholders for static elements
svg.append("g").classed("x axis", true);
svg.append("g").classed("y axis", true);
svg.append("g").attr("id", "edges");
svg.append("g").attr("id", "obsNodes");
svg.append("g").attr("id", "fieldNodes");

plot.call(svg, generateData(NUM_OF_OBSERVATIONS, 0.5, true));

if ( d3.select('#playMode').attr('mode') === 'auto') {
  autoAppend();
}

/**
 * appending new observation
 */
function appendData(existingObservations, numOfObs, p, tryToBeBad) {
  let params = {};
  const observations = genObservations(
    2,
    { p: p, tryToBeBad: tryToBeBad },
    existingObservations
  );
  const obsNodes = [];
  const fieldNodes = [];
  const edges = []; // connects fields to their linked observation nodes

  // get the fields structure from all observations
  // this should contain all the identity fields from all observations

  const fields = getFields({}, observations);

  // for each unique field, create a field node
  let i = 0;
  for (var fieldKey in fields) {
    fieldNodes.push({
      type: "FIELD",
      i: i,
      t: fields[fieldKey].firstObservedDate,
      cy: 20 + fields[fieldKey].angle,
      r: 4,
      label: fieldKey,
      uuid: fields[fieldKey].uuid
    });
    i++;
  }

  // for each observation, creat an observation node
  observations.forEach(observation => {
    obsNodes.push({
      type: "OBS",
      t: observation.startDate,
      cy: observation.severity,
      r: Math.sqrt(observation.severity * 20),
      uuid: observation.uuid
    });

    // go through fields in the observation, make the edge
    //         sourceIp
    for (var fieldKey in observation) {
      let fieldNode = fields[observation[fieldKey]];

      if (fieldNode !== undefined) {
        edges.push({
          obsNodeUuid: observation.uuid,
          fieldNodeUuid: fieldNode.uuid
        });
      }
    }
  });

  params.observations = observations;
  params.obsNodes = obsNodes;
  params.fieldNodes = fieldNodes;
  params.edges = edges;

  return params;
}

/**
 * generating data
 */
function generateData(numOfObs, p, tryToBeBad) {
  let params = {};
  const observations = getRandomObservations(numOfObs, p, tryToBeBad);

  const obsNodes = [];
  const fieldNodes = [];
  const edges = []; // connects fields to their linked observation nodes

  // get the fields structure from all observations
  // this should contain all the identity fields from all observations
  const fields = getFields({}, observations);

  // for each unique field, create a field node
  let i = 0;
  for (var fieldKey in fields) {
    fieldNodes.push({
      type: "FIELD",
      i: i,
      t: fields[fieldKey].firstObservedDate,
      cy: 20 + fields[fieldKey].angle,
      r: 4,
      label: fieldKey,
      uuid: fields[fieldKey].uuid
    });
    i++;
  }

  // for each observation, creat an observation node
  observations.forEach(observation => {
    obsNodes.push({
      type: "OBS",
      t: observation.startDate,
      cy: observation.severity,
      r: Math.sqrt(observation.severity * 20),
      uuid: observation.uuid
    });

    // go through fields in the observation, make the edge
    //         sourceIp
    for (var fieldKey in observation) {
      let fieldNode = fields[observation[fieldKey]];

      if (fieldNode !== undefined) {
        edges.push({
          obsNodeUuid: observation.uuid,
          fieldNodeUuid: fieldNode.uuid
        });
      }
    }
  });

  params.observations = observations;
  params.obsNodes = obsNodes;
  params.fieldNodes = fieldNodes;
  params.edges = edges;

  return params;
}


/**
 * call back to switch between auto and manual mode in appending data
 */
function switchMode() {
  if (d3.select('#playMode').attr('mode') === 'auto') {
    d3.select('#playMode').attr('mode', 'manual').html('Manual Mode');
    d3.select('#append_btn').attr('disabled', null)
  } else {
    d3.select('#playMode').attr('mode', 'auto').html('Auto Mode');
    d3.select('#append_btn').attr('disabled', true);
    autoAppend();
  }
}

/**
 * recursive function that appends new data in a fix time interval 
 */
function autoAppend() {
  plot.call(svg, appendData(svg.observations, 10, 1, true));
  setTimeout(function() {
    if (d3.select('#playMode').attr('mode') === 'auto') {
      autoAppend();
    }
  }, AUTO_APPEND_INTERVAL);
}


/**
 * plot the d3 graph using params 
 */
function plot(params) {
  // create x and y scale function
  let xScale = d3
    .scaleLinear()
    .domain(d3.extent(params.fieldNodes, d => d.i))
    .range([padding, width - padding]);

  let xTimeScale = d3
    .scaleTime()
    .domain(d3.extent(params.obsNodes, d => d.t))
    .range([padding, width - padding]);

  let yScale = d3
    .scaleLinear()
    // .domain(d3.extent(params.obsNodes, d => d.cy))
    .domain([-1, 30])

    .range([height - padding, padding]);

  // dragging functions for the nodes
  function dragstarted(d) {
    d3
      .select(this)
      .raise()
      .classed("active", true);
  }

  function dragged(d) {
    d3.select(this).attr("transform", d => {
      return (
        "translate(" +
        (d3.event.x - (d.type === "OBS" ? xTimeScale(d.t) : xScale(d.i))) +
        ", " +
        (d3.event.y - yScale(d.cy)) +
        ")"
      );
    });

    d3
      .selectAll("line")
      .filter(lineData => {
        return d.uuid === lineData.fieldNodeUuid;
      })
      .attr("x2", d3.event.x)
      .attr("y2", d3.event.y);

    d3
      .selectAll("line")
      .filter(lineData => {
        return d.uuid === lineData.obsNodeUuid;
      })
      .attr("x1", d3.event.x)
      .attr("y1", d3.event.y);
  }

  function dragended(d) {
    d3.select(this).classed("active", false);
  }

  /*************************
   ****** X AND Y axis *****
   *************************/
  // enter()
  this.select(".x.axis")
    .attr("transform", "translate(0," + (height - padding + 20) + ")")
    .transition()
    .call(
      d3
        .axisBottom(xTimeScale)
        .ticks(5)
        .tickFormat(d3.timeFormat("%Y-%m-%d"))
    )
    .attr("transform", "translate(0," + (height - padding + 4) + ")");

  // update()
  this.select(".x.axis")
    .attr("transform", "translate(0," + (height - padding + 4) + ")")
    .transition()
    .duration(DURATION)
    .attr("transform", "translate(0," + (height - padding + 4) + ")");

  this.select(".y.axis")
    .attr("transform", "translate(" + (padding - 5) + ", 0 )")
    .call(d3.axisLeft(yScale).ticks(10));

  // exit()

  /******************************
   ****** Observation Nodes *****
   ******************************/
  // enter()
  let obsNodeGroups = this.select("#obsNodes")
    .selectAll(".node")
    .data(params.obsNodes, d => d.uuid)
    .enter()
    .append("g")
    .classed("node", true)
    .classed(NodeType.IP, d => d.type === NodeType.IP);

  // making transition for new data
  obsNodeGroups
    .append("circle")
    .attr("cx", width)
    .attr("cy", d => yScale(d.cy));
  //.transition();
  obsNodeGroups
    .append("text")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "hanging");

  // update()

  // add circle to the node
  this.selectAll("#obsNodes > .node")
    .on("contextmenu", function(d, i) {
      d3.event.preventDefault();
      // react on right-clicking
      console.log("open context menu");
    })
    .attr("transform", null)
    .select("circle")
    .transition()
    .duration(DURATION)
    .attr("cx", d => xTimeScale(d.t))
    .attr("cy", d => yScale(d.cy))
    .attr("r", d => d.r)
    .attr("fill", "green");

  this.selectAll("#obsNodes > .node")
    .append("title")
    .text(d => JSON.stringify(d));

  // add text to the group
  this.selectAll("#obsNodes > .node")
    .select("text")
    .text(d => {
      switch (d.type) {
        case NodeType.FILE_HASH:
          return "file: " + d.label.substring(0, 8) + "...";
      }
      return d.label;
    })
    .classed("label", true)
    .attr("text-anchor", "middle")
    .classed("hidden", d => d.r < 4)
    // .transition()
    // .duration(DURATION)
    .attr("x", d => xTimeScale(d.t))
    .attr("y", d => yScale(d.cy + d.r / 2));

  // exit()
  this.selectAll("#obsNodes > .node")
    .data(params.obsNodes)
    .exit()
    .remove();

  /*************************
   ****** Field Nodes  *****
   *************************/
  // enter()

  let fieldNodeGroups = this.select("#fieldNodes")
    .selectAll(".node")
    .data(params.fieldNodes)
    .enter()
    .append("g")
    .classed("node", true)
    .classed(NodeType.IP, d => d.type === NodeType.IP);

  fieldNodeGroups.append("circle");
  fieldNodeGroups.append("text");

  // update ()
  this.selectAll("#fieldNodes > .node")
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    )
    .attr("transform", null)
    .select("circle")
    .transition()
    .duration(DURATION)
    .attr("cx", d => xScale(d.i))
    .attr("cy", d => yScale(d.cy))
    .attr("r", d => d.r)
    .attr("fill", "green");

  this.selectAll("#fieldNodes > .node")
    .append("title")
    .text(d => d.label);

  // exit()

  this.selectAll("#fieldNodes > .node")
    .data(params.fieldNodes)
    .exit()
    .remove();

  /*******************
   ****** Edges  *****
   *******************/

  this.select("#edges")
    .selectAll(".edge")
    .data(params.edges)
    .enter()
    .append("line")
    .classed("edge", true);

  // update()

  this.selectAll(".edge")
    .transition()
    .duration(DURATION)
    .attr("x1", d => {
      return xTimeScale(
        params.obsNodes.filter(nodeData => nodeData.uuid === d.obsNodeUuid)[0].t
      );
    })
    .attr("y1", d => {
      return yScale(
        params.obsNodes.filter(nodeData => nodeData.uuid === d.obsNodeUuid)[0]
          .cy
      );
    })
    .attr("x2", d => {
      return xScale(
        params.fieldNodes.filter(
          nodeData => nodeData.uuid === d.fieldNodeUuid
        )[0].i
      );
    })
    .attr("y2", d => {
      return yScale(
        params.fieldNodes.filter(
          nodeData => nodeData.uuid === d.fieldNodeUuid
        )[0].cy
      );
    });

  // exit(), clean up extra nodes and edges

  this.selectAll(".edge")
    .data(params.edges)
    .exit()
    .remove();

  // tuck the observations data somwhere

  svg.observations = params.observations;
}
