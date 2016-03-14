var App = (function (my, $) {
	
	var mapWidth            = 200;
	var mapHeight           = 900;

	var s = null;

	my.drawMap = function(annotations, containerSelector) {
		// draw empty map
		s = Snap(containerSelector);
		s.rect(0, 0, mapWidth, mapHeight).attr({fill: '#666'});;
		
		// draw filled memory
		var mapBounds = my.getMemorMapBounds();
		var map = s.rect(0, addressToY(mapBounds.start), mapWidth, addressToY(mapBounds.end - mapBounds.start));
		map.attr({
    	fill: "#900",
    	stroke: "#b00",
    	strokeWidth: 1
		});

		// draw blocks
		for(var i = 0; i < annotations.blocks.length; i++) {
			drawBlock(annotations.blocks[i]);
		}
	}
	
	function addressToY(addr) {
		return addr / 0xffff * mapHeight;
	}
	
	function drawBlock(block) {
	  var startY = addressToY(block.from)
		var endY   = addressToY(block.to);
		s.rect(0, startY, mapWidth, endY - startY).attr({
    	fill: "#090",
    	stroke: "#0b0",
    	strokeWidth: 1
		});;
	}
	
  return my;

}(App || {}, jQuery));