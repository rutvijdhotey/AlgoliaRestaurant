

$(document).on('click', '.go-to-page', function(e) {
  e.preventDefault();
  $('html, body').animate({scrollTop: 0}, '500', 'swing');
  algoliaHelper.setCurrentPage(+$(this).data('page') - 1).search();
});

$(document).on('click', '.toggle-refine', function(e) {
  e.preventDefault();
  algoliaHelper.toggleRefine($(this).data('facet'), $(this).data('value')).search();
});


//Initialise Algolia Search
var applicationID = '0ERK48U88S';
var apiKey = 'ab7cdae6fba29f65d112ec2bf92a412e';
var indexToSearch = 'Restaurants';
var PARAMS = {
    hitsPerPage : 10,
    maxValuesPerFacet : 10,
    facets: ['food_type'],
    disjunctiveFacets: ['stars'],
    index: indexToSearch
};

//Client + helper init
var client = algoliasearch(applicationID,apiKey);
var algoliaHelper = algoliasearchHelper(client,indexToSearch,PARAMS);

$searchInput = $('#search-input');
$searchInputIcon = $('#search-input-icon');
$main = $('main');
$hits = $('#hits');
$stats = $('#stats');
$facets = $('#facets');
$pagination = $('#pagination');

// Hogan templates binding
var hitTemplate = Hogan.compile($('#hit-template').text());
var statsTemplate = Hogan.compile($('#stats-template').text());
var facetTemplate = Hogan.compile($('#facet-template').text());
var paginationTemplate = Hogan.compile($('#pagination-template').text());
var noResultsTemplate = Hogan.compile($('#no-results-template').text());

// Input binding
$searchInput
.on('keyup', function() {
  var query = $(this).val();
  algoliaHelper.setQuery(query).search();
})
.focus();

// Search results
algoliaHelper.on('result', function(content, state) {
  console.log(content);
});

// Input binding
$searchInput
.on('keyup', function() {
  var query = $(this).val();
  toggleIconEmptyInput(query);
  algoliaHelper.setQuery(query).search();
})
.focus();

$searchInputIcon.on('click', function(e) {
  e.preventDefault();
  $searchInput.val('').keyup().focus();
});

function toggleIconEmptyInput(query) {
  $searchInputIcon.toggleClass('empty', query.trim() !== '');
}


// Search results
algoliaHelper.on('result', function(content, state) {
  renderHits(content);
});

function renderHits(content) {
  $hits.html(hitTemplate.render(content));
}

// Search results
algoliaHelper.on('result', function(content, state) {
  renderStats(content);
  renderHits(content);
});

function renderStats(content) {
  var stats = {
    nbHits: content.nbHits,
    nbHits_plural: content.nbHits !== 1,
    processingTimeMS: content.processingTimeMS
  };
  $stats.html(statsTemplate.render(stats));
}



// Search results
algoliaHelper.on('result', function(content, state) {
  renderStats(content);
  renderHits(content);
  renderPagination(content);
});

function renderPagination(content) {
  var pages = [];
  if (content.page > 3) {
    pages.push({current: false, number: 1});
    pages.push({current: false, number: '...', disabled: true});
  }
  for (var p = content.page - 3; p < content.page + 3; ++p) {
    if (p < 0 || p >= content.nbPages) continue;
    pages.push({current: content.page === p, number: p + 1});
  }
  if (content.page + 3 < content.nbPages) {
    pages.push({current: false, number: '...', disabled: true});
    pages.push({current: false, number: content.nbPages});
  }
  var pagination = {
    pages: pages,
    prev_page: content.page > 0 ? content.page : false,
    next_page: content.page + 1 < content.nbPages ? content.page + 2 : false
  };
  $pagination.html(paginationTemplate.render(pagination));
}

//.initIndex('Restaurants').setSettings({"attributesForFaceting":["food_type"]});
var FACETS_ORDER_OF_DISPLAY = ['food_type'];
var FACETS_LABELS = {food_type: 'Food Type/Cuisines' , stars: 'Stars'};


// Search results
algoliaHelper.on('result', function(content, state) {
  renderStats(content);
  renderHits(content);
  renderFacets(content, state);
  renderPagination(content);
});




function renderFacets(content, state) {
  var facetsHtml = '';
  var facetName = 'food_type';
  var facetResult = content.getFacetByName(facetName);
  var facetContent = {};
  if (facetResult) {
    facetContent = {
      facet: facetName,
      title: FACETS_LABELS[facetName],
      values: content.getFacetValues(facetName, {sortBy: ['isRefined:desc', 'count:desc']}),
      disjunctive: $.inArray(facetName, PARAMS.disjunctiveFacets) !== -1
    };
    facetsHtml += facetTemplate.render(facetContent);
  }
  $facets.html(facetsHtml);
}



// Search results
algoliaHelper.on('result', function(content, state) {
  renderStats(content);
  renderHits(content);
  renderFacets(content, state);
  //bindSearchObjects(state);
  renderPagination(content);
  handleNoResults(content);
});

// NO RESULTS
// ==========

function handleNoResults(content) {
  if (content.nbHits > 0) {
    $main.removeClass('no-results');
    return;
  }
  $main.addClass('no-results');

  var filters = [];
  var i;
  var j;
  for (i in algoliaHelper.state.facetsRefinements) {
    filters.push({
      class: 'toggle-refine',
      facet: i, facet_value: algoliaHelper.state.facetsRefinements[i],
      label: FACETS_LABELS[i] + ': ',
      label_value: algoliaHelper.state.facetsRefinements[i]
    });
  }
  for (i in algoliaHelper.state.disjunctiveFacetsRefinements) {
    for (j in algoliaHelper.state.disjunctiveFacetsRefinements[i]) {
      filters.push({
        class: 'toggle-refine',
        facet: i,
        facet_value: algoliaHelper.state.disjunctiveFacetsRefinements[i][j],
        label: FACETS_LABELS[i] + ': ',
        label_value: algoliaHelper.state.disjunctiveFacetsRefinements[i][j]
      });
    }
  }
  for (i in algoliaHelper.state.numericRefinements) {
    for (j in algoliaHelper.state.numericRefinements[i]) {
      filters.push({
        class: 'remove-numeric-refine',
        facet: i,
        facet_value: j,
        label: FACETS_LABELS[i] + ' ',
        label_value: j + ' ' + algoliaHelper.state.numericRefinements[i][j]
      });
    }
  }
  $hits.html(noResultsTemplate.render({query: content.query, filters: filters}));
}
