window.initSupernode = async function(sel, slug='str-indexing-pos-1'){
  window.renderAll = util.initRenderAll(['scans', 'hovered'])
  var data = await util.getFile(`/supernode/${slug}.json`)

  var c = d3.conventions({
    sel: sel.html('').classed('supernode', 1),
    height: 600,
    width: 800,
    margin: {left: 50, right: 50, top: 50, bottom: 50}
  })

  var radius = 20

  // Define arrow markers for both colors
  c.svg.append('defs').appendMany('marker', ['green', 'purple'])
    .at({
      id:  d => 'arrow-' + d,
      viewBox: '0 -5 10 10',
      refX: 0,
      markerWidth: 6,
      markerHeight: 6,
      orient: 'auto',
    })
    .append('path')
    .at({d: 'M0,-5L10,0L0,5', fill: d => d})

  var simulation = d3.forceSimulation(data.nodes)
    .force('link', d3.forceLink(data.links)
      .id(d => d.id)
      .strength(d => Math.abs(d.weight)))
    .force('charge', d3.forceManyBody().strength(-1000))
    .force('y', d3.forceY(d => c.y(d.l)).strength(1))
    .force('x', d3.forceX(c.width/2).strength(0.1))
    .force('collision', d3.forceCollide().radius(radius * 3))

  var linkSel = c.svg.appendMany('line.link', data.links)
    .at({
      stroke: d => d.weight > 0 ? 'green' : 'purple',
      strokeWidth: 2,
      opacity: d => Math.abs(d.weight),
      markerEnd:  d => `url(#arrow-${d.weight > 0 ? 'green' : 'purple'})`,
    })


  var drag = d3.drag()
    .on('start', event => {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    })
    .on('drag', event => {
      event.subject.fx = event.x
      event.subject.fy = event.y
    })
    .on('end', event => {
      if (!event.active) simulation.alphaTarget(0)
    })

  var nodeSel = c.svg.appendMany('g.node', data.nodes)
    .call(drag)
    .on('click', (ev, d) => console.log(d))

  nodeSel.append('circle')
    .at({r: radius, fill: '#fff', stroke: '#ccc'})

  nodeSel.each(function(supernode){
    if (!supernode.features?.length) return

    d3.select(this).appendMany('circle.feature', supernode.features)
      .at({r: 3, stroke: '#000', fill: '#fff'})
      .translate((d, i) => [
        radius*Math.cos(i*2*Math.PI/supernode.features.length),
        radius*Math.sin(i*2*Math.PI/supernode.features.length)
      ])
      .call(util.attachFeatureExamplesTooltip, 
        d => ({scan: data.metadata.scan, featureIndex: d.feature_idx}),
        // the last features are preloaded first
        () => data.nodes.map(d => d.features).flat().concat(supernode.features), 
      )
  })
  nodeSel.append('text')
    .text(d => d.name)
    .at({x: radius + 6, y: '.66em', fontSize: 12})

  simulation.on('tick', () => {
    linkSel
      .at({
        x1: d => d.source.x,
        y1: d => d.source.y,
        x2: d => {
          var dx = d.target.x - d.source.x
          var dy = d.target.y - d.source.y
          var len = Math.sqrt(dx*dx + dy*dy)
          return d.target.x - dx/len * (radius + 14)
        },
        y2: d => {
          var dx = d.target.x - d.source.x
          var dy = d.target.y - d.source.y
          var len = Math.sqrt(dx*dx + dy*dy)
          return d.target.y - dy/len * (radius + 14)
        }
      })

    nodeSel.translate(d => [d.x, d.y])
  })

  if (data.url) sel.append('a').at({href: data.url}).text('circuit graph').st({margin: 10})
}

window.init?.()
