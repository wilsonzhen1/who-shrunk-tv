document.addEventListener("DOMContentLoaded", function () {
    // Scrollama setup
    const scroller = scrollama();
  
    scroller
      .setup({
        step: ".step",
        offset: 0.6,
        once: false,
      })
      .onStepEnter((response) => {
        response.element.classList.add("is-active");
      })
      .onStepExit((response) => {
        if (response.index !== 0) {
          response.element.classList.remove("is-active");
        }
      });
  
    // Chart Data
    const showDataByYear = {
      2000: {
        comedy_show_name: "Will & Grace",
        drama_show_name: "The West Wing",
        comedy_season_number: 2,
        drama_season_number: 1,
        comedy_episodes: 24,
        drama_episodes: 22
      },
      2001: {
        comedy_show_name: "Sex and the City",
        drama_show_name: "The West Wing",
        comedy_season_number: 3,
        drama_season_number: 2,
        comedy_episodes: 18,
        drama_episodes: 22
      },
      2002: {
        comedy_show_name: "Friends",
        drama_show_name: "The West Wing",
        comedy_season_number: 8,
        drama_season_number: 3,
        comedy_episodes: 24,
        drama_episodes: 21
      },
      2003: {
        comedy_show_name: "Everybody Loves Raymond",
        drama_show_name: "The West Wing",
        comedy_season_number: 7,
        drama_season_number: 4,
        comedy_episodes: 25,
        drama_episodes: 23
      },
      2004: {
        comedy_show_name: "Arrested Development",
        drama_show_name: "The Sopranos",
        comedy_season_number: 1,
        drama_season_number: 5,
        comedy_episodes: 22,
        drama_episodes: 13
      },
      2005: {
        comedy_show_name: "Everybody Loves Raymond",
        drama_show_name: "Lost",
        comedy_season_number: 9,
        drama_season_number: 1,
        comedy_episodes: 16,
        drama_episodes: 25
      },
      2006: {
        comedy_show_name: "The Office",
        drama_show_name: "24",
        comedy_season_number: 2,
        drama_season_number: 5,
        comedy_episodes: 22,
        drama_episodes: 24
      },
      2007: {
        comedy_show_name: "30 Rock",
        drama_show_name: "The Sopranos",
        comedy_season_number: 1,
        drama_season_number: 6,
        comedy_episodes: 21,
        drama_episodes: 21
      },
      2008: {
        comedy_show_name: "30 Rock",
        drama_show_name: "Mad Men",
        comedy_season_number: 2,
        drama_season_number: 1,
        comedy_episodes: 15,
        drama_episodes: 13
      },
      2009: {
        comedy_show_name: "30 Rock",
        drama_show_name: "Mad Men",
        comedy_season_number: 3,
        drama_season_number: 2,
        comedy_episodes: 22,
        drama_episodes: 13
      },
      2010: {
        comedy_show_name: "Modern Family",
        drama_show_name: "Mad Men",
        comedy_season_number: 1,
        drama_season_number: 3,
        comedy_episodes: 24,
        drama_episodes: 13
      },
      2011: {
        comedy_show_name: "Modern Family",
        drama_show_name: "Mad Men",
        comedy_season_number: 2,
        drama_season_number: 4,
        comedy_episodes: 24,
        drama_episodes: 13
      },
      2012: {
        comedy_show_name: "Modern Family",
        drama_show_name: "Homeland",
        comedy_season_number: 3,
        drama_season_number: 1,
        comedy_episodes: 24,
        drama_episodes: 12
      },
      2013: {
        comedy_show_name: "Modern Family",
        drama_show_name: "Breaking Bad",
        comedy_season_number: 4,
        drama_season_number: 5,
        comedy_episodes: 24,
        drama_episodes: 16
      },
      2014: {
        comedy_show_name: "Modern Family",
        drama_show_name: "Breaking Bad",
        comedy_season_number: 5,
        drama_season_number: 5,
        comedy_episodes: 24,
        drama_episodes: 16
      },
      2015: {
        comedy_show_name: "Veep",
        drama_show_name: "Game of Thrones",
        comedy_season_number: 4,
        drama_season_number: 5,
        comedy_episodes: 10,
        drama_episodes: 10
      },
      2016: {
        comedy_show_name: "Veep",
        drama_show_name: "Game of Thrones",
        comedy_season_number: 5,
        drama_season_number: 6,
        comedy_episodes: 10,
        drama_episodes: 10
      },
      2017: {
        comedy_show_name: "Veep",
        drama_show_name: "The Handmaid’s Tale",
        comedy_season_number: 6,
        drama_season_number: 1,
        comedy_episodes: 10,
        drama_episodes: 10
      },
      2018: {
        comedy_show_name: "The Marvelous Mrs. Maisel",
        drama_show_name: "Game of Thrones",
        comedy_season_number: 1,
        drama_season_number: 7,
        comedy_episodes: 8,
        drama_episodes: 7
      },
      2019: {
        comedy_show_name: "The Marvelous Mrs. Maisel",
        drama_show_name: "Game of Thrones",
        comedy_season_number: 2,
        drama_season_number: 8,
        comedy_episodes: 10,
        drama_episodes: 6
      },
      2020: {
        comedy_show_name: "Schitt's Creek",
        drama_show_name: "Succession",
        comedy_season_number: 6,
        drama_season_number: 2,
        comedy_episodes: 14,
        drama_episodes: 10
      },
      2021: {
        comedy_show_name: "Ted Lasso",
        drama_show_name: "The Crown",
        comedy_season_number: 1,
        drama_season_number: 4,
        comedy_episodes: 10,
        drama_episodes: 10
      },
      2022: {
        comedy_show_name: "Ted Lasso",
        drama_show_name: "Succession",
        comedy_season_number: 2,
        drama_season_number: 3,
        comedy_episodes: 12,
        drama_episodes: 9
      },
      2023: {
        comedy_show_name: "The Bear",
        drama_show_name: "Succession",
        comedy_season_number: 1,
        drama_season_number: 4,
        comedy_episodes: 8,
        drama_episodes: 10
      },
      2024: {
        comedy_show_name: "Hacks",
        drama_show_name: "Shōgun",
        comedy_season_number: 3,
        drama_season_number: 1,
        comedy_episodes: 9,
        drama_episodes: 10
      }
    };
  
    // Call chart rendering
    createEpisodeScroller("#episode-scroll-container", showDataByYear);
  });
  
  function createEpisodeScroller(containerSelector, showDataByYear) {
    const width = window.innerWidth;
    const maxEpisodes = 25;
    const blockHeight = 16;
    const blockGap = 4;
  
    const height = (blockHeight + blockGap) * maxEpisodes + 100; 
  
    const margin = { top: 10, right: 0, bottom: 30, left: 0 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
  
    const colors = {
      "Drama": "#7B3F74",
      "Comedy": "#FF5F1F"
    };
  
    const initialYear = 2000;
    const container = document.querySelector(containerSelector);
    const scrollDiv = document.createElement("div");
    container.appendChild(scrollDiv);
  
    const divSel = d3.select(scrollDiv)
      .style("overflow-y", "auto")
      .style("max-width", `${width}px`)
      .style("max-height", `${height}px`);
  
    const svg = divSel.append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("position", "absolute")
      .style("top", "0px")
      .style("left", "0px")
      .style("pointer-events", "none");
  
    const chartGroup = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
    const x = d3.scaleBand()
      .domain(["Drama", "Comedy"])
      .range([chartWidth / 3, width - chartWidth / 3])
      .padding(0.25);
  
    const offSet = {
      "Drama": -2 * x.bandwidth() / 2,
      "Comedy": x.bandwidth() / 3
    };
  
    [5, 10, 15, 20, 25].forEach(refVal => {
      const y_val = chartHeight - (blockHeight + blockGap) * refVal - 2.5;
      chartGroup.append("line")
        .attr("x1", width / 2 + offSet["Drama"])
        .attr("x2", width / 2 + 2.5 * offSet["Comedy"])
        .attr("y1", y_val)
        .attr("y2", y_val)
        .attr("stroke", "#999")
        .attr("stroke-dasharray", "4 2");
  
      chartGroup.append("text")
        .attr("x", chartWidth / 2 - 10)
        .attr("y", y_val - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-family", "Lexend")
        .style("fill", "#666")
        .text(`${refVal} episodes`);
    });
  
    const referenceBlocksGroup = chartGroup.selectAll(".reference-group")
      .data(["Drama", "Comedy"])
      .enter()
      .append("g")
      .attr("class", "reference-group");
  
    referenceBlocksGroup.each(function (key) {
      const group = d3.select(this);
      group.selectAll("rect")
        .data(d3.range(25))
        .enter()
        .append("rect")
        .attr("x", width / 2 + offSet[key])
        .attr("y", (d, i) => chartHeight - (i + 1) * (blockHeight + blockGap))
        .attr("width", x.bandwidth() / 2)
        .attr("height", blockHeight)
        .attr("fill", "#d3d3d3");
    });
  
    const blocksGroup = chartGroup.selectAll(".block-group")
      .data(["Drama", "Comedy"])
      .enter()
      .append("g")
      .attr("class", "block-group");
  
    const yearLabel = svg.append("text")
      .attr("x", width / 2 - 10)
      .attr("y", margin.top * 3)
      .attr("text-anchor", "middle")
      .style("fill", "#666")
      .style("font-size", "32px")
      .style("font-family", "Lexend")
      .style("font-weight", "bold");
  
    const bestDrama = svg.append("text")
      .attr("x", width / 2 + offSet["Drama"] + x.bandwidth() / 4)
      .attr("y", height - margin.bottom / 2)
      .attr("text-anchor", "middle")
      .style("fill", "#666")
      .style("font-size", "20px")
      .style("font-family", "Lexend")
      .style("font-weight", "bold")
      .text("Best drama");
  
    const bestComedy = svg.append("text")
      .attr("x", width / 2 + offSet["Comedy"] + x.bandwidth() / 4)
      .attr("y", height - margin.bottom / 2)
      .attr("text-anchor", "middle")
      .style("fill", "#666")
      .style("font-size", "20px")
      .style("font-family", "Lexend")
      .style("font-weight", "bold")
      .text("Best comedy");
  
    const bestDramaName = svg.append("text");
    const bestComedyName = svg.append("text");
  
    const updateBars = (year) => {
      const yearData = showDataByYear[year];
      if (!yearData) return;
  
      const newData = [
        { name: "Drama", value: yearData.drama_episodes },
        { name: "Comedy", value: yearData.comedy_episodes }
      ];
  
      yearLabel.text(`${year}`);
  
      chartGroup.selectAll(".block-group")
        .each(function (name) {
          const group = d3.select(this);
          const value = newData.find(d => d.name === name).value;
  
          const rects = group.selectAll("rect")
            .data(d3.range(value));
  
          rects.exit().remove();
  
          rects.enter()
            .append("rect")
            .merge(rects)
            .attr("x", width / 2 + offSet[name])
            .attr("y", (d, i) => chartHeight - (i + 1) * (blockHeight + blockGap))
            .attr("width", x.bandwidth() / 2)
            .attr("height", blockHeight)
            .attr("fill", colors[name])
            .attr("opacity", value / 25);
        });
  
      bestDramaName
        .attr("x", width / 2 + offSet["Drama"] - 10)
        .attr("y", chartHeight - (newData[0].value - 1) * (blockHeight + blockGap))
        .attr("text-anchor", "end")
        .style("fill", "#666")
        .style("font-size", "20px")
        .style("font-family", "Lexend")
        .style("font-weight", "bold")
        .text(`${yearData.drama_show_name}, Season ${yearData.drama_season_number}`);
  
      bestComedyName
        .attr("x", 10 + width / 2 + offSet["Comedy"] + x.bandwidth() / 2)
        .attr("y", chartHeight - (newData[1].value - 1) * (blockHeight + blockGap))
        .style("fill", "#666")
        .style("font-size", "20px")
        .style("font-family", "Lexend")
        .style("font-weight", "bold")
        .text(`${yearData.comedy_show_name}, Season ${yearData.comedy_season_number}`);
    };
  
    // Set up scroll trigger
    const nSteps = 27;
    const stepSize = 300;
    const scrollHeight = stepSize * nSteps;
  
    const innerDiv = divSel.append("div")
      .style("width", `${width}px`)
      .style("height", `${scrollHeight}px`);
  
    let currentStep = 0;
  
    divSel.on("scroll", function () {
      const newStep = Math.floor(divSel.property("scrollTop") / stepSize);
      if (newStep !== currentStep) {
        currentStep = newStep;
        updateBars(initialYear + newStep);
      }
    });
  
    updateBars(initialYear);
  }
  
