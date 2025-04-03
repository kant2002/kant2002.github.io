window.init = async function(){
  // TODO: lazy load

  // TODO: inline?
  util.getFile('/data/graph-metadata.json')
  
  // Add detailed graph button
  d3.selectAll('.detail-graph-button-inline')
    .st({position: 'relative', top: 5})
    .html(`
      <svg width="143" height="24" viewBox="0 0 143 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="inline-button" clip-path="url(#clip0_2313_7388)">
      <rect width="143" height="24" fill="white"/>
      <g id="full_graph_link__capital-state-dallas">
      <rect width="143" height="24" rx="4" fill="#6A9BCC" fill-opacity=".1"/>
      <g id="Component">
      <path id="Vector 891" d="M11.5 7.25H8M8 7.25V10.75M8 7.25L12 11.25" stroke="#6A9BCC"/>
      <path id="Vector 893" d="M13.5 16.75L17 16.75M17 16.75L17 13.25M17 16.75L13 12.75" stroke="#6A9BCC"/>
      </g>
      <text id="View detailed graph" fill="#6A9BCC" xml:space="preserve" style="white-space: pre" font-family="Roboto" font-size="13" letter-spacing="0em"><tspan x="22" y="16.4434">View detailed graph</tspan></text>
      </g>
      </g>
      <defs>
      <clipPath id="clip0_2313_7388">
      <rect width="143" height="24" fill="white"/>
      </clipPath>
      </defs>
      </svg>
    `)
    .selectAll('[id^="full_graph_link"]')
    .classed('full_graph_link', 1)
    .each(function(){
      var cgSlug = d3.select(this).attr('id').split('full_graph_link__')[1] 
      util.attachCgLinkEvents(d3.select(this), cgSlug, null)
    })

  // Select all feature example divs
  d3.selectAll('.fe-div').each(function() {
    var args = JSON.parse(this.dataset.args)

    // Init feature example in this div
    window.initFeatureExamples({
      containerSel: d3.select(this),
      showLogits: false,
      hideStaleOutputs: true,
    }).renderFeature(util.scanSlugToName.h35, args.featureIndex)
  })  
  
  d3.selectAll('.cg-div').each(function() {
    var args = JSON.parse(this.dataset.args.replaceAll(`'`, `"`))
    window.initCg(d3.select(this), args.slug)
  })
  
  // hide modal controls
  function hideModal(){ 
    d3.select('modal').classed('is-active', 0) 
    d3.select('body').classed('modal-open', 0)
    history.replaceState(null, '', window.location.pathname)
  }
  d3.selectAll('modal .modal-bg, modal .modal-hide').on('click', hideModal)
  d3.select('body').on('keydown.hide-modal', ev => ev.key === 'Escape' ? hideModal() : '')
    
  // needs to happen after distill footnotes stuff, delay it
  window.addEventListener('DOMContentLoaded', function (){
    d3.selectAll('.fh-span').each(function (){
      initFeatureHover(d3.select(this), this.dataset.args.replaceAll(`'`, `"`))
    })
  })
  
  // ?slug=mo-chocolate opens a circuit graph
  // this will open even on mobile — not sure if weird/broken
  var cgSlug = util.params.get('slug')
  if (cgSlug){
    d3.select('body').classed('modal-open', true)
    var contentSel = d3.select('modal').classed('is-active', 1)
      .select('.modal-content').html('')
    
    util.initGraphSelect(contentSel, cgSlug)
  }
  
  // add TOC
  var titleMap = {
      "We investigate the internal mechanisms used by Claude 3.5 Haiku — Anthropic's lightweight production model — in a variety of contexts, using our circuit tracing methodology.": "",
      "We investigate the internal mechanisms used by Claude 3.5 Haiku — Anthropic's lightweight production model — in a variety of contexts, using our circuit tracing methodology.": -1,
      "Introductory Example: Multi-step Reasoning": "Multi-step Reasoning",
      "Planning in Poems": "Planning in Poems",
      "Multilingual Circuits": "Multilingual Circuits",
      "Addition": "Addition",
      "Medical diagnoses": "Medical Diagnoses",
      "Entity Recognition and Hallucinations": "Hallucinations",
      "Refusals": "Refusals",
      "Life of a Jailbreak": "Life of a Jailbreak",
      "Chain-of-thought Faithfulness": "Chain-of-thought Faithfulness",
      "Uncovering Hidden Goals in a Misaligned Model": "Uncovering Hidden Goals",
      "Commonly Observed Circuit Components and Structure": "Common Components",
      "Limitations": "Limitations",
      "Building an Interpretable Replacement Model": "Replacement Model",
      "Circuit Tracing: Revealing Computational Graphs in Language Models\n": "Introduction",
      "Circuit Tracing: Revealing Computational Graphs in Language Models": "Introduction",
      "On the Biology of a Large Language Model": "Introduction",
  }

  var h2Data = []
  d3.select('body').selectAll('h1,h2').each(function(){
    var sel = d3.select(this)
    var text = sel.text()
    var shortText = titleMap[text] || text
    if (!shortText || shortText == -1) return 
    
    h2Data.push({text, shortText, node: this})
  })
  // #appendix is not h2 but it's ok
  h2Data.push({ text: "Appendix", shortText: "Appendix", node: d3.select("#appendix").node() });
  // double title tags, filter out
  h2Data = d3.nestBy(h2Data, d => d.shortText).map(d => d.at(-1))
  
  var selectSel = d3.select('body').selectAppend('div.sticky-toc').html('')
    .selectAppend('select')
    .on('change', function(){
      var d = h2Data[this.selectedIndex]
      d.node.scrollIntoView({behavior: 'auto'})
      window.scrollBy(0, -30)
    })

  // selectSel.appendMany('option', h2Data).text(d => d.shortText)

  // list to scroll position 
  d3.select(window).on('scroll.toc', util.throttleDebounce(function(){
    var currentH2 = h2Data.map(d => d.node).reverse()
      .find(d => d.getBoundingClientRect().top <= 100)

    if (!currentH2) return
    var idx = h2Data.findIndex(d => d.node == currentH2)
    selectSel
      .classed('active', idx > 0) 
      .node().selectedIndex = idx
  }, 100))
  
  // offset scroll so TOC doesn't cover up h2 tags on mobile
  if (window.location.hash) setTimeout(() => window.scrollBy(0, -30), 100) 
  d3.selectAll('a[href^="#"]').on('click.hash-adjust', () => setTimeout(() => window.scrollBy(0, -30), 0))
  
  function prepend(domNode, tagName) {
    // d3.insert(_, ":first-child") fails to insert before text nodes
    return d3.select(domNode.insertBefore(document.createElement(tagName), domNode.firstChild));
  }

  var idToSectionCounterDict = {};

  // insert ToC counters
  var appendixCounter = [0, 0];
  d3.select('d-appendix').selectAll('h3,h4').each(function () {
    var counterIndex = Number(this.tagName.at(-1)) - 3;
    appendixCounter[counterIndex] += 1;
    var pieces = appendixCounter.slice(0, counterIndex + 1);
    if (pieces[0] > 26) {
      // If needed, we can fix by going to AA, etc.
      console.error("More than 26 appendix sections, bailing");
      return;
    }
    pieces[0] = String.fromCharCode(64 + pieces[0]); // 1 -> A, etc.
    var section = '§\u00a0' + pieces.join(".");
    for (var afterIndex = counterIndex + 1; afterIndex < appendixCounter.length; afterIndex++) {
      appendixCounter[afterIndex] = 0;
    }

    var a = d3.select(this).select('a');
    var id = a.empty() ? null : a.attr('id');
    if (id) {
      idToSectionCounterDict[id] = section;
    }

    // make idempotent (but we still want idToSectionCounterDict)
    if (!d3.select(this).select(".toc-counter").empty()) return;

    prepend(this, "span").text(section + " ").classed("toc-counter", true);
  });

  var headerCounter = [0, 0, 0];
  d3.select("d-article").selectAll('h2,h3,h4').each(function () {

    var counterIndex = Number(this.tagName.at(-1)) - 2;
    headerCounter[counterIndex] += 1;
    if (headerCounter[0] === 0) return; // skip Contents itself
    
    var section = '§\u00a0' + headerCounter.slice(0, counterIndex + 1)
      .filter(n => n) // Tolerate somebody skipping from h2 to h4
      .join(".");
    for (var afterIndex = counterIndex + 1; afterIndex < headerCounter.length; afterIndex++) {
      headerCounter[afterIndex] = 0;
    }
    var a = d3.select(this).select('a');
    var id = a.empty() ? null : a.attr('id');
    if (id) {
      idToSectionCounterDict[id] = section;
    }

    // make idempotent (but we still want idToSectionCounterDict)
    if (!d3.select(this).select(".toc-counter").empty()) return;

    prepend(this, "span").text(section + " ").classed("toc-counter", true);

  });

  d3.selectAll('.toc a').each(function () {
    var sel = d3.select(this);
    var href = sel.attr("href");
    if (href && href.startsWith("#")) {
      var section = idToSectionCounterDict[href.slice(1)];
      if (section) {
        prepend(this, "span").text(section + " ").classed("toc-counter", true);
      }
    }
  });

  selectSel.appendMany('option', h2Data).text(d => {
    var text = d.shortText;
    if (text === "Appendix") return text;
    var toc = d3.select(d.node).select(".toc-counter");
    if (!toc.empty()) {
      text = toc.text() + text;
    }
    return text;
  })

  d3.selectAll("d-article a:not([id])").each(function() {
    var sel = d3.select(this);
    if (!sel.select(".toc-counter").empty()) return;
    var href = sel.attr("href");
    if (!href.startsWith("#")) return;
    if (!sel.text().startsWith("§")) return;

    var section = idToSectionCounterDict[href.slice(1)];
    if (section) {
      var newText = section + sel.text().slice(1);
      // console.log("Patching " + newText);
      sel.text(newText);
    } else {
      console.warn(`Internal link with unknown anchor ${href}`);
      console.warn(this);
    }
  });

  // insert svgs

  var figmaManifest = await util.getFile('/figma/manifest.json')
  var figureCount = 0
  d3.selectAll('.sn-figma-div').each(function() {
    var args = JSON.parse(this.dataset.args.replaceAll(`'`, `"`))
    
    if (figmaManifest.figures.includes(args.figma_slug)) figureCount++
    window.initSupernodeFigma(d3.select(this), args.figma_slug, args.scale, figureCount)
  })


}

init()
