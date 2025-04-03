window.initSupernodeFigma = async function (sel, figmaSlug, scale, figureIndex) {
  sel.html('').append('div').classed('supernode-figma', 1).at({ id: figmaSlug })

  // TODO: inline to avoid a round trip
  var manifest = await util.getFile('/figma/manifest.json')

  var validVariants = manifest.svgs
    .map(d => ({
      slug: d.replace('.svg', ''),
      maxWidth: parseInt(d.match(/(\d+)px-svg/)?.[1]) || Infinity
    }))
    .filter(d => d.slug === figmaSlug || d.slug.startsWith(figmaSlug.replace('-svg', '-')))
    .filter(d => d.slug === figmaSlug || isFinite(d.maxWidth))
    .filter(d => window.innerWidth <= d.maxWidth)

  var bestSlug = (d3.least(validVariants, d => d.maxWidth)?.slug) || figmaSlug
  var rawsvg = (await util.getFile(`/figma/${bestSlug}.svg`)).replace('https://static_js', './static_js')
  sel.html(rawsvg)

  var svgSel = sel.select('svg')
  if (!svgSel.node()) return sel.html(`<h1>${bestSlug} supernode figma missing</h1>`)

  if (!scale) scale = 1
  svgSel.at({
    width: svgSel.attr('width')*scale,
    height: svgSel.attr('height')*scale,
  })

  // add figure number
  if (figureIndex !== undefined){
    svgSel.selectAll('tspan').each(function(){
      var text = d3.select(this).text()
      if (text.includes('Figure 00')){
        var sel = d3.select(this)
        var parts = text.split('Figure 00')

        sel.html(`<tspan>Figure ${figureIndex}</tspan>${parts[1]}`)
        sel.select('tspan')
          .st({cursor: 'pointer', fontWeight: 'bold'})
          .on('click', () => window.location.hash = figmaSlug)
      }
    })
  }

  // add super node events
  var supernodeSel = sel.selectAll('[id^="sn"]').datum(function(){
    var id = d3.select(this).attr('id')

    var scan = util.scanSlugToName[id.split('_')[0].slice(2, 5)]
    var featureIndices = [...new Set(id.split('_b').filter(d => isFinite(d)))]
    return {scan, featureIndices}
  })

  var allFeatures = supernodeSel.data().flatMap(d => d.featureIndices)
  util.attachFeatureExamplesTooltip(
    supernodeSel,
    d => ({scan: d.scan, featureIndices: d.featureIndices}),
    d => allFeatures.map(e => ({featureIndex: e, scan: d.scan}))
  )

  
  // add graph button
  svgSel.selectAll('[id^="full_graph_link"]')
    .classed('full_graph_link', 1)
    .each(function(){
      var cgSlug = d3.select(this).attr('id').split('full_graph_link__')[1] 
      util.attachCgLinkEvents(d3.select(this), cgSlug, figmaSlug)
    })
  
  d3.selectAll('a[href*="static_js/attribution_graphs/index.html"]')
    .each(function(){
      try{
        var cgSlug = new URL(this.href).searchParams.get('slug')
        util.attachCgLinkEvents(d3.select(this), cgSlug)
      } catch (e){
        // console.log(e, this.href, this)
      }
    })

}

window.init?.()
