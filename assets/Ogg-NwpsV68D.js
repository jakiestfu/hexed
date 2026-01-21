import{k as d}from"./index-CMEpbKl5.js";var f=Object.getOwnPropertyNames,_=(n,t)=>function(){return t||(0,n[f(n)[0]])((t={exports:{}}).exports,t),t.exports},p=_({"<stdin>"(n){(function(t,i){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream"],i):typeof n=="object"&&n!==null&&typeof n.nodeType!="number"?i(n,d.KaitaiStream):i(t.Ogg||(t.Ogg={}),t.KaitaiStream)})(typeof self<"u"?self:n,function(t,i){var r=(function(){function a(o,s,e){this._io=o,this._parent=s,this._root=e||this,this._debug={},this._read()}a.prototype._read=function(){for(this._debug.pages={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.pages.arr=[],this.pages=[];!this._io.isEof();)this._debug.pages.arr[this.pages.length]={start:this._io.pos,ioOffset:this._io.byteOffset},this.pages.push(new h(this._io,this,this._root)),this._debug.pages.arr[this.pages.length-1].end=this._io.pos;this._debug.pages.end=this._io.pos};var h=a.Page=(function(){function o(s,e,g){this._io=s,this._parent=e,this._root=g,this._debug={},this._read()}return o.prototype._read=function(){if(this._debug.syncCode={start:this._io.pos,ioOffset:this._io.byteOffset},this.syncCode=this._io.readBytes(4),this._debug.syncCode.end=this._io.pos,i.byteArrayCompare(this.syncCode,new Uint8Array([79,103,103,83]))!=0){var s=new i.ValidationNotEqualError(new Uint8Array([79,103,103,83]),this.syncCode,this._io,"/types/page/seq/0");throw this._debug.syncCode.validationError=s,s}if(this._debug.version={start:this._io.pos,ioOffset:this._io.byteOffset},this.version=this._io.readBytes(1),this._debug.version.end=this._io.pos,i.byteArrayCompare(this.version,new Uint8Array([0]))!=0){var s=new i.ValidationNotEqualError(new Uint8Array([0]),this.version,this._io,"/types/page/seq/1");throw this._debug.version.validationError=s,s}this._debug.reserved1={start:this._io.pos,ioOffset:this._io.byteOffset},this.reserved1=this._io.readBitsIntBe(5),this._debug.reserved1.end=this._io.pos,this._debug.isEndOfStream={start:this._io.pos,ioOffset:this._io.byteOffset},this.isEndOfStream=this._io.readBitsIntBe(1)!=0,this._debug.isEndOfStream.end=this._io.pos,this._debug.isBeginningOfStream={start:this._io.pos,ioOffset:this._io.byteOffset},this.isBeginningOfStream=this._io.readBitsIntBe(1)!=0,this._debug.isBeginningOfStream.end=this._io.pos,this._debug.isContinuation={start:this._io.pos,ioOffset:this._io.byteOffset},this.isContinuation=this._io.readBitsIntBe(1)!=0,this._debug.isContinuation.end=this._io.pos,this._io.alignToByte(),this._debug.granulePos={start:this._io.pos,ioOffset:this._io.byteOffset},this.granulePos=this._io.readU8le(),this._debug.granulePos.end=this._io.pos,this._debug.bitstreamSerial={start:this._io.pos,ioOffset:this._io.byteOffset},this.bitstreamSerial=this._io.readU4le(),this._debug.bitstreamSerial.end=this._io.pos,this._debug.pageSeqNum={start:this._io.pos,ioOffset:this._io.byteOffset},this.pageSeqNum=this._io.readU4le(),this._debug.pageSeqNum.end=this._io.pos,this._debug.crc32={start:this._io.pos,ioOffset:this._io.byteOffset},this.crc32=this._io.readU4le(),this._debug.crc32.end=this._io.pos,this._debug.numSegments={start:this._io.pos,ioOffset:this._io.byteOffset},this.numSegments=this._io.readU1(),this._debug.numSegments.end=this._io.pos,this._debug.lenSegments={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.lenSegments.arr=[],this.lenSegments=[];for(var e=0;e<this.numSegments;e++)this._debug.lenSegments.arr[e]={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenSegments.push(this._io.readU1()),this._debug.lenSegments.arr[e].end=this._io.pos;this._debug.lenSegments.end=this._io.pos,this._debug.segments={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.segments.arr=[],this.segments=[];for(var e=0;e<this.numSegments;e++)this._debug.segments.arr[e]={start:this._io.pos,ioOffset:this._io.byteOffset},this.segments.push(this._io.readBytes(this.lenSegments[e])),this._debug.segments.arr[e].end=this._io.pos;this._debug.segments.end=this._io.pos},o})();return a})();t.Ogg=r})}});const m=p(),c={id:"ogg",title:"Ogg media container file",ksy:{meta:{id:"ogg",title:"Ogg media container file","file-extension":["ogg","ogv","oga","spx","ogx"],xref:{justsolve:"Ogg",loc:"fdd000026",pronom:"fmt/944",wikidata:"Q188199"},license:"CC0-1.0",endian:"le"},doc:`Ogg is a popular media container format, which provides basic
streaming / buffering mechanisms and is content-agnostic. Most
popular codecs that are used within Ogg streams are Vorbis (thus
making Ogg/Vorbis streams) and Theora (Ogg/Theora).

Ogg stream is a sequence Ogg pages. They can be read sequentially,
or one can jump into arbitrary stream location and scan for "OggS"
sync code to find the beginning of a new Ogg page and continue
decoding the stream contents from that one.
`,seq:[{id:"pages",repeat:"eos",type:"page"}],types:{page:{doc:`Ogg page is a basic unit of data in an Ogg bitstream, usually
it's around 4-8 KB, with a maximum size of 65307 bytes.
`,seq:[{id:"sync_code",contents:"OggS"},{id:"version",contents:[0],doc:"Version of the Ogg bitstream format. Currently must be 0."},{id:"reserved1",type:"b5"},{id:"is_end_of_stream",type:"b1",doc:`EOS (End Of Stream) mark. This page is the last page in the
logical bitstream. The EOS flag must be set on the final page of
every logical bitstream, and must not be set on any other page.
`},{id:"is_beginning_of_stream",type:"b1",doc:`BOS (Beginning Of Stream) mark. This page is the first page in
the logical bitstream. The BOS flag must be set on the first
page of every logical bitstream, and must not be set on any
other page.
`},{id:"is_continuation",type:"b1",doc:`The first packet on this page is a continuation of the previous
packet in the logical bitstream.
`},{id:"granule_pos",type:"u8",doc:`"Granule position" is the time marker in Ogg files. It is an
abstract value, whose meaning is determined by the codec. It
may, for example, be a count of the number of samples, the
number of frames or a more complex scheme.
`},{id:"bitstream_serial",type:"u4",doc:`Serial number that identifies a page as belonging to a
particular logical bitstream. Each logical bitstream in a file
has a unique value, and this field allows implementations to
deliver the pages to the appropriate decoder. In a typical
Vorbis and Theora file, one stream is the audio (Vorbis), and
the other is the video (Theora).
`},{id:"page_seq_num",type:"u4",doc:`Sequential number of page, guaranteed to be monotonically
increasing for each logical bitstream. The first page is 0, the
second 1, etc. This allows implementations to detect when data
has been lost.
`},{id:"crc32",type:"u4",doc:`This field provides a CRC32 checksum of the data in the entire
page (including the page header, calculated with the checksum
field set to 0). This allows verification that the data has not
been corrupted since it was created. Pages that fail the
checksum should be discarded. The checksum is generated using a
polynomial value of 0x04C11DB7.
`},{id:"num_segments",type:"u1",doc:`The number of segments that exist in this page. There can be a
maximum of 255 segments in any one page.
`},{id:"len_segments",type:"u1",repeat:"expr","repeat-expr":"num_segments",doc:`Table of lengths of segments.
`},{id:"segments",repeat:"expr","repeat-expr":"num_segments",size:"len_segments[_index]",doc:"Segment content bytes make up the rest of the Ogg page."}]}}}};export{m as default,c as spec};
