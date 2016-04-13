var App = (function (my, $) {
	
	// List of annotated blocks
	var annotatedBlocks = [];
	
	// comments we have added
	var comments = {};
	
	// labels we have added
	var labels = {};
	
	// Other useful vars
	var hextab = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
	
	// block functions
	my.addBlock = function(block) {
		annotatedBlocks.push(block);
	};
	
	my.getBlocks = function() {
		return annotatedBlocks;
	};
	
	// label functions
	my.addLabel = function(address, label) {
		labels[address] = label;
	}
	
	// comment functions
	my.addComment = function(address, comment) {
		comments[address] = comment;
	}
	
	// Add annotation to project
	my.loadAnnotation = function(annotation) {
		for(var i = 0; i < annotation.blocks.length; i++) {
			var block = annotation.blocks[i];
			if (block.type == 'code') {
				// disassemble code and add it
				var result = my.disassemble(stringToNum(block.from), stringToNum(block.to));
				result.comment = block.comment || '';
				my.addBlock(result);
				
				// add labels
				if (block.labels) {
					for(var j = 0; j < block.labels.length; j++) {
						var curLabel = block.labels[j];
						my.addLabel(stringToNum(curLabel.addr), curLabel.label);
					}
				}
				
				// add comments
				if (block.comments) {
					for(var j = 0; j < block.comments.length; j++) {
						var curComment = block.comments[j];
						my.addComment(stringToNum(curComment.addr), curComment.comment);
					}
				}
			}
      else if (block.type == 'gameboy_rom_header') {
        var gb_header = my.parseGBRomHeader();
        my.addBlock(gb_header);
      }
		}

    if (annotation.labels != undefined) {
		  for(var i = 0; i < annotation.labels.length; i++) {
        my.addLabel(stringToNum(annotation.labels[i].addr), annotation.labels[i].label);
      }
    }
	}

  my.loadAnnotationFromUrl = function(url, callback) {
    jQuery.getJSON(url, function(data) {

      var rom_url = data.rom_url;
      if (rom_url) {
        my.loadROMWithUrl(rom_url, function() {
          my.loadAnnotation(data);
          callback();
        });
      }
    });
  }

	my.render = function(element) {
		var html = '';
		var e = jQuery(element);
		for(var i = 0; i < annotatedBlocks.length; i++) {
			html += my.renderBlock(annotatedBlocks[i]);
		}
		element.html(html);
		
		// trigger qtip
		jQuery('.additional a').each(function() {
			 jQuery(this).qtip({
				 content: {
					 text: $(this).next('.tooltiptext')
				 }
			 });
     });
	};

	// private methods
	function getHexWord(v) {
    return '' + hextab[Math.floor(v / 0x1000)] + hextab[Math.floor((v & 0x0f00) / 256)] + hextab[Math.floor((v & 0xf0) / 16)] + hextab[v & 0x000f];
  }
	
	my.renderCodeLine = function(line) {

		// code template and helper
		var srcTpl = '<div class="code-line" data-addr="{{line.addr}}">' +
			'<div class="address">{{getHexAddress line.addr}}</div>' +
			'<div class="opcodes">{{line.ops}}</div>' +
			'<div class="code-label editable">{{#if line.label}}{{line.label}}{{else}}&nbsp{{/if}}</div>' +
			'<div class="instr">{{line.instr}}</div>' +
			'<div class="additional">{{#if line.disas}}{{{line.disas}}}{{else}}&nbsp{{/if}}</div>' +
			'<div class="comment editable" data-addr="{{line.addr}}">{{#if line.comment}}; {{{line.comment}}}{{else}}&nbsp{{/if}}</div>' +
			'</div>';

		Handlebars.registerHelper('getHexAddress', function(val) {
			var result = getHexWord(val);
			return new Handlebars.SafeString(result);
		});

		var tpl = Handlebars.compile(srcTpl);

		return tpl({'line': line});
	}
	
	function replaceAddresses(line) {
		// single address line
		var regexpList = [
			/\$([0-9A-F]{4})/i,
		];

		var args = line.disas.trim();
		
		for(var i = 0; i < regexpList.length; i++) {
			var found = args.match(regexpList[i]);
			if (found) {
				var labelAddress = parseInt(found[1], 16);
				if (labels[labelAddress]) {
					var newLabel = labels[labelAddress];
					var labelHelp = '';
					if (typeof newLabel !== 'string') {
						labelHelp = newLabel.help;
						newLabel  = newLabel.name;
					}
          else {
            // Provide a default tooltip text
					  labelHelp = '0x' + found[1] + ': ' + newLabel;
          }
					line.disas = line.disas.replace(
						'$' + found[1],
						'$<a href="#">' + newLabel + '</a>'
					);

					if (labelHelp) {
						line.disas += '<div class="tooltiptext">' + labelHelp + '</div>';
					}
				}
			}
		}

	}

	function renderCodeBlock(block) {
		
		// parse all lines
		var html = '<div class="code-block">';

		// Add a header to the top.
		comment = block.comment ? block.comment : '';
    link = '<a href="#" class="colapse-button" ><span class="glyphicon glyphicon-chevron-down" aria-hidden="true"></span></a>';
		html += '<div class="code-block-comment">' + comment + link + '</div>';

		for(var i = 0; i < block.code.length; i++) {
			var line = block.code[i];

      line.comment = '';
      if (comments[line.addr] != undefined) {
        if (typeof comments[line.addr] == 'string') {
			    line.comment = comments[line.addr];
        }
        else {
          // full line string
          var c = comments[line.addr];
		      html += '<div class="code-block-comment">' + c.comment + '</div>';
        }
      }
			
			line.label   = labels[line.addr]   ? labels[line.addr]   : '';
	
			replaceAddresses(line);
			
			html += my.renderCodeLine(line);
		}
		html += '</div>';
		return html + "\n";
	}

	my.renderBlock = function(block) {
		var html = '';
		if (block.type && block.type == 'code') {
			html += renderCodeBlock(block);
		}
		else if (block.type && block.type == 'gameboy_rom_header') {
			html += my.renderGBRomHeaderBlock(block);
		}
		return html;
	}

  function stringToNum(s) {
    return parseInt(s, 16);
  }
	
	return my;
}(App || {}, jQuery));	
