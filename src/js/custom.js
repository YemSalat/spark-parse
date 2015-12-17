(function (global, $) {
  'use strict';

  // WARNING!
  // the code below is not very nice (aka prototype)

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
  // load examples
  $('.examples-item').click(function (evt) {
    evt.preventDefault();
    var $this = $(this);
    var exId = $this.data('example');
    var $exEl = $('#src_' + exId);
    var exText = $exEl.text().trim();

    exText = exText.replace(/^\t+/gm, '') + '\n';

    editorSpark.setValue(exText);
    editorSpark.selection.moveTo(Infinity);
    editorSpark.focus();

    global.location.hash = $this.attr('href');

  });
  // global onLoad
  $(global).load(function () {
    if (global.location.hash.length > 1) {
      $('.examples-item[href^="'+global.location.hash+'"]').click();
    }
  });

  // :: EDITORS
  var editorSpark = window._e =  ace.edit("inputArea");
  var sessionSpark = window._s =editorSpark.getSession();
  editorSpark.focus();
  sessionSpark.setMode("ace/mode/c_cpp");
  sessionSpark.setUseWrapMode(true);
  sessionSpark.setTabSize(2);
  editorSpark.$blockScrolling = Infinity // disable console message
  editorSpark.setShowPrintMargin(false);
  editorSpark.setBehavioursEnabled(true);
  editorSpark.renderer.setPadding(2);
  editorSpark.setOptions({
    vScrollBarAlwaysVisible: false,
    fontSize: 17
  });
  editorSpark.on('change', function () {
    $resultArea.addClass('_changed');
  });

  var editorCpp = ace.edit("resultArea");
  var sessionCpp = editorCpp.getSession();
  sessionCpp.setMode("ace/mode/c_cpp");
  sessionCpp.setUseWrapMode(true);
  sessionCpp.setTabSize(2);
  editorCpp.$blockScrolling = Infinity // disable console message
  editorCpp.setShowPrintMargin(false);
  editorCpp.setBehavioursEnabled(true);
  editorCpp.renderer.setPadding(2);
  editorCpp.setOptions({
    vScrollBarAlwaysVisible: false,
    fontSize: 17
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
    editorSpark.focus();
    editorSpark.gotoLine(loc.line, loc.column - 1, true);
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
                    .replace(/\:[ ]+"([^"]+)"/g, '  <span class="_color-1">$1</span>')
                    .replace(/\:[ ]+(\d+)/g, '  <span class="_color-1">$1</span>');
    return result;
  }

  // :: PARSE SOURCE
  var parseSource = function () {
    var text = editorSpark.getValue();
    $output.removeClass('_error');
    $resultArea.removeClass('_changed');
    try {
      var tree_1 = parser.parse(text);
      console.log('TREE 1:');
      console.log(global._t1 = tree_1);
      var _t = evaluator.parse(tree_1);
      global._t = _t;
      var tree_2 = _t.tree;
      console.log('TREE 2:');
      console.log(_t)
      global._t2 = tree_2;
      var tree_3 = generator.parse(tree_2);
      console.log('CODE:');
      console.log(tree_3);

      var result = prettyJSON(tree_2);

      $output.html(result);

      editorCpp.setValue(tree_3 + '\n');

      editorCpp.selection.moveTo(Infinity);

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
      $('#output >  .fold > .fold > .fold > .toggler').click();

    }
    catch (e) {
      logError(e);
    }
  };

})(this, this.jQuery);