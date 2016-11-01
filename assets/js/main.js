$(function () {
  console.log('Page loaded');
});

var info;

var q = d3.queue();

q
  .defer(d3.json,"./resources/dataset/restaurants_info.json")
  .defer(d3.json, "./resources/dataset/restaurants_list.json")
  .await(analyze);

  function analyze(error, info, list) {
    if(error) { console.log(error); }

    info.sort(function(a,b){
      return a.objectID - b.objectID ;
    })
    list.sort(function(a,b){
      return a.objectID - b.objectID ;
    })

    var  i = 0;
    list.forEach(function(one_element) {
      if(one_element.objectID === info[i].objectID){
          list[i] = Object.assign(one_element, info[i]);
      }

      i++;
    });

    var list = JSON.stringify(list);
    var url = 'data:text/json;charset=utf8,' + encodeURIComponent(list);
    window.open(url, '_blank');
    window.focus();

}
