import{k as m}from"./index-CMEpbKl5.js";var x=Object.getOwnPropertyNames,k=(d,a)=>function(){return a||(0,d[x(d)[0]])((a={exports:{}}).exports,a),a.exports},T=k({"<stdin>"(d){(function(a,h){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream","./DcmpVariableLengthInteger"],h):typeof d=="object"&&d!==null&&typeof d.nodeType!="number"?h(d,m.KaitaiStream,require("./DcmpVariableLengthInteger")):h(a.Dcmp1||(a.Dcmp1={}),a.KaitaiStream,a.DcmpVariableLengthInteger||(a.DcmpVariableLengthInteger={}))})(typeof self<"u"?self:d,function(a,h,p){var l=(function(){function n(i,_,u){this._io=i,this._parent=_,this._root=u||this,this._debug={},this._read()}n.prototype._read=function(){this._debug.chunks={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.chunks.arr=[],this.chunks=[];do{this._debug.chunks.arr[this.chunks.length]={start:this._io.pos,ioOffset:this._io.byteOffset};var i=new c(this._io,this,this._root);this.chunks.push(i),this._debug.chunks.arr[this.chunks.length-1].end=this._io.pos}while(i.tag!=255);this._debug.chunks.end=this._io.pos};var c=n.Chunk=(function(){i.TagKind=Object.freeze({INVALID:-1,LITERAL:0,BACKREFERENCE:1,TABLE_LOOKUP:2,EXTENDED:3,END:4,"-1":"INVALID",0:"LITERAL",1:"BACKREFERENCE",2:"TABLE_LOOKUP",3:"EXTENDED",4:"END"});function i(e,s,t){this._io=e,this._parent=s,this._root=t,this._debug={},this._read()}i.prototype._read=function(){switch(this._debug.tag={start:this._io.pos,ioOffset:this._io.byteOffset},this.tag=this._io.readU1(),this._debug.tag.end=this._io.pos,this._debug.body={start:this._io.pos,ioOffset:this._io.byteOffset},this.tag>=0&&this.tag<=31?n.Chunk.TagKind.LITERAL:this.tag>=32&&this.tag<=207?n.Chunk.TagKind.BACKREFERENCE:this.tag>=208&&this.tag<=209?n.Chunk.TagKind.LITERAL:this.tag==210?n.Chunk.TagKind.BACKREFERENCE:this.tag>=213&&this.tag<=253?n.Chunk.TagKind.TABLE_LOOKUP:this.tag==254?n.Chunk.TagKind.EXTENDED:this.tag==255?n.Chunk.TagKind.END:n.Chunk.TagKind.INVALID){case n.Chunk.TagKind.BACKREFERENCE:this.body=new _(this._io,this,this._root,this.tag);break;case n.Chunk.TagKind.END:this.body=new u(this._io,this,this._root);break;case n.Chunk.TagKind.EXTENDED:this.body=new f(this._io,this,this._root);break;case n.Chunk.TagKind.LITERAL:this.body=new g(this._io,this,this._root,this.tag);break;case n.Chunk.TagKind.TABLE_LOOKUP:this.body=new y(this._io,this,this._root,this.tag);break}this._debug.body.end=this._io.pos};var _=i.BackreferenceBody=(function(){function e(s,t,r,o){this._io=s,this._parent=t,this._root=r,this.tag=o,this._debug={},this._read()}return e.prototype._read=function(){this.isIndexSeparate&&(this._debug.indexSeparateMinus={start:this._io.pos,ioOffset:this._io.byteOffset},this.indexSeparateMinus=this._io.readU1(),this._debug.indexSeparateMinus.end=this._io.pos)},Object.defineProperty(e.prototype,"index",{get:function(){return this._m_index!==void 0?this._m_index:(this._debug._m_index={},this._m_index=this.isIndexSeparate?this.indexSeparate:this.indexInTag,this._m_index)}}),Object.defineProperty(e.prototype,"indexInTag",{get:function(){return this._m_indexInTag!==void 0?this._m_indexInTag:(this._debug._m_indexInTag={},this._m_indexInTag=this.tag-32,this._m_indexInTag)}}),Object.defineProperty(e.prototype,"indexSeparate",{get:function(){return this._m_indexSeparate!==void 0?this._m_indexSeparate:(this.isIndexSeparate&&(this._debug._m_indexSeparate={},this._m_indexSeparate=this.indexSeparateMinus+176),this._m_indexSeparate)}}),Object.defineProperty(e.prototype,"isIndexSeparate",{get:function(){return this._m_isIndexSeparate!==void 0?this._m_isIndexSeparate:(this._debug._m_isIndexSeparate={},this._m_isIndexSeparate=this.tag==210,this._m_isIndexSeparate)}}),e})(),u=i.EndBody=(function(){function e(s,t,r){this._io=s,this._parent=t,this._root=r,this._debug={},this._read()}return e.prototype._read=function(){},e})(),f=i.ExtendedBody=(function(){function e(t,r,o){this._io=t,this._parent=r,this._root=o,this._debug={},this._read()}e.prototype._read=function(){switch(this._debug.tag={start:this._io.pos,ioOffset:this._io.byteOffset},this.tag=this._io.readU1(),this._debug.tag.end=this._io.pos,this._debug.body={start:this._io.pos,ioOffset:this._io.byteOffset},this.tag){case 2:this.body=new s(this._io,this,this._root);break}this._debug.body.end=this._io.pos};var s=e.RepeatBody=(function(){function t(r,o,b){this._io=r,this._parent=o,this._root=b,this._debug={},this._read()}return t.prototype._read=function(){this._debug.toRepeatRaw={start:this._io.pos,ioOffset:this._io.byteOffset},this.toRepeatRaw=new p.DcmpVariableLengthInteger(this._io,null,null),this._debug.toRepeatRaw.end=this._io.pos,this._debug.repeatCountM1Raw={start:this._io.pos,ioOffset:this._io.byteOffset},this.repeatCountM1Raw=new p.DcmpVariableLengthInteger(this._io,null,null),this._debug.repeatCountM1Raw.end=this._io.pos},Object.defineProperty(t.prototype,"repeatCount",{get:function(){return this._m_repeatCount!==void 0?this._m_repeatCount:(this._debug._m_repeatCount={},this._m_repeatCount=this.repeatCountM1+1,this._m_repeatCount)}}),Object.defineProperty(t.prototype,"repeatCountM1",{get:function(){return this._m_repeatCountM1!==void 0?this._m_repeatCountM1:(this._debug._m_repeatCountM1={},this._m_repeatCountM1=this.repeatCountM1Raw.value,this._m_repeatCountM1)}}),Object.defineProperty(t.prototype,"toRepeat",{get:function(){return this._m_toRepeat!==void 0?this._m_toRepeat:(this._debug._m_toRepeat={},this._m_toRepeat=this.toRepeatRaw.value,this._m_toRepeat)}}),t})();return e})(),g=i.LiteralBody=(function(){function e(s,t,r,o){this._io=s,this._parent=t,this._root=r,this.tag=o,this._debug={},this._read()}return e.prototype._read=function(){this.isLenLiteralSeparate&&(this._debug.lenLiteralSeparate={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenLiteralSeparate=this._io.readU1(),this._debug.lenLiteralSeparate.end=this._io.pos),this._debug.literal={start:this._io.pos,ioOffset:this._io.byteOffset},this.literal=this._io.readBytes(this.lenLiteral),this._debug.literal.end=this._io.pos},Object.defineProperty(e.prototype,"doStore",{get:function(){return this._m_doStore!==void 0?this._m_doStore:(this._debug._m_doStore={},this._m_doStore=this.isLenLiteralSeparate?this.tag==209:(this.tag&16)!=0,this._m_doStore)}}),Object.defineProperty(e.prototype,"isLenLiteralSeparate",{get:function(){return this._m_isLenLiteralSeparate!==void 0?this._m_isLenLiteralSeparate:(this._debug._m_isLenLiteralSeparate={},this._m_isLenLiteralSeparate=this.tag>=208,this._m_isLenLiteralSeparate)}}),Object.defineProperty(e.prototype,"lenLiteral",{get:function(){return this._m_lenLiteral!==void 0?this._m_lenLiteral:(this._debug._m_lenLiteral={},this._m_lenLiteral=this.isLenLiteralSeparate?this.lenLiteralSeparate:this.lenLiteralM1InTag+1,this._m_lenLiteral)}}),Object.defineProperty(e.prototype,"lenLiteralM1InTag",{get:function(){return this._m_lenLiteralM1InTag!==void 0?this._m_lenLiteralM1InTag:(this.isLenLiteralSeparate||(this._debug._m_lenLiteralM1InTag={},this._m_lenLiteralM1InTag=this.tag&15),this._m_lenLiteralM1InTag)}}),e})(),y=i.TableLookupBody=(function(){function e(s,t,r,o){this._io=s,this._parent=t,this._root=r,this.tag=o,this._debug={},this._read()}return e.prototype._read=function(){},Object.defineProperty(e.prototype,"lookupTable",{get:function(){return this._m_lookupTable!==void 0?this._m_lookupTable:(this._debug._m_lookupTable={},this._m_lookupTable=[new Uint8Array([0,0]),new Uint8Array([0,1]),new Uint8Array([0,2]),new Uint8Array([0,3]),new Uint8Array([46,1]),new Uint8Array([62,1]),new Uint8Array([1,1]),new Uint8Array([30,1]),new Uint8Array([255,255]),new Uint8Array([14,1]),new Uint8Array([49,0]),new Uint8Array([17,18]),new Uint8Array([1,7]),new Uint8Array([51,50]),new Uint8Array([18,57]),new Uint8Array([237,16]),new Uint8Array([1,39]),new Uint8Array([35,34]),new Uint8Array([1,55]),new Uint8Array([7,6]),new Uint8Array([1,23]),new Uint8Array([1,35]),new Uint8Array([0,255]),new Uint8Array([0,47]),new Uint8Array([7,14]),new Uint8Array([253,60]),new Uint8Array([1,53]),new Uint8Array([1,21]),new Uint8Array([1,2]),new Uint8Array([0,7]),new Uint8Array([0,62]),new Uint8Array([5,213]),new Uint8Array([2,1]),new Uint8Array([6,7]),new Uint8Array([7,8]),new Uint8Array([48,1]),new Uint8Array([1,51]),new Uint8Array([0,16]),new Uint8Array([23,22]),new Uint8Array([55,62]),new Uint8Array([54,55])],this._m_lookupTable)}}),Object.defineProperty(e.prototype,"value",{get:function(){return this._m_value!==void 0?this._m_value:(this._debug._m_value={},this._m_value=this.lookupTable[this.tag-213],this._m_value)}}),e})();return i})();return n})();a.Dcmp1=l})}});const v=T(),L={id:"dcmp_1",title:"Compressed Macintosh resource data, Apple `'dcmp' (1)` format",ksy:{meta:{id:"dcmp_1",title:"Compressed Macintosh resource data, Apple `'dcmp' (1)` format",application:"Mac OS",license:"MIT","ks-version":"0.8",imports:["dcmp_variable_length_integer"],endian:"be"},doc:`Compressed resource data in \`'dcmp' (1)\` format,
as stored in compressed resources with header type \`8\` and decompressor ID \`1\`.

The \`'dcmp' (1)\` decompressor resource is included in the System file of System 7.0 and later.
This compression format is used for a few compressed resources in System 7.0's files
(such as the Finder Help file).
This decompressor is also included with and used by some other Apple applications,
such as ResEdit.
(Note: ResEdit includes the \`'dcmp' (1)\` resource,
but none of its resources actually use this decompressor.)

This compression format supports some basic general-purpose compression schemes,
including backreferences to previous data and run-length encoding.
It also includes some types of compression tailored specifically to Mac OS resources,
including a set of single-byte codes that correspond to entries in a hard-coded lookup table.

The \`'dcmp' (0)\` compression format (see dcmp_0.ksy) is very similar to this format,
with the main difference that it operates mostly on units of 2 or 4 bytes.
This makes the \`\`dcmp' (0)\` format more suitable for word-aligned data,
such as executable code, bitmaps, sounds, etc.
The \`'dcmp' (0)\` format also appears to be generally preferred over \`'dcmp' (1)\`,
with the latter only being used in resource files that contain mostly unaligned data,
such as text.
`,"doc-ref":"https://github.com/dgelessus/python-rsrcfork/blob/f891a6e/src/rsrcfork/compress/dcmp1.py",seq:[{id:"chunks",type:"chunk",repeat:"until","repeat-until":"_.tag == 0xff",doc:`The sequence of chunks that make up the compressed data.
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
: tag >= 0x20 and tag <= 0xcf ? tag_kind::backreference
: tag >= 0xd0 and tag <= 0xd1 ? tag_kind::literal
: tag == 0xd2 ? tag_kind::backreference
: tag >= 0xd5 and tag <= 0xfd ? tag_kind::table_lookup
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
`,params:[{id:"tag",type:"u1",doc:`The tag byte preceding this chunk body.
`}],seq:[{id:"len_literal_separate",type:"u1",if:"is_len_literal_separate",doc:`The length of the literal data,
in bytes.

This field is only present if the tag byte is 0xd0 or 0xd1.
In practice,
this only happens if the length is 0x11 or greater,
because smaller lengths can be encoded into the tag byte.
`},{id:"literal",size:"len_literal",doc:`The literal data.
`}],instances:{do_store:{value:`is_len_literal_separate ? tag == 0xd1 : (tag & 0x10) != 0
`,doc:`Whether this literal should be stored for use by future backreference chunks.

See the documentation of the \`backreference_body\` type for details about backreference chunks.
`},len_literal_m1_in_tag:{value:"tag & 0x0f",if:"not is_len_literal_separate",doc:`The part of the tag byte that indicates the length of the literal data,
in bytes,
minus one.

If the tag byte is 0xd0 or 0xd1,
the length is stored in a separate byte after the tag byte and before the literal data.
`},is_len_literal_separate:{value:"tag >= 0xd0",doc:`Whether the length of the literal is stored separately from the tag.
`},len_literal:{value:`is_len_literal_separate
? len_literal_separate
: len_literal_m1_in_tag + 1
`,doc:`The length of the literal data,
in bytes.

In practice,
this value is always greater than zero,
as there is no use in storing a zero-length literal.
`}}},backreference_body:{doc:`The body of a backreference chunk.

This chunk expands to the data stored in a preceding literal chunk,
indicated by an index number (\`index\`).
`,params:[{id:"tag",type:"u1",doc:`The tag byte preceding this chunk body.
`}],seq:[{id:"index_separate_minus",type:"u1",if:"is_index_separate",doc:`The index of the referenced literal chunk,
stored separately from the tag.
The value in this field is stored minus 0xb0.

This field is only present if the tag byte is 0xd2.
For other tag bytes,
the index is encoded in the tag byte.
Values smaller than 0xb0 cannot be stored in this field,
they must always be encoded in the tag byte.
`}],instances:{is_index_separate:{value:"tag == 0xd2",doc:`Whether the index is stored separately from the tag.
`},index_in_tag:{value:"tag - 0x20",doc:`The index of the referenced literal chunk,
as stored in the tag byte.
`},index_separate:{value:`index_separate_minus + 0xb0
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
  [0x00, 0x00], [0x00, 0x01], [0x00, 0x02],
  [0x00, 0x03], [0x2e, 0x01], [0x3e, 0x01], [0x01, 0x01],
  [0x1e, 0x01], [0xff, 0xff], [0x0e, 0x01], [0x31, 0x00],
  [0x11, 0x12], [0x01, 0x07], [0x33, 0x32], [0x12, 0x39],
  [0xed, 0x10], [0x01, 0x27], [0x23, 0x22], [0x01, 0x37],
  [0x07, 0x06], [0x01, 0x17], [0x01, 0x23], [0x00, 0xff],
  [0x00, 0x2f], [0x07, 0x0e], [0xfd, 0x3c], [0x01, 0x35],
  [0x01, 0x15], [0x01, 0x02], [0x00, 0x07], [0x00, 0x3e],
  [0x05, 0xd5], [0x02, 0x01], [0x06, 0x07], [0x07, 0x08],
  [0x30, 0x01], [0x01, 0x33], [0x00, 0x10], [0x17, 0x16],
  [0x37, 0x3e], [0x36, 0x37],
]
`,doc:`Fixed lookup table that maps tag byte numbers to two bytes each.

The entries in the lookup table are offset -
index 0 stands for tag 0xd5, 1 for 0xd6, etc.
`},value:{value:"lookup_table[tag - 0xd5]",doc:`The two bytes that the tag byte expands to,
based on the fixed lookup table.
`}}},extended_body:{doc:`The body of an extended chunk.
The meaning of this chunk depends on the extended tag byte stored in the chunk data.
`,seq:[{id:"tag",type:"u1",doc:`The chunk's extended tag byte.
This controls the structure of the body and the meaning of the chunk.
`},{id:"body",type:{"switch-on":"tag",cases:{2:"repeat_body"}},doc:`The chunk's body.
`}],types:{repeat_body:{doc:`The body of a repeat chunk.

This chunk expands to the same byte repeated a number of times,
i. e. it implements a form of run-length encoding.
`,seq:[{id:"to_repeat_raw",type:"dcmp_variable_length_integer",doc:"Raw variable-length integer representation of `to_repeat`.\n"},{id:"repeat_count_m1_raw",type:"dcmp_variable_length_integer",doc:"Raw variable-length integer representation of `repeat_count_m1`.\n"}],instances:{to_repeat:{value:"to_repeat_raw.value",doc:`The value to repeat.

Although it is stored as a variable-length integer,
this value must fit into an unsigned 8-bit integer.
`},repeat_count_m1:{value:"repeat_count_m1_raw.value",doc:`The number of times to repeat the value,
minus one.

This value must not be negative.
`},repeat_count:{value:"repeat_count_m1 + 1",doc:`The number of times to repeat the value.

This value must be positive.
`}}}}},end_body:{doc:`The body of an end chunk.
This body is always empty.

The last chunk in the compressed data must always be an end chunk.
An end chunk cannot appear elsewhere in the compressed data.
`,seq:[]}}}}}};export{v as default,L as spec};
