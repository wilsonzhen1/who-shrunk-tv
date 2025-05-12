// script.js
//current ver

(async function() {
    try {
      // 1) Load core datasets
      const [weeklyData, cumulativeData, labels, shows] = await Promise.all([
        d3.json('json/weeklyData.json'),
        d3.json('json/cumulativeData.json'),
        d3.json('json/labels.json'),
        d3.json('json/shows.json')
      ]);
  
      // 2) Tooltip setup
      const tooltip = d3.select('body').append('div')
        .attr('id','tooltip')
        .style('position','absolute')
        .style('pointer-events','none')
        .style('background','rgba(255,255,255,0.9)')
        .style('border','1px solid #ccc')
        .style('padding','4px 8px')
        .style('font-size','12px')
        .style('border-radius','4px')
        .style('opacity',0);
  
      function positionTooltip(ev) {
        const node = tooltip.node();
        const { width: tw, height: th } = node.getBoundingClientRect();
        let x = ev.pageX + 10;
        let y = ev.pageY + 10;
        if (x + tw > window.innerWidth) x = ev.pageX - tw - 10;
        if (y + th > window.innerHeight) y = ev.pageY - th - 10;
        tooltip.style('left', x + 'px').style('top', y + 'px');
      }
  
      // 3) Layout & date parsing
      const margin = { top:80, right:150, bottom:60, left:120 };
      const width  = document.body.clientWidth - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;
      const parseDate = d3.timeParse('%Y-%m-%d');
      const cutoffDate = parseDate('2021-01-01');
      weeklyData.forEach(d => d.date = parseDate(d.date));
      cumulativeData.forEach(d => d.date = parseDate(d.date));
  
      // 4) Color scales & helpers
      const color = d3.scaleOrdinal(d3.schemeCategory10).domain(shows);
      function cssClass(name){ return name.replace(/\s+/g,'_'); }
      function fadeOthers(focus){
        shows.forEach(s=>{
          if(s!==focus){
            d3.selectAll(`.line.${cssClass(s)}, .annotation.${cssClass(s)}, .scatter.${cssClass(s)}`)
              .style('opacity',0.1);
          }
        });
      }
      function restoreAll(){
        d3.selectAll('.line, .annotation, .scatter').style('opacity',1);
      }
      const clicked = new Set();
  
      // 5) Controls: select-all + per-show toggles
      const controls = d3.select('#controls');
      controls.append('label')
        .html('<input type="checkbox" id="chk_all" checked> <span style="font-weight:bold; margin-left:6px;">Select All</span>')
        .on('change', function(){
          const on = d3.select('#chk_all').property('checked');
          shows.forEach(show=>{
            d3.select(`#chk_${cssClass(show)}`)
              .property('checked', on)
              .dispatch('change');
          });
        });
      shows.forEach(show=>{
        const cls = cssClass(show), id = `chk_${cls}`;
        const lbl = controls.append('label').style('margin-left','8px');
        lbl.append('input')
          .attr('type','checkbox')
          .attr('id', id)
          .property('checked', true)
          .on('change', function(){
            d3.selectAll(`.line.${cls}, .annotation.${cls}, .scatter.${cls}`)
              .style('display', this.checked ? null : 'none');
            const allChecked = shows.every(s=>d3.select(`#chk_${cssClass(s)}`).property('checked'));
            d3.select('#chk_all').property('checked', allChecked);
            updateHighlight();
          });
        lbl.append('span')
          .text(show)
          .style('color', color(show))
          .style('cursor','pointer')
          .on('mouseover', ()=>fadeOthers(show))
          .on('mouseout', ()=>restoreAll())
          .on('click', function(){
            const cb = d3.select(`#${id}`);
            cb.property('checked', !cb.property('checked')).dispatch('change');
          });
      });
  
      function updateHighlight(){
        const anyClicked = clicked.size > 0;
        shows.forEach(show=>{
          const cls     = cssClass(show),
                paths   = d3.selectAll(`.line.${cls}`),
                anns    = d3.selectAll(`.annotation.${cls}`),
                scats   = d3.selectAll(`.scatter.${cls}`),
                visible = d3.select(`#chk_${cls}`).property('checked');
          if(!visible){
            paths.style('opacity',0).style('pointer-events','none');
            anns .style('opacity',0);
            scats.style('opacity',0).style('pointer-events','none');
          } else if(anyClicked){
            if(clicked.has(show)){
              paths.style('opacity',1).style('pointer-events','all');
              anns .style('opacity',1);
              scats.style('opacity',1).style('pointer-events','all');
            } else {
              paths.style('opacity',0.1).style('pointer-events','none');
              anns .style('opacity',0.1);
              scats.style('opacity',0.1).style('pointer-events','none');
            }
          } else {
            paths.style('opacity',1).style('pointer-events','all');
            anns .style('opacity',1);
            scats.style('opacity',1).style('pointer-events','all');
          }
        });
      }
  
      // 6) drawChart for time-series
      function drawChart(data, svgId, titleText){
        const svg = d3.select(svgId)
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
        const x = d3.scaleTime().domain(d3.extent(data,d=>d.date)).range([0,width]);
        const y = d3.scaleLinear().domain([0,d3.max(data,d=>d3.max(shows,s=>d[s]))]).nice().range([height,0]);
  
        // X-axis monthly mids
        const [mn,mx] = x.domain(),
              months = d3.timeMonth.range(mn,mx),
              mids   = months.map(m=>new Date(m.getFullYear(),m.getMonth(),15));
        svg.append('g').attr('transform',`translate(0,${height})`)
           .call(d3.axisBottom(x).tickValues(mids).tickFormat(d3.timeFormat('%b %Y')))
           .selectAll('text').attr('transform','rotate(-45)').style('text-anchor','end');
  
        // Y-axis + label
        svg.append('g').call(d3.axisLeft(y));
        svg.append('text').attr('transform','rotate(-90)')
           .attr('x',-height/2).attr('y',-margin.left+20)
           .attr('text-anchor','middle')
           .text(titleText.includes('Cumulative') ? 'Cumulative Hours Watched (hrs)' : 'Weekly Hours Watched (hrs)');
  
        // Title
        svg.append('text').attr('x',width/2).attr('y',-50)
           .attr('text-anchor','middle').attr('font-size','18px').attr('font-weight','bold')
           .text(titleText);
  
        // draw lines
        shows.forEach(show=>{
          const cls = cssClass(show);
          svg.append('path').datum(data)
             .attr('class',`line ${cls}`)
             .attr('stroke',color(show)).attr('fill','none')
             .attr('d',d3.line().x(d=>x(d.date)).y(d=>y(d[show])))
             .style('cursor','pointer')
             .on('mouseover', ev=>{ tooltip.html(show).style('opacity',1); positionTooltip(ev); })
             .on('mousemove', ev=>positionTooltip(ev))
             .on('mouseout', ()=>tooltip.style('opacity',0))
             .on('click', ()=>{
               clicked.has(show)?clicked.delete(show):clicked.add(show);
               updateHighlight();
             });
        });
  
        // annotations
        const annG = svg.append('g').style('pointer-events','none'),
              labelOffset = 60;
        shows.forEach((show,i)=>{
          const cls = cssClass(show),
                baseY = -margin.top + labelOffset + i*16;
          labels.filter(l=>l.series===show).forEach(lab=>{
            const dt = parseDate(lab.date);
            if(dt < cutoffDate) return;
            annG.append('line')
                .attr('class',`annotation ${cls}`)
                .attr('x1',x(dt)).attr('x2',x(dt))
                .attr('y1',0).attr('y2',height)
                .attr('stroke',color(show))
                .attr('stroke-dasharray','4');
            annG.append('text')
                .attr('class',`annotation ${cls}`)
                .attr('x',x(dt)).attr('y',baseY)
                .attr('text-anchor','middle')
                .attr('fill',color(show))
                .text(`S${lab.season} (${lab.episodes} eps)`);
          });
        });
      }
  
      // render time-series
      drawChart(weeklyData,     '#chart-weekly',     'Weekly Hours Watched');
      drawChart(cumulativeData, '#chart-cumulative', 'Cumulative Weekly Hours Viewed');
  
      // 7) Load & aggregate runtimes from sprihaa2.csv
      const runtimeRaw = await d3.csv('sprihaa2.csv', d=>({
        series:  d.series_name,
        season:  +d.season_number,
        episode: +d.episode_number,
        runtime: +d.runtime_minutes
      }));
      const runtimeMap = {};
      runtimeRaw.forEach(d=>{
        const key = `${d.series}||${d.season}`;
        if(!runtimeMap[key]) runtimeMap[key]={sum:d.runtime,count:1};
        else { runtimeMap[key].sum+=d.runtime; runtimeMap[key].count+=1; }
      });
      Object.keys(runtimeMap).forEach(k=>{
        runtimeMap[k] = runtimeMap[k].sum / runtimeMap[k].count;
      });
  
      // 8) Season-level scatterprep
      const seasonMetrics = [];
      for(const show of shows){
        const labs = labels.filter(l=>l.series===show)
                           .sort((a,b)=>+a.season-+b.season);
        for(let i=0;i<labs.length;i++){
          const lab = labs[i],
                start = parseDate(lab.date),
                end   = (i+1<labs.length)? parseDate(labs[i+1].date) : weeklyData[weeklyData.length-1].date,
                totalHours = weeklyData.filter(d=>d.date>=start && d.date<end)
                                       .reduce((s,d)=>s+(d[show]||0),0),
                avgMin = runtimeMap[`${show}||${lab.season}`];
          if(!avgMin) continue;
          const avgHrs = avgMin/60,
                hrsPerEp = totalHours/lab.episodes;
          seasonMetrics.push({
            series: show,
            season: lab.season,
            episodes: lab.episodes,
            hours_per_episode: hrsPerEp,
            norm_hours_per_episode: hrsPerEp/avgHrs
          });
        }
      }
  
      function linearRegression(x,y){
        const n=x.length, mx=d3.mean(x), my=d3.mean(y);
        let num=0, den=0;
        for(let i=0;i<n;i++){
          num += (x[i]-mx)*(y[i]-my);
          den += Math.pow(x[i]-mx,2);
        }
        return { slope:num/den, intercept: my - (num/den)*mx };
      }
  
      // 9) Draw season-level scatter
      const lrRaw  = linearRegression(seasonMetrics.map(d=>d.episodes), seasonMetrics.map(d=>d.hours_per_episode));
      const lrNorm = linearRegression(seasonMetrics.map(d=>d.episodes), seasonMetrics.map(d=>d.norm_hours_per_episode));
      function drawScatter(data, svgId, valKey, lr){
        const svg = d3.select(svgId)
          .attr('width', width+margin.left+margin.right)
          .attr('height', height+margin.top+margin.bottom)
          .append('g').attr('transform',`translate(${margin.left},${margin.top})`);
        const xSc = d3.scaleLinear().domain(d3.extent(data,d=>d.episodes)).nice().range([0,width]);
        const ySc = d3.scaleLinear().domain(d3.extent(data,d=>d[valKey])).nice().range([height,0]);
        svg.append('g').attr('transform',`translate(0,${height})`).call(d3.axisBottom(xSc).ticks(6));
        svg.append('g').call(d3.axisLeft(ySc));
        svg.append('text').attr('x',width/2).attr('y',height+50).attr('text-anchor','middle').text('Episodes per Season');
        svg.append('text').attr('transform','rotate(-90)').attr('x',-height/2).attr('y',-margin.left+20)
           .attr('text-anchor','middle')
           .text(valKey==='norm_hours_per_episode' ? 'Normalized Hours per Episode' : 'Hours per Episode (hrs)');
        const [x0,x1] = xSc.domain(), y0 = lr.intercept + lr.slope*x0, y1 = lr.intercept + lr.slope*x1;
        svg.append('line').attr('x1',xSc(x0)).attr('y1',ySc(y0)).attr('x2',xSc(x1)).attr('y2',ySc(y1))
           .attr('stroke','#666').attr('stroke-dasharray','4');
        data.forEach(d=>{
          const cls = cssClass(d.series);
          svg.append('circle').attr('class',`scatter ${cls}`)
             .attr('cx',xSc(d.episodes)).attr('cy',ySc(d[valKey])).attr('r',5).attr('fill',color(d.series))
             .on('mouseover',ev=>{ tooltip.html(`${d.series} S${d.season}`).style('opacity',1); positionTooltip(ev); })
             .on('mousemove',ev=>positionTooltip(ev))
             .on('mouseout',()=>tooltip.style('opacity',0));
        });
      }
      drawScatter(seasonMetrics,'#chart-season','hours_per_episode',lrRaw);
      drawScatter(seasonMetrics,'#chart-season-normalized','norm_hours_per_episode',lrNorm);
      updateHighlight();
  
  
  // // 10) Global scatter with normalized value for all series
  // async function drawGlobalScatter(){
  //   // load global view data
  //   const globalData = await d3.csv('all-weeks-global.csv', d=>({
  //     series:      d.show_title,
  //     season:      +((d.season_title.match(/\d+/)||[])[0]||0),
  //     weeklyHours: +d.weekly_hours_viewed,
  //     category:    d.category
  //   }));
  //   // only English TV
  //   const tvEng = globalData.filter(d=>d.category==='TV (English)');
  
  //   // sum weeklyHours per series-season
  //   const bySeason = d3.rollup(tvEng,
  //     v=>d3.sum(v,d=>d.weeklyHours),
  //     d=>d.series, d=>d.season
  //   );
  
  //   // compute total runtime per series-season (in hours)
  //   const runtimeRaw = await d3.csv('sprihaa2.csv', d=>({
  //     series:  d.series_name,
  //     season:  +d.season_number,
  //     runtime: +d.runtime_minutes
  //   }));
  //   const runtimeSum = d3.rollup(runtimeRaw,
  //     v=>d3.sum(v,d=>d.runtime)/60,   // minutes -> hours
  //     d=>d.series, d=>d.season
  //   );
  
  //   // build points array with normalized value
  //   const points = [];
  //   for (let [series, seasons] of bySeason) {
  //     for (let [season, totalHours] of seasons) {
  //       const runHours = runtimeSum.get(series)?.get(season) || 0;
  //       if (!runHours) continue;
  //       points.push({ series, season, episodes: 0, normalized: totalHours / runHours });
  //     }
  //   }
  
  //   // count episodes per series-season
  //   const meta = await d3.csv('sprihaa2.csv', d=>({
  //     series: d.series_name,
  //     season: +d.season_number,
  //     episode: +d.episode_number
  //   }));
  //   const epsCount = d3.rollup(meta, v=>new Set(v.map(d=>d.episode)).size, d=>d.series, d=>d.season);
  //   points.forEach(d=> d.episodes = epsCount.get(d.series).get(d.season) );
  
  //   // set up svg
  //   const container = d3.select('#chart-global-scatter').html('');
  //   const m2 = { top:20, right:30, bottom:50, left:100 };
  //   const W2 = container.node().clientWidth - m2.left - m2.right;
  //   const H2 = 500 - m2.top - m2.bottom;
  
  //   // 1) create the outer SVG element
  //   const svgElem = container.append('svg')
  //     .attr('width', W2 + m2.left + m2.right)
  //     .attr('height', H2 + m2.top + m2.bottom);
  
  //   // 2) add invisible rect to catch pan drags
  //   svgElem.append('rect')
  //     .attr('width', W2)
  //     .attr('height', H2)
  //     .attr('transform', `translate(${m2.left},${m2.top})`)
  //     .style('fill', 'none')
  //     .style('pointer-events', 'all');
  
  //   // the inner group for axes+points
  //   const svg = svgElem.append('g')
  //     .attr('transform', `translate(${m2.left},${m2.top})`);
  
  //   // scales
  //   const x = d3.scaleLinear().domain(d3.extent(points,d=>d.episodes)).nice().range([0,W2]);
  //   const y = d3.scaleLinear().domain(d3.extent(points,d=>d.normalized)).nice().range([H2,0]);
  
  //   // axes
  //   const gX = svg.append('g').attr('transform',`translate(0,${H2})`).call(d3.axisBottom(x));
  //   const gY = svg.append('g').call(d3.axisLeft(y));
  
  //   // labels
  //   svg.append('text').attr('text-anchor','middle').attr('x',W2/2).attr('y',H2+35)
  //      .text('Season Length (Episodes)');
  //   svg.append('text').attr('text-anchor','middle').attr('transform','rotate(-90)')
  //      .attr('x',-H2/2).attr('y',-m2.left+20)
  //      .text('Global Viewing Hours per Season (normalized by runtime)');
  
  //   // clipping region
  //   const clipId = 'clip-norm';
  //   svg.append('defs').append('clipPath').attr('id',clipId)
  //      .append('rect').attr('width',W2).attr('height',H2);
  //   const plot = svg.append('g').attr('clip-path',`url(#${clipId})`);
  
  //   // points
  //   plot.selectAll('circle').data(points).enter().append('circle')
  //     .attr('cx',d=>x(d.episodes)).attr('cy',d=>y(d.normalized)).attr('r',5)
  //     .attr('fill','#1f77b4').style('opacity',0.8)
  //     .on('mouseover',(ev,d)=>{tooltip.html(`${d.series} S${d.season}<br/>Eps: ${d.episodes}<br/>Norm Hrs: ${d.normalized.toFixed(2)}`).style('opacity',1);positionTooltip(ev);})
  //     .on('mousemove',positionTooltip)
  //     .on('mouseout',()=>tooltip.style('opacity',0))
  //     .on('click',(ev,d)=>{
  //       const px = x(d.episodes), py = y(d.normalized), k=4;
  //       const tx = W2/2 - k*px, ty = H2/2 - k*py;
  //       // use svgElem here so zoom.transform applies to the same element we called zoom on
  //       svgElem.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(tx,ty).scale(k));
  //     });
  
  //   // zoom & pan
  //   const zoom = d3.zoom().scaleExtent([1,10]).extent([[0,0],[W2,H2]]).on('zoom',({transform})=>{
  //     const zx=transform.rescaleX(x), zy=transform.rescaleY(y);
  //     gX.call(d3.axisBottom(zx)); gY.call(d3.axisLeft(zy));
  //     plot.selectAll('circle').attr('cx',d=>zx(d.episodes)).attr('cy',d=>zy(d.normalized));
  //   });
  
  //   // 3) attach zoom to the outer SVG
  //   svgElem.call(zoom);
  // }
  
  // 10) Global scatter with normalized value + search + click‑to‑zoom + reset
  async function drawGlobalScatter(){
    // — data loading & aggregation (unchanged) —
    const globalData = await d3.csv('all-weeks-global.csv', d=>({
      series:      d.show_title,
      season:      +((d.season_title.match(/\d+/)||[])[0]||0),
      weeklyHours: +d.weekly_hours_viewed,
      category:    d.category
    }));
    const tvEng = globalData.filter(d=>d.category==='TV (English)');
    const bySeason = d3.rollup(tvEng, v=>d3.sum(v,d=>d.weeklyHours), d=>d.series, d=>d.season);
    const runtimeRaw = await d3.csv('sprihaa2.csv', d=>({
      series:  d.series_name,
      season:  +d.season_number,
      runtime: +d.runtime_minutes
    }));
    const runtimeSum = d3.rollup(runtimeRaw, v=>d3.sum(v,d=>d.runtime)/60, d=>d.series, d=>d.season);
    const points = [];
    for (let [series, seasons] of bySeason) {
      for (let [season, totalHours] of seasons) {
        const runH = runtimeSum.get(series)?.get(season) || 0;
        if (runH) points.push({ series, season, episodes:0, normalized: totalHours/runH });
      }
    }
    const meta = await d3.csv('sprihaa2.csv', d=>({
      series:d.series_name, season:+d.season_number, episode:+d.episode_number
    }));
    const epsCount = d3.rollup(meta, v=>new Set(v.map(d=>d.episode)).size, d=>d.series, d=>d.season);
    points.forEach(d=> d.episodes = epsCount.get(d.series).get(d.season) );
  
    // — clear & add controls bar —
    const container = d3.select('#chart-global-scatter').html('');
    const controls = container.append('div')
      .style('display','flex')
      .style('gap','8px')
      .style('margin-bottom','8px');
  
    // Reset button
    const resetBtn = controls.append('button')
      .text('Reset View')
      .style('padding','4px 8px')
      .style('cursor','pointer');
  
    // Search box
    const searchBox = controls.append('input')
      .attr('type','text')
      .attr('placeholder','Search show…')
      .style('padding','4px')
      .on('input', function(){
        const term = this.value.trim().toLowerCase();
        plot.selectAll('circle')
          .attr('stroke', d=> term && d.series.toLowerCase().includes(term) ? 'orange' : null)
          .attr('stroke-width', d=> term && d.series.toLowerCase().includes(term) ? 2 : null)
          .style('opacity', d=> !term || d.series.toLowerCase().includes(term) ? 0.8 : 0.2);
      });
  
    // — compute dimensions & create SVG —
    const m2 = { top:20, right:30, bottom:50, left:100 };
    const W2 = container.node().clientWidth - m2.left - m2.right;
    const H2 = 500 - m2.top - m2.bottom;
  
    const svgElem = container.append('svg')
      .attr('width', W2 + m2.left + m2.right)
      .attr('height', H2 + m2.top + m2.bottom);
  
    // invisible rect to catch pan
    svgElem.append('rect')
      .attr('width', W2).attr('height', H2)
      .attr('transform', `translate(${m2.left},${m2.top})`)
      .style('fill','none').style('pointer-events','all');
  
    const svg = svgElem.append('g')
      .attr('transform', `translate(${m2.left},${m2.top})`);
  
    // — scales & axes —
    const x = d3.scaleLinear().domain(d3.extent(points,d=>d.episodes)).nice().range([0,W2]);
    const y = d3.scaleLinear().domain(d3.extent(points,d=>d.normalized)).nice().range([H2,0]);
    const gX = svg.append('g').attr('transform',`translate(0,${H2})`).call(d3.axisBottom(x));
    const gY = svg.append('g').call(d3.axisLeft(y));
  
    // axis labels
    svg.append('text').attr('text-anchor','middle').attr('x',W2/2).attr('y',H2+35)
       .text('Season Length (Episodes)');
    svg.append('text').attr('transform','rotate(-90)').attr('text-anchor','middle')
       .attr('x',-H2/2).attr('y',-m2.left+20)
       .text('Normalized Hours');
  
    // — clipping & plot group —
    const clipId = 'clip-norm';
    svg.append('defs').append('clipPath').attr('id',clipId)
       .append('rect').attr('width',W2).attr('height',H2);
    const plot = svg.append('g').attr('clip-path',`url(#${clipId})`);
  
    // — zoom behavior (pan & wheel) —
    const zoom = d3.zoom().scaleExtent([1,10]).extent([[0,0],[W2,H2]])
      .on('zoom', ({transform})=>{
        const zx = transform.rescaleX(x), zy = transform.rescaleY(y);
        gX.call(d3.axisBottom(zx)); gY.call(d3.axisLeft(zy));
        plot.selectAll('circle')
            .attr('cx', d=>zx(d.episodes))
            .attr('cy', d=>zy(d.normalized));
      });
  
    // wire reset button
    resetBtn.on('click', () => {
      svgElem.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    });
  
    // — draw points with click-to-zoom —
    plot.selectAll('circle').data(points).enter().append('circle')
      .attr('cx', d=>x(d.episodes)).attr('cy', d=>y(d.normalized)).attr('r',5)
      .attr('fill','#1f77b4').style('opacity',0.8)
      .on('mouseover', (ev,d)=>{ tooltip.html(`${d.series} S${d.season}<br/>` +
          `Episodes: ${d.episodes}<br/>` +
          `Normalized Global Viewing Hours: ${d.normalized.toFixed(2)}`).style('opacity',1); positionTooltip(ev); })
      .on('mousemove', positionTooltip)
      .on('mouseout', ()=>tooltip.style('opacity',0))
      .on('click', (ev,d)=>{
        const px = x(d.episodes), py = y(d.normalized), k = 4;
        const tx = W2/2 - k*px, ty = H2/2 - k*py;
        svgElem.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(tx,ty).scale(k));
      });
  
    // attach zoom
    svgElem.call(zoom);
  }
  
  
  
  
  
    
     
  
      // invoke global scatter
      await drawGlobalScatter();
  
    } catch(err) {
      console.error('❌ Error loading or rendering:', err);
    }
  })();