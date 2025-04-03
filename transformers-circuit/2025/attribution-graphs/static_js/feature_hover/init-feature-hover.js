window.initFeatureHover = async function(sel, configStr) {
  var modelType = configStr.split('__')[0]
  var featureIndices = configStr.split('__')[1]?.split('_')
    .map(d => d.replace('b', ''))

  var scan = util.scanSlugToName[modelType]
  if (!scan) return console.error('Invalid model type:', modelType)

  sel.datum(configStr).classed('.supernode-figma', 1)
  util.attachFeatureExamplesTooltip(
    sel,
    () => ({scan, featureIndices}),
    () => featureIndices.map(featureIndex => ({featureIndex, scan}))
  )
}

window.init?.()
