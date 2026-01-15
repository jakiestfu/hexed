import{k as u}from"./index-DZ3xxA7Z.js";var y=Object.getOwnPropertyNames,l=(r,s)=>function(){return s||(0,r[y(r)[0]])((s={exports:{}}).exports,s),s.exports},b=l({"<stdin>"(r){(function(s,i){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream","./BytesWithIo"],i):typeof r=="object"&&r!==null&&typeof r.nodeType!="number"?i(r,u.KaitaiStream,require("./BytesWithIo")):i(s.CompressedResource||(s.CompressedResource={}),s.KaitaiStream,s.BytesWithIo||(s.BytesWithIo={}))})(typeof self<"u"?self:r,function(s,i,h){var _=(function(){function p(o,c,d){this._io=o,this._parent=c,this._root=d||this,this._debug={},this._read()}p.prototype._read=function(){this._debug.header={start:this._io.pos,ioOffset:this._io.byteOffset},this.header=new f(this._io,this,this._root),this._debug.header.end=this._io.pos,this._debug.compressedData={start:this._io.pos,ioOffset:this._io.byteOffset},this.compressedData=this._io.readBytesFull(),this._debug.compressedData.end=this._io.pos};var f=p.Header=(function(){function o(t,e,a){this._io=t,this._parent=e,this._root=a,this._debug={},this._read()}o.prototype._read=function(){this._debug.commonPart={start:this._io.pos,ioOffset:this._io.byteOffset},this.commonPart=new c(this._io,this,this._root),this._debug.commonPart.end=this._io.pos,this._debug.typeSpecificPartRawWithIo={start:this._io.pos,ioOffset:this._io.byteOffset},this._raw_typeSpecificPartRawWithIo=this._io.readBytes(this.commonPart.lenHeader-12);var t=new i(this._raw_typeSpecificPartRawWithIo);this.typeSpecificPartRawWithIo=new h.BytesWithIo(t,null,null),this._debug.typeSpecificPartRawWithIo.end=this._io.pos};var c=o.CommonPart=(function(){function t(e,a,n){this._io=e,this._parent=a,this._root=n,this._debug={},this._read()}return t.prototype._read=function(){if(this._debug.magic={start:this._io.pos,ioOffset:this._io.byteOffset},this.magic=this._io.readBytes(4),this._debug.magic.end=this._io.pos,i.byteArrayCompare(this.magic,new Uint8Array([168,159,101,114]))!=0){var e=new i.ValidationNotEqualError(new Uint8Array([168,159,101,114]),this.magic,this._io,"/types/header/types/common_part/seq/0");throw this._debug.magic.validationError=e,e}if(this._debug.lenHeader={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenHeader=this._io.readU2be(),this._debug.lenHeader.end=this._io.pos,this.lenHeader!=18){var e=new i.ValidationNotEqualError(18,this.lenHeader,this._io,"/types/header/types/common_part/seq/1");throw this._debug.lenHeader.validationError=e,e}if(this._debug.headerType={start:this._io.pos,ioOffset:this._io.byteOffset},this.headerType=this._io.readU1(),this._debug.headerType.end=this._io.pos,this._debug.unknown={start:this._io.pos,ioOffset:this._io.byteOffset},this.unknown=this._io.readU1(),this._debug.unknown.end=this._io.pos,this.unknown!=1){var e=new i.ValidationNotEqualError(1,this.unknown,this._io,"/types/header/types/common_part/seq/3");throw this._debug.unknown.validationError=e,e}this._debug.lenDecompressed={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenDecompressed=this._io.readU4be(),this._debug.lenDecompressed.end=this._io.pos},t})(),d=o.TypeSpecificPartType8=(function(){function t(e,a,n){this._io=e,this._parent=a,this._root=n,this._debug={},this._read()}return t.prototype._read=function(){if(this._debug.workingBufferFractionalSize={start:this._io.pos,ioOffset:this._io.byteOffset},this.workingBufferFractionalSize=this._io.readU1(),this._debug.workingBufferFractionalSize.end=this._io.pos,this._debug.expansionBufferSize={start:this._io.pos,ioOffset:this._io.byteOffset},this.expansionBufferSize=this._io.readU1(),this._debug.expansionBufferSize.end=this._io.pos,this._debug.decompressorId={start:this._io.pos,ioOffset:this._io.byteOffset},this.decompressorId=this._io.readS2be(),this._debug.decompressorId.end=this._io.pos,this._debug.reserved={start:this._io.pos,ioOffset:this._io.byteOffset},this.reserved=this._io.readU2be(),this._debug.reserved.end=this._io.pos,this.reserved!=0){var e=new i.ValidationNotEqualError(0,this.reserved,this._io,"/types/header/types/type_specific_part_type_8/seq/3");throw this._debug.reserved.validationError=e,e}},t})(),m=o.TypeSpecificPartType9=(function(){function t(e,a,n){this._io=e,this._parent=a,this._root=n,this._debug={},this._read()}return t.prototype._read=function(){this._debug.decompressorId={start:this._io.pos,ioOffset:this._io.byteOffset},this.decompressorId=this._io.readS2be(),this._debug.decompressorId.end=this._io.pos,this._debug.decompressorSpecificParametersWithIo={start:this._io.pos,ioOffset:this._io.byteOffset},this._raw_decompressorSpecificParametersWithIo=this._io.readBytes(4);var e=new i(this._raw_decompressorSpecificParametersWithIo);this.decompressorSpecificParametersWithIo=new h.BytesWithIo(e,null,null),this._debug.decompressorSpecificParametersWithIo.end=this._io.pos},Object.defineProperty(t.prototype,"decompressorSpecificParameters",{get:function(){return this._m_decompressorSpecificParameters!==void 0?this._m_decompressorSpecificParameters:(this._debug._m_decompressorSpecificParameters={},this._m_decompressorSpecificParameters=this.decompressorSpecificParametersWithIo.data,this._m_decompressorSpecificParameters)}}),t})();return Object.defineProperty(o.prototype,"typeSpecificPart",{get:function(){if(this._m_typeSpecificPart!==void 0)return this._m_typeSpecificPart;var t=this.typeSpecificPartRawWithIo._io,e=t.pos;switch(t.seek(0),this._debug._m_typeSpecificPart={start:t.pos,ioOffset:t.byteOffset},this.commonPart.headerType){case 8:this._m_typeSpecificPart=new d(t,this,this._root);break;case 9:this._m_typeSpecificPart=new m(t,this,this._root);break}return this._debug._m_typeSpecificPart.end=t.pos,t.seek(e),this._m_typeSpecificPart}}),Object.defineProperty(o.prototype,"typeSpecificPartRaw",{get:function(){return this._m_typeSpecificPartRaw!==void 0?this._m_typeSpecificPartRaw:(this._debug._m_typeSpecificPartRaw={},this._m_typeSpecificPartRaw=this.typeSpecificPartRawWithIo.data,this._m_typeSpecificPartRaw)}}),o})();return p})();s.CompressedResource=_})}});const g=b(),P={id:"compressed_resource",title:"Compressed Macintosh resource",ksy:{meta:{id:"compressed_resource",title:"Compressed Macintosh resource",application:"Mac OS",license:"MIT","ks-version":"0.9",imports:["/common/bytes_with_io"],endian:"be"},doc:`Compressed Macintosh resource data,
as stored in resources with the "compressed" attribute.

Resource decompression is not documented by Apple.
It is mostly used internally in System 7,
some of Apple's own applications (such as ResEdit),
and also by some third-party applications.
Later versions of Classic Mac OS make less use of resource compression,
but still support it fully for backwards compatibility.
Carbon in Mac OS X no longer supports resource compression in any way.

The data of all compressed resources starts with a common header,
followed by the compressed data.
The data is decompressed using code in a \`'dcmp'\` resource.
Some decompressors used by Apple are included in the System file,
but applications can also include custom decompressors.
The header of the compressed data indicates the ID of the \`'dcmp'\` resource used to decompress the data,
along with some parameters for the decompressor.
`,"doc-ref":["http://www.alysis.us/arctechnology.htm","http://preserve.mactech.com/articles/mactech/Vol.09/09.01/ResCompression/index.html","https://github.com/dgelessus/python-rsrcfork/tree/f891a6e/src/rsrcfork/compress"],seq:[{id:"header",type:"header",doc:`The header of the compressed data.
`},{id:"compressed_data","size-eos":!0,doc:`The compressed resource data.

The format of this data is completely dependent on the decompressor and its parameters,
as specified in the header.
For details about the compressed data formats implemented by Apple's decompressors,
see the specs in the resource_compression subdirectory.
`}],types:{header:{doc:`Compressed resource data header,
as stored at the start of all compressed resources.
`,seq:[{id:"common_part",type:"common_part",doc:`The common part of the header.
Among other things,
this part contains the header type,
which determines the format of the data in the type-specific part of the header.
`},{id:"type_specific_part_raw_with_io",type:"bytes_with_io",size:"common_part.len_header - common_part._sizeof",doc:"Use `type_specific_part_raw` instead,\nunless you need access to this field's `_io`.\n"}],instances:{type_specific_part_raw:{value:"type_specific_part_raw_with_io.data",doc:`The type-specific part of the header,
as a raw byte array.
`},type_specific_part:{io:"type_specific_part_raw_with_io._io",pos:0,type:{"switch-on":"common_part.header_type",cases:{8:"type_specific_part_type_8",9:"type_specific_part_type_9"}},doc:`The type-specific part of the header,
parsed according to the type from the common part.
`}},types:{common_part:{doc:`The common part of a compressed resource data header.
The format of this part is the same for all compressed resources.
`,seq:[{id:"magic",contents:[168,159,101,114],doc:`The signature of all compressed resource data.

When interpreted as MacRoman, this byte sequence decodes to \`®üer\`.
`},{id:"len_header",type:"u2",valid:18,doc:`The byte length of the entire header (common and type-specific parts).

The meaning of this field is mostly a guess,
as all known header types result in a total length of \`0x12\`.
`},{id:"header_type",type:"u1",doc:`Type of the header.
This determines the format of the data in the type-specific part of the header.

The only known header type values are \`8\` and \`9\`.

Every known decompressor is only compatible with one of the header types
(but every header type is used by more than one decompressor).
Apple's decompressors with IDs 0 and 1 use header type 8,
and those with IDs 2 and 3 use header type 9.
`},{id:"unknown",type:"u1",valid:1,doc:"The meaning of this field is not known.\nIt has the value `0x01` in all known compressed resources.\n"},{id:"len_decompressed",type:"u4",doc:`The byte length of the data after decompression.
`}]},type_specific_part_type_8:{doc:"The type-specific part of a compressed resource header with header type `8`.\n",seq:[{id:"working_buffer_fractional_size",type:"u1",doc:`The ratio of the compressed data size to the uncompressed data size,
times 256.

This parameter affects the amount of memory allocated by the Resource Manager during decompression,
but does not have a direct effect on the decompressor
(except that it will misbehave if insufficient memory is provided).
Alternative decompressors that decompress resources into a separate buffer rather than in-place can generally ignore this parameter.
`},{id:"expansion_buffer_size",type:"u1",doc:`The maximum number of bytes that the compressed data might "grow" during decompression.

This parameter affects the amount of memory allocated by the Resource Manager during decompression,
but does not have a direct effect on the decompressor
(except that it will misbehave if insufficient memory is provided).
Alternative decompressors that decompress resources into a separate buffer rather than in-place can generally ignore this parameter.
`},{id:"decompressor_id",type:"s2",doc:"The ID of the `'dcmp'` resource that should be used to decompress this resource.\n"},{id:"reserved",type:"u2",valid:0,doc:`The meaning of this field is not known.
It has the value \`0\` in all known compressed resources,
so it is most likely reserved.
`}]},type_specific_part_type_9:{doc:"The type-specific part of a compressed resource header with header type `9`.\n",seq:[{id:"decompressor_id",type:"s2",doc:"The ID of the `'dcmp'` resource that should be used to decompress this resource.\n"},{id:"decompressor_specific_parameters_with_io",type:"bytes_with_io",size:4,doc:"Use `decompressor_specific_parameters` instead,\nunless you need access to this field's `_io`.\n"}],instances:{decompressor_specific_parameters:{value:"decompressor_specific_parameters_with_io.data",doc:`Decompressor-specific parameters.
The exact structure and meaning of this field is different for each decompressor.

This field always has the same length,
but decompressors don't always use the entirety of the field,
so depending on the decompressor some parts of this field may be meaningless.
`}}}}}}}};export{g as default,P as spec};
