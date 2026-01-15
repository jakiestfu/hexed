import{k as h}from"./index-COA_x_BK.js";var p=Object.getOwnPropertyNames,g=(e,t)=>function(){return t||(0,e[p(e)[0]])((t={exports:{}}).exports,t),t.exports},d=g({"<stdin>"(e){(function(t,i){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream"],i):typeof e=="object"&&e!==null&&typeof e.nodeType!="number"?i(e,h.KaitaiStream):i(t.VlqBase128Be||(t.VlqBase128Be={}),t.KaitaiStream)})(typeof self<"u"?self:e,function(t,i){var r=(function(){function a(s,n,o){this._io=s,this._parent=n,this._root=o||this,this._debug={},this._read()}a.prototype._read=function(){this._debug.groups={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.groups.arr=[],this.groups=[];do{this._debug.groups.arr[this.groups.length]={start:this._io.pos,ioOffset:this._io.byteOffset};var s=new u(this._io,this,this._root);this.groups.push(s),this._debug.groups.arr[this.groups.length-1].end=this._io.pos}while(s.hasNext);this._debug.groups.end=this._io.pos};var u=a.Group=(function(){function s(n,o,l){this._io=n,this._parent=o,this._root=l,this._debug={},this._read()}return s.prototype._read=function(){this._debug.hasNext={start:this._io.pos,ioOffset:this._io.byteOffset},this.hasNext=this._io.readBitsIntBe(1)!=0,this._debug.hasNext.end=this._io.pos,this._debug.value={start:this._io.pos,ioOffset:this._io.byteOffset},this.value=this._io.readBitsIntBe(7),this._debug.value.end=this._io.pos},s})();return Object.defineProperty(a.prototype,"last",{get:function(){return this._m_last!==void 0?this._m_last:(this._debug._m_last={},this._m_last=this.groups.length-1,this._m_last)}}),Object.defineProperty(a.prototype,"value",{get:function(){return this._m_value!==void 0?this._m_value:(this._debug._m_value={},this._m_value=this.groups[this.last].value+(this.last>=1?this.groups[this.last-1].value<<7:0)+(this.last>=2?this.groups[this.last-2].value<<14:0)+(this.last>=3?this.groups[this.last-3].value<<21:0)+(this.last>=4?this.groups[this.last-4].value<<28:0)+(this.last>=5?this.groups[this.last-5].value<<35:0)+(this.last>=6?this.groups[this.last-6].value<<42:0)+(this.last>=7?this.groups[this.last-7].value<<49:0),this._m_value)}}),a})();t.VlqBase128Be=r})}});const f=d(),b={id:"vlq_base128_be",title:"Variable length quantity, unsigned integer, base128, big-endian",ksy:{meta:{id:"vlq_base128_be",title:"Variable length quantity, unsigned integer, base128, big-endian",xref:{justsolve:"Variable-length_quantity",wikidata:"Q7915686"},license:"CC0-1.0","ks-version":.9,"bit-endian":"be"},doc:`A variable-length unsigned integer using base128 encoding. 1-byte groups
consist of 1-bit flag of continuation and 7-bit value chunk, and are ordered
"most significant group first", i.e. in "big-endian" manner.

This particular encoding is specified and used in:

* Standard MIDI file format
* ASN.1 BER encoding
* RAR 5.0 file format

More information on this encoding is available at
<https://en.wikipedia.org/wiki/Variable-length_quantity>

This particular implementation supports serialized values to up 8 bytes long.
`,"-webide-representation":"{value:dec}",seq:[{id:"groups",type:"group",repeat:"until","repeat-until":"not _.has_next"}],types:{group:{"-webide-representation":"{value}",doc:`One byte group, clearly divided into 7-bit "value" chunk and 1-bit "continuation" flag.
`,seq:[{id:"has_next",type:"b1",doc:"If true, then we have more bytes to read"},{id:"value",type:"b7",doc:"The 7-bit (base128) numeric value chunk of this group"}]}},instances:{last:{value:"groups.size - 1"},value:{value:`(groups[last].value
+ (last >= 1 ? (groups[last - 1].value << 7) : 0)
+ (last >= 2 ? (groups[last - 2].value << 14) : 0)
+ (last >= 3 ? (groups[last - 3].value << 21) : 0)
+ (last >= 4 ? (groups[last - 4].value << 28) : 0)
+ (last >= 5 ? (groups[last - 5].value << 35) : 0)
+ (last >= 6 ? (groups[last - 6].value << 42) : 0)
+ (last >= 7 ? (groups[last - 7].value << 49) : 0)).as<u8>
`,doc:"Resulting value as normal integer"}}}};export{f as default,b as spec};
