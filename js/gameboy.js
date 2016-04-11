//
// Gameboy related annotation code.
//

var App = (function (my, $) {

  my.ROM = [];
  my.currentBank = 1;

	// Load ROM with the provided data
	//
	// Parameters:
	// -----------
	// data      String with hex representation of code
	//
  my.loadROM = function(data) {
    my.ROM = [];

    var addr = 0;

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
            my.ROM[addr++] = parseInt(lc + c, 16);
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

    // Load bank 0 and 1
    my.loadBank(0);
    my.loadBank(1);

    my.startAddress = 0;
    my.endAddr = 0xffff;

    // Load default known labels
    loadGameboyLabels();

    return addr;
  }

  // banknum = 0, 1, 2, 3 ...
  my.loadBank = function(bankNum) {
    var startAddress = bankNum * 0x4000;
    var ramStartAddress = (bankNum == 0) ? 0 : 0x4000;
    for(i = 0; i < 0x4000; i++) {
      my.RAM[ ramStartAddress + i ] = my.ROM[startAddress + i];
    }
  }

  my.parseGBRomHeader = function() {

    var gameboyHeader = {};
    
    // Parse start code 0x100 - 0x103
    gameboyHeader.startCode = my.disassemble(0x100, 0x103);

    // Nintendo Logo 0x104 - 0x133
    gameboyHeader.nintendoLogo = my.disassembleData(0x104, 0x133);
    // Title of game 0x134 - 0x142
    gameboyHeader.title = my.disassembleData(0x134, 0x142);
    // Is GB Color game
    gameboyHeader.isColorGBData = my.ByteAt(0x143);
    // Licensee 0x144 - 0x145
    gameboyHeader.licenseeCodeHigh = my.ByteAt(0x144);
    gameboyHeader.licenseeCodeLow  = my.ByteAt(0x145);
    // GB/SGB Indicateor - 0x146
    gameboyHeader.GBorSGBIndicator = my.ByteAt(0x146);
    // Cartridge type - 0x147
    gameboyHeader.cartridgeType = my.ByteAt(0x147);
    // ROM size - 0x148
    gameboyHeader.romSize = my.ByteAt(0x148);
    // RAM size - 0x149
    gameboyHeader.ramSize = my.ByteAt(0x149);
    // Destination code (0 Japan, 1 Non-Japan) - 0x14a
    gameboyHeader.destinationCode = my.ByteAt(0x14a);
    // Licence code (old) - 0x14b
    gameboyHeader.licenceCode = my.ByteAt(0x14b);
    // Mask ROM version - 0x14c
    gameboyHeader.maskRomVersion = my.ByteAt(0x14c);
    // Complement Check = 0x14d
    gameboyHeader.complementCheck = my.ByteAt(0x14d);
    // Checksum = 0x14e
    gameboyHeader.checksumHigh = my.ByteAt(0x14e);
    gameboyHeader.checksumLow  = my.ByteAt(0x14f);

    return {
      'type': 'gameboy_rom_header',
      'hdr': gameboyHeader,
      'comment': '<strong>Gameboy ROM Header information</strong>'
    };
  }

  my.renderGBRomHeaderBlock = function(block) {

    var hdr = block.hdr;

		var html = '<div class="code-block">';

		// Create comment with ROM info
		comment = block.comment ? block.comment : '';

    comment += '<br/><br/>';
    comment += '<strong>Title:</strong> ' + hdr.title[0].instr + '<br/>';
    comment += '<strong>Is Gameboy Color:</strong> ' +
      (hdr.isColorGBData == 0x80 ? 'Yes' : 'No') +
      ' (' + my.getHexByte(hdr.isColorGBData) + ')<br/>';

    // Cartridge type
    var cartridgeTypes = {
      0x00: 'ROM Only',
      0x01: 'ROM + MBC1',
      0x02: 'ROM + MBC1 + RAM',
      0x03: 'ROM + MBC1 + RAM + BATT',
      0x05: 'ROM + MBC2',
      0x06: 'ROM + MBC2 + BATT',
      0x08: 'ROM + RAM',
      0x09: 'ROM + RAM + BATT',
      0x0b: 'ROM + MMM01',
      0x0c: 'ROM + MMM01 + SRAM',
      0x0d: 'ROM + MMM01 + SRAM + BATT',
      0x0f: 'ROM + MBC3 + TIMER + BATT',
      0x10: 'ROM + MBC3 + TIMER + RAM + BATT',
      0x11: 'ROM + MBC3',
      0x12: 'ROM + MBC3 + RAM',
      0x13: 'ROM + MBC3 + RAM + BATT',
      0x19: 'ROM + MBC5',
      0x1a: 'ROM + MBC5 + RAM',
      0x1b: 'ROM + MBC5 + RAM + BATT',
      0x1c: 'ROM + MBC5 + RUMBLE',
      0x1d: 'ROM + MBC5 + RUMBLE + SRAM',
      0x1e: 'ROM + MBC5 + RUMBLE + SRAM + BATT',
      0x1f: 'Pocket Camera',
      0xfd: 'Bandai TAMA5',
      0xfe: 'Hudson HuC-3',
    };
    var cartridgeTypeText = cartridgeTypes[hdr.cartridgeType] || 'Unknown';
    comment += '<strong>Cartridge type:</strong> ' + cartridgeTypeText + ' (' + my.getHexByte(hdr.cartridgeType) + ')<br/>';

    // ROM size
    var romSizes = {
      0x00: '256kBit = 32kB  =   2 banks',
      0x01: '512kBit = 64kB  =   4 banks',
      0x02: '  1MBit = 128kB =   8 banks',
      0x03: '  2MBit = 256kB =  16 banks',
      0x04: '  4MBit = 512kB =  32 banks',
      0x05: '  8MBit =   1MB =  64 banks',
      0x06: ' 16MBit =   2MB = 128 banks',
      0x52: '  9MBit = 1.1MB =  72 banks',
      0x53: ' 10MBit = 1.2MB =  80 banks',
      0x54: ' 12MBit = 1.5MB =  96 banks',
    };
    var romSizeText = romSizes[hdr.romSize] || 'Unknown';
    comment += '<strong>ROM Size:</strong> ' + romSizeText + ' (' + my.getHexByte(hdr.romSize) + ')<br/>';

    // RAM size
    var ramSizes = {
      0x00: 'None',
      0x01: ' 16kBit = 2kB   = 1 bank',
      0x02: ' 64kBit = 8kB   = 1 bank',
      0x03: '256kBit = 32kB  = 4 bank',
      0x04: '  1MBit = 128kB = 16 bank',
    };
    var ramSizeText = ramSizes[hdr.ramSize] || 'Unknown';
    comment += '<strong>RAM Size:</strong> ' + ramSizeText + ' (' + my.getHexByte(hdr.ramSize) + ')<br/>';

    // startup code
    comment += '<strong>Startup code:</strong> ';

		if (comment) {
		  html += '<div class="code-block-comment">' + comment + '</div>';
		}


    // Render startup code
    for(i = 0; i < hdr.startCode.code.length; i++) {
      var line = hdr.startCode.code[i];
			html += my.renderCodeLine(line);
    }

		html += '</div>';
		return html + "\n";
  }

  //
  // Codigo obtenido de aca: http://mrcoles.com/blog/making-images-byte-by-byte-javascript/
  //

  // Helper code to render sprits
  function _asLittleEndianHex(value, bytes) {
      // Convert value into little endian hex bytes
      // value - the number as a decimal integer (representing bytes)
      // bytes - the number of bytes that this value takes up in a string

      // Example:
      // _asLittleEndianHex(2835, 4)
      // > '\x13\x0b\x00\x00'

      var result = [];

      for (; bytes>0; bytes--) {
          result.push(String.fromCharCode(value & 255));
          value >>= 8;
      }

      return result.join('');
  }

  function _collapseData(rows, row_padding) {
      // Convert rows of RGB arrays into BMP data
      var i,
          rows_len = rows.length,
          j,
          pixels_len = rows_len ? rows[0].length : 0,
          pixel,
          padding = '',
          result = [];

      for (; row_padding > 0; row_padding--) {
          padding += '\x00';
      }

      for (i=0; i<rows_len; i++) {
          for (j=0; j<pixels_len; j++) {
              pixel = rows[i][j];
              result.push(String.fromCharCode(pixel[2]) +
                          String.fromCharCode(pixel[1]) +
                          String.fromCharCode(pixel[0]));
          }
          result.push(padding);
      }

      return result.join('');
  }

  function _scaleRows(rows, scale) {
      // Simplest scaling possible
      var real_w = rows.length,
          scaled_w = parseInt(real_w * scale),
          real_h = real_w ? rows[0].length : 0,
          scaled_h = parseInt(real_h * scale),
          new_rows = [],
          new_row, x, y;

      for (y=0; y<scaled_h; y++) {
          new_rows.push(new_row = []);
          for (x=0; x<scaled_w; x++) {
              new_row.push(rows[parseInt(y/scale)][parseInt(x/scale)]);
          }
      }
      return new_rows;
  }

  my.generateBitmapDataURL = function(rows, scale) {
      // Expects rows starting in bottom left
      // formatted like this: [[[255, 0, 0], [255, 255, 0], ...], ...]
      // which represents: [[red, yellow, ...], ...]

      if (!window.btoa) {
          alert('Oh no, your browser does not support base64 encoding - window.btoa()!!');
          return false;
      }

      scale = scale || 1;
      if (scale != 1) {
          rows = _scaleRows(rows, scale);
      }

      var height = rows.length,                                // the number of rows
          width = height ? rows[0].length : 0,                 // the number of columns per row
          row_padding = (4 - (width * 3) % 4) % 4,             // pad each row to a multiple of 4 bytes
          num_data_bytes = (width * 3 + row_padding) * height, // size in bytes of BMP data
          num_file_bytes = 54 + num_data_bytes,                // full header size (offset) + size of data
          file;

      height = _asLittleEndianHex(height, 4);
      width = _asLittleEndianHex(width, 4);
      num_data_bytes = _asLittleEndianHex(num_data_bytes, 4);
      num_file_bytes = _asLittleEndianHex(num_file_bytes, 4);

      // these are the actual bytes of the file...

      file = ('BM' +               // "Magic Number"
              num_file_bytes +     // size of the file (bytes)*
              '\x00\x00' +         // reserved
              '\x00\x00' +         // reserved
              '\x36\x00\x00\x00' + // offset of where BMP data lives (54 bytes)
              '\x28\x00\x00\x00' + // number of remaining bytes in header from here (40 bytes)
              width +              // the width of the bitmap in pixels*
              height +             // the height of the bitmap in pixels*
              '\x01\x00' +         // the number of color planes (1)
              '\x18\x00' +         // 24 bits / pixel
              '\x00\x00\x00\x00' + // No compression (0)
              num_data_bytes +     // size of the BMP data (bytes)*
              '\x13\x0B\x00\x00' + // 2835 pixels/meter - horizontal resolution
              '\x13\x0B\x00\x00' + // 2835 pixels/meter - the vertical resolution
              '\x00\x00\x00\x00' + // Number of colors in the palette (keep 0 for 24-bit)
              '\x00\x00\x00\x00' + // 0 important colors (means all colors are important)
              _collapseData(rows, row_padding)
             );

      return 'data:image/bmp;base64,' + btoa(file);
  }

  function loadGameboyLabels() {
    var knownLocations = [
      {'addr': 0xff05, 'label': 'TIMA'},
      {'addr': 0xff06, 'label': 'TMA'},
      {'addr': 0xff07, 'label': 'TAC'},
      {'addr': 0xff10, 'label': 'NR10'},
      {'addr': 0xff11, 'label': 'NR11'},
      {'addr': 0xff12, 'label': 'NR12'},
      {'addr': 0xff14, 'label': 'NR14'},
      {'addr': 0xff16, 'label': 'NR21'},
      {'addr': 0xff17, 'label': 'NR22'},
      {'addr': 0xff19, 'label': 'NR24'},
      {'addr': 0xff1a, 'label': 'NR30'},
      {'addr': 0xff1b, 'label': 'NR31'},
      {'addr': 0xff1c, 'label': 'NR32'},
      {'addr': 0xff1e, 'label': 'NR33'},
      {'addr': 0xff20, 'label': 'NR41'},
      {'addr': 0xff21, 'label': 'NR42'},
      {'addr': 0xff22, 'label': 'NR43'},
      {'addr': 0xff23, 'label': 'NR30'},
      {'addr': 0xff24, 'label': 'NR50'},
      {'addr': 0xff25, 'label': 'NR51'},
      {'addr': 0xff40, 'label': 
        {
          'name': 'LCDC', 
          'help': "<strong>0xff40 - LCD Control (R/W)</strong><br/>" +
            "Bit 7 - LCD Control Operation (*)<br/>" +
            "&nbsp;0: Stop completely (no picture on screen)<br/>" +
            "&nbsp;1: operation<br/>" +
            "Bit 6 - Window Tile Map Display Select<br/>" +
            "&nbsp;0: $9800-$9BFF<br/>" +
            "&nbsp;1: $9C00-$9FFF<br/>" +
            "Bit 5 - Window Display<br/>" +
            "&nbsp;0: off<br/>" +
            "&nbsp;1: on<br/>" +
            "Bit 4 - BG & Window Tile Data Select<br/>" +
            "&nbsp;0: $8800-$97FF<br/>" +
            "&nbsp;1: $8000-$8FFF <- Same area as OBJ<br/>" +
            "Bit 3 - BG Tile Map Display Select<br/>" +
            "&nbsp;0: $9800-$9BFF<br/>" +
            "&nbsp;1: $9C00-$9FFF<br/>" +
            "Bit 2 - OBJ (Sprite) Size<br/>" +
            "&nbsp;0: 8*8<br/>" +
            "&nbsp;1: 8*16 (width*height)<br/>" +
            "Bit 1 - OBJ (Sprite) Display<br/>" +
            "&nbsp;0: off<br/>" +
            "&nbsp;1: on<br/>" +
            "Bit 0 - BG & Window Display<br/>" +
            "&nbsp;0: off<br/>" +
            "&nbsp;1: on<br/>" +
            "* - Stopping LCD operation (bit 7 from 1 to 0) must<br/>" +
            "be performed during V-blank to work properly. V-<br/>" +
            "blank can be confirmed when the value of LY is<br/>" +
            "greater than or equal to 144."}
      },
      {'addr': 0xff41, 'label':
        {'name': 'STAT',
         'help': '<strong>0xff41 - LCD Status register</strong><br>Bit 6 - LYC=LY Coincidence (Selectable)<br>' +
           'Bit 5 - Mode 10<br>' +
           'Bit 4 - Mode 01<br>' +
           'Bit 3 - Mode 00<br>' +
           '&nbsp;0: Non Selection<br>' +
           '&nbsp;1: Selection<br>' +
           'Bit 2 - Coincidence Flag<br>' +
           '&nbsp;0: LYC not equal to LCDC LY<br>' +
           '&nbsp;1: LYC = LCDC LY<br>' +
           'Bit 1-0 - Mode Flag<br>' +
           '&nbsp;00: During H-Blank<br>' +
           '&nbsp;01: During V-Blank<br>' +
           '&nbsp;10: During Searching OAM-RAM<br>' +
           '&nbsp;11: During Transfering Data to<br>' +
           'LCD Driver'
        }
      },
      {'addr': 0xff42, 'label': 'SCY'},
      {'addr': 0xff43, 'label': 'SCX'},
      {'addr': 0xff44, 'label': 'LY'},
      {'addr': 0xff45, 'label': 'LYC'},
      {'addr': 0xff46, 'label': 'DMA'},
      {'addr': 0xff47, 'label': {'name': 'BGP', 'help': '<strong>0xff47 - BG & Window Palette Data</strong>'}},
      {'addr': 0xff48, 'label': 'OBP0'},
      {'addr': 0xff49, 'label': 'OBP1'},
      {'addr': 0xff4a, 'label': 'WY'},
      {'addr': 0xff4b, 'label': 'WX'},
      {'addr': 0xffff, 'label': 'IE'}
    ];

    for(i = 0; i < knownLocations.length; i++) {
      var location = knownLocations[i];
      my.addLabel(location.addr, location.label);
    }

  }

  return my;

}(App || {}, jQuery));
