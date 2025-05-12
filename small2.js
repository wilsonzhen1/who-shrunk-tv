import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const margin = { top: 30, right: 30, bottom: 35, left: 45 };
const width = 260;
const height = 200;

const networks = ["ABC", "CBS", "HBO", "NBC", "Netflix", "Showtime"];
const multColors = {
  ABC: "#FF0000", CBS: "#FF8C00", HBO: "#1E3A8A",
  NBC: "#0084B4", Netflix: "#E50914", Showtime: "#9B1B30"
};

// Add tooltip div
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "mult-tooltip")
  .style("position", "absolute")
  .style("pointer-events", "none")
  .style("background", "#fff")
  .style("padding", "6px 8px")
  .style("border", "1px solid #ccc")
  .style("border-radius", "4px")
  .style("font-size", "12px")
  .style("box-shadow", "0 2px 6px rgba(0,0,0,0.15)")
  .style("display", "none");

// Load both datasets
Promise.all([
  d3.csv("avg_runtime.csv", d3.autoType),
  d3.csv("median_episode_count.csv", d3.autoType)
]).then(([runtimeData, episodeData]) => {
  renderCharts(runtimeData, "#multSmallMultiplesChart", "runtime", "Average Runtime (Minutes)");
  renderCharts(episodeData, "#multSmallMultiplesChart", "episodes", "Median Episode Count");
  setupScrollama(runtimeData, episodeData);
});

function renderCharts(data, containerId, mode, label) {
  const container = d3.select(containerId)
    .append("div")
    .attr("id", `${mode}-container`)
    .style("display", mode === "runtime" ? "grid" : "none")
    .style("grid-template-columns", "repeat(3, 1fr)")
    .style("gap", "20px")
    .style("justify-content", "center")
    .style("padding", "20px");

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([
      d3.min(data, d => d3.min(networks, n => d[n])) - 1,
      d3.max(data, d => d3.max(networks, n => d[n])) + 1
    ])
    .range([height - margin.bottom, margin.top]);

  const xAxis = d3.axisBottom(x).ticks(5).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(y).ticks(4);

  networks.forEach(net => {
    const div = container.append("div").attr("class", `mult-chart chart-${mode} chart-${net}`);
    const svg = div.append("svg").attr("width", width).attr("height", height);
    const line = d3.line().x(d => x(d.year)).y(d => y(d[net]));

    // Draw line
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", multColors[net])
      .attr("stroke-width", 2)
      .attr("d", line);

    // Dots
    svg.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d[net]))
      .attr("r", 3)
      .attr("fill", multColors[net])
      .on("mouseover", (event, d) => {
        tooltip.style("display", "block")
          .html(`<strong>${net}</strong><br>${label}: ${d[net].toFixed(1)}<br>Year: ${d.year}`);
      })
      .on("mousemove", event => {
        tooltip.style("left", `${event.pageX + 10}px`)
               .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .attr("font-size", "9px");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .attr("font-size", "9px");

    // Network label
    svg.append("text")
      .attr("x", margin.left)
      .attr("y", margin.top - 10)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text(net);

    // Y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 12)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#444")
      .text(label);

    // X-axis label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#444")
      .text("Year");
  });
}

function setupScrollama(runtimeData, episodeData) {
  const scroller = scrollama();

  const getChangeType = (data, type) => {
    const start = data[0], end = data[data.length - 1];
    return networks.filter(net => (end[net] - start[net]) * (type === "increase" ? 1 : -1) >= 0);
  };

  scroller.setup({
    step: ".mult-step",
    offset: 0.5
  }).onStepEnter(({ element }) => {
    const step = element.dataset.step;
    const runtimeCharts = d3.selectAll(".chart-runtime");
    const episodeCharts = d3.selectAll(".chart-episodes");

    // Toggle visibility
    d3.select("#runtime-container").style("display", step.includes("episode") ? "none" : "grid");
    d3.select("#episodes-container").style("display", step.includes("episode") ? "grid" : "none");

    if (step === "all" || step === "all-episodes") {
      runtimeCharts.style("opacity", 1);
      episodeCharts.style("opacity", 1);
    }
    
     else {
      const isEpisode = step.includes("episode");
      const target = isEpisode ? episodeData : runtimeData;
      const changeType = step.includes("increase") ? "increase" : "decrease";
      const relevantNets = getChangeType(target, changeType);
      d3.selectAll(`.chart-${isEpisode ? "episodes" : "runtime"}`)
        .style("opacity", function () {
          const net = this.classList.value.match(/chart-(ABC|CBS|HBO|NBC|Netflix|Showtime)/)[1];
          return relevantNets.includes(net) ? 1 : 0.1;
        });
    }
  });
}
