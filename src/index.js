import * as d3 from "d3";
import Chance from "chance";
import {
  NodeType,
  getRandomObservations,
  getFields,
  genObservations,
  touchFields,
  appendData
} from "./helper";

const chance = new Chance();

const NUM_OF_OBSERVATIONS = 100;

const DURATION = 1000;
const AUTO_APPEND_INTERVAL = 1000;

const width = 1000;
const height = 600;
const padding = 50;

/**********************
 ***** page set up ****
 **********************/
let svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .on("mousemove", function(d, i) {
    d3.select("#position").text("Position :" + d3.event.x + ", " + d3.event.y);
  });

// making yScale a constant
let yScale = d3
  .scaleLinear()
  .domain([-1, 30])
  .range([height - padding, padding]);

drawBands(svg);

let controls = d3
  .select("body")
  .append("div")
  .attr("id", "controls");

controls
  .append("button")
  .attr("mode", "manual")
  .attr("id", "playMode")
  .html("Auto Mode")
  .on("click", function(evt) {
    switchMode();
  });

controls
  .append("button")
  .html("Add new observations")
  .attr("id", "append_btn")
  .on("click", function(evt) {
    plot.call(svg, appendData(svg.observations, svg.fields, 10, 0.7, true));
  });

svg
  .append("text")
  .attr("id", "position")
  .attr("x", 5)
  .attr("y", height - 5)
  .text("Position: ?, ?");

// placeholders for static elements
svg.append("g").classed("x axis", true);
svg.append("g").attr("id", "edges");
svg.append("g").attr("id", "obsNodes");
svg.append("g").attr("id", "fieldNodes");

plot.call(svg, appendData([], [], NUM_OF_OBSERVATIONS, 1, 0.5, true));

if (d3.select("#playMode").attr("mode") === "auto") {
  autoAppend();
}

/**
 * recursive function that appends new data in a fix time interval
 */
