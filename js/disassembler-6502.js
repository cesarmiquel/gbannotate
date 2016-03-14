//
// 6502 disassembler
// n. landsteiner, mass:werk / electronic tradion 2005; e-tradion.net
// http://www.masswerk.at/6502/disassembler.html
//
// Modified by Cesar Miquel
//

var App = (function (my, $) {

  // lookup tables
  var opctab = [
      ['BRK', 'imp'], ['ORA', 'inx'], ['???', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['ORA', 'zpg'], ['ASL', 'zpg'], ['???', 'imp'],
      ['PHP', 'imp'], ['ORA', 'imm'], ['ASL', 'acc'], ['???', 'imp'],
      ['???', 'imp'], ['ORA', 'abs'], ['ASL', 'abs'], ['???', 'imp'],
      ['BPL', 'rel'], ['ORA', 'iny'], ['???', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['ORA', 'zpx'], ['ASL', 'zpx'], ['???', 'imp'],
      ['CLC', 'imp'], ['ORA', 'aby'], ['???', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['ORA', 'abx'], ['ASL', 'abx'], ['???', 'imp'],
      ['JSR', 'abs'], ['AND', 'inx'], ['???', 'imp'], ['???', 'imp'],
      ['BIT', 'zpg'], ['AND', 'zpg'], ['ROL', 'zpg'], ['???', 'imp'],
      ['PLP', 'imp'], ['AND', 'imm'], ['ROL', 'acc'], ['???', 'imp'],
      ['BIT', 'abs'], ['AND', 'abs'], ['ROL', 'abs'], ['???', 'imp'],
      ['BMI', 'rel'], ['AND', 'iny'], ['???', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['AND', 'zpx'], ['ROL', 'zpx'], ['???', 'imp'],
      ['SEC', 'imp'], ['AND', 'aby'], ['???', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['AND', 'abx'], ['ROL', 'abx'], ['???', 'imp'],
      ['RTI', 'imp'], ['EOR', 'inx'], ['???', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['EOR', 'zpg'], ['LSR', 'zpg'], ['???', 'imp'],
      ['PHA', 'imp'], ['EOR', 'imm'], ['LSR', 'acc'], ['???', 'imp'],
      ['JMP', 'abs'], ['EOR', 'abs'], ['LSR', 'abs'], ['???', 'imp'],
      ['BVC', 'rel'], ['EOR', 'iny'], ['???', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['EOR', 'zpx'], ['LSR', 'zpx'], ['???', 'imp'],
      ['CLI', 'imp'], ['EOR', 'aby'], ['???', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['EOR', 'abx'], ['LSR', 'abx'], ['???', 'imp'],
      ['RTS', 'imp'], ['ADC', 'inx'], ['???', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['ADC', 'zpg'], ['ROR', 'zpg'], ['???', 'imp'],
      ['PLA', 'imp'], ['ADC', 'imm'], ['ROR', 'acc'], ['???', 'imp'],
      ['JMP', 'ind'], ['ADC', 'abs'], ['ROR', 'abs'], ['???', 'imp'],
      ['BVS', 'rel'], ['ADC', 'iny'], ['???', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['ADC', 'zpx'], ['ROR', 'zpx'], ['???', 'imp'],
      ['SEI', 'imp'], ['ADC', 'aby'], ['???', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['ADC', 'abx'], ['ROR', 'abx'], ['???', 'imp'],
      ['???', 'imp'], ['STA', 'inx'], ['???', 'imp'], ['???', 'imp'],
      ['STY', 'zpg'], ['STA', 'zpg'], ['STX', 'zpg'], ['???', 'imp'],
      ['DEY', 'imp'], ['???', 'imp'], ['TXA', 'imp'], ['???', 'imp'],
      ['STY', 'abs'], ['STA', 'abs'], ['STX', 'abs'], ['???', 'imp'],
      ['BCC', 'rel'], ['STA', 'iny'], ['???', 'imp'], ['???', 'imp'],
      ['STY', 'zpx'], ['STA', 'zpx'], ['STX', 'zpy'], ['???', 'imp'],
      ['TYA', 'imp'], ['STA', 'aby'], ['TXS', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['STA', 'abx'], ['???', 'imp'], ['???', 'imp'],
      ['LDY', 'imm'], ['LDA', 'inx'], ['LDX', 'imm'], ['???', 'imp'],
      ['LDY', 'zpg'], ['LDA', 'zpg'], ['LDX', 'zpg'], ['???', 'imp'],
      ['TAY', 'imp'], ['LDA', 'imm'], ['TAX', 'imp'], ['???', 'imp'],
      ['LDY', 'abs'], ['LDA', 'abs'], ['LDX', 'abs'], ['???', 'imp'],
      ['BCS', 'rel'], ['LDA', 'iny'], ['???', 'imp'], ['???', 'imp'],
      ['LDY', 'zpx'], ['LDA', 'zpx'], ['LDX', 'zpy'], ['???', 'imp'],
      ['CLV', 'imp'], ['LDA', 'aby'], ['TSX', 'imp'], ['???', 'imp'],
      ['LDY', 'abx'], ['LDA', 'abx'], ['LDX', 'aby'], ['???', 'imp'],
      ['CPY', 'imm'], ['CMP', 'inx'], ['???', 'imp'], ['???', 'imp'],
      ['CPY', 'zpg'], ['CMP', 'zpg'], ['DEC', 'zpg'], ['???', 'imp'],
      ['INY', 'imp'], ['CMP', 'imm'], ['DEX', 'imp'], ['???', 'imp'],
      ['CPY', 'abs'], ['CMP', 'abs'], ['DEC', 'abs'], ['???', 'imp'],
      ['BNE', 'rel'], ['CMP', 'iny'], ['???', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['CMP', 'zpx'], ['DEC', 'zpx'], ['???', 'imp'],
      ['CLD', 'imp'], ['CMP', 'aby'], ['???', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['CMP', 'abx'], ['DEC', 'abx'], ['???', 'imp'],
      ['CPX', 'imm'], ['SBC', 'inx'], ['???', 'imp'], ['???', 'imp'],
      ['CPX', 'zpg'], ['SBC', 'zpg'], ['INC', 'zpg'], ['???', 'imp'],
      ['INX', 'imp'], ['SBC', 'imm'], ['NOP', 'imp'], ['???', 'imp'],
      ['CPX', 'abs'], ['SBC', 'abs'], ['INC', 'abs'], ['???', 'imp'],
      ['BEQ', 'rel'], ['SBC', 'iny'], ['???', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['SBC', 'zpx'], ['INC', 'zpx'], ['???', 'imp'],
      ['SED', 'imp'], ['SBC', 'aby'], ['???', 'imp'], ['???', 'imp'],
      ['???', 'imp'], ['SBC', 'abx'], ['INC', 'abx'], ['???', 'imp']
  ];

  var addrtab = {
    acc: 'A',
    abs: 'abs',
    abx: 'abs,X',
    aby: 'abs,Y',
    imm: '#',
    imp: 'impl',
    ind: 'ind',
    inx: 'X,ind',
    iny: 'ind,Y',
    rel: 'rel',
    zpg: 'zpg',
    zpx: 'zpg,X',
    zpy: 'zpg,Y'
  }

  var steptab = {
    imp: 1,
    acc: 1,
    imm: 2,
    abs: 3,
    abx: 3,
    aby: 3,
    zpg: 2,
    zpx: 2,
    zpy: 2,
    ind: 3,
    inx: 2,
    iny: 2,
    rel: 2
  };

  // public functions
  // startAddr :     disassemble from (hex)
  // stopAddr  :     dissasemble to (hex)
  my.disassemble = function(inputStartAddr, inputStopAddr) {

    // safety checks
    inputStartAddr = inputStartAddr & 0xffff;
    inputStopAddr  = inputStopAddr & 0xffff;

    // disassemble
    var code = [];

    my.pc = inputStartAddr;
    while (my.pc < inputStopAddr && my.pc < my.endAddr) {
      line = disassembleStep();
      code.push(line);
    }
    
    var result = {
      'type': 'code',
      'start': inputStartAddr,
      'end': my.pc,
      'code': code,
    }
    return result;
  }
	
  function disassembleStep() {
    var instr, op1, op2, addr, ops, disas, adm, step;

    // get instruction and ops, inc pc
    instr = my.ByteAt(my.pc);
    addr  = my.pc;
    ops   = my.getHexByte(instr) + ' ';
    adm   = opctab[instr][1];
    step  = steptab[adm];
    if (step > 1) {
      op1 = my.getHexByte(my.ByteAt(my.pc + 1));
      if (step > 2) {
        op2 = my.getHexByte(my.ByteAt(my.pc + 2));
      }
    }
    // format and output to listing
    disas = '';
    switch (adm) {
    case 'imm':
      ops += op1;
      disas += '#$' + op1;
      break;
    case 'zpg':
      ops += op1;
      disas += '$' + op1;
      break;
    case 'acc':
      ops += '';
      disas += 'A';
      break;
    case 'abs':
      ops += op1 + ' ' + op2;
      disas += '$' + op2 + op1;
      break;
    case 'zpx':
      ops += op1;
      disas += '$' + op1 + ',X';
      break;
    case 'zpy':
      ops += op1;
      disas += '$' + op1 + ',Y';
      break;
    case 'abx':
      ops += op1 + ' ' + op2;
      disas += '$' + op2 + op1 + ',X';
      break;
    case 'aby':
      ops += op1 + ' ' + op2;
      disas += '$' + op2 + op1 + ',Y';
      break;
    case 'iny':
      ops += op1;
      disas += '($' + op1 + '),Y';
      break;
    case 'inx':
      ops += op1;
      disas += '($' + op1 + ',X)';
      break;
    case 'rel':
      var opv = my.ByteAt(my.pc + 1);
      var targ = my.pc + 2;
      if (opv & 128) {
        targ -= (opv ^ 255) + 1;
      } else {
        targ += opv;
      }
      targ &= 0xffff;
      ops += op1;
      disas += '$' + my.getHexWord(targ);
      break;
    case 'ind':
      ops += op1 + ' ' + op2;
      disas += '($' + op2 + op1 + ')';
      break;
    default:
      ops += '';
    }
    my.pc = (my.pc + step) & 0xffff;

    return {
      'addr': addr,
      'ops': ops.trim() ,
      'instr': opctab[instr][0],
      'disas': disas,
    };
  }

  return my;

}(App || {}, jQuery));