(function (global, $) {
  'use strict';


  // :: MODULES
  var parser = global.SparkParser;
  var evaluator = global.SparkEvaluator;
  var generator = global.SparkGenerator;


  // :: ELEMENTS
  var $btnEval = $('#btnEval');
  var $inputArea = $('#inputArea').focus();
  var $resultArea = $('#resultArea');
  var $output = $('#output');


  // :: EVENTS
  // change input source
  $inputArea.on('input', function () {
    $resultArea.addClass('_changed');
  });
  // click on fold
  $(document).on('click', '.fold', function (evt) {
    evt.preventDefault();
    evt.stopPropagation();
    var $this = $(this);
    if (!$this.hasClass('_active')) {
      $('.fold').removeClass('_active');
      $this.addClass('_active');
    }
    else {
      $this.removeClass('_active');
    }
  });
  // press ctrl+enter
  $(document).on('keydown', function (evt) {
    if (evt.which === 13 && evt.ctrlKey) {
      evt.preventDefault();
      evt.stopPropagation();
      parseSource();
    }
  })
  // click 'eval' button
  $btnEval.click(function (evt) {
    evt.preventDefault();
    evt.stopPropagation();
    parseSource();
  });

  // :: LOG ERROR
  var logError = function (error) {
    var result = 'Unknown error';
    var loc = error.location.start;
    var link = 'line <b>'+ loc.line +'</b>, column <b>'+ loc.column +'</b>';
    if (error.name === 'SyntaxError') {
      if (error.expected) {
        var found = error.found || 'end of input';
        result = 'Check syntax on '+ link +': unexpected "<b>'+found+'</b>"';
      }
      else {
        result = 'Check syntax on '+ link +':'+ error.message;
      }
    }
    else {
      result = 'Semantic error on '+ link +': '+ error.message;
    }
    $output.addClass('_error').html(result);
  };

  // :: PRETTY JSON OUTPUT
  var prettyJSON = function (json) {
    var result = JSON.stringify(json, null, 2)
                    // remove location
                    .replace(/"location"\:[^\{]+\{[^\}]+\}[^\}]+\}[^\}]+\}\,\s+/g, '')
                    // remove commas
                    .replace(/\,\n/g, '\n')
                    // bold braces
                    .replace(/\s*\{\n?/g, '<div class="fold">')
                    .replace(/\s*\}\n?/g, '</div>')
                    // bold $$
                    .replace(/([A-Z_]+)/g, '<b>$1</b>')
                    // stylize props
                    .replace(/"([^"]+)"\:/g, '<i style="color: #555;">$1</i>: ')
                    .replace(/\:[ ]+"([^"]+)"/g, '  <span style="color: #37547D;">$1</span>')
                    .replace(/\:[ ]+(\d+)/g, '  <span style="color: #37547D;">$1</span>');
    return result;
  }

  // :: PARSE SOURCE
  var parseSource = function () {
    var text = $inputArea.val();
    $output.removeClass('_error');
    $resultArea.removeClass('_changed');
    try {
      var tree_1 = parser.parse(text);
      var tree_2 = evaluator.parse(tree_1).tree;
      var tree_3 = generator.parse(tree_2);

      var result = prettyJSON(tree_2);

      $output.html(result);
      $resultArea.val(tree_3);

      $('.fold').append('<div class="toggler"></div>');
      $('.toggler').click(function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        var $this = $(this);
        var $par = $this.closest('.fold');

        $this.toggleClass('_active');
        $par.toggleClass('_folded');
      });

      $('#output >  .fold > .toggler').remove();
      $('#output >  .fold > .fold > .toggler').click();

      console.log('TREE 1:');
      console.log(global._t1 = tree_1);
      console.log('TREE 2:');
      console.log(global._t2 = tree_2);
      console.log('CODE:');
      console.log(tree_3);
    }
    catch (e) {
      logError(e);
    }
  };

})(this, this.jQuery);