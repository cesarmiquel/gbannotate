//
// 6502 disassembler
// n. landsteiner, mass:werk / electronic tradion 2005; e-tradion.net
// http://www.masswerk.at/6502/disassembler.html
//
// Modified by Cesar Miquel
//

var App = (function (my, $) {

  // globals
  my.RAM = [];
  my.pc = 0;
  my.startAddr = 0;
  my.endAddr = 0;

  // internal
  var hextab = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
	
	my.getMemorMapBounds = function() {
		return {start: my.startAddr, end: my.endAddr};
	}

	//
	// Load RAM with the provided program at the provided location
	//
	// Parameters:
	// -----------
	// data      String with hex representation of code
	// codeAddr  Starting address in decimal (or hex).
	//
  my.loadRAM = function(data, codeAddr) {
    my.RAM = [];
    
    my.startAddr = codeAddr;
    var addr = codeAddr & 0xffff;

    var lc = '';
    var ofs = 0;
    var mode = 1;
    data = data.toUpperCase();
    for (var i = 0; i < data.length; i++) {
      var c = data.charAt(i);
      if (mode == 2) {
        if ((c == '\r') || (c == '\n')) {
          mode = 1;
        }
      } else if (((c >= '0') && (c <= '9')) || ((c >= 'A') && (c <= 'F'))) {
        if (mode == 1) {
          if (lc) {
            my.RAM[addr++] = parseInt(lc + c, 16);
            if (addr > 0xffff)
              break;
            lc = '';
          } else {
            lc = c;
          }
        }
      } else if (c == ':') {
        mode = 0;
      } else if (c == ';') {
        mode = 2;
      } else {
        mode = 1;
      }
    }
    my.endAddr = addr;
    return addr;
  }

  my.ByteAt = function(addr) {
    return my.RAM[addr] || 0;
  }

  my.getHexByte = function(v) {
    return '' + hextab[Math.floor(v / 16)] + hextab[v & 0x0f];
  }

  my.getHexWord = function(v) {
    return '' + hextab[Math.floor(v / 0x1000)] + hextab[Math.floor((v & 0x0f00) / 256)] + hextab[Math.floor((v & 0xf0) / 16)] + hextab[v & 0x000f];
  }

  return my;

}(App || {}, jQuery));
