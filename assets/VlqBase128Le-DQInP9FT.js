import{k as _}from"./index-CMEpbKl5.js";var g=Object.getOwnPropertyNames,f=(s,i)=>function(){return i||(0,s[g(s)[0]])((i={exports:{}}).exports,i),i.exports},b=f({"<stdin>"(s){(function(i,n){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream"],n):typeof s=="object"&&s!==null&&typeof s.nodeType!="number"?n(s,_.KaitaiStream):n(i.VlqBase128Le||(i.VlqBase128Le={}),i.KaitaiStream)})(typeof self<"u"?self:s,function(i,n){var o=(function(){function r(e,t,a){this._io=e,this._parent=t,this._root=a||this,this._debug={},this._read()}r.prototype._read=function(){this._debug.groups={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.groups.arr=[],this.groups=[];var e=0;do{this._debug.groups.arr[this.groups.length]={start:this._io.pos,ioOffset:this._io.byteOffset};var t=new u(this._io,this,this._root,e,e!=0?this.groups[e-1].intermValue:0,e!=0?e==9?9223372036854776e3:this.groups[e-1].multiplier*128:1);this.groups.push(t),this._debug.groups.arr[this.groups.length-1].end=this._io.pos,e++}while(t.hasNext);this._debug.groups.end=this._io.pos};var u=r.Group=(function(){function e(t,a,h,l,p,d){this._io=t,this._parent=a,this._root=h,this.idx=l,this.prevIntermValue=p,this.multiplier=d,this._debug={},this._read()}return e.prototype._read=function(){if(this._debug.hasNext={start:this._io.pos,ioOffset:this._io.byteOffset},this.hasNext=this._io.readBitsIntBe(1)!=0,this._debug.hasNext.end=this._io.pos,this.hasNext!=(this.idx==9?!1:this.hasNext)){var t=new n.ValidationNotEqualError(this.idx==9?!1:this.hasNext,this.hasNext,this._io,"/types/group/seq/0");throw this._debug.hasNext.validationError=t,t}if(this._debug.value={start:this._io.pos,ioOffset:this._io.byteOffset},this.value=this._io.readBitsIntBe(7),this._debug.value.end=this._io.pos,!(this.value<=(this.idx==9?1:127))){var t=new n.ValidationGreaterThanError(this.idx==9?1:127,this.value,this._io,"/types/group/seq/1");throw this._debug.value.validationError=t,t}},Object.defineProperty(e.prototype,"intermValue",{get:function(){return this._m_intermValue!==void 0?this._m_intermValue:(this._debug._m_intermValue={},this._m_intermValue=this.prevIntermValue+this.value*this.multiplier,this._m_intermValue)}}),e})();return Object.defineProperty(r.prototype,"len",{get:function(){return this._m_len!==void 0?this._m_len:(this._debug._m_len={},this._m_len=this.groups.length,this._m_len)}}),Object.defineProperty(r.prototype,"signBit",{get:function(){return this._m_signBit!==void 0?this._m_signBit:(this._debug._m_signBit={},this._m_signBit=this.len==10?9223372036854776e3:this.groups[this.groups.length-1].multiplier*64,this._m_signBit)}}),Object.defineProperty(r.prototype,"value",{get:function(){return this._m_value!==void 0?this._m_value:(this._debug._m_value={},this._m_value=this.groups[this.groups.length-1].intermValue,this._m_value)}}),Object.defineProperty(r.prototype,"valueSigned",{get:function(){return this._m_valueSigned!==void 0?this._m_valueSigned:(this._debug._m_valueSigned={},this._m_valueSigned=this.signBit>0&&this.value>=this.signBit?-(this.signBit-(this.value-this.signBit)):this.value,this._m_valueSigned)}}),r})();i.VlqBase128Le=o})}});const m=b(),c={id:"vlq_base128_le",title:"Variable length quantity, unsigned/signed integer, base128, little-endian",ksy:{meta:{id:"vlq_base128_le",title:"Variable length quantity, unsigned/signed integer, base128, little-endian",xref:{justsolve:"Variable-length_quantity",wikidata:"Q6457577"},license:"CC0-1.0","ks-version":"0.10","bit-endian":"be"},doc:`A variable-length unsigned/signed integer using base128 encoding. 1-byte groups
consist of 1-bit flag of continuation and 7-bit value chunk, and are ordered
"least significant group first", i.e. in "little-endian" manner.

This particular encoding is specified and used in:

* DWARF debug file format, where it's dubbed "unsigned LEB128" or "ULEB128".
  <https://dwarfstd.org/doc/dwarf-2.0.0.pdf> - page 139
* Google Protocol Buffers, where it's called "Base 128 Varints".
  <https://protobuf.dev/programming-guides/encoding/#varints>
* Apache Lucene, where it's called "VInt"
  <https://lucene.apache.org/core/3_5_0/fileformats.html#VInt>
* Apache Avro uses this as a basis for integer encoding, adding ZigZag on
  top of it for signed ints
  <https://avro.apache.org/docs/1.12.0/specification/#primitive-types-1>

More information on this encoding is available at <https://en.wikipedia.org/wiki/LEB128>

This particular implementation supports integer values up to 64 bits (i.e. the
maximum unsigned value supported is \`2**64 - 1\`), which implies that serialized
values can be up to 10 bytes in length.

If the most significant 10th byte (\`groups[9]\`) is present, its \`has_next\`
must be \`false\` (otherwise we would have 11 or more bytes, which is not
supported) and its \`value\` can be only \`0\` or \`1\` (because a 9-byte VLQ can
represent \`9 * 7 = 63\` bits already, so the 10th byte can only add 1 bit,
since only integers up to 64 bits are supported). These restrictions are
enforced by this implementation. They were inspired by the Protoscope tool,
see <https://github.com/protocolbuffers/protoscope/blob/8e7a6aafa2c9958527b1e0747e66e1bfff045819/writer.go#L644-L648>.
`,"-webide-representation":"{value:dec}",seq:[{id:"groups",type:`group(
  _index,
  _index != 0 ? groups[_index - 1].interm_value : 0,
  _index != 0 ? (_index == 9 ? 0x8000_0000_0000_0000 : groups[_index - 1].multiplier * 128) : 1
)
`,repeat:"until","repeat-until":"not _.has_next"}],types:{group:{"-webide-representation":"{value}",doc:`One byte group, clearly divided into 7-bit "value" chunk and 1-bit "continuation" flag.
`,params:[{id:"idx",type:"s4"},{id:"prev_interm_value",type:"u8"},{id:"multiplier",type:"u8"}],seq:[{id:"has_next",type:"b1",valid:"idx == 9 ? false : has_next",doc:"If `true`, then we have more bytes to read.\n\nSince this implementation only supports serialized values up to 10\nbytes, this must be `false` in the 10th group (`groups[9]`).\n"},{id:"value",type:"b7",valid:{max:"(idx == 9 ? 1 : 0b111_1111).as<u8>"},doc:"The 7-bit (base128) numeric value chunk of this group\n\nSince this implementation only supports integer values up to 64 bits,\nthe `value` in the 10th group (`groups[9]`) can only be `0` or `1`\n(otherwise the width of the represented value would be 65 bits or\nmore, which is not supported).\n"}],instances:{interm_value:{value:"(prev_interm_value + value * multiplier).as<u8>"}}}},instances:{len:{value:"groups.size"},value:{value:"groups.last.interm_value",doc:"Resulting unsigned value as normal integer"},sign_bit:{value:"(len == 10 ? 0x8000_0000_0000_0000 : groups.last.multiplier * 0b100_0000).as<u8>"},value_signed:{value:"sign_bit > 0 and value >= sign_bit ? -(sign_bit - (value - sign_bit)).as<s8> : value.as<s8>"}}}};export{m as default,c as spec};
