import{k as y}from"./index-CMEpbKl5.js";var f=Object.getOwnPropertyNames,u=(i,e)=>function(){return e||(0,i[f(i)[0]])((e={exports:{}}).exports,e),e.exports},b=u({"<stdin>"(i){(function(e,s){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream"],s):typeof i=="object"&&i!==null&&typeof i.nodeType!="number"?s(i,y.KaitaiStream):s(e.Utf8String||(e.Utf8String={}),e.KaitaiStream)})(typeof self<"u"?self:i,function(e,s){var a=(function(){function r(t,n,o){this._io=t,this._parent=n,this._root=o||this,this._debug={},this._read()}r.prototype._read=function(){for(this._debug.codepoints={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.codepoints.arr=[],this.codepoints=[];!this._io.isEof();)this._debug.codepoints.arr[this.codepoints.length]={start:this._io.pos,ioOffset:this._io.byteOffset},this.codepoints.push(new _(this._io,this,this._root,this._io.pos)),this._debug.codepoints.arr[this.codepoints.length-1].end=this._io.pos;this._debug.codepoints.end=this._io.pos};var _=r.Utf8Codepoint=(function(){function t(n,o,h,d){this._io=n,this._parent=o,this._root=h,this.ofs=d,this._debug={},this._read()}return t.prototype._read=function(){this._debug.bytes={start:this._io.pos,ioOffset:this._io.byteOffset},this.bytes=this._io.readBytes(this.lenBytes),this._debug.bytes.end=this._io.pos},Object.defineProperty(t.prototype,"byte0",{get:function(){if(this._m_byte0!==void 0)return this._m_byte0;var n=this._io.pos;return this._io.seek(this.ofs),this._debug._m_byte0={start:this._io.pos,ioOffset:this._io.byteOffset},this._m_byte0=this._io.readU1(),this._debug._m_byte0.end=this._io.pos,this._io.seek(n),this._m_byte0}}),Object.defineProperty(t.prototype,"lenBytes",{get:function(){return this._m_lenBytes!==void 0?this._m_lenBytes:(this._debug._m_lenBytes={},this._m_lenBytes=(this.byte0&128)==0?1:(this.byte0&224)==192?2:(this.byte0&240)==224?3:(this.byte0&248)==240?4:-1,this._m_lenBytes)}}),Object.defineProperty(t.prototype,"raw0",{get:function(){return this._m_raw0!==void 0?this._m_raw0:(this._debug._m_raw0={},this._m_raw0=this.bytes[0]&(this.lenBytes==1?127:this.lenBytes==2?31:this.lenBytes==3?15:this.lenBytes==4?7:0),this._m_raw0)}}),Object.defineProperty(t.prototype,"raw1",{get:function(){return this._m_raw1!==void 0?this._m_raw1:(this.lenBytes>=2&&(this._debug._m_raw1={},this._m_raw1=this.bytes[1]&63),this._m_raw1)}}),Object.defineProperty(t.prototype,"raw2",{get:function(){return this._m_raw2!==void 0?this._m_raw2:(this.lenBytes>=3&&(this._debug._m_raw2={},this._m_raw2=this.bytes[2]&63),this._m_raw2)}}),Object.defineProperty(t.prototype,"raw3",{get:function(){return this._m_raw3!==void 0?this._m_raw3:(this.lenBytes>=4&&(this._debug._m_raw3={},this._m_raw3=this.bytes[3]&63),this._m_raw3)}}),Object.defineProperty(t.prototype,"valueAsInt",{get:function(){return this._m_valueAsInt!==void 0?this._m_valueAsInt:(this._debug._m_valueAsInt={},this._m_valueAsInt=this.lenBytes==1?this.raw0:this.lenBytes==2?this.raw0<<6|this.raw1:this.lenBytes==3?this.raw0<<12|this.raw1<<6|this.raw2:this.lenBytes==4?this.raw0<<18|this.raw1<<12|this.raw2<<6|this.raw3:-1,this._m_valueAsInt)}}),t})();return r})();e.Utf8String=a})}});const l=b(),c={id:"utf8_string",title:"UTF-8-encoded string",ksy:{meta:{id:"utf8_string",title:"UTF-8-encoded string","file-extension":"txt",xref:{wikidata:"Q193537"},license:"CC0-1.0"},doc:`UTF-8 is a popular character encoding scheme that allows to
represent strings as sequence of code points defined in Unicode
standard. Its features are:

* variable width (i.e. one code point might be represented by 1 to 4
  bytes)
* backward compatibility with ASCII
* basic validity checking (and thus distinguishing from other legacy
  8-bit encodings)
* maintaining sort order of codepoints if sorted as a byte array

WARNING: For the vast majority of practical purposes of format
definitions in Kaitai Struct, you'd likely NOT want to use this and
rather just use \`type: str\` with \`encoding: utf-8\`. That will use
native string implementations, which are most likely more efficient
and will give you native language strings, rather than an array of
individual codepoints.  This format definition is provided mostly
for educational / research purposes.
`,seq:[{id:"codepoints",type:"utf8_codepoint(_io.pos)",repeat:"eos"}],types:{utf8_codepoint:{"-webide-representation":"U+{value_as_int:hex}",params:[{id:"ofs",type:"u8"}],seq:[{id:"bytes",size:"len_bytes"}],instances:{byte0:{pos:"ofs",type:"u1"},len_bytes:{value:`(byte0 & 0b1000_0000 == 0) ? 1 :
(byte0 & 0b1110_0000 == 0b1100_0000) ? 2 :
(byte0 & 0b1111_0000 == 0b1110_0000) ? 3 :
(byte0 & 0b1111_1000 == 0b1111_0000) ? 4 :
-1
`},raw0:{value:`bytes[0] & (
  len_bytes == 1 ? 0b0111_1111 :
  len_bytes == 2 ? 0b0001_1111 :
  len_bytes == 3 ? 0b0000_1111 :
  len_bytes == 4 ? 0b0000_0111 :
  0
)
`},raw1:{value:"bytes[1] & 0b0011_1111",if:"len_bytes >= 2"},raw2:{value:"bytes[2] & 0b0011_1111",if:"len_bytes >= 3"},raw3:{value:"bytes[3] & 0b0011_1111",if:"len_bytes >= 4"},value_as_int:{value:`len_bytes == 1 ? raw0 : len_bytes == 2 ? ((raw0 << 6) | raw1) : len_bytes == 3 ? ((raw0 << 12) | (raw1 << 6) | raw2) : len_bytes == 4 ? ((raw0 << 18) | (raw1 << 12) | (raw2 << 6) | raw3) : -1
`}}}}}};export{l as default,c as spec};