function autoAppend() {
  plot.call(
    svg,
    appendData(svg.observations, svg.fields, NUM_OF_OBSERVATIONS, 0.5, true)
  );
  setTimeout(function() {
    if (d3.select("#playMode").attr("mode") === "auto") {
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

  // dragging functions for the nodes
  function dragstarted(d) {
    d3
      .select(this)
      .raise()
      .classed("active", true);
  }

  function dragged(d) {
    d3.select(this).attr("transform", d => {
      if (d.x === undefined) {
        return (
          "translate(" +
          (d3.event.x - xTimeScale(d.t)) +
          ", " +
          (d3.event.y - yScale(d.cy)) +
          ")"
        );
      } else {
        return (
          "translate(" + (d3.event.x - d.x) + ", " + (d3.event.y - d.y) + ")"
        );
      }
    });

    d3
      .selectAll("#edges line")
      .filter(lineData => {
        return d.uuid === lineData.fieldNodeUuid;
      })
      .attr("x2", d3.event.x)
      .attr("y2", d3.event.y);

    d3
      .selectAll("#edges line")
      .filter(lineData => {
        return d.uuid === lineData.obsNodeUuid;
      })
      .attr("x1", d3.event.x)
      .attr("y1", d3.event.y);
  }

  function dragended(d) {
    d3.select(this).classed("active", false);
  }

  function appendFieldsAndRestore(d) {
    // if obsNode is drop in a certain location
    // we want to pull in the fields into the investigate workspace
    // this can probably can be done via the contextmenu, but I think
    // making it drag and drop is way cooler.
    // throw in something into the workspace, and start investigating

    // when the mouse is released, we need to append the fields that are in the
    // observation that are not yet in the fields array
    // once it is in the fields array, and we make the plot again, everything should
    // just work, ,but we need to fix the location of the fields to be around the point where
    // the mouse is released.

    // oh wait, they are already parts of the fields array, but were not
    // put into the edges array because it doesn't have enough count

    // in this case, we will just mark the field as custom, so that
    // d3 will respect the positions when it is plotted.

    svg.fields = touchFields(
      svg.fields,
      svg.observations.filter(observation => observation.uuid === d.uuid)[0],
      d3.event.x,
      d3.event.y
    );

    d3
      .select(this)
      .classed("active", false)
      .attr("transform", null);

    d3
      .selectAll("#edges line")
      .filter(lineData => {
        return d.uuid === lineData.obsNodeUuid;
      })
      .attr("x1", xTimeScale(d.t))
      .attr("y1", yScale(d.cy));

    plot.call(svg, appendData(svg.observations, svg.fields, 0, 0.5, true));
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

  // this.select(".y.axis")
  //   .attr("transform", "translate(" + (padding - 5) + ", 0 )")
  //   .call(d3.axisLeft(yScale).ticks(10));

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
    .classed(NodeType.IP, d => d.type === NodeType.IP)
    .on("mouseover", d => {
      d3
        .select("#edges")
        .selectAll("line")
        .classed("show", lineData => lineData.obsNodeUuid === d.uuid);
    })
    .on("mouseout", d => {
      d3
        .select("#edges")
        .selectAll("line.show")
        .classed("show", lineData => lineData.obsNodeUuid !== d.uuid);
    });

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
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", appendFieldsAndRestore)
    )
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
    .data(params.obsNodes, d => d.uuid)
    .exit()
    .remove();

  /*************************
   ****** Field Nodes  *****
   *************************/
  // enter()

  let fieldNodeGroups = this.select("#fieldNodes")
    .selectAll(".node")
    .data(params.fieldNodes, d => d.uuid)
    .enter()
    .append("g")
    .classed("node", true)
    .classed(NodeType.IP, d => d.type === NodeType.IP)
    .on("mouseover", d => {
      d3
        .select("#edges")
        .selectAll("line")
        .classed("show", lineData => lineData.fieldNodeUuid === d.uuid);
    })
    .on("mouseout", d => {
      d3
        .select("#edges")
        .selectAll("line.show")
        .classed("show", lineData => lineData.fieldNodeUuid !== d.uuid);
    });

  fieldNodeGroups
    .append("circle")
    .attr("cy", d => {
      return height;
    })
    .attr("cx", d => {
      return width;
    })
    .transition() // transition to bubble up from the observation nodes
    .duration(DURATION);
  fieldNodeGroups
    .append("text")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "hanging")
    .attr("dy", 12);

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
    .attr("cx", d => {
      if (d.t) {
        return xTimeScale(d.t);
      } else {
        return d.x;
      }
    })
    .attr("cy", d => {
      if (d.y) {
        return d.y;
      } else {
        return yScale(d.cy);
      }
    })
    .attr("r", d => d.r)
    .attr("fill", "green");

  this.selectAll("#fieldNodes > .node")
    .select("text")
    .text(d => d.label)
    .attr("x", d => {
      if (d.t) {
        return xTimeScale(d.t);
      } else {
        return d.x;
      }
    })
    .attr("y", d => {
      if (d.y) {
        return d.y;
      } else {
        return yScale(d.cy);
      }
    })
    .transition()
    .duration(DURATION)
    .attr("x", d => {
      if (d.t) {
        return xTimeScale(d.t);
      } else {
        return d.x;
      }
    })
    .attr("y", d => {
      if (d.y) {
        return d.y;
      } else {
        return yScale(d.cy);
      }
    });

  // this.selectAll("#fieldNodes > .node")
  //   .append("title")
  //   .text(d => d.label);

  // exit()

  this.selectAll("#fieldNodes > .node")
    .data(params.fieldNodes, d => d.uuid)
    .exit()
    .remove();

  /*******************
   ****** Edges  *****
   *******************/

  this.select("#edges")
    .selectAll(".edge")
    .data(params.edges, d => d.uuid)
    .enter()
    .append("line")
    .classed("edge", true)
    .attr("x2", width - padding)
    .attr("y2", height / 2)
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
    });
  // .transition()
  // .duration(DURATION);

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
      return xTimeScale(
        params.fieldNodes.filter(
          nodeData => nodeData.uuid === d.fieldNodeUuid
        )[0].t
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
    .data(params.edges, d => d.uuid)
    .exit()
    .remove();

  // tuck the observations data somwhere

  svg.observations = params.observations;
  svg.fields = params.fields;
}

function drawBands(svg) {
  svg.append("g").attr("id", "severity_bands");

  svg
    .select("#severity_bands")
    .append("rect")
    .attr("x", 0)
    .attr("y", yScale(3.5))
    .attr("width", width)
    .attr("height", yScale(-0.25) - yScale(3.5))
    .classed("severity severity-low", true);

  svg
    .select("#severity_bands")
    .append("rect")
    .attr("x", 0)
    .attr("y", yScale(5.5))
    .attr("width", width)
    .attr("height", yScale(3.5) - yScale(5.5))
    .classed("severity severity-medium", true);

  svg
    .select("#severity_bands")
    .append("rect")
    .attr("x", 0)
    .attr("y", yScale(7.5))
    .attr("width", width)
    .attr("height", yScale(5.5) - yScale(7.5))
    .classed("severity severity-high", true);

  svg
    .select("#severity_bands")
    .append("rect")
    .attr("x", 0)
    .attr("y", yScale(10.25))
    .attr("width", width)
    .attr("height", yScale(7.5) - yScale(10.25))
    .classed("severity severity-critical", true);

  svg
    .select("#severity_bands")
    .append("line")
    .attr("x1", 0)
    .attr("y1", yScale(10.25))
    .attr("y2", yScale(10.25))
    .attr("x2", width)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2);
}

/**
 * call back to switch between auto and manual mode in appending data
 */
function switchMode() {
  if (d3.select("#playMode").attr("mode") === "auto") {
    d3
      .select("#playMode")
      .attr("mode", "manual")
      .html("Manual Mode");
    d3.select("#append_btn").attr("disabled", null);
  } else {
    d3
      .select("#playMode")
      .attr("mode", "auto")
      .html("Auto Mode");
    d3.select("#append_btn").attr("disabled", true);
    autoAppend();
  }
}
