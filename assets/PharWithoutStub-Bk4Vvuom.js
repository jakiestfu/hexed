import{k as b}from"./index-C9sUxlHS.js";var g=Object.getOwnPropertyNames,y=(r,a)=>function(){return a||(0,r[g(r)[0]])((a={exports:{}}).exports,a),a.exports},v=y({"<stdin>"(r){(function(a,n){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream","./PhpSerializedValue"],n):typeof r=="object"&&r!==null&&typeof r.nodeType!="number"?n(r,b.KaitaiStream,require("./PhpSerializedValue")):n(a.PharWithoutStub||(a.PharWithoutStub={}),a.KaitaiStream,a.PhpSerializedValue||(a.PhpSerializedValue={}))})(typeof self<"u"?self:r,function(a,n,d){var _=(function(){o.SignatureType=Object.freeze({MD5:1,SHA1:2,SHA256:4,SHA512:8,OPENSSL:16,1:"MD5",2:"SHA1",4:"SHA256",8:"SHA512",16:"OPENSSL"});function o(e,t,i){this._io=e,this._parent=t,this._root=i||this,this._debug={},this._read()}o.prototype._read=function(){this._debug.manifest={start:this._io.pos,ioOffset:this._io.byteOffset},this.manifest=new c(this._io,this,this._root),this._debug.manifest.end=this._io.pos,this._debug.files={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.files.arr=[],this.files=[];for(var e=0;e<this.manifest.numFiles;e++)this._debug.files.arr[e]={start:this._io.pos,ioOffset:this._io.byteOffset},this.files.push(this._io.readBytes(this.manifest.fileEntries[e].lenDataCompressed)),this._debug.files.arr[e].end=this._io.pos;if(this._debug.files.end=this._io.pos,this.manifest.flags.hasSignature){this._debug.signature={start:this._io.pos,ioOffset:this._io.byteOffset},this._raw_signature=this._io.readBytesFull();var t=new n(this._raw_signature);this.signature=new m(t,this,this._root),this._debug.signature.end=this._io.pos}};var p=o.ApiVersion=(function(){function e(t,i,s){this._io=t,this._parent=i,this._root=s,this._debug={},this._read()}return e.prototype._read=function(){this._debug.release={start:this._io.pos,ioOffset:this._io.byteOffset},this.release=this._io.readBitsIntBe(4),this._debug.release.end=this._io.pos,this._debug.major={start:this._io.pos,ioOffset:this._io.byteOffset},this.major=this._io.readBitsIntBe(4),this._debug.major.end=this._io.pos,this._debug.minor={start:this._io.pos,ioOffset:this._io.byteOffset},this.minor=this._io.readBitsIntBe(4),this._debug.minor.end=this._io.pos,this._debug.unused={start:this._io.pos,ioOffset:this._io.byteOffset},this.unused=this._io.readBitsIntBe(4),this._debug.unused.end=this._io.pos},e})(),l=o.FileEntry=(function(){function e(t,i,s){this._io=t,this._parent=i,this._root=s,this._debug={},this._read()}return e.prototype._read=function(){if(this._debug.lenFilename={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenFilename=this._io.readU4le(),this._debug.lenFilename.end=this._io.pos,this._debug.filename={start:this._io.pos,ioOffset:this._io.byteOffset},this.filename=this._io.readBytes(this.lenFilename),this._debug.filename.end=this._io.pos,this._debug.lenDataUncompressed={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenDataUncompressed=this._io.readU4le(),this._debug.lenDataUncompressed.end=this._io.pos,this._debug.timestamp={start:this._io.pos,ioOffset:this._io.byteOffset},this.timestamp=this._io.readU4le(),this._debug.timestamp.end=this._io.pos,this._debug.lenDataCompressed={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenDataCompressed=this._io.readU4le(),this._debug.lenDataCompressed.end=this._io.pos,this._debug.crc32={start:this._io.pos,ioOffset:this._io.byteOffset},this.crc32=this._io.readU4le(),this._debug.crc32.end=this._io.pos,this._debug.flags={start:this._io.pos,ioOffset:this._io.byteOffset},this.flags=new u(this._io,this,this._root),this._debug.flags.end=this._io.pos,this._debug.lenMetadata={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenMetadata=this._io.readU4le(),this._debug.lenMetadata.end=this._io.pos,this.lenMetadata!=0){this._debug.metadata={start:this._io.pos,ioOffset:this._io.byteOffset},this._raw_metadata=this._io.readBytes(this.lenMetadata);var t=new n(this._raw_metadata);this.metadata=new h(t,this,this._root),this._debug.metadata.end=this._io.pos}},e})(),u=o.FileFlags=(function(){function e(t,i,s){this._io=t,this._parent=i,this._root=s,this._debug={},this._read()}return e.prototype._read=function(){this._debug.value={start:this._io.pos,ioOffset:this._io.byteOffset},this.value=this._io.readU4le(),this._debug.value.end=this._io.pos},Object.defineProperty(e.prototype,"bzip2Compressed",{get:function(){return this._m_bzip2Compressed!==void 0?this._m_bzip2Compressed:(this._debug._m_bzip2Compressed={},this._m_bzip2Compressed=(this.value&8192)!=0,this._m_bzip2Compressed)}}),Object.defineProperty(e.prototype,"permissions",{get:function(){return this._m_permissions!==void 0?this._m_permissions:(this._debug._m_permissions={},this._m_permissions=this.value&511,this._m_permissions)}}),Object.defineProperty(e.prototype,"zlibCompressed",{get:function(){return this._m_zlibCompressed!==void 0?this._m_zlibCompressed:(this._debug._m_zlibCompressed={},this._m_zlibCompressed=(this.value&4096)!=0,this._m_zlibCompressed)}}),e})(),f=o.GlobalFlags=(function(){function e(t,i,s){this._io=t,this._parent=i,this._root=s,this._debug={},this._read()}return e.prototype._read=function(){this._debug.value={start:this._io.pos,ioOffset:this._io.byteOffset},this.value=this._io.readU4le(),this._debug.value.end=this._io.pos},Object.defineProperty(e.prototype,"anyBzip2Compressed",{get:function(){return this._m_anyBzip2Compressed!==void 0?this._m_anyBzip2Compressed:(this._debug._m_anyBzip2Compressed={},this._m_anyBzip2Compressed=(this.value&8192)!=0,this._m_anyBzip2Compressed)}}),Object.defineProperty(e.prototype,"anyZlibCompressed",{get:function(){return this._m_anyZlibCompressed!==void 0?this._m_anyZlibCompressed:(this._debug._m_anyZlibCompressed={},this._m_anyZlibCompressed=(this.value&4096)!=0,this._m_anyZlibCompressed)}}),Object.defineProperty(e.prototype,"hasSignature",{get:function(){return this._m_hasSignature!==void 0?this._m_hasSignature:(this._debug._m_hasSignature={},this._m_hasSignature=(this.value&65536)!=0,this._m_hasSignature)}}),e})(),c=o.Manifest=(function(){function e(t,i,s){this._io=t,this._parent=i,this._root=s,this._debug={},this._read()}return e.prototype._read=function(){if(this._debug.lenManifest={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenManifest=this._io.readU4le(),this._debug.lenManifest.end=this._io.pos,this._debug.numFiles={start:this._io.pos,ioOffset:this._io.byteOffset},this.numFiles=this._io.readU4le(),this._debug.numFiles.end=this._io.pos,this._debug.apiVersion={start:this._io.pos,ioOffset:this._io.byteOffset},this.apiVersion=new p(this._io,this,this._root),this._debug.apiVersion.end=this._io.pos,this._debug.flags={start:this._io.pos,ioOffset:this._io.byteOffset},this.flags=new f(this._io,this,this._root),this._debug.flags.end=this._io.pos,this._debug.lenAlias={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenAlias=this._io.readU4le(),this._debug.lenAlias.end=this._io.pos,this._debug.alias={start:this._io.pos,ioOffset:this._io.byteOffset},this.alias=this._io.readBytes(this.lenAlias),this._debug.alias.end=this._io.pos,this._debug.lenMetadata={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenMetadata=this._io.readU4le(),this._debug.lenMetadata.end=this._io.pos,this.lenMetadata!=0){this._debug.metadata={start:this._io.pos,ioOffset:this._io.byteOffset},this._raw_metadata=this._io.readBytes(this.lenMetadata);var t=new n(this._raw_metadata);this.metadata=new h(t,this,this._root),this._debug.metadata.end=this._io.pos}this._debug.fileEntries={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.fileEntries.arr=[],this.fileEntries=[];for(var i=0;i<this.numFiles;i++)this._debug.fileEntries.arr[i]={start:this._io.pos,ioOffset:this._io.byteOffset},this.fileEntries.push(new l(this._io,this,this._root)),this._debug.fileEntries.arr[i].end=this._io.pos;this._debug.fileEntries.end=this._io.pos},e})(),h=o.SerializedValue=(function(){function e(t,i,s){this._io=t,this._parent=i,this._root=s,this._debug={},this._read()}return e.prototype._read=function(){this._debug.raw={start:this._io.pos,ioOffset:this._io.byteOffset},this.raw=this._io.readBytesFull(),this._debug.raw.end=this._io.pos},Object.defineProperty(e.prototype,"parsed",{get:function(){if(this._m_parsed!==void 0)return this._m_parsed;var t=this._io.pos;return this._io.seek(0),this._debug._m_parsed={start:this._io.pos,ioOffset:this._io.byteOffset},this._m_parsed=new d.PhpSerializedValue(this._io,null,null),this._debug._m_parsed.end=this._io.pos,this._io.seek(t),this._m_parsed}}),e})(),m=o.Signature=(function(){function e(t,i,s){this._io=t,this._parent=i,this._root=s,this._debug={},this._read()}return e.prototype._read=function(){if(this._debug.data={start:this._io.pos,ioOffset:this._io.byteOffset},this.data=this._io.readBytes(this._io.size-this._io.pos-8),this._debug.data.end=this._io.pos,this._debug.type={start:this._io.pos,ioOffset:this._io.byteOffset,enumName:"PharWithoutStub.SignatureType"},this.type=this._io.readU4le(),this._debug.type.end=this._io.pos,this._debug.magic={start:this._io.pos,ioOffset:this._io.byteOffset},this.magic=this._io.readBytes(4),this._debug.magic.end=this._io.pos,n.byteArrayCompare(this.magic,new Uint8Array([71,66,77,66]))!=0){var t=new n.ValidationNotEqualError(new Uint8Array([71,66,77,66]),this.magic,this._io,"/types/signature/seq/2");throw this._debug.magic.validationError=t,t}},e})();return o})();a.PharWithoutStub=_})}});const O=v(),A={id:"phar_without_stub",title:"PHP phar archive (without stub)",ksy:{meta:{id:"phar_without_stub",title:"PHP phar archive (without stub)",application:"PHP","file-extension":"phar",xref:{wikidata:"Q1269709"},license:"CC0-1.0","ks-version":.9,imports:["/serialization/php_serialized_value"],endian:"le"},doc:`A phar (PHP archive) file. The phar format is a custom archive format
from the PHP ecosystem that is used to package a complete PHP library
or application into a single self-contained archive.
All phar archives start with an executable PHP stub, which can be used to
allow executing or including phar files as if they were regular PHP scripts.
PHP 5.3 and later include the phar extension, which adds native support for
reading and manipulating phar files.

The phar format was originally developed as part of the PEAR library
PHP_Archive, first released in 2005. Later, a native PHP extension
named "phar" was developed, which was first released on PECL in 2007,
and is included with PHP 5.3 and later. The phar extension has effectively
superseded the PHP_Archive library, which has not been updated since 2010.
The phar extension is also no longer released independently on PECL;
it is now developed and released as part of PHP itself.

Because of current limitations in Kaitai Struct
(seekaitai-io/kaitai_struct#158 and kaitai-io/kaitai_struct#538),
the executable PHP stub that precedes the rest of the archive is not handled
by this spec. Before parsing a phar using this spec, the stub must be
removed manually.

A phar's stub is terminated by the special token \`__HALT_COMPILER();\`
(which may be followed by at most one space, the PHP tag end \`?>\`,
and an optional line terminator). The stub termination sequence is
immediately followed by the remaining parts of the phar format,
as described in this spec.

The phar stub usually contains code that loads the phar and runs
a contained PHP file, but this is not required. A minimal valid phar stub
is \`<?php __HALT_COMPILER();\` - such a stub makes it impossible to execute
the phar directly, but still allows loading or manipulating it using the
phar extension.

Note: The phar format does not specify any encoding for text fields
(stub, alias name, and all file names), so these fields may contain arbitrary
binary data. The actual text encoding used in a specific phar file usually
depends on the application that created the phar, and on the
standard encoding of the system on which the phar was created.
`,"doc-ref":["https://www.php.net/manual/en/phar.fileformat.php","https://github.com/php/php-src/tree/master/ext/phar","https://svn.php.net/viewvc/pecl/phar/","https://svn.php.net/viewvc/pear/packages/PHP_Archive/"],seq:[{id:"manifest",type:"manifest",doc:`The archive's manifest, containing general metadata about the archive
and its files.
`},{id:"files",size:"manifest.file_entries[_index].len_data_compressed",repeat:"expr","repeat-expr":"manifest.num_files",doc:`The contents of each file in the archive (possibly compressed,
as indicated by the file's flags in the manifest). The files are stored
in the same order as they appear in the manifest.
`},{id:"signature",type:"signature","size-eos":!0,if:"manifest.flags.has_signature",doc:`The archive's signature - a digest of all archive data before
the signature itself.

Note: Almost all of the available "signature" types are actually hashes,
not signatures, and cannot be used to verify that the archive has not
been tampered with. Only the OpenSSL signature type is a true
cryptographic signature.
`}],enums:{signature_type:{1:{id:"md5","-orig-id":"PHAR_SIG_MD5",doc:"Indicates an MD5 hash."},2:{id:"sha1","-orig-id":"PHAR_SIG_SHA1",doc:"Indicates a SHA-1 hash."},4:{id:"sha256","-orig-id":"PHAR_SIG_SHA256",doc:`Indicates a SHA-256 hash. Available since API version 1.1.0,
PHP_Archive 0.12.0 and phar extension 1.1.0.
`},8:{id:"sha512","-orig-id":"PHAR_SIG_SHA512",doc:`Indicates a SHA-512 hash. Available since API version 1.1.0,
PHP_Archive 0.12.0 and phar extension 1.1.0.
`},16:{id:"openssl","-orig-id":"PHAR_SIG_OPENSSL",doc:`Indicates an OpenSSL signature. Available since API version 1.1.1,
PHP_Archive 0.12.0 (even though it claims to only support
API version 1.1.0) and phar extension 1.3.0. This type is not
documented in the phar extension's documentation of the phar format.

Note: In older versions of the phar extension, this value was used
for an undocumented and unimplemented "PGP" signature type
(\`PHAR_SIG_PGP\`).
`}}},types:{serialized_value:{seq:[{id:"raw","size-eos":!0,doc:"The serialized value, as a raw byte array."}],instances:{parsed:{pos:0,type:"php_serialized_value",doc:"The serialized value, parsed as a structure."}}},file_flags:{seq:[{id:"value",type:"u4",doc:"The unparsed flag bits."}],instances:{permissions:{value:"value & 0x1ff","-orig-id":"PHAR_ENT_PERM_MASK",doc:"The file's permission bits."},zlib_compressed:{value:"(value & 0x1000) != 0","-orig-id":"PHAR_ENT_COMPRESSED_GZ",doc:"Whether this file's data is stored using zlib compression."},bzip2_compressed:{value:"(value & 0x2000) != 0","-orig-id":"PHAR_ENT_COMPRESSED_BZ2",doc:"Whether this file's data is stored using bzip2 compression."}}},file_entry:{seq:[{id:"len_filename",type:"u4",doc:"The length of the file name, in bytes."},{id:"filename",size:"len_filename",doc:`The name of this file. If the name ends with a slash, this entry
represents a directory, otherwise a regular file. Directory entries
are supported since phar API version 1.1.1.
(Explicit directory entries are only needed for empty directories.
Non-empty directories are implied by the files located inside them.)
`},{id:"len_data_uncompressed",type:"u4",doc:"The length of the file's data when uncompressed, in bytes."},{id:"timestamp",type:"u4",doc:`The time at which the file was added or last updated, as a
Unix timestamp.
`},{id:"len_data_compressed",type:"u4",doc:"The length of the file's data when compressed, in bytes."},{id:"crc32",type:"u4",doc:"The CRC32 checksum of the file's uncompressed data."},{id:"flags",type:"file_flags",doc:"Flags for this file."},{id:"len_metadata",type:"u4",doc:"The length of the metadata, in bytes, or 0 if there is none."},{id:"metadata",size:"len_metadata",type:"serialized_value",if:"len_metadata != 0",doc:`Metadata for this file, in the format used by PHP's
\`serialize\` function. The meaning of the serialized data is not
specified further, it may be used to store arbitrary custom data
about the file.
`}]},api_version:{meta:{endian:"be"},doc:`A phar API version number. This version number is meant to indicate
which features are used in a specific phar, so that tools reading
the phar can easily check that they support all necessary features.

The following API versions exist so far:

* 0.5, 0.6, 0.7, 0.7.1: The first official API versions. At this point,
  the phar format was only used by the PHP_Archive library, and the
  API version numbers were identical to the PHP_Archive versions that
  supported them. Development of the native phar extension started around
  API version 0.7. These API versions could only be queried using the
  \`PHP_Archive::APIversion()\` method, but were not stored physically
  in archives. These API versions are not supported by this spec.
* 0.8.0: Used by PHP_Archive 0.8.0 (released 2006-07-18) and
  later development versions of the phar extension. This is the first
  version number to be physically stored in archives. This API version
  is not supported by this spec.
* 0.9.0: Used by later development/early beta versions of the
  phar extension. Also temporarily used by PHP_Archive 0.9.0
  (released 2006-12-15), but reverted back to API version 0.8.0 in
  PHP_Archive 0.9.1 (released 2007-01-05).
* 1.0.0: Supported since PHP_Archive 0.10.0 (released 2007-05-29)
  and phar extension 1.0.0 (released 2007-03-28). This is the first
  stable, forwards-compatible and documented version of the format.
* 1.1.0: Supported since PHP_Archive 0.12.0 (released 2015-07-06)
  and phar extension 1.1.0 (released 2007-04-12). Adds SHA-256 and
  SHA-512 signature types.
* 1.1.1: Supported since phar extension 2.0.0 (released 2009-07-29 and
  included with PHP 5.3 and later). (PHP_Archive 0.12.0 also supports
  all features from API version 1.1.1, but it reports API version 1.1.0.)
  Adds the OpenSSL signature type and support for storing
  empty directories.
`,seq:[{id:"release",type:"b4"},{id:"major",type:"b4"},{id:"minor",type:"b4"},{id:"unused",type:"b4"}]},global_flags:{seq:[{id:"value",type:"u4",doc:"The unparsed flag bits."}],instances:{any_zlib_compressed:{value:"(value & 0x1000) != 0","-orig-id":"PHAR_HDR_COMPRESSED_GZ",doc:`Whether any of the files in this phar are stored using
zlib compression.
`},any_bzip2_compressed:{value:"(value & 0x2000) != 0","-orig-id":"PHAR_HDR_COMPRESSED_BZ2",doc:`Whether any of the files in this phar are stored using
bzip2 compression.
`},has_signature:{value:"(value & 0x10000) != 0","-orig-id":"PHAR_HDR_SIGNATURE",doc:"Whether this phar contains a signature."}}},manifest:{seq:[{id:"len_manifest",type:"u4",doc:`The length of the manifest, in bytes.

Note: The phar extension does not allow reading manifests
larger than 100 MiB.
`},{id:"num_files",type:"u4",doc:"The number of files in this phar."},{id:"api_version",type:"api_version",doc:"The API version used by this phar manifest."},{id:"flags",type:"global_flags",doc:"Global flags for this phar."},{id:"len_alias",type:"u4",doc:"The length of the alias, in bytes."},{id:"alias",size:"len_alias",doc:`The phar's alias, i. e. the name under which it is loaded into PHP.
`},{id:"len_metadata",type:"u4",doc:"The size of the metadata, in bytes, or 0 if there is none."},{id:"metadata",size:"len_metadata",type:"serialized_value",if:"len_metadata != 0",doc:`Metadata for this phar, in the format used by PHP's
\`serialize\` function. The meaning of the serialized data is not
specified further, it may be used to store arbitrary custom data
about the archive.
`},{id:"file_entries",type:"file_entry",repeat:"expr","repeat-expr":"num_files",doc:"Manifest entries for the files contained in this phar."}]},signature:{seq:[{id:"data",size:"_io.size - _io.pos - 8",doc:`The signature data. The size and contents depend on the
signature type.
`},{id:"type",type:"u4",enum:"signature_type",doc:"The signature type."},{id:"magic",contents:"GBMB"}]}}}};export{O as default,A as spec};
