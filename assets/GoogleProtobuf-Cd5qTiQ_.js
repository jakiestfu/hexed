import{k as p}from"./index-COA_x_BK.js";var h=Object.getOwnPropertyNames,_=(t,e)=>function(){return e||(0,t[h(t)[0]])((e={exports:{}}).exports,e),e.exports},y=_({"<stdin>"(t){(function(e,o){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream","./VlqBase128Le"],o):typeof t=="object"&&t!==null&&typeof t.nodeType!="number"?o(t,p.KaitaiStream,require("./VlqBase128Le")):o(e.GoogleProtobuf||(e.GoogleProtobuf={}),e.KaitaiStream,e.VlqBase128Le||(e.VlqBase128Le={}))})(typeof self<"u"?self:t,function(e,o,a){var d=(function(){function s(i,r,n){this._io=i,this._parent=r,this._root=n||this,this._debug={},this._read()}s.prototype._read=function(){for(this._debug.pairs={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.pairs.arr=[],this.pairs=[];!this._io.isEof();)this._debug.pairs.arr[this.pairs.length]={start:this._io.pos,ioOffset:this._io.byteOffset},this.pairs.push(new f(this._io,this,this._root)),this._debug.pairs.arr[this.pairs.length-1].end=this._io.pos;this._debug.pairs.end=this._io.pos};var u=s.DelimitedBytes=(function(){function i(r,n,l){this._io=r,this._parent=n,this._root=l,this._debug={},this._read()}return i.prototype._read=function(){this._debug.len={start:this._io.pos,ioOffset:this._io.byteOffset},this.len=new a.VlqBase128Le(this._io,null,null),this._debug.len.end=this._io.pos,this._debug.body={start:this._io.pos,ioOffset:this._io.byteOffset},this.body=this._io.readBytes(this.len.value),this._debug.body.end=this._io.pos},i})(),f=s.Pair=(function(){i.WireTypes=Object.freeze({VARINT:0,BIT_64:1,LEN_DELIMITED:2,GROUP_START:3,GROUP_END:4,BIT_32:5,0:"VARINT",1:"BIT_64",2:"LEN_DELIMITED",3:"GROUP_START",4:"GROUP_END",5:"BIT_32"});function i(r,n,l){this._io=r,this._parent=n,this._root=l,this._debug={},this._read()}return i.prototype._read=function(){switch(this._debug.key={start:this._io.pos,ioOffset:this._io.byteOffset},this.key=new a.VlqBase128Le(this._io,null,null),this._debug.key.end=this._io.pos,this._debug.value={start:this._io.pos,ioOffset:this._io.byteOffset},this.wireType){case s.Pair.WireTypes.BIT_32:this.value=this._io.readU4le();break;case s.Pair.WireTypes.BIT_64:this.value=this._io.readU8le();break;case s.Pair.WireTypes.LEN_DELIMITED:this.value=new u(this._io,this,this._root);break;case s.Pair.WireTypes.VARINT:this.value=new a.VlqBase128Le(this._io,null,null);break}this._debug.value.end=this._io.pos},Object.defineProperty(i.prototype,"fieldTag",{get:function(){return this._m_fieldTag!==void 0?this._m_fieldTag:(this._debug._m_fieldTag={},this._m_fieldTag=this.key.value>>>3,this._m_fieldTag)}}),Object.defineProperty(i.prototype,"wireType",{get:function(){return this._m_wireType!==void 0?this._m_wireType:(this._debug._m_wireType={enumName:"GoogleProtobuf.Pair.WireTypes"},this._m_wireType=this.key.value&7,this._m_wireType)}}),i})();return s})();e.GoogleProtobuf=d})}});const c=y(),b={id:"google_protobuf",title:"Google Protocol Buffers (protobuf)",ksy:{meta:{id:"google_protobuf",title:"Google Protocol Buffers (protobuf)",xref:{justsolve:"Protobuf",wikidata:"Q1645574"},license:"MIT","ks-version":.7,imports:["/common/vlq_base128_le"]},doc:`Google Protocol Buffers (AKA protobuf) is a popular data
serialization scheme used for communication protocols, data storage,
etc. There are implementations are available for almost every
popular language. The focus points of this scheme are brevity (data
is encoded in a very size-efficient manner) and extensibility (one
can add keys to the structure, while keeping it readable in previous
version of software).

Protobuf uses semi-self-describing encoding scheme for its
messages. It means that it is possible to parse overall structure of
the message (skipping over fields one can't understand), but to
fully understand the message, one needs a protocol definition file
(\`.proto\`). To be specific:

* "Keys" in key-value pairs provided in the message are identified
  only with an integer "field tag". \`.proto\` file provides info on
  which symbolic field names these field tags map to.
* "Keys" also provide something called "wire type". It's not a data
  type in its common sense (i.e. you can't, for example, distinguish
  \`sint32\` vs \`uint32\` vs some enum, or \`string\` from \`bytes\`), but
  it's enough information to determine how many bytes to
  parse. Interpretation of the value should be done according to the
  type specified in \`.proto\` file.
* There's no direct information on which fields are optional /
  required, which fields may be repeated or constitute a map, what
  restrictions are placed on fields usage in a single message, what
  are the fields' default values, etc, etc.
`,"doc-ref":"https://protobuf.dev/programming-guides/encoding/",seq:[{id:"pairs",type:"pair",repeat:"eos",doc:"Key-value pairs which constitute a message"}],types:{pair:{doc:"Key-value pair",seq:[{id:"key",type:"vlq_base128_le",doc:`Key is a bit-mapped variable-length integer: lower 3 bits
are used for "wire type", and everything higher designates
an integer "field tag".
`},{id:"value",doc:`Value that corresponds to field identified by
\`field_tag\`. Type is determined approximately: there is
enough information to parse it unambiguously from a stream,
but further information from \`.proto\` file is required to
interpret it properly.
`,type:{"switch-on":"wire_type",cases:{"wire_types::varint":"vlq_base128_le","wire_types::len_delimited":"delimited_bytes","wire_types::bit_64":"u8le","wire_types::bit_32":"u4le"}}}],instances:{wire_type:{value:"key.value & 0b111",enum:"wire_types",doc:`"Wire type" is a part of the "key" that carries enough
information to parse value from the wire, i.e. read correct
amount of bytes, but there's not enough information to
interpret in unambiguously. For example, one can't clearly
distinguish 64-bit fixed-sized integers from 64-bit floats,
signed zigzag-encoded varints from regular unsigned varints,
arbitrary bytes from UTF-8 encoded strings, etc.
`},field_tag:{value:"key.value >> 3",doc:"Identifies a field of protocol. One can look up symbolic\nfield name in a `.proto` file by this field tag.\n"}},enums:{wire_types:{0:"varint",1:"bit_64",2:"len_delimited",3:"group_start",4:"group_end",5:"bit_32"}}},delimited_bytes:{seq:[{id:"len",type:"vlq_base128_le"},{id:"body",size:"len.value"}]}}}};export{c as default,b as spec};
