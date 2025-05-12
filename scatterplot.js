import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const width = window.innerWidth;
const height = 550;
const margin = { top: 10, right: 20, bottom: 50, left: 50 };

const networkColors = {
  'HBO': '#1E3A8A', 'ABC': '#FF0000', 'NBC': '#0084B4', 'CBS': '#FF8C00',
  'FOX': '#00A1E4', 'Showtime': '#9B1B30', 'FX': '#DC3545', 'AMC': '#00B140',
  'PBS': '#4F4A33', 'Netflix': '#E50914', 'Amazon': '#FF9900', 'USA Network': '#006F91',
  'Hulu': '#1CE783', 'BBC America': '#BBC0C0', 'Pop TV': '#FC71A1', 'Disney+': '#003F87',
  'HBO Max': '#F56C6C', 'Apple TV+': '#A1B3B4'
};

const awardColors = { 'Drama': '#7B3F74', 'Comedy': '#FF5F1F' };
const opacities = { "Yes": 1, "No": 0.25 };
const winnerObj = { "Yes": "Best ", "No": "Nominee for " };

let data = [];
let svg, tooltip, img, caption, num;

function getColor(d, colorBy) {
  return colorBy === "Award type" ? awardColors[d.type] : networkColors[d.network];
}

function jitterPoints(data, radius = 5) {
  const groups = {};
  data.forEach((d, i) => {
    const key = `${d.year}_${d.episodes}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push({ ...d, originalIndex: i });
  });

  const jittered = [...data];
  Object.values(groups).forEach(group => {
    group.forEach((d, i) => {
      const angle = (2 * Math.PI * i) / group.length;
      jittered[d.originalIndex].xJitter = Math.cos(angle) * radius;
      jittered[d.originalIndex].yJitter = Math.sin(angle) * radius;
    });
  });
  return jittered;
}

function setupControls(data) {
    const controls = d3.select("#scatterplot-controls").html("");
  
    const toggleWrap = controls.append("div")
      .style("display", "flex")
      .style("align-items", "center")
      // .style("margin-bottom", "12px");
  
    toggleWrap.append("input")
      .attr("type", "checkbox")
      .attr("id", "winnerFilter")
      .style("margin-right", "8px")
      .on("change", updateChart);
  
    toggleWrap.append("label")
      .attr("for", "winnerFilter")
      .text("Exclude nominees");
  
    controls.append("br");
  
    controls.append("label").text("Color by ");
    const colorSelect = controls.append("select")
      .attr("id", "colorBy")
      .on("change", () => {
        setupTypeFilter(data);
        updateChart();
      });
  
    colorSelect.selectAll("option")
      .data(["Award type", "Network"])
      .enter()
      .append("option")
      .text(d => d);
  
      const awardTypeLabel = controls.append("label")
      .attr("id", "awardTypeLabel")
      .style("display", "block")
      .text("Select award type");
    
    controls.append("div").attr("id", "typeFilter");
    setupTypeFilter(data);
  
    updateChart();
  }  

function setupTypeFilter(data) {
    const colorBy = d3.select("#colorBy").property("value");
    const awardTypeLabel = d3.select("#awardTypeLabel");
    const filterDiv = d3.select("#typeFilter");
    filterDiv.html("");

  if (colorBy === "Network") {
    const networks = Array.from(new Set(data.map(d => d.network))).sort();
    awardTypeLabel.style("display", "none");
    const selectAllWrapper = filterDiv.append("div").style("margin-bottom", "8px");
    selectAllWrapper.append("input")
      .attr("type", "checkbox")
      .attr("id", "selectAllNetworks")
      .property("checked", true)
      .on("change", function () {
        const checked = this.checked;
        d3.selectAll(".network-checkbox").property("checked", checked);
        updateChart();
      });

    selectAllWrapper.append("label")
      .attr("for", "selectAllNetworks")
      .text("All networks");

    networks.forEach(network => {
      const label = filterDiv.append("label").style("margin-right", "10px").style("display", "inline-block");
      label.append("input")
        .attr("type", "checkbox")
        .attr("class", "network-checkbox")
        .style("accent-color", networkColors[network])
        .attr("value", network)
        .property("checked", true)
        .on("change", function () {
          const allChecked = d3.selectAll(".network-checkbox").nodes().every(cb => cb.checked);
          d3.select("#selectAllNetworks").property("checked", allChecked);
          updateChart();
        })
        .on("mouseover", function () {
          d3.selectAll("circle").each(function(e) {
            if ((e.network === network)) {
              d3.select(this).classed("network-hovered", true);
            }
          });
        })
        .on("mouseout", function () {
          d3.selectAll("circle").each(function(e) {
            if (d3.select(this).classed("network-hovered")) {
              d3.select(this).classed("network-hovered", false);
            }
          });
        })
      label.append("span").text(network);
    });
  } else {
    const select = filterDiv.append("select").attr("id", "awardTypeSelect").on("change", updateChart);
    awardTypeLabel.style("display", "block");
    select.selectAll("option")
      .data(["Both", "Drama", "Comedy"])
      .enter()
      .append("option")
      .text(d => d);
  }
}

function updateChart() {
  const colorBy = d3.select("#colorBy").property("value");
  const exclude = document.querySelector("#winnerFilter")?.checked;

  let filtered = data.slice();

  if (exclude) {
    filtered = filtered.filter(d =>
      d.winner?.toLowerCase() === "yes" &&
      (d.type === "Drama" || d.type === "Comedy")
    );
  }
  
  if (colorBy === "Award type") {
    const sel = d3.select("#awardTypeSelect").property("value");
    if (sel !== "Both") {
      filtered = filtered.filter(d => d.type === sel);
    }
  } else {
    const networks = d3.selectAll(".network-checkbox").nodes()
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    filtered = filtered.filter(d => networks.includes(d.network));
  }

  filtered = jitterPoints(filtered);

  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([margin.left, width * 0.7 - margin.right]);
  const y = d3.scaleLinear().domain(d3.extent(data, d => d.episodes)).range([height - margin.bottom, margin.top]);

  svg.selectAll("circle")
    .data(filtered, d => d.name + d.year)
    .join("circle")
    .attr("cx", d => x(d.year) + d.xJitter)
    .attr("cy", d => y(d.episodes) + d.yJitter)
    .attr("r", 6)
    .attr("fill", d => getColor(d, colorBy))
    .attr("fill-opacity", d => opacities[d.winner])
    .on("mouseover", function(event, d) {
        svg.selectAll("circle")
          .classed("hovered", e => e.name === d.name);
      
        d3.select(this).raise(); // bring current circle to front
      
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
          .style("opacity", 1)
          .html(`<b>${d.name}</b><br>Season ${d.season_number} (${d.year})<br>${d.episodes} episodes`);
      })
      .on("mouseout", function(event, d) {
        svg.selectAll("circle").classed("hovered", false);
        tooltip.style("opacity", 0);
      })
    .on("click", (event, d) => {
      d3.selectAll("circle")
        .classed("clicked", e => e.name === d.name)
        .attr("stroke", e => e.name === d.name ? "black" : null)
        .attr("stroke-width", e => e.name === d.name ? 2 : null);

      img.style.display = "block";
      img.src = d.poster_path;
      caption.textContent = `${winnerObj[d.winner]}${d.type}, ${d.year}`;
      num.textContent = `${d.episodes} episodes`;
    });

  d3.select("body").on("click", (e) => {
    if (!e.target.closest("circle")) {
      d3.selectAll("circle").classed("clicked", false).attr("stroke", null).attr("stroke-width", null);
      img.src = "";
      img.style.display = "none";
      caption.textContent = "Click a circle";
      num.textContent = "";
    }
  });
}

function initializeChart() {
  const chart = d3.select("#scatterplot-chart").html("");
  const wrapper = chart.append("div").style("display", "flex");

  svg = d3.create("svg").attr("width", width * 0.7).attr("height", height).style("font", "10px sans-serif");
  const g = svg.append("g");

  const x = d3.scaleLinear().domain([2000, 2025]).range([margin.left, width * 0.7 - margin.right]);
  const y = d3.scaleLinear().domain([0, 25]).range([height - margin.bottom, margin.top]);

  g.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
  g.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

  // X Axis Label
svg.append("text")
.attr("x", (width * 0.7) / 2)
.attr("y", height - 10)
.attr("text-anchor", "middle")
.style("font-size", "16px")
.style("fill", "#000")
.text("Award year");

// Y Axis Label
svg.append("text")
.attr("transform", "rotate(-90)")
.attr("x", -(height / 2))
.attr("y", 15) // distance from left
.attr("text-anchor", "middle")
.style("font-size", "16px")
.style("fill", "#000")
.text("Number of episodes");

  tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "white")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("font-size", "14px")
    .style("opacity", 0);

  const panel = d3.select("#scatterplot-chart").append("div").style("margin-left", "20px").style("width", `${width * 0.3}px`).style("text-align", "center");
  img = panel.append("img").style("max-width", "100%").style("display", "none").node();
  caption = panel.append("div").style("font-weight", "bold").style("margin-top", "10px").text("Click a circle").node();
  num = panel.append("div").style("color", "#333").style("font-size", "16px").node();

  wrapper.node().appendChild(svg.node());
}

d3.json("emmy_winners.json").then(json => {
  data = json;
  initializeChart();
  setupControls(data);
  updateChart();
});
