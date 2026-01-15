import{k as A}from"./index-Cy_iKu7E.js";var U=Object.getOwnPropertyNames,k=(l,r)=>function(){return r||(0,l[U(l)[0]])((r={exports:{}}).exports,r),r.exports},T=k({"<stdin>"(l){(function(r,x){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream","./DcmpVariableLengthInteger"],x):typeof l=="object"&&l!==null&&typeof l.nodeType!="number"?x(l,A.KaitaiStream,require("./DcmpVariableLengthInteger")):x(r.Dcmp0||(r.Dcmp0={}),r.KaitaiStream,r.DcmpVariableLengthInteger||(r.DcmpVariableLengthInteger={}))})(typeof self<"u"?self:l,function(r,x,d){var y=(function(){function i(a,p,c){this._io=a,this._parent=p,this._root=c||this,this._debug={},this._read()}i.prototype._read=function(){this._debug.chunks={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.chunks.arr=[],this.chunks=[];do{this._debug.chunks.arr[this.chunks.length]={start:this._io.pos,ioOffset:this._io.byteOffset};var a=new g(this._io,this,this._root);this.chunks.push(a),this._debug.chunks.arr[this.chunks.length-1].end=this._io.pos}while(a.tag!=255);this._debug.chunks.end=this._io.pos};var g=i.Chunk=(function(){a.TagKind=Object.freeze({INVALID:-1,LITERAL:0,BACKREFERENCE:1,TABLE_LOOKUP:2,EXTENDED:3,END:4,"-1":"INVALID",0:"LITERAL",1:"BACKREFERENCE",2:"TABLE_LOOKUP",3:"EXTENDED",4:"END"});function a(e,s,o){this._io=e,this._parent=s,this._root=o,this._debug={},this._read()}a.prototype._read=function(){switch(this._debug.tag={start:this._io.pos,ioOffset:this._io.byteOffset},this.tag=this._io.readU1(),this._debug.tag.end=this._io.pos,this._debug.body={start:this._io.pos,ioOffset:this._io.byteOffset},this.tag>=0&&this.tag<=31?i.Chunk.TagKind.LITERAL:this.tag>=32&&this.tag<=74?i.Chunk.TagKind.BACKREFERENCE:this.tag>=75&&this.tag<=253?i.Chunk.TagKind.TABLE_LOOKUP:this.tag==254?i.Chunk.TagKind.EXTENDED:this.tag==255?i.Chunk.TagKind.END:i.Chunk.TagKind.INVALID){case i.Chunk.TagKind.BACKREFERENCE:this.body=new p(this._io,this,this._root,this.tag);break;case i.Chunk.TagKind.END:this.body=new c(this._io,this,this._root);break;case i.Chunk.TagKind.EXTENDED:this.body=new b(this._io,this,this._root);break;case i.Chunk.TagKind.LITERAL:this.body=new m(this._io,this,this._root,this.tag);break;case i.Chunk.TagKind.TABLE_LOOKUP:this.body=new w(this._io,this,this._root,this.tag);break}this._debug.body.end=this._io.pos};var p=a.BackreferenceBody=(function(){function e(s,o,h,_){this._io=s,this._parent=o,this._root=h,this.tag=_,this._debug={},this._read()}return e.prototype._read=function(){if(this.isIndexSeparate){switch(this._debug.indexSeparateMinus={start:this._io.pos,ioOffset:this._io.byteOffset},this.tag){case 32:this.indexSeparateMinus=this._io.readU1();break;case 33:this.indexSeparateMinus=this._io.readU1();break;case 34:this.indexSeparateMinus=this._io.readU2be();break}this._debug.indexSeparateMinus.end=this._io.pos}},Object.defineProperty(e.prototype,"index",{get:function(){return this._m_index!==void 0?this._m_index:(this._debug._m_index={},this._m_index=this.isIndexSeparate?this.indexSeparate:this.indexInTag,this._m_index)}}),Object.defineProperty(e.prototype,"indexInTag",{get:function(){return this._m_indexInTag!==void 0?this._m_indexInTag:(this._debug._m_indexInTag={},this._m_indexInTag=this.tag-35,this._m_indexInTag)}}),Object.defineProperty(e.prototype,"indexSeparate",{get:function(){return this._m_indexSeparate!==void 0?this._m_indexSeparate:(this.isIndexSeparate&&(this._debug._m_indexSeparate={},this._m_indexSeparate=this.indexSeparateMinus+40+(this.tag==33?256:0)),this._m_indexSeparate)}}),Object.defineProperty(e.prototype,"isIndexSeparate",{get:function(){return this._m_isIndexSeparate!==void 0?this._m_isIndexSeparate:(this._debug._m_isIndexSeparate={},this._m_isIndexSeparate=this.tag>=32&&this.tag<=34,this._m_isIndexSeparate)}}),e})(),c=a.EndBody=(function(){function e(s,o,h){this._io=s,this._parent=o,this._root=h,this._debug={},this._read()}return e.prototype._read=function(){},e})(),b=a.ExtendedBody=(function(){function e(n,t,u){this._io=n,this._parent=t,this._root=u,this._debug={},this._read()}e.prototype._read=function(){switch(this._debug.tag={start:this._io.pos,ioOffset:this._io.byteOffset},this.tag=this._io.readU1(),this._debug.tag.end=this._io.pos,this._debug.body={start:this._io.pos,ioOffset:this._io.byteOffset},this.tag){case 0:this.body=new h(this._io,this,this._root);break;case 2:this.body=new _(this._io,this,this._root,this.tag);break;case 3:this.body=new _(this._io,this,this._root,this.tag);break;case 4:this.body=new s(this._io,this,this._root);break;case 6:this.body=new o(this._io,this,this._root);break}this._debug.body.end=this._io.pos};var s=e.DeltaEncoding16BitBody=(function(){function n(t,u,f){this._io=t,this._parent=u,this._root=f,this._debug={},this._read()}return n.prototype._read=function(){this._debug.firstValueRaw={start:this._io.pos,ioOffset:this._io.byteOffset},this.firstValueRaw=new d.DcmpVariableLengthInteger(this._io,null,null),this._debug.firstValueRaw.end=this._io.pos,this._debug.numDeltasRaw={start:this._io.pos,ioOffset:this._io.byteOffset},this.numDeltasRaw=new d.DcmpVariableLengthInteger(this._io,null,null),this._debug.numDeltasRaw.end=this._io.pos,this._debug.deltas={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.deltas.arr=[],this.deltas=[];for(var t=0;t<this.numDeltas;t++)this._debug.deltas.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this.deltas.push(this._io.readS1()),this._debug.deltas.arr[t].end=this._io.pos;this._debug.deltas.end=this._io.pos},Object.defineProperty(n.prototype,"firstValue",{get:function(){return this._m_firstValue!==void 0?this._m_firstValue:(this._debug._m_firstValue={},this._m_firstValue=this.firstValueRaw.value,this._m_firstValue)}}),Object.defineProperty(n.prototype,"numDeltas",{get:function(){return this._m_numDeltas!==void 0?this._m_numDeltas:(this._debug._m_numDeltas={},this._m_numDeltas=this.numDeltasRaw.value,this._m_numDeltas)}}),n})(),o=e.DeltaEncoding32BitBody=(function(){function n(t,u,f){this._io=t,this._parent=u,this._root=f,this._debug={},this._read()}return n.prototype._read=function(){this._debug.firstValueRaw={start:this._io.pos,ioOffset:this._io.byteOffset},this.firstValueRaw=new d.DcmpVariableLengthInteger(this._io,null,null),this._debug.firstValueRaw.end=this._io.pos,this._debug.numDeltasRaw={start:this._io.pos,ioOffset:this._io.byteOffset},this.numDeltasRaw=new d.DcmpVariableLengthInteger(this._io,null,null),this._debug.numDeltasRaw.end=this._io.pos,this._debug.deltasRaw={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.deltasRaw.arr=[],this.deltasRaw=[];for(var t=0;t<this.numDeltas;t++)this._debug.deltasRaw.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this.deltasRaw.push(new d.DcmpVariableLengthInteger(this._io,null,null)),this._debug.deltasRaw.arr[t].end=this._io.pos;this._debug.deltasRaw.end=this._io.pos},Object.defineProperty(n.prototype,"firstValue",{get:function(){return this._m_firstValue!==void 0?this._m_firstValue:(this._debug._m_firstValue={},this._m_firstValue=this.firstValueRaw.value,this._m_firstValue)}}),Object.defineProperty(n.prototype,"numDeltas",{get:function(){return this._m_numDeltas!==void 0?this._m_numDeltas:(this._debug._m_numDeltas={},this._m_numDeltas=this.numDeltasRaw.value,this._m_numDeltas)}}),n})(),h=e.JumpTableBody=(function(){function n(t,u,f){this._io=t,this._parent=u,this._root=f,this._debug={},this._read()}return n.prototype._read=function(){this._debug.segmentNumberRaw={start:this._io.pos,ioOffset:this._io.byteOffset},this.segmentNumberRaw=new d.DcmpVariableLengthInteger(this._io,null,null),this._debug.segmentNumberRaw.end=this._io.pos,this._debug.numAddressesRaw={start:this._io.pos,ioOffset:this._io.byteOffset},this.numAddressesRaw=new d.DcmpVariableLengthInteger(this._io,null,null),this._debug.numAddressesRaw.end=this._io.pos,this._debug.addressesRaw={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.addressesRaw.arr=[],this.addressesRaw=[];for(var t=0;t<this.numAddresses;t++)this._debug.addressesRaw.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this.addressesRaw.push(new d.DcmpVariableLengthInteger(this._io,null,null)),this._debug.addressesRaw.arr[t].end=this._io.pos;this._debug.addressesRaw.end=this._io.pos},Object.defineProperty(n.prototype,"numAddresses",{get:function(){return this._m_numAddresses!==void 0?this._m_numAddresses:(this._debug._m_numAddresses={},this._m_numAddresses=this.numAddressesRaw.value,this._m_numAddresses)}}),Object.defineProperty(n.prototype,"segmentNumber",{get:function(){return this._m_segmentNumber!==void 0?this._m_segmentNumber:(this._debug._m_segmentNumber={},this._m_segmentNumber=this.segmentNumberRaw.value,this._m_segmentNumber)}}),n})(),_=e.RepeatBody=(function(){function n(t,u,f,v){this._io=t,this._parent=u,this._root=f,this.tag=v,this._debug={},this._read()}return n.prototype._read=function(){this._debug.toRepeatRaw={start:this._io.pos,ioOffset:this._io.byteOffset},this.toRepeatRaw=new d.DcmpVariableLengthInteger(this._io,null,null),this._debug.toRepeatRaw.end=this._io.pos,this._debug.repeatCountM1Raw={start:this._io.pos,ioOffset:this._io.byteOffset},this.repeatCountM1Raw=new d.DcmpVariableLengthInteger(this._io,null,null),this._debug.repeatCountM1Raw.end=this._io.pos},Object.defineProperty(n.prototype,"byteCount",{get:function(){return this._m_byteCount!==void 0?this._m_byteCount:(this._debug._m_byteCount={},this._m_byteCount=this.tag==2?1:this.tag==3?2:-1,this._m_byteCount)}}),Object.defineProperty(n.prototype,"repeatCount",{get:function(){return this._m_repeatCount!==void 0?this._m_repeatCount:(this._debug._m_repeatCount={},this._m_repeatCount=this.repeatCountM1+1,this._m_repeatCount)}}),Object.defineProperty(n.prototype,"repeatCountM1",{get:function(){return this._m_repeatCountM1!==void 0?this._m_repeatCountM1:(this._debug._m_repeatCountM1={},this._m_repeatCountM1=this.repeatCountM1Raw.value,this._m_repeatCountM1)}}),Object.defineProperty(n.prototype,"toRepeat",{get:function(){return this._m_toRepeat!==void 0?this._m_toRepeat:(this._debug._m_toRepeat={},this._m_toRepeat=this.toRepeatRaw.value,this._m_toRepeat)}}),n})();return e})(),m=a.LiteralBody=(function(){function e(s,o,h,_){this._io=s,this._parent=o,this._root=h,this.tag=_,this._debug={},this._read()}return e.prototype._read=function(){this.isLenLiteralDiv2Separate&&(this._debug.lenLiteralDiv2Separate={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenLiteralDiv2Separate=this._io.readU1(),this._debug.lenLiteralDiv2Separate.end=this._io.pos),this._debug.literal={start:this._io.pos,ioOffset:this._io.byteOffset},this.literal=this._io.readBytes(this.lenLiteral),this._debug.literal.end=this._io.pos},Object.defineProperty(e.prototype,"doStore",{get:function(){return this._m_doStore!==void 0?this._m_doStore:(this._debug._m_doStore={},this._m_doStore=(this.tag&16)!=0,this._m_doStore)}}),Object.defineProperty(e.prototype,"isLenLiteralDiv2Separate",{get:function(){return this._m_isLenLiteralDiv2Separate!==void 0?this._m_isLenLiteralDiv2Separate:(this._debug._m_isLenLiteralDiv2Separate={},this._m_isLenLiteralDiv2Separate=this.lenLiteralDiv2InTag==0,this._m_isLenLiteralDiv2Separate)}}),Object.defineProperty(e.prototype,"lenLiteral",{get:function(){return this._m_lenLiteral!==void 0?this._m_lenLiteral:(this._debug._m_lenLiteral={},this._m_lenLiteral=this.lenLiteralDiv2*2,this._m_lenLiteral)}}),Object.defineProperty(e.prototype,"lenLiteralDiv2",{get:function(){return this._m_lenLiteralDiv2!==void 0?this._m_lenLiteralDiv2:(this._debug._m_lenLiteralDiv2={},this._m_lenLiteralDiv2=this.isLenLiteralDiv2Separate?this.lenLiteralDiv2Separate:this.lenLiteralDiv2InTag,this._m_lenLiteralDiv2)}}),Object.defineProperty(e.prototype,"lenLiteralDiv2InTag",{get:function(){return this._m_lenLiteralDiv2InTag!==void 0?this._m_lenLiteralDiv2InTag:(this._debug._m_lenLiteralDiv2InTag={},this._m_lenLiteralDiv2InTag=this.tag&15,this._m_lenLiteralDiv2InTag)}}),e})(),w=a.TableLookupBody=(function(){function e(s,o,h,_){this._io=s,this._parent=o,this._root=h,this.tag=_,this._debug={},this._read()}return e.prototype._read=function(){},Object.defineProperty(e.prototype,"lookupTable",{get:function(){return this._m_lookupTable!==void 0?this._m_lookupTable:(this._debug._m_lookupTable={},this._m_lookupTable=[new Uint8Array([0,0]),new Uint8Array([78,186]),new Uint8Array([0,8]),new Uint8Array([78,117]),new Uint8Array([0,12]),new Uint8Array([78,173]),new Uint8Array([32,83]),new Uint8Array([47,11]),new Uint8Array([97,0]),new Uint8Array([0,16]),new Uint8Array([112,0]),new Uint8Array([47,0]),new Uint8Array([72,110]),new Uint8Array([32,80]),new Uint8Array([32,110]),new Uint8Array([47,46]),new Uint8Array([255,252]),new Uint8Array([72,231]),new Uint8Array([63,60]),new Uint8Array([0,4]),new Uint8Array([255,248]),new Uint8Array([47,12]),new Uint8Array([32,6]),new Uint8Array([78,237]),new Uint8Array([78,86]),new Uint8Array([32,104]),new Uint8Array([78,94]),new Uint8Array([0,1]),new Uint8Array([88,143]),new Uint8Array([79,239]),new Uint8Array([0,2]),new Uint8Array([0,24]),new Uint8Array([96,0]),new Uint8Array([255,255]),new Uint8Array([80,143]),new Uint8Array([78,144]),new Uint8Array([0,6]),new Uint8Array([38,110]),new Uint8Array([0,20]),new Uint8Array([255,244]),new Uint8Array([76,238]),new Uint8Array([0,10]),new Uint8Array([0,14]),new Uint8Array([65,238]),new Uint8Array([76,223]),new Uint8Array([72,192]),new Uint8Array([255,240]),new Uint8Array([45,64]),new Uint8Array([0,18]),new Uint8Array([48,46]),new Uint8Array([112,1]),new Uint8Array([47,40]),new Uint8Array([32,84]),new Uint8Array([103,0]),new Uint8Array([0,32]),new Uint8Array([0,28]),new Uint8Array([32,95]),new Uint8Array([24,0]),new Uint8Array([38,111]),new Uint8Array([72,120]),new Uint8Array([0,22]),new Uint8Array([65,250]),new Uint8Array([48,60]),new Uint8Array([40,64]),new Uint8Array([114,0]),new Uint8Array([40,110]),new Uint8Array([32,12]),new Uint8Array([102,0]),new Uint8Array([32,107]),new Uint8Array([47,7]),new Uint8Array([85,143]),new Uint8Array([0,40]),new Uint8Array([255,254]),new Uint8Array([255,236]),new Uint8Array([34,216]),new Uint8Array([32,11]),new Uint8Array([0,15]),new Uint8Array([89,143]),new Uint8Array([47,60]),new Uint8Array([255,0]),new Uint8Array([1,24]),new Uint8Array([129,225]),new Uint8Array([74,0]),new Uint8Array([78,176]),new Uint8Array([255,232]),new Uint8Array([72,199]),new Uint8Array([0,3]),new Uint8Array([0,34]),new Uint8Array([0,7]),new Uint8Array([0,26]),new Uint8Array([103,6]),new Uint8Array([103,8]),new Uint8Array([78,249]),new Uint8Array([0,36]),new Uint8Array([32,120]),new Uint8Array([8,0]),new Uint8Array([102,4]),new Uint8Array([0,42]),new Uint8Array([78,208]),new Uint8Array([48,40]),new Uint8Array([38,95]),new Uint8Array([103,4]),new Uint8Array([0,48]),new Uint8Array([67,238]),new Uint8Array([63,0]),new Uint8Array([32,31]),new Uint8Array([0,30]),new Uint8Array([255,246]),new Uint8Array([32,46]),new Uint8Array([66,167]),new Uint8Array([32,7]),new Uint8Array([255,250]),new Uint8Array([96,2]),new Uint8Array([61,64]),new Uint8Array([12,64]),new Uint8Array([102,6]),new Uint8Array([0,38]),new Uint8Array([45,72]),new Uint8Array([47,1]),new Uint8Array([112,255]),new Uint8Array([96,4]),new Uint8Array([24,128]),new Uint8Array([74,64]),new Uint8Array([0,64]),new Uint8Array([0,44]),new Uint8Array([47,8]),new Uint8Array([0,17]),new Uint8Array([255,228]),new Uint8Array([33,64]),new Uint8Array([38,64]),new Uint8Array([255,242]),new Uint8Array([66,110]),new Uint8Array([78,185]),new Uint8Array([61,124]),new Uint8Array([0,56]),new Uint8Array([0,13]),new Uint8Array([96,6]),new Uint8Array([66,46]),new Uint8Array([32,60]),new Uint8Array([103,12]),new Uint8Array([45,104]),new Uint8Array([102,8]),new Uint8Array([74,46]),new Uint8Array([74,174]),new Uint8Array([0,46]),new Uint8Array([72,64]),new Uint8Array([34,95]),new Uint8Array([34,0]),new Uint8Array([103,10]),new Uint8Array([48,7]),new Uint8Array([66,103]),new Uint8Array([0,50]),new Uint8Array([32,40]),new Uint8Array([0,9]),new Uint8Array([72,122]),new Uint8Array([2,0]),new Uint8Array([47,43]),new Uint8Array([0,5]),new Uint8Array([34,110]),new Uint8Array([102,2]),new Uint8Array([229,128]),new Uint8Array([103,14]),new Uint8Array([102,10]),new Uint8Array([0,80]),new Uint8Array([62,0]),new Uint8Array([102,12]),new Uint8Array([46,0]),new Uint8Array([255,238]),new Uint8Array([32,109]),new Uint8Array([32,64]),new Uint8Array([255,224]),new Uint8Array([83,64]),new Uint8Array([96,8]),new Uint8Array([4,128]),new Uint8Array([0,104]),new Uint8Array([11,124]),new Uint8Array([68,0]),new Uint8Array([65,232]),new Uint8Array([72,65])],this._m_lookupTable)}}),Object.defineProperty(e.prototype,"value",{get:function(){return this._m_value!==void 0?this._m_value:(this._debug._m_value={},this._m_value=this.lookupTable[this.tag-75],this._m_value)}}),e})();return a})();return i})();r.Dcmp0=y})}});const D=T(),R={id:"dcmp_0",title:"Compressed Macintosh resource data, Apple `'dcmp' (0)` format",ksy:{meta:{id:"dcmp_0",title:"Compressed Macintosh resource data, Apple `'dcmp' (0)` format",application:"Mac OS",license:"MIT","ks-version":"0.8",imports:["dcmp_variable_length_integer"],endian:"be"},doc:`Compressed resource data in \`'dcmp' (0)\` format,
as stored in compressed resources with header type \`8\` and decompressor ID \`0\`.

The \`'dcmp' (0)\` decompressor resource is included in the System file of System 7.0 and later.
This compression format is used for most compressed resources in System 7.0's files.
This decompressor is also included with and used by some other Apple applications,
such as ResEdit.

This compression format supports some basic general-purpose compression schemes,
including backreferences to previous data,
run-length encoding,
and delta encoding.
It also includes some types of compression tailored specifically to Mac OS resources,
including a set of single-byte codes that correspond to entries in a hard-coded lookup table,
and a specialized kind of delta encoding for segment loader jump tables.

Almost all parts of this compression format operate on units of 2 or 4 bytes.
As a result,
it is nearly impossible to store data with an odd length in this format.
To work around this limitation,
odd-length resources are padded with an extra byte before compressing them with this format.
This extra byte is ignored after decompression,
as the real (odd) length of the resource is stored in the compressed resource header.

The \`'dcmp' (1)\` compression format (see dcmp_1.ksy) is very similar to this format,
with the main difference that it operates mostly on single bytes rather than two-byte units.
`,"doc-ref":"https://github.com/dgelessus/python-rsrcfork/blob/f891a6e/src/rsrcfork/compress/dcmp0.py",seq:[{id:"chunks",type:"chunk",repeat:"until","repeat-until":"_.tag == 0xff",doc:`The sequence of chunks that make up the compressed data.
`}],types:{chunk:{doc:`A single chunk of compressed data.
Each chunk in the compressed data expands to a sequence of bytes in the uncompressed data,
except when \`tag == 0xff\`,
which marks the end of the data and does not correspond to any bytes in the uncompressed data.

Most chunks are stateless and always expand to the same data,
regardless of where the chunk appears in the sequence.
However,
some chunks affect the behavior of future chunks,
or expand to different data depending on which chunks came before them.
`,seq:[{id:"tag",type:"u1",doc:`The chunk's tag byte.
This controls the structure of the body and the meaning of the chunk.
`},{id:"body",type:{"switch-on":`tag >= 0x00 and tag <= 0x1f ? tag_kind::literal
: tag >= 0x20 and tag <= 0x4a ? tag_kind::backreference
: tag >= 0x4b and tag <= 0xfd ? tag_kind::table_lookup
: tag == 0xfe ? tag_kind::extended
: tag == 0xff ? tag_kind::end
: tag_kind::invalid
`,cases:{"tag_kind::literal":"literal_body(tag)","tag_kind::backreference":"backreference_body(tag)","tag_kind::table_lookup":"table_lookup_body(tag)","tag_kind::extended":"extended_body","tag_kind::end":"end_body"}},doc:`The chunk's body.

Certain chunks do not have any data following the tag byte.
In this case,
the body is a zero-length structure.
`}],enums:{tag_kind:{0:"literal",1:"backreference",2:"table_lookup",3:"extended",4:"end","-1":"invalid"}},types:{literal_body:{doc:`The body of a literal data chunk.

The data that this chunk expands to is stored literally in the body (\`literal\`).
Optionally,
the literal data may also be stored for use by future backreference chunks (\`do_store\`).

The length of the literal data is stored as a number of two-byte units.
This means that the literal data always has an even length in bytes.
`,params:[{id:"tag",type:"u1",doc:`The tag byte preceding this chunk body.
`}],seq:[{id:"len_literal_div2_separate",type:"u1",if:"is_len_literal_div2_separate",doc:`The length of the literal data,
in two-byte units.

This field is only present if the tag byte's low nibble is zero.
In practice,
this only happens if the length is 0x10 or greater,
because smaller lengths can be encoded into the tag byte.
`},{id:"literal",size:"len_literal",doc:`The literal data.
`}],instances:{do_store:{value:"(tag & 0x10) != 0",doc:`Whether this literal should be stored for use by future backreference chunks.

See the documentation of the \`backreference_body\` type for details about backreference chunks.
`},len_literal_div2_in_tag:{value:"tag & 0x0f",doc:`The part of the tag byte that indicates the length of the literal data,
in two-byte units.
If this value is 0,
the length is stored in a separate byte after the tag byte and before the literal data.
`},is_len_literal_div2_separate:{value:"len_literal_div2_in_tag == 0",doc:`Whether the length of the literal is stored separately from the tag.
`},len_literal_div2:{value:`is_len_literal_div2_separate
? len_literal_div2_separate
: len_literal_div2_in_tag
`,doc:`The length of the literal data,
in two-byte units.

In practice,
this value is always greater than zero,
as there is no use in storing a zero-length literal.
`},len_literal:{value:"len_literal_div2 * 2",doc:`The length of the literal data,
in bytes.
`}}},backreference_body:{doc:`The body of a backreference chunk.

This chunk expands to the data stored in a preceding literal chunk,
indicated by an index number (\`index\`).
`,params:[{id:"tag",type:"u1",doc:`The tag byte preceding this chunk body.
`}],seq:[{id:"index_separate_minus",type:{"switch-on":"tag",cases:{32:"u1",33:"u1",34:"u2"}},if:"is_index_separate",doc:`The index of the referenced literal chunk,
stored separately from the tag.
The value in this field is stored minus 0x28.
If the tag byte is 0x21,
the value is also stored minus 0x100,
*on top of* the regular offset
(i. e. minus 0x128 in total).

In other words,
for tag bytes 0x20 and 0x21,
the index is actually 9 bits large,
with the low 8 bits stored separately and the highest bit stored in the lowest bit of the tag byte.

This field is only present if the tag byte is 0x20 through 0x22.
For higher tag bytes,
the index is encoded in the tag byte.
Values smaller than 0x28 cannot be stored in this field,
they must always be encoded in the tag byte.
`}],instances:{is_index_separate:{value:"tag >= 0x20 and tag <= 0x22",doc:`Whether the index is stored separately from the tag.
`},index_in_tag:{value:"tag - 0x23",doc:`The index of the referenced literal chunk,
as stored in the tag byte.
`},index_separate:{value:`index_separate_minus + 0x28 + (tag == 0x21 ? 0x100 : 0)
`,if:"is_index_separate",doc:`The index of the referenced literal chunk,
as stored separately from the tag byte,
with the implicit offset corrected for.
`},index:{value:`is_index_separate ? index_separate : index_in_tag
`,doc:`The index of the referenced literal chunk.

Stored literals are assigned index numbers in the order in which they appear in the compressed data,
starting at 0.
Non-stored literals are not counted in the numbering and cannot be referenced using backreferences.
Once an index is assigned to a stored literal,
it is never changed or unassigned for the entire length of the compressed data.

As the name indicates,
a backreference can only reference stored literal chunks found *before* the backreference,
not ones that come after it.
`}}},table_lookup_body:{doc:`The body of a table lookup chunk.
This body is always empty.

This chunk always expands to two bytes (\`value\`),
determined from the tag byte using a fixed lookup table (\`lookup_table\`).
This lookup table is hardcoded in the decompressor and always the same for all compressed data.
`,params:[{id:"tag",type:"u1",doc:`The tag byte preceding this chunk body.
`}],seq:[],instances:{lookup_table:{value:`[
  [0x00, 0x00],
  [0x4e, 0xba], [0x00, 0x08], [0x4e, 0x75], [0x00, 0x0c],
  [0x4e, 0xad], [0x20, 0x53], [0x2f, 0x0b], [0x61, 0x00],
  [0x00, 0x10], [0x70, 0x00], [0x2f, 0x00], [0x48, 0x6e],
  [0x20, 0x50], [0x20, 0x6e], [0x2f, 0x2e], [0xff, 0xfc],
  [0x48, 0xe7], [0x3f, 0x3c], [0x00, 0x04], [0xff, 0xf8],
  [0x2f, 0x0c], [0x20, 0x06], [0x4e, 0xed], [0x4e, 0x56],
  [0x20, 0x68], [0x4e, 0x5e], [0x00, 0x01], [0x58, 0x8f],
  [0x4f, 0xef], [0x00, 0x02], [0x00, 0x18], [0x60, 0x00],
  [0xff, 0xff], [0x50, 0x8f], [0x4e, 0x90], [0x00, 0x06],
  [0x26, 0x6e], [0x00, 0x14], [0xff, 0xf4], [0x4c, 0xee],
  [0x00, 0x0a], [0x00, 0x0e], [0x41, 0xee], [0x4c, 0xdf],
  [0x48, 0xc0], [0xff, 0xf0], [0x2d, 0x40], [0x00, 0x12],
  [0x30, 0x2e], [0x70, 0x01], [0x2f, 0x28], [0x20, 0x54],
  [0x67, 0x00], [0x00, 0x20], [0x00, 0x1c], [0x20, 0x5f],
  [0x18, 0x00], [0x26, 0x6f], [0x48, 0x78], [0x00, 0x16],
  [0x41, 0xfa], [0x30, 0x3c], [0x28, 0x40], [0x72, 0x00],
  [0x28, 0x6e], [0x20, 0x0c], [0x66, 0x00], [0x20, 0x6b],
  [0x2f, 0x07], [0x55, 0x8f], [0x00, 0x28], [0xff, 0xfe],
  [0xff, 0xec], [0x22, 0xd8], [0x20, 0x0b], [0x00, 0x0f],
  [0x59, 0x8f], [0x2f, 0x3c], [0xff, 0x00], [0x01, 0x18],
  [0x81, 0xe1], [0x4a, 0x00], [0x4e, 0xb0], [0xff, 0xe8],
  [0x48, 0xc7], [0x00, 0x03], [0x00, 0x22], [0x00, 0x07],
  [0x00, 0x1a], [0x67, 0x06], [0x67, 0x08], [0x4e, 0xf9],
  [0x00, 0x24], [0x20, 0x78], [0x08, 0x00], [0x66, 0x04],
  [0x00, 0x2a], [0x4e, 0xd0], [0x30, 0x28], [0x26, 0x5f],
  [0x67, 0x04], [0x00, 0x30], [0x43, 0xee], [0x3f, 0x00],
  [0x20, 0x1f], [0x00, 0x1e], [0xff, 0xf6], [0x20, 0x2e],
  [0x42, 0xa7], [0x20, 0x07], [0xff, 0xfa], [0x60, 0x02],
  [0x3d, 0x40], [0x0c, 0x40], [0x66, 0x06], [0x00, 0x26],
  [0x2d, 0x48], [0x2f, 0x01], [0x70, 0xff], [0x60, 0x04],
  [0x18, 0x80], [0x4a, 0x40], [0x00, 0x40], [0x00, 0x2c],
  [0x2f, 0x08], [0x00, 0x11], [0xff, 0xe4], [0x21, 0x40],
  [0x26, 0x40], [0xff, 0xf2], [0x42, 0x6e], [0x4e, 0xb9],
  [0x3d, 0x7c], [0x00, 0x38], [0x00, 0x0d], [0x60, 0x06],
  [0x42, 0x2e], [0x20, 0x3c], [0x67, 0x0c], [0x2d, 0x68],
  [0x66, 0x08], [0x4a, 0x2e], [0x4a, 0xae], [0x00, 0x2e],
  [0x48, 0x40], [0x22, 0x5f], [0x22, 0x00], [0x67, 0x0a],
  [0x30, 0x07], [0x42, 0x67], [0x00, 0x32], [0x20, 0x28],
  [0x00, 0x09], [0x48, 0x7a], [0x02, 0x00], [0x2f, 0x2b],
  [0x00, 0x05], [0x22, 0x6e], [0x66, 0x02], [0xe5, 0x80],
  [0x67, 0x0e], [0x66, 0x0a], [0x00, 0x50], [0x3e, 0x00],
  [0x66, 0x0c], [0x2e, 0x00], [0xff, 0xee], [0x20, 0x6d],
  [0x20, 0x40], [0xff, 0xe0], [0x53, 0x40], [0x60, 0x08],
  [0x04, 0x80], [0x00, 0x68], [0x0b, 0x7c], [0x44, 0x00],
  [0x41, 0xe8], [0x48, 0x41],
]
`,doc:`Fixed lookup table that maps tag byte numbers to two bytes each.

The entries in the lookup table are offset -
index 0 stands for tag 0x4b, 1 for 0x4c, etc.
`},value:{value:"lookup_table[tag - 0x4b]",doc:`The two bytes that the tag byte expands to,
based on the fixed lookup table.
`}}},extended_body:{doc:`The body of an extended chunk.
The meaning of this chunk depends on the extended tag byte stored in the chunk data.
`,seq:[{id:"tag",type:"u1",doc:`The chunk's extended tag byte.
This controls the structure of the body and the meaning of the chunk.
`},{id:"body",type:{"switch-on":"tag",cases:{0:"jump_table_body",2:"repeat_body(tag)",3:"repeat_body(tag)",4:"delta_encoding_16_bit_body",6:"delta_encoding_32_bit_body"}},doc:`The chunk's body.
`}],types:{jump_table_body:{doc:`The body of a jump table chunk.

This chunk generates parts of a segment loader jump table,
in the format found in \`'CODE' (0)\` resources.
It expands to the following data,
with all non-constant numbers encoded as unsigned 16-bit big-endian integers:

* \`0x3f 0x3c\` (push following segment number onto stack)
* The segment number
* \`0xa9 0xf0\` (\`_LoadSeg\` trap)
* For each address:
  * The address
  * \`0x3f 0x3c\` (push following segment number onto stack)
  * The segment number
  * \`0xa9 0xf0\` (\`_LoadSeg\` trap)

Note that this generates one jump table entry without an address before it,
meaning that this address needs to be generated by the preceding chunk.
All following jump table entries are generated with the addresses encoded in this chunk.
`,seq:[{id:"segment_number_raw",type:"dcmp_variable_length_integer",doc:"Raw variable-length integer representation of `segment_number`.\n"},{id:"num_addresses_raw",type:"dcmp_variable_length_integer",doc:"Raw variable-length integer representation of `num_addresses`.\n"},{id:"addresses_raw",type:"dcmp_variable_length_integer",repeat:"expr","repeat-expr":"num_addresses",doc:`The addresses for each generated jump table entry,
stored as variable-length integers.

The first address is stored literally and must be in the range \`0x0 <= x <= 0xffff\`,
i. e. an unsigned 16-bit integer.

All following addresses are stored as deltas relative to the previous address.
Each of these deltas is stored plus 6;
this value needs to be subtracted before (or after) adding it to the previous address.

Each delta (after subtracting 6) should be positive,
and adding it to the previous address should not result in a value larger than \`0xffff\`,
i. e. there should be no 16-bit unsigned integer wraparound.
These conditions are always met in all known jump table chunks,
so it is not known how the original decompressor behaves otherwise.
`}],instances:{segment_number:{value:"segment_number_raw.value",doc:`The segment number for all of the generated jump table entries.

Although it is stored as a variable-length integer,
the segment number must be in the range \`0x0 <= x <= 0xffff\`,
i. e. an unsigned 16-bit integer.
`},num_addresses:{value:"num_addresses_raw.value",doc:`The number of addresses stored in this chunk.

This number must be greater than 0.
`}}},repeat_body:{doc:`The body of a repeat chunk.

This chunk expands to a 1-byte or 2-byte value repeated a number of times,
i. e. it implements a form of run-length encoding.
`,params:[{id:"tag",type:"u1",doc:`The extended tag byte preceding this chunk body.
`}],seq:[{id:"to_repeat_raw",type:"dcmp_variable_length_integer",doc:"Raw variable-length integer representation of `to_repeat`.\n"},{id:"repeat_count_m1_raw",type:"dcmp_variable_length_integer",doc:"Raw variable-length integer representation of `repeat_count_m1`.\n"}],instances:{byte_count:{value:`tag == 0x02 ? 1
: tag == 0x03 ? 2
: -1
`,doc:`The length in bytes of the value to be repeated.
Regardless of the byte count,
the value to be repeated is stored as a variable-length integer.
`},to_repeat:{value:"to_repeat_raw.value",doc:`The value to repeat.

Although it is stored as a variable-length integer,
this value must fit into an unsigned big-endian integer that is as long as \`byte_count\`,
i. e. either 8 or 16 bits.
`},repeat_count_m1:{value:"repeat_count_m1_raw.value",doc:`The number of times to repeat the value,
minus one.

This value must not be negative.
`},repeat_count:{value:"repeat_count_m1 + 1",doc:`The number of times to repeat the value.

This value must be positive.
`}}},delta_encoding_16_bit_body:{doc:`The body of a 16-bit delta encoding chunk.

This chunk expands to a sequence of 16-bit big-endian integer values.
The first value is stored literally.
All following values are stored as deltas relative to the previous value.
`,seq:[{id:"first_value_raw",type:"dcmp_variable_length_integer",doc:"Raw variable-length integer representation of `first_value`.\n"},{id:"num_deltas_raw",type:"dcmp_variable_length_integer",doc:"Raw variable-length integer representation of `num_deltas`.\n"},{id:"deltas",type:"s1",repeat:"expr","repeat-expr":"num_deltas",doc:`The deltas for each value relative to the previous value.

Each of these deltas is a signed 8-bit value.
When adding the delta to the previous value,
16-bit integer wraparound is performed if necessary,
so that the resulting value always fits into a 16-bit signed integer.
`}],instances:{first_value:{value:"first_value_raw.value",doc:`The first value in the sequence.

Although it is stored as a variable-length integer,
this value must be in the range \`-0x8000 <= x <= 0x7fff\`,
i. e. a signed 16-bit integer.
`},num_deltas:{value:"num_deltas_raw.value",doc:`The number of deltas stored in this chunk.

This number must not be negative.
`}}},delta_encoding_32_bit_body:{doc:`The body of a 32-bit delta encoding chunk.

This chunk expands to a sequence of 32-bit big-endian integer values.
The first value is stored literally.
All following values are stored as deltas relative to the previous value.
`,seq:[{id:"first_value_raw",type:"dcmp_variable_length_integer",doc:"Raw variable-length integer representation of `first_value`.\n"},{id:"num_deltas_raw",type:"dcmp_variable_length_integer",doc:"Raw variable-length integer representation of `num_deltas`.\n"},{id:"deltas_raw",type:"dcmp_variable_length_integer",repeat:"expr","repeat-expr":"num_deltas",doc:`The deltas for each value relative to the previous value,
stored as variable-length integers.

Each of these deltas is a signed value.
When adding the delta to the previous value,
32-bit integer wraparound is performed if necessary,
so that the resulting value always fits into a 32-bit signed integer.
`}],instances:{first_value:{value:"first_value_raw.value",doc:`The first value in the sequence.
`},num_deltas:{value:"num_deltas_raw.value",doc:`The number of deltas stored in this chunk.

This number must not be negative.
`}}}}},end_body:{doc:`The body of an end chunk.
This body is always empty.

The last chunk in the compressed data must always be an end chunk.
An end chunk cannot appear elsewhere in the compressed data.
`,seq:[]}}}}}};export{D as default,R as spec};
