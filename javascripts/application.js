function Launcher() {
  this.activatedListItem = 0;
  this.isStale = false;
  this.list = $('div#launcher div#list ul');
  this.searchBox = $('#search-box');
  this.selectedOption = 0;
  this.itemTemplate = $.template('<li><a href="${href}">${name} <span>${parent}</span></a></li>')
  
  var launcher = this;
};

Launcher.getInstance = function() {
  if (Launcher.instance == null) {
    Launcher.instance = new Launcher();
  }

  return Launcher.instance;
}

Launcher.prototype.clearSearchBox = function() { 
  this.searchBox.val('');
  this.filter();
}

// ==============
// = Visibility =
// ==============
Launcher.prototype.hide = function() { 
  $('#launcher').fadeOut('fast').unbind('keydown');
  $(document).unbind('keyup');
  $(document).bind('keyup', 'g', function(){ Launcher.getInstance().show(); });
}

Launcher.prototype.show = function() { 
  // ======================================================================
  // = FIXME: not unbinding 'g', so it can't be typed into the search box =
  // ======================================================================
  $(document).unbind('keyup');
  $(document).bind('keyup', 'esc', function(){ Launcher.getInstance().hide(); });
  
  $('#launcher').show();
  this.searchBox.focus();
  this.addKeyBindings();
}

Launcher.prototype.addKeyBindings = function() { 
  var launcher = this;
  $('#launcher').keydown(function(event){
    switch(event.keyCode) {
      case 8:  // backspace
        launcher.clearSearchBox();
        return false; break;
      case 9:  // tab (no-op)
        return false; break;
      case 13: // return
        launcher.loadUrlForActivated();
        return false; break;
      case 32: // space
        launcher.toggleFilter();
        return false; break;
      case 37: // left
        launcher.filterLeft();
        return false; break;
      case 38: // up
        launcher.listUp();
        return false; break;
      case 39: // right
        launcher.filterRight();
        return false; break;
      case 40: // down
        launcher.listDown();
        return false; break;
      default:
        launcher.startStaleTimer();
        return true;
    }
  });
  
  $('#launcher').keyup(function(event){
    if($.inArray(event.keyCode, [8, 13, 32, 37, 38, 39, 40]) == -1 && !event.metaKey) {
      launcher.filter();
    };
  });
};

Launcher.prototype.filter = function() {
  var launcher = this;
	var term = jQuery.trim( this.searchBox.val().toLowerCase() );
	var scores = [];

	if (!term) {
		launcher.rows.show();
	} else {
		launcher.rows.hide();

		launcher.cache.each(function(i){
			var score = this.score(term);
			if (score > 0) { scores.push([score, i]); }
		});

		jQuery.each(scores.sort(function(a, b){return b[0] - a[0];}), function(){
			jQuery(launcher.rows[ this[1] ]).show();
		});
	};
	
	this.activatedListItem = 0;
	this.highlightActivatedRow();
}

Launcher.prototype.updateList = function() {
  if (this.list.length) {
		this.rows = this.list.children('li');
		this.cache = this.rows.map(function(){
			return $(this).children('a').html().split(" ", 1)[0].toLowerCase();
		});
	};
}

Launcher.prototype.filterLeft = function() {
  if(this.selectedOption != 0) {
    this.selectedOption -= 1;
  }
  this.highlightActivatedFilter();
}

Launcher.prototype.filterRight = function() {
  if(this.selectedOption != 2) {
    this.selectedOption += 1;
  }
  this.highlightActivatedFilter();
}

Launcher.prototype.toggleFilter = function() {
  var checkbox =  $($('#filters label').get(this.selectedOption)).find(':input');
  if(checkbox.attr('checked')) {
    checkbox.attr('checked', false)
  } else {
    checkbox.attr('checked', true);
  }
}

Launcher.prototype.getActivated = function() {
  return $(this.rows.filter(':visible').get(this.activatedListItem));
}

Launcher.prototype.highlightActivatedRow = function() {
  this.rows.filter('.active').removeClass('active');
  var activated = this.getActivated().addClass('active');
  this.scrollList(activated)
}

Launcher.prototype.highlightActivatedFilter = function() {
  var filters = $('#filters label');
  filters.filter('.active').removeClass('active');
  $(filters.get(this.selectedOption)).addClass('active');
}

Launcher.prototype.loadUrlForActivated = function() {
  var href = this.getActivated().children('a').attr('href');
  if(href) { 
    this.hide();
    window.location = href
  };
}
  
Launcher.prototype.listUp = function() {
  if(this.activatedListItem != 0) {
    this.activatedListItem -= 1;
    this.highlightActivatedRow();
  }
}

Launcher.prototype.listDown = function() {
  if(this.activatedListItem != this.rows.length-1) {
    this.activatedListItem += 1;
    this.highlightActivatedRow();
  }
}

Launcher.prototype.makeStale = function() {
  this.isStale = true;
  this.searchBox.addClass('stale');
}

Launcher.prototype.populateList = function(data) {
  var launcher = this;
  $.each(data, function(){
   launcher.list.append(launcher.itemTemplate, this);
  });
  this.updateList();
}

Launcher.prototype.scrollList = function(activated) {
  var scrollWindowTop = this.list[0].scrollTop;
  var scrollWindowBottom = this.list[0].scrollTop + this.list.height();
  var activatedTop = activated[0].offsetTop;
  var activatedBottom = activated[0].offsetTop + activated.height() + 1;

  if (activatedTop < scrollWindowTop){
    this.list.scrollTo('-='+(scrollWindowTop-activatedTop)+'px');
  } else if (activatedBottom > scrollWindowBottom) {
    this.list.scrollTo('+='+(activatedBottom-scrollWindowBottom)+'px');
  }
}
Launcher.prototype.startStaleTimer = function() {
  if(this.isStale) { this.clearSearchBox(); }
  this.isStale = false;
  this.searchBox.removeClass('stale');
  
  clearTimeout(this.staleTimer);
  var launcher = this;
  this.staleTimer = setTimeout(function(){ launcher.makeStale(); }, 750);
}

var data = [
  { href:'http://google.com', type:'class', name:'Abstract', parent:'Merb::Test::Fixtures' },
  { href:'http://lighthousecf.org', type:'class', name:'AbstractAdapter', parent:'Merb::Rack' },
  { href:'http://merbivore.com', type:'method', name:'last', parent:'Dictionary' },
  { href:'http://merbivore.com', type:'method', name:'last_modified', parent:'Merb::ConditionalGetMixin' },
  { href:'http://merbivore.com', type:'method', name:'last_name', parent:'ID::User' },
  { href:'http://merbivore.com', type:'method', name:'load', parent:'Merb::Helpers' }
]

$(document).ready(function(){
  Launcher.getInstance().populateList(data);
  Launcher.getInstance().hide();
});