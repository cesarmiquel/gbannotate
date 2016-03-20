//
// Gameboy related annotation code.
//

var App = (function (my, $) {

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

  return my;

}(App || {}, jQuery));
