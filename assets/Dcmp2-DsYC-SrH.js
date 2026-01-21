import{k as _}from"./index-CMEpbKl5.js";var p=Object.getOwnPropertyNames,c=(o,s)=>function(){return s||(0,o[p(o)[0]])((s={exports:{}}).exports,s),s.exports},w=c({"<stdin>"(o){(function(s,x){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream","./BytesWithIo"],x):typeof o=="object"&&o!==null&&typeof o.nodeType!="number"?x(o,_.KaitaiStream,require("./BytesWithIo")):x(s.Dcmp2||(s.Dcmp2={}),s.KaitaiStream,s.BytesWithIo||(s.BytesWithIo={}))})(typeof self<"u"?self:o,function(s,x,l){var d=(function(){function a(e,r,n,t,i){this._io=e,this._parent=r,this._root=n||this,this.lenDecompressed=t,this.headerParametersWithIo=i,this._debug={},this._read()}a.prototype._read=function(){if(this.headerParameters.flags.hasCustomLookupTable){this._debug.customLookupTable={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.customLookupTable.arr=[],this.customLookupTable=[];for(var e=0;e<this.headerParameters.numCustomLookupTableEntries;e++)this._debug.customLookupTable.arr[e]={start:this._io.pos,ioOffset:this._io.byteOffset},this.customLookupTable.push(this._io.readBytes(2)),this._debug.customLookupTable.arr[e].end=this._io.pos;this._debug.customLookupTable.end=this._io.pos}switch(this._debug.data={start:this._io.pos,ioOffset:this._io.byteOffset},this.headerParameters.flags.tagged){case!0:this._raw_data=this._io.readBytes(this._io.size-this._io.pos-(this.isLenDecompressedOdd?1:0));var r=new x(this._raw_data);this.data=new u(r,this,this._root);break;default:this._raw_data=this._io.readBytes(this._io.size-this._io.pos-(this.isLenDecompressedOdd?1:0));var r=new x(this._raw_data);this.data=new y(r,this,this._root);break}this._debug.data.end=this._io.pos,this.isLenDecompressedOdd&&(this._debug.lastByte={start:this._io.pos,ioOffset:this._io.byteOffset},this.lastByte=this._io.readBytes(1),this._debug.lastByte.end=this._io.pos)};var f=a.HeaderParameters=(function(){function e(n,t,i){this._io=n,this._parent=t,this._root=i,this._debug={},this._read()}e.prototype._read=function(){this._debug.unknown={start:this._io.pos,ioOffset:this._io.byteOffset},this.unknown=this._io.readU2be(),this._debug.unknown.end=this._io.pos,this._debug.numCustomLookupTableEntriesM1={start:this._io.pos,ioOffset:this._io.byteOffset},this.numCustomLookupTableEntriesM1=this._io.readU1(),this._debug.numCustomLookupTableEntriesM1.end=this._io.pos,this._debug.flags={start:this._io.pos,ioOffset:this._io.byteOffset},this.flags=new r(this._io,this,this._root),this._debug.flags.end=this._io.pos};var r=e.Flags=(function(){function n(t,i,h){this._io=t,this._parent=i,this._root=h,this._debug={},this._read()}return n.prototype._read=function(){this._debug.reserved={start:this._io.pos,ioOffset:this._io.byteOffset},this.reserved=this._io.readBitsIntBe(6),this._debug.reserved.end=this._io.pos,this._debug.tagged={start:this._io.pos,ioOffset:this._io.byteOffset},this.tagged=this._io.readBitsIntBe(1)!=0,this._debug.tagged.end=this._io.pos,this._debug.hasCustomLookupTable={start:this._io.pos,ioOffset:this._io.byteOffset},this.hasCustomLookupTable=this._io.readBitsIntBe(1)!=0,this._debug.hasCustomLookupTable.end=this._io.pos},Object.defineProperty(n.prototype,"asInt",{get:function(){if(this._m_asInt!==void 0)return this._m_asInt;var t=this._io.pos;return this._io.seek(0),this._debug._m_asInt={start:this._io.pos,ioOffset:this._io.byteOffset},this._m_asInt=this._io.readU1(),this._debug._m_asInt.end=this._io.pos,this._io.seek(t),this._m_asInt}}),n})();return Object.defineProperty(e.prototype,"numCustomLookupTableEntries",{get:function(){return this._m_numCustomLookupTableEntries!==void 0?this._m_numCustomLookupTableEntries:(this.flags.hasCustomLookupTable&&(this._debug._m_numCustomLookupTableEntries={},this._m_numCustomLookupTableEntries=this.numCustomLookupTableEntriesM1+1),this._m_numCustomLookupTableEntries)}}),e})(),u=a.TaggedData=(function(){function e(n,t,i){this._io=n,this._parent=t,this._root=i,this._debug={},this._read()}e.prototype._read=function(){for(this._debug.chunks={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.chunks.arr=[],this.chunks=[];!this._io.isEof();)this._debug.chunks.arr[this.chunks.length]={start:this._io.pos,ioOffset:this._io.byteOffset},this.chunks.push(new r(this._io,this,this._root)),this._debug.chunks.arr[this.chunks.length-1].end=this._io.pos;this._debug.chunks.end=this._io.pos};var r=e.Chunk=(function(){function n(t,i,h){this._io=t,this._parent=i,this._root=h,this._debug={},this._read()}return n.prototype._read=function(){this._debug.tag={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.tag.arr=[],this.tag=[];for(var t=0;t<8;t++)this._debug.tag.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this.tag.push(this._io.readBitsIntBe(1)!=0),this._debug.tag.arr[t].end=this._io.pos;this._debug.tag.end=this._io.pos,this._io.alignToByte(),this._debug.units={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.units.arr=[],this.units=[];var t=0;do{switch(this._debug.units.arr[this.units.length]={start:this._io.pos,ioOffset:this._io.byteOffset},this.tag[t]){case!0:var i=this._io.readU1();this.units.push(i);break;default:var i=this._io.readBytes(this.tag[t]?1:2);this.units.push(i);break}this._debug.units.arr[this.units.length-1].end=this._io.pos,t++}while(!(t>=7||this._io.isEof()));this._debug.units.end=this._io.pos},n})();return e})(),y=a.UntaggedData=(function(){function e(r,n,t){this._io=r,this._parent=n,this._root=t,this._debug={},this._read()}return e.prototype._read=function(){for(this._debug.tableReferences={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.tableReferences.arr=[],this.tableReferences=[];!this._io.isEof();)this._debug.tableReferences.arr[this.tableReferences.length]={start:this._io.pos,ioOffset:this._io.byteOffset},this.tableReferences.push(this._io.readU1()),this._debug.tableReferences.arr[this.tableReferences.length-1].end=this._io.pos;this._debug.tableReferences.end=this._io.pos},e})();return Object.defineProperty(a.prototype,"defaultLookupTable",{get:function(){return this._m_defaultLookupTable!==void 0?this._m_defaultLookupTable:(this._debug._m_defaultLookupTable={},this._m_defaultLookupTable=[new Uint8Array([0,0]),new Uint8Array([0,8]),new Uint8Array([78,186]),new Uint8Array([32,110]),new Uint8Array([78,117]),new Uint8Array([0,12]),new Uint8Array([0,4]),new Uint8Array([112,0]),new Uint8Array([0,16]),new Uint8Array([0,2]),new Uint8Array([72,110]),new Uint8Array([255,252]),new Uint8Array([96,0]),new Uint8Array([0,1]),new Uint8Array([72,231]),new Uint8Array([47,46]),new Uint8Array([78,86]),new Uint8Array([0,6]),new Uint8Array([78,94]),new Uint8Array([47,0]),new Uint8Array([97,0]),new Uint8Array([255,248]),new Uint8Array([47,11]),new Uint8Array([255,255]),new Uint8Array([0,20]),new Uint8Array([0,10]),new Uint8Array([0,24]),new Uint8Array([32,95]),new Uint8Array([0,14]),new Uint8Array([32,80]),new Uint8Array([63,60]),new Uint8Array([255,244]),new Uint8Array([76,238]),new Uint8Array([48,46]),new Uint8Array([103,0]),new Uint8Array([76,223]),new Uint8Array([38,110]),new Uint8Array([0,18]),new Uint8Array([0,28]),new Uint8Array([66,103]),new Uint8Array([255,240]),new Uint8Array([48,60]),new Uint8Array([47,12]),new Uint8Array([0,3]),new Uint8Array([78,208]),new Uint8Array([0,32]),new Uint8Array([112,1]),new Uint8Array([0,22]),new Uint8Array([45,64]),new Uint8Array([72,192]),new Uint8Array([32,120]),new Uint8Array([114,0]),new Uint8Array([88,143]),new Uint8Array([102,0]),new Uint8Array([79,239]),new Uint8Array([66,167]),new Uint8Array([103,6]),new Uint8Array([255,250]),new Uint8Array([85,143]),new Uint8Array([40,110]),new Uint8Array([63,0]),new Uint8Array([255,254]),new Uint8Array([47,60]),new Uint8Array([103,4]),new Uint8Array([89,143]),new Uint8Array([32,107]),new Uint8Array([0,36]),new Uint8Array([32,31]),new Uint8Array([65,250]),new Uint8Array([129,225]),new Uint8Array([102,4]),new Uint8Array([103,8]),new Uint8Array([0,26]),new Uint8Array([78,185]),new Uint8Array([80,143]),new Uint8Array([32,46]),new Uint8Array([0,7]),new Uint8Array([78,176]),new Uint8Array([255,242]),new Uint8Array([61,64]),new Uint8Array([0,30]),new Uint8Array([32,104]),new Uint8Array([102,6]),new Uint8Array([255,246]),new Uint8Array([78,249]),new Uint8Array([8,0]),new Uint8Array([12,64]),new Uint8Array([61,124]),new Uint8Array([255,236]),new Uint8Array([0,5]),new Uint8Array([32,60]),new Uint8Array([255,232]),new Uint8Array([222,252]),new Uint8Array([74,46]),new Uint8Array([0,48]),new Uint8Array([0,40]),new Uint8Array([47,8]),new Uint8Array([32,11]),new Uint8Array([96,2]),new Uint8Array([66,110]),new Uint8Array([45,72]),new Uint8Array([32,83]),new Uint8Array([32,64]),new Uint8Array([24,0]),new Uint8Array([96,4]),new Uint8Array([65,238]),new Uint8Array([47,40]),new Uint8Array([47,1]),new Uint8Array([103,10]),new Uint8Array([72,64]),new Uint8Array([32,7]),new Uint8Array([102,8]),new Uint8Array([1,24]),new Uint8Array([47,7]),new Uint8Array([48,40]),new Uint8Array([63,46]),new Uint8Array([48,43]),new Uint8Array([34,110]),new Uint8Array([47,43]),new Uint8Array([0,44]),new Uint8Array([103,12]),new Uint8Array([34,95]),new Uint8Array([96,6]),new Uint8Array([0,255]),new Uint8Array([48,7]),new Uint8Array([255,238]),new Uint8Array([83,64]),new Uint8Array([0,64]),new Uint8Array([255,228]),new Uint8Array([74,64]),new Uint8Array([102,10]),new Uint8Array([0,15]),new Uint8Array([78,173]),new Uint8Array([112,255]),new Uint8Array([34,216]),new Uint8Array([72,107]),new Uint8Array([0,34]),new Uint8Array([32,75]),new Uint8Array([103,14]),new Uint8Array([74,174]),new Uint8Array([78,144]),new Uint8Array([255,224]),new Uint8Array([255,192]),new Uint8Array([0,42]),new Uint8Array([39,64]),new Uint8Array([103,2]),new Uint8Array([81,200]),new Uint8Array([2,182]),new Uint8Array([72,122]),new Uint8Array([34,120]),new Uint8Array([176,110]),new Uint8Array([255,230]),new Uint8Array([0,9]),new Uint8Array([50,46]),new Uint8Array([62,0]),new Uint8Array([72,65]),new Uint8Array([255,234]),new Uint8Array([67,238]),new Uint8Array([78,113]),new Uint8Array([116,0]),new Uint8Array([47,44]),new Uint8Array([32,108]),new Uint8Array([0,60]),new Uint8Array([0,38]),new Uint8Array([0,80]),new Uint8Array([24,128]),new Uint8Array([48,31]),new Uint8Array([34,0]),new Uint8Array([102,12]),new Uint8Array([255,218]),new Uint8Array([0,56]),new Uint8Array([102,2]),new Uint8Array([48,44]),new Uint8Array([32,12]),new Uint8Array([45,110]),new Uint8Array([66,64]),new Uint8Array([255,226]),new Uint8Array([169,240]),new Uint8Array([255,0]),new Uint8Array([55,124]),new Uint8Array([229,128]),new Uint8Array([255,220]),new Uint8Array([72,104]),new Uint8Array([89,79]),new Uint8Array([0,52]),new Uint8Array([62,31]),new Uint8Array([96,8]),new Uint8Array([47,6]),new Uint8Array([255,222]),new Uint8Array([96,10]),new Uint8Array([112,2]),new Uint8Array([0,50]),new Uint8Array([255,204]),new Uint8Array([0,128]),new Uint8Array([34,81]),new Uint8Array([16,31]),new Uint8Array([49,124]),new Uint8Array([160,41]),new Uint8Array([255,216]),new Uint8Array([82,64]),new Uint8Array([1,0]),new Uint8Array([103,16]),new Uint8Array([160,35]),new Uint8Array([255,206]),new Uint8Array([255,212]),new Uint8Array([32,6]),new Uint8Array([72,120]),new Uint8Array([0,46]),new Uint8Array([80,79]),new Uint8Array([67,250]),new Uint8Array([103,18]),new Uint8Array([118,0]),new Uint8Array([65,232]),new Uint8Array([74,110]),new Uint8Array([32,217]),new Uint8Array([0,90]),new Uint8Array([127,255]),new Uint8Array([81,202]),new Uint8Array([0,92]),new Uint8Array([46,0]),new Uint8Array([2,64]),new Uint8Array([72,199]),new Uint8Array([103,20]),new Uint8Array([12,128]),new Uint8Array([46,159]),new Uint8Array([255,214]),new Uint8Array([128,0]),new Uint8Array([16,0]),new Uint8Array([72,66]),new Uint8Array([74,107]),new Uint8Array([255,210]),new Uint8Array([0,72]),new Uint8Array([74,71]),new Uint8Array([78,209]),new Uint8Array([32,111]),new Uint8Array([0,65]),new Uint8Array([96,12]),new Uint8Array([42,120]),new Uint8Array([66,46]),new Uint8Array([50,0]),new Uint8Array([101,116]),new Uint8Array([103,22]),new Uint8Array([0,68]),new Uint8Array([72,109]),new Uint8Array([32,8]),new Uint8Array([72,108]),new Uint8Array([11,124]),new Uint8Array([38,64]),new Uint8Array([4,0]),new Uint8Array([0,104]),new Uint8Array([32,109]),new Uint8Array([0,13]),new Uint8Array([42,64]),new Uint8Array([0,11]),new Uint8Array([0,62]),new Uint8Array([2,32])],this._m_defaultLookupTable)}}),Object.defineProperty(a.prototype,"headerParameters",{get:function(){if(this._m_headerParameters!==void 0)return this._m_headerParameters;var e=this.headerParametersWithIo._io,r=e.pos;return e.seek(0),this._debug._m_headerParameters={start:e.pos,ioOffset:e.byteOffset},this._m_headerParameters=new f(e,this,this._root),this._debug._m_headerParameters.end=e.pos,e.seek(r),this._m_headerParameters}}),Object.defineProperty(a.prototype,"isLenDecompressedOdd",{get:function(){return this._m_isLenDecompressedOdd!==void 0?this._m_isLenDecompressedOdd:(this._debug._m_isLenDecompressedOdd={},this._m_isLenDecompressedOdd=x.mod(this.lenDecompressed,2)!=0,this._m_isLenDecompressedOdd)}}),Object.defineProperty(a.prototype,"lookupTable",{get:function(){return this._m_lookupTable!==void 0?this._m_lookupTable:(this._debug._m_lookupTable={},this._m_lookupTable=this.headerParameters.flags.hasCustomLookupTable?this.customLookupTable:this.defaultLookupTable,this._m_lookupTable)}}),a})();s.Dcmp2=d})}});const A=w(),m={id:"dcmp_2",title:"Compressed Macintosh resource data, Apple `'dcmp' (2)` format",ksy:{meta:{id:"dcmp_2",title:"Compressed Macintosh resource data, Apple `'dcmp' (2)` format",application:"Mac OS",license:"MIT","ks-version":"0.8",imports:["/common/bytes_with_io"],endian:"be"},doc:`Compressed resource data in \`'dcmp' (2)\` format,
as stored in compressed resources with header type \`9\` and decompressor ID \`2\`.

The \`'dcmp' (2)\` decompressor resource is included in the System file of System 7.0 and later.
This compression format is used for a few compressed resources in System 7.0's files
(such as the System file).
This decompressor is also included with and used by some other Apple applications,
such as ResEdit.
(Note: ResEdit includes the \`'dcmp' (2)\` resource,
but none of its resources actually use this decompressor.)

This compression format is based on simple dictionary coding,
where each byte in the compressed data expands to two bytes,
based on a lookup table
(either included in the compressed data or provided by the decompressor).
An alternative "tagged" compression format is also supported,
which allows using two-byte literals in addition to single-byte table references,
at the cost of requiring an extra "tag" byte every 16 output bytes,
to differentiate literals and table references.
`,"doc-ref":"https://github.com/dgelessus/python-rsrcfork/blob/f891a6e/src/rsrcfork/compress/dcmp2.py",params:[{id:"len_decompressed",type:"u4",doc:`The length of the decompressed data in bytes,
from the compressed resource header.
`},{id:"header_parameters_with_io",type:"bytes_with_io",doc:`The unparsed decompressor-specific parameters,
from the compressed resource header.
`}],seq:[{id:"custom_lookup_table",size:2,repeat:"expr","repeat-expr":"header_parameters.num_custom_lookup_table_entries",if:"header_parameters.flags.has_custom_lookup_table",doc:`The custom lookup table to be used instead of the default lookup table.
`},{id:"data",type:{"switch-on":"header_parameters.flags.tagged",cases:{true:"tagged_data",_:"untagged_data"}},size:`_io.size - _io.pos - (is_len_decompressed_odd ? 1 : 0)
`,doc:`The compressed data.
The structure of the data varies depending on whether the "tagged" or "untagged" variant of the compression format is used.
`},{id:"last_byte",size:1,if:"is_len_decompressed_odd",doc:`The last byte of the decompressed data,
stored literally.
Only present if the decompressed data has an odd length.

This special case is necessary because the compressed data is otherwise always stored in two-byte groups,
either literally or as table references,
so otherwise there would be no way to compress odd-length resources using this format.
`}],instances:{header_parameters:{io:"header_parameters_with_io._io",pos:0,type:"header_parameters",doc:`The parsed decompressor-specific parameters from the compressed resource header.
`},is_len_decompressed_odd:{value:"len_decompressed % 2 != 0",doc:`Whether the length of the decompressed data is odd.
This affects the meaning of the last byte of the compressed data.
`},default_lookup_table:{value:`[
  [0x00, 0x00], [0x00, 0x08], [0x4e, 0xba], [0x20, 0x6e],
  [0x4e, 0x75], [0x00, 0x0c], [0x00, 0x04], [0x70, 0x00],
  [0x00, 0x10], [0x00, 0x02], [0x48, 0x6e], [0xff, 0xfc],
  [0x60, 0x00], [0x00, 0x01], [0x48, 0xe7], [0x2f, 0x2e],
  [0x4e, 0x56], [0x00, 0x06], [0x4e, 0x5e], [0x2f, 0x00],
  [0x61, 0x00], [0xff, 0xf8], [0x2f, 0x0b], [0xff, 0xff],
  [0x00, 0x14], [0x00, 0x0a], [0x00, 0x18], [0x20, 0x5f],
  [0x00, 0x0e], [0x20, 0x50], [0x3f, 0x3c], [0xff, 0xf4],
  [0x4c, 0xee], [0x30, 0x2e], [0x67, 0x00], [0x4c, 0xdf],
  [0x26, 0x6e], [0x00, 0x12], [0x00, 0x1c], [0x42, 0x67],
  [0xff, 0xf0], [0x30, 0x3c], [0x2f, 0x0c], [0x00, 0x03],
  [0x4e, 0xd0], [0x00, 0x20], [0x70, 0x01], [0x00, 0x16],
  [0x2d, 0x40], [0x48, 0xc0], [0x20, 0x78], [0x72, 0x00],
  [0x58, 0x8f], [0x66, 0x00], [0x4f, 0xef], [0x42, 0xa7],
  [0x67, 0x06], [0xff, 0xfa], [0x55, 0x8f], [0x28, 0x6e],
  [0x3f, 0x00], [0xff, 0xfe], [0x2f, 0x3c], [0x67, 0x04],
  [0x59, 0x8f], [0x20, 0x6b], [0x00, 0x24], [0x20, 0x1f],
  [0x41, 0xfa], [0x81, 0xe1], [0x66, 0x04], [0x67, 0x08],
  [0x00, 0x1a], [0x4e, 0xb9], [0x50, 0x8f], [0x20, 0x2e],
  [0x00, 0x07], [0x4e, 0xb0], [0xff, 0xf2], [0x3d, 0x40],
  [0x00, 0x1e], [0x20, 0x68], [0x66, 0x06], [0xff, 0xf6],
  [0x4e, 0xf9], [0x08, 0x00], [0x0c, 0x40], [0x3d, 0x7c],
  [0xff, 0xec], [0x00, 0x05], [0x20, 0x3c], [0xff, 0xe8],
  [0xde, 0xfc], [0x4a, 0x2e], [0x00, 0x30], [0x00, 0x28],
  [0x2f, 0x08], [0x20, 0x0b], [0x60, 0x02], [0x42, 0x6e],
  [0x2d, 0x48], [0x20, 0x53], [0x20, 0x40], [0x18, 0x00],
  [0x60, 0x04], [0x41, 0xee], [0x2f, 0x28], [0x2f, 0x01],
  [0x67, 0x0a], [0x48, 0x40], [0x20, 0x07], [0x66, 0x08],
  [0x01, 0x18], [0x2f, 0x07], [0x30, 0x28], [0x3f, 0x2e],
  [0x30, 0x2b], [0x22, 0x6e], [0x2f, 0x2b], [0x00, 0x2c],
  [0x67, 0x0c], [0x22, 0x5f], [0x60, 0x06], [0x00, 0xff],
  [0x30, 0x07], [0xff, 0xee], [0x53, 0x40], [0x00, 0x40],
  [0xff, 0xe4], [0x4a, 0x40], [0x66, 0x0a], [0x00, 0x0f],
  [0x4e, 0xad], [0x70, 0xff], [0x22, 0xd8], [0x48, 0x6b],
  [0x00, 0x22], [0x20, 0x4b], [0x67, 0x0e], [0x4a, 0xae],
  [0x4e, 0x90], [0xff, 0xe0], [0xff, 0xc0], [0x00, 0x2a],
  [0x27, 0x40], [0x67, 0x02], [0x51, 0xc8], [0x02, 0xb6],
  [0x48, 0x7a], [0x22, 0x78], [0xb0, 0x6e], [0xff, 0xe6],
  [0x00, 0x09], [0x32, 0x2e], [0x3e, 0x00], [0x48, 0x41],
  [0xff, 0xea], [0x43, 0xee], [0x4e, 0x71], [0x74, 0x00],
  [0x2f, 0x2c], [0x20, 0x6c], [0x00, 0x3c], [0x00, 0x26],
  [0x00, 0x50], [0x18, 0x80], [0x30, 0x1f], [0x22, 0x00],
  [0x66, 0x0c], [0xff, 0xda], [0x00, 0x38], [0x66, 0x02],
  [0x30, 0x2c], [0x20, 0x0c], [0x2d, 0x6e], [0x42, 0x40],
  [0xff, 0xe2], [0xa9, 0xf0], [0xff, 0x00], [0x37, 0x7c],
  [0xe5, 0x80], [0xff, 0xdc], [0x48, 0x68], [0x59, 0x4f],
  [0x00, 0x34], [0x3e, 0x1f], [0x60, 0x08], [0x2f, 0x06],
  [0xff, 0xde], [0x60, 0x0a], [0x70, 0x02], [0x00, 0x32],
  [0xff, 0xcc], [0x00, 0x80], [0x22, 0x51], [0x10, 0x1f],
  [0x31, 0x7c], [0xa0, 0x29], [0xff, 0xd8], [0x52, 0x40],
  [0x01, 0x00], [0x67, 0x10], [0xa0, 0x23], [0xff, 0xce],
  [0xff, 0xd4], [0x20, 0x06], [0x48, 0x78], [0x00, 0x2e],
  [0x50, 0x4f], [0x43, 0xfa], [0x67, 0x12], [0x76, 0x00],
  [0x41, 0xe8], [0x4a, 0x6e], [0x20, 0xd9], [0x00, 0x5a],
  [0x7f, 0xff], [0x51, 0xca], [0x00, 0x5c], [0x2e, 0x00],
  [0x02, 0x40], [0x48, 0xc7], [0x67, 0x14], [0x0c, 0x80],
  [0x2e, 0x9f], [0xff, 0xd6], [0x80, 0x00], [0x10, 0x00],
  [0x48, 0x42], [0x4a, 0x6b], [0xff, 0xd2], [0x00, 0x48],
  [0x4a, 0x47], [0x4e, 0xd1], [0x20, 0x6f], [0x00, 0x41],
  [0x60, 0x0c], [0x2a, 0x78], [0x42, 0x2e], [0x32, 0x00],
  [0x65, 0x74], [0x67, 0x16], [0x00, 0x44], [0x48, 0x6d],
  [0x20, 0x08], [0x48, 0x6c], [0x0b, 0x7c], [0x26, 0x40],
  [0x04, 0x00], [0x00, 0x68], [0x20, 0x6d], [0x00, 0x0d],
  [0x2a, 0x40], [0x00, 0x0b], [0x00, 0x3e], [0x02, 0x20],
]
`,doc:`The default lookup table,
which is used if no custom lookup table is included with the compressed data.
`},lookup_table:{value:`header_parameters.flags.has_custom_lookup_table
? custom_lookup_table
: default_lookup_table
`,doc:`The lookup table to be used for this compressed data.
`}},types:{header_parameters:{doc:`Decompressor-specific parameters for this compression format,
as stored in the compressed resource header.
`,seq:[{id:"unknown",type:"u2",doc:`The meaning of this field is unknown.
It does not appear to have any effect on the format of the compressed data or the decompression process.

The value of this field is usually zero and otherwise a small integer (< 10).
For \`'lpch'\` resources,
the value is always nonzero,
and sometimes larger than usual.
`},{id:"num_custom_lookup_table_entries_m1",type:"u1",doc:`The number of entries in the custom lookup table,
minus one.

If the default lookup table is used rather than a custom one,
this value is zero.
`},{id:"flags",type:"flags",doc:`Various flags that affect the format of the compressed data and the decompression process.
`}],instances:{num_custom_lookup_table_entries:{value:"num_custom_lookup_table_entries_m1 + 1",if:"flags.has_custom_lookup_table",doc:`The number of entries in the custom lookup table.
Only used if a custom lookup table is present.
`}},types:{flags:{doc:`Flags for the decompressor,
as stored in the decompressor-specific parameters.
`,seq:[{id:"reserved",type:"b6",doc:`These flags have no known usage or meaning and should always be zero.
`},{id:"tagged",type:"b1",doc:`Whether the "tagged" variant of this compression format should be used,
rather than the default "untagged" variant.
`},{id:"has_custom_lookup_table",type:"b1",doc:`Whether a custom lookup table is included before the compressed data,
which should be used instead of the default hardcoded lookup table.
`}],instances:{as_int:{pos:0,type:"u1",doc:`The flags as a packed integer,
as they are stored in the data.
`}}}}},untagged_data:{doc:`Compressed data in the "untagged" variant of the format.
`,seq:[{id:"table_references",type:"u1",repeat:"eos",doc:`References into the lookup table.
Each reference is an integer that is expanded to two bytes by looking it up in the table.
`}]},tagged_data:{doc:`Compressed data in the "tagged" variant of the format.
`,seq:[{id:"chunks",type:"chunk",repeat:"eos",doc:`The tagged chunks that make up the compressed data.
`}],types:{chunk:{doc:`A single tagged chunk of compressed data.

Each chunk expands to 16 bytes of decompressed data.
In compressed form,
the chunks have a variable length
(between 9 and 17 bytes)
depending on the value of the tag byte.
`,seq:[{id:"tag",type:"b1",repeat:"expr","repeat-expr":8,doc:`The bits of the tag byte control the format and meaning of the 8 compressed data units that follow the tag byte.
`},{id:"units",type:{"switch-on":"tag[_index]",cases:{true:"u1"}},size:`tag[_index] ? 1 : 2
`,repeat:"until","repeat-until":"_index >= 7 or _io.eof",doc:`The compressed data units in this chunk.

The format and meaning of each unit is controlled by the bit in the tag byte with the same index.
If the bit is 0 (false),
the unit is a pair of bytes,
which are literally copied to the decompressed data.
If the bit is 1 (true),
the unit is a reference into the lookup table,
an integer which is expanded to two bytes by looking it up in the table.
`}]}}}}}};export{A as default,m as spec};
