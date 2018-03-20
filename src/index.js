import * as d3 from 'd3';

console.log("working");

const square = d3.selectAll("rect");
square.style("fill", "orange");

var margin = {top: 20, right: 20, bottom: 30, left: 40},
width = 640 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;


var svg = d3.select("#chart").append("svg")
.attr("height", height + margin.left + margin.right)
.attr("width", width + margin.top + margin.bottom);

var chart = svg.append("g")
.attr("transform",
"translate(" + margin.left + "," + margin.top + ")"
);

var xScale = d3.scaleLinear()
.range([0,width]);
var yScale = d3.scaleLinear()
.range([height,0]);

var minDist = d3.min(hubble_data, function(nebulae) {
    return nebulae.distance - nebulae.distance_error;
    });