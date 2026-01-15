import{k as _}from"./index-C9sUxlHS.js";var u=Object.getOwnPropertyNames,m=(t,i)=>function(){return i||(0,t[u(t)[0]])((i={exports:{}}).exports,i),i.exports},l=m({"<stdin>"(t){(function(i,n){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream"],n):typeof t=="object"&&t!==null&&typeof t.nodeType!="number"?n(t,_.KaitaiStream):n(i.Bcd||(i.Bcd={}),i.KaitaiStream)})(typeof self<"u"?self:t,function(i,n){var d=(function(){function s(e,a,r,g,o,h){this._io=e,this._parent=a,this._root=r||this,this.numDigits=g,this.bitsPerDigit=o,this.isLe=h,this._debug={},this._read()}return s.prototype._read=function(){this._debug.digits={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.digits.arr=[],this.digits=[];for(var e=0;e<this.numDigits;e++){switch(this._debug.digits.arr[e]={start:this._io.pos,ioOffset:this._io.byteOffset},this.bitsPerDigit){case 4:this.digits.push(this._io.readBitsIntBe(4));break;case 8:this.digits.push(this._io.readU1());break}this._debug.digits.arr[e].end=this._io.pos}this._debug.digits.end=this._io.pos},Object.defineProperty(s.prototype,"asInt",{get:function(){return this._m_asInt!==void 0?this._m_asInt:(this._debug._m_asInt={},this._m_asInt=this.isLe?this.asIntLe:this.asIntBe,this._m_asInt)}}),Object.defineProperty(s.prototype,"asIntBe",{get:function(){return this._m_asIntBe!==void 0?this._m_asIntBe:(this._debug._m_asIntBe={},this._m_asIntBe=this.digits[this.lastIdx]+(this.numDigits<2?0:this.digits[this.lastIdx-1]*10+(this.numDigits<3?0:this.digits[this.lastIdx-2]*100+(this.numDigits<4?0:this.digits[this.lastIdx-3]*1e3+(this.numDigits<5?0:this.digits[this.lastIdx-4]*1e4+(this.numDigits<6?0:this.digits[this.lastIdx-5]*1e5+(this.numDigits<7?0:this.digits[this.lastIdx-6]*1e6+(this.numDigits<8?0:this.digits[this.lastIdx-7]*1e7))))))),this._m_asIntBe)}}),Object.defineProperty(s.prototype,"asIntLe",{get:function(){return this._m_asIntLe!==void 0?this._m_asIntLe:(this._debug._m_asIntLe={},this._m_asIntLe=this.digits[0]+(this.numDigits<2?0:this.digits[1]*10+(this.numDigits<3?0:this.digits[2]*100+(this.numDigits<4?0:this.digits[3]*1e3+(this.numDigits<5?0:this.digits[4]*1e4+(this.numDigits<6?0:this.digits[5]*1e5+(this.numDigits<7?0:this.digits[6]*1e6+(this.numDigits<8?0:this.digits[7]*1e7))))))),this._m_asIntLe)}}),Object.defineProperty(s.prototype,"lastIdx",{get:function(){return this._m_lastIdx!==void 0?this._m_lastIdx:(this._debug._m_lastIdx={},this._m_lastIdx=this.numDigits-1,this._m_lastIdx)}}),s})();i.Bcd=d})}});const f=l(),p={id:"bcd",title:"BCD (Binary Coded Decimals)",ksy:{meta:{id:"bcd",title:"BCD (Binary Coded Decimals)",xref:{justsolve:"Binary-coded_decimal",wikidata:"Q276582"},license:"CC0-1.0","ks-version":.8},doc:`BCD (Binary Coded Decimals) is a common way to encode integer
numbers in a way that makes human-readable output somewhat
simpler. In this encoding scheme, every decimal digit is encoded as
either a single byte (8 bits), or a nibble (half of a byte, 4
bits). This obviously wastes a lot of bits, but it makes translation
into human-readable string much easier than traditional
binary-to-decimal conversion process, which includes lots of
divisions by 10.

For example, encoding integer 31337 in 8-digit, 8 bits per digit,
big endian order of digits BCD format yields

\`\`\`
00 00 00 03 01 03 03 07
\`\`\`

Encoding the same integer as 8-digit, 4 bits per digit, little
endian order BCD format would yield:

\`\`\`
73 31 30 00
\`\`\`

Using this type of encoding in Kaitai Struct is pretty
straightforward: one calls for this type, specifying desired
encoding parameters, and gets result using either \`as_int\` or
\`as_str\` attributes.
`,params:[{id:"num_digits",type:"u1",doc:"Number of digits in this BCD representation. Only values from 1 to 8 inclusive are supported."},{id:"bits_per_digit",type:"u1",doc:"Number of bits per digit. Only values of 4 and 8 are supported."},{id:"is_le",type:"bool",doc:"Endianness used by this BCD representation. True means little-endian, false is for big-endian."}],seq:[{id:"digits",type:{"switch-on":"bits_per_digit",cases:{4:"b4",8:"u1"}},repeat:"expr","repeat-expr":"num_digits"}],instances:{as_int:{value:"is_le ? as_int_le : as_int_be",doc:"Value of this BCD number as integer. Endianness would be selected based on `is_le` parameter given."},as_int_le:{value:`digits[0] + (num_digits < 2 ? 0 :
 (digits[1] * 10 +
  (num_digits < 3 ? 0 :
   (digits[2] * 100 +
    (num_digits < 4 ? 0 :
     (digits[3] * 1000 +
      (num_digits < 5 ? 0 :
       (digits[4] * 10000 +
        (num_digits < 6 ? 0 :
         (digits[5] * 100000 +
          (num_digits < 7 ? 0 :
           (digits[6] * 1000000 +
            (num_digits < 8 ? 0 :
             (digits[7] * 10000000)
            )
           )
          )
         )
        )
       )
      )
     )
    )
   )
  )
 )
)
`,doc:"Value of this BCD number as integer (treating digit order as little-endian)."},last_idx:{value:"num_digits - 1",doc:"Index of last digit (0-based)."},as_int_be:{value:`digits[last_idx] + (num_digits < 2 ? 0 :
 (digits[last_idx - 1] * 10 +
  (num_digits < 3 ? 0 :
   (digits[last_idx - 2] * 100 +
    (num_digits < 4 ? 0 :
     (digits[last_idx - 3] * 1000 +
      (num_digits < 5 ? 0 :
       (digits[last_idx - 4] * 10000 +
        (num_digits < 6 ? 0 :
         (digits[last_idx - 5] * 100000 +
          (num_digits < 7 ? 0 :
           (digits[last_idx - 6] * 1000000 +
            (num_digits < 8 ? 0 :
             (digits[last_idx - 7] * 10000000)
            )
           )
          )
         )
        )
       )
      )
     )
    )
   )
  )
 )
)
`,doc:"Value of this BCD number as integer (treating digit order as big-endian)."}}}};export{f as default,p as spec};
