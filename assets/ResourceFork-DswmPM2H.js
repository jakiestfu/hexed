import{k as I}from"./index-DQZRlv-R.js";var R=Object.getOwnPropertyNames,M=(_,d)=>function(){return d||(0,_[R(_)[0]])((d={exports:{}}).exports,d),d.exports},T=M({"<stdin>"(_){(function(d,n){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream","./BytesWithIo"],n):typeof _=="object"&&_!==null&&typeof _.nodeType!="number"?n(_,I.KaitaiStream,require("./BytesWithIo")):n(d.ResourceFork||(d.ResourceFork={}),d.KaitaiStream,d.BytesWithIo||(d.BytesWithIo={}))})(typeof self<"u"?self:_,function(d,n,y){var O=(function(){function u(s,c,f){this._io=s,this._parent=c,this._root=f||this,this._debug={},this._read()}u.prototype._read=function(){this._debug.header={start:this._io.pos,ioOffset:this._io.byteOffset},this.header=new g(this._io,this,this._root),this._debug.header.end=this._io.pos,this._debug.systemData={start:this._io.pos,ioOffset:this._io.byteOffset},this.systemData=this._io.readBytes(112),this._debug.systemData.end=this._io.pos,this._debug.applicationData={start:this._io.pos,ioOffset:this._io.byteOffset},this.applicationData=this._io.readBytes(128),this._debug.applicationData.end=this._io.pos};var k=u.DataBlock=(function(){function s(c,f,l){this._io=c,this._parent=f,this._root=l,this._debug={},this._read()}return s.prototype._read=function(){this._debug.lenData={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenData=this._io.readU4be(),this._debug.lenData.end=this._io.pos,this._debug.data={start:this._io.pos,ioOffset:this._io.byteOffset},this.data=this._io.readBytes(this.lenData),this._debug.data.end=this._io.pos},s})(),g=u.FileHeader=(function(){function s(c,f,l){this._io=c,this._parent=f,this._root=l,this._debug={},this._read()}return s.prototype._read=function(){this._debug.ofsDataBlocks={start:this._io.pos,ioOffset:this._io.byteOffset},this.ofsDataBlocks=this._io.readU4be(),this._debug.ofsDataBlocks.end=this._io.pos,this._debug.ofsResourceMap={start:this._io.pos,ioOffset:this._io.byteOffset},this.ofsResourceMap=this._io.readU4be(),this._debug.ofsResourceMap.end=this._io.pos,this._debug.lenDataBlocks={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenDataBlocks=this._io.readU4be(),this._debug.lenDataBlocks.end=this._io.pos,this._debug.lenResourceMap={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenResourceMap=this._io.readU4be(),this._debug.lenResourceMap.end=this._io.pos},s})(),w=u.ResourceMap=(function(){function s(i,a,p){this._io=i,this._parent=a,this._root=p,this._debug={},this._read()}s.prototype._read=function(){this._debug.reservedFileHeaderCopy={start:this._io.pos,ioOffset:this._io.byteOffset},this.reservedFileHeaderCopy=new g(this._io,this,this._root),this._debug.reservedFileHeaderCopy.end=this._io.pos,this._debug.reservedNextResourceMapHandle={start:this._io.pos,ioOffset:this._io.byteOffset},this.reservedNextResourceMapHandle=this._io.readU4be(),this._debug.reservedNextResourceMapHandle.end=this._io.pos,this._debug.reservedFileReferenceNumber={start:this._io.pos,ioOffset:this._io.byteOffset},this.reservedFileReferenceNumber=this._io.readU2be(),this._debug.reservedFileReferenceNumber.end=this._io.pos,this._debug.fileAttributes={start:this._io.pos,ioOffset:this._io.byteOffset},this._raw_fileAttributes=this._io.readBytes(2);var i=new n(this._raw_fileAttributes);this.fileAttributes=new c(i,this,this._root),this._debug.fileAttributes.end=this._io.pos,this._debug.ofsTypeList={start:this._io.pos,ioOffset:this._io.byteOffset},this.ofsTypeList=this._io.readU2be(),this._debug.ofsTypeList.end=this._io.pos,this._debug.ofsNames={start:this._io.pos,ioOffset:this._io.byteOffset},this.ofsNames=this._io.readU2be(),this._debug.ofsNames.end=this._io.pos};var c=s.FileAttributes=(function(){function i(a,p,r){this._io=a,this._parent=p,this._root=r,this._debug={},this._read()}return i.prototype._read=function(){this._debug.resourcesLocked={start:this._io.pos,ioOffset:this._io.byteOffset},this.resourcesLocked=this._io.readBitsIntBe(1)!=0,this._debug.resourcesLocked.end=this._io.pos,this._debug.reserved0={start:this._io.pos,ioOffset:this._io.byteOffset},this.reserved0=this._io.readBitsIntBe(6),this._debug.reserved0.end=this._io.pos,this._debug.printerDriverMultifinderCompatible={start:this._io.pos,ioOffset:this._io.byteOffset},this.printerDriverMultifinderCompatible=this._io.readBitsIntBe(1)!=0,this._debug.printerDriverMultifinderCompatible.end=this._io.pos,this._debug.noWriteChanges={start:this._io.pos,ioOffset:this._io.byteOffset},this.noWriteChanges=this._io.readBitsIntBe(1)!=0,this._debug.noWriteChanges.end=this._io.pos,this._debug.needsCompact={start:this._io.pos,ioOffset:this._io.byteOffset},this.needsCompact=this._io.readBitsIntBe(1)!=0,this._debug.needsCompact.end=this._io.pos,this._debug.mapNeedsWrite={start:this._io.pos,ioOffset:this._io.byteOffset},this.mapNeedsWrite=this._io.readBitsIntBe(1)!=0,this._debug.mapNeedsWrite.end=this._io.pos,this._debug.reserved1={start:this._io.pos,ioOffset:this._io.byteOffset},this.reserved1=this._io.readBitsIntBe(5),this._debug.reserved1.end=this._io.pos},Object.defineProperty(i.prototype,"asInt",{get:function(){if(this._m_asInt!==void 0)return this._m_asInt;var a=this._io.pos;return this._io.seek(0),this._debug._m_asInt={start:this._io.pos,ioOffset:this._io.byteOffset},this._m_asInt=this._io.readU2be(),this._debug._m_asInt.end=this._io.pos,this._io.seek(a),this._m_asInt}}),i})(),f=s.Name=(function(){function i(a,p,r){this._io=a,this._parent=p,this._root=r,this._debug={},this._read()}return i.prototype._read=function(){this._debug.lenValue={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenValue=this._io.readU1(),this._debug.lenValue.end=this._io.pos,this._debug.value={start:this._io.pos,ioOffset:this._io.byteOffset},this.value=this._io.readBytes(this.lenValue),this._debug.value.end=this._io.pos},i})(),l=s.TypeListAndReferenceLists=(function(){function i(r,m,t){this._io=r,this._parent=m,this._root=t,this._debug={},this._read()}i.prototype._read=function(){this._debug.typeList={start:this._io.pos,ioOffset:this._io.byteOffset},this.typeList=new p(this._io,this,this._root),this._debug.typeList.end=this._io.pos,this._debug.referenceLists={start:this._io.pos,ioOffset:this._io.byteOffset},this.referenceLists=this._io.readBytesFull(),this._debug.referenceLists.end=this._io.pos};var a=i.ReferenceList=(function(){function r(t,o,e,h){this._io=t,this._parent=o,this._root=e,this.numReferences=h,this._debug={},this._read()}r.prototype._read=function(){this._debug.references={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.references.arr=[],this.references=[];for(var t=0;t<this.numReferences;t++)this._debug.references.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this.references.push(new m(this._io,this,this._root)),this._debug.references.arr[t].end=this._io.pos;this._debug.references.end=this._io.pos};var m=r.Reference=(function(){function t(e,h,b){this._io=e,this._parent=h,this._root=b,this._debug={},this._read()}t.prototype._read=function(){this._debug.id={start:this._io.pos,ioOffset:this._io.byteOffset},this.id=this._io.readS2be(),this._debug.id.end=this._io.pos,this._debug.ofsName={start:this._io.pos,ioOffset:this._io.byteOffset},this.ofsName=this._io.readU2be(),this._debug.ofsName.end=this._io.pos,this._debug.attributes={start:this._io.pos,ioOffset:this._io.byteOffset},this._raw_attributes=this._io.readBytes(1);var e=new n(this._raw_attributes);this.attributes=new o(e,this,this._root),this._debug.attributes.end=this._io.pos,this._debug.ofsDataBlock={start:this._io.pos,ioOffset:this._io.byteOffset},this.ofsDataBlock=this._io.readBitsIntBe(24),this._debug.ofsDataBlock.end=this._io.pos,this._io.alignToByte(),this._debug.reservedHandle={start:this._io.pos,ioOffset:this._io.byteOffset},this.reservedHandle=this._io.readU4be(),this._debug.reservedHandle.end=this._io.pos};var o=t.Attributes=(function(){function e(h,b,v){this._io=h,this._parent=b,this._root=v,this._debug={},this._read()}return e.prototype._read=function(){this._debug.systemReference={start:this._io.pos,ioOffset:this._io.byteOffset},this.systemReference=this._io.readBitsIntBe(1)!=0,this._debug.systemReference.end=this._io.pos,this._debug.loadIntoSystemHeap={start:this._io.pos,ioOffset:this._io.byteOffset},this.loadIntoSystemHeap=this._io.readBitsIntBe(1)!=0,this._debug.loadIntoSystemHeap.end=this._io.pos,this._debug.purgeable={start:this._io.pos,ioOffset:this._io.byteOffset},this.purgeable=this._io.readBitsIntBe(1)!=0,this._debug.purgeable.end=this._io.pos,this._debug.locked={start:this._io.pos,ioOffset:this._io.byteOffset},this.locked=this._io.readBitsIntBe(1)!=0,this._debug.locked.end=this._io.pos,this._debug.protected={start:this._io.pos,ioOffset:this._io.byteOffset},this.protected=this._io.readBitsIntBe(1)!=0,this._debug.protected.end=this._io.pos,this._debug.preload={start:this._io.pos,ioOffset:this._io.byteOffset},this.preload=this._io.readBitsIntBe(1)!=0,this._debug.preload.end=this._io.pos,this._debug.needsWrite={start:this._io.pos,ioOffset:this._io.byteOffset},this.needsWrite=this._io.readBitsIntBe(1)!=0,this._debug.needsWrite.end=this._io.pos,this._debug.compressed={start:this._io.pos,ioOffset:this._io.byteOffset},this.compressed=this._io.readBitsIntBe(1)!=0,this._debug.compressed.end=this._io.pos},Object.defineProperty(e.prototype,"asInt",{get:function(){if(this._m_asInt!==void 0)return this._m_asInt;var h=this._io.pos;return this._io.seek(0),this._debug._m_asInt={start:this._io.pos,ioOffset:this._io.byteOffset},this._m_asInt=this._io.readU1(),this._debug._m_asInt.end=this._io.pos,this._io.seek(h),this._m_asInt}}),e})();return Object.defineProperty(t.prototype,"dataBlock",{get:function(){if(this._m_dataBlock!==void 0)return this._m_dataBlock;var e=this._root.dataBlocksWithIo._io,h=e.pos;return e.seek(this.ofsDataBlock),this._debug._m_dataBlock={start:e.pos,ioOffset:e.byteOffset},this._m_dataBlock=new k(e,this,this._root),this._debug._m_dataBlock.end=e.pos,e.seek(h),this._m_dataBlock}}),Object.defineProperty(t.prototype,"name",{get:function(){if(this._m_name!==void 0)return this._m_name;if(this.ofsName!=65535){var e=this._root.resourceMap.namesWithIo._io,h=e.pos;e.seek(this.ofsName),this._debug._m_name={start:e.pos,ioOffset:e.byteOffset},this._m_name=new f(e,this,this._root),this._debug._m_name.end=e.pos,e.seek(h)}return this._m_name}}),t})();return r})(),p=i.TypeList=(function(){function r(t,o,e){this._io=t,this._parent=o,this._root=e,this._debug={},this._read()}r.prototype._read=function(){this._debug.numTypesM1={start:this._io.pos,ioOffset:this._io.byteOffset},this.numTypesM1=this._io.readU2be(),this._debug.numTypesM1.end=this._io.pos,this._debug.entries={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.entries.arr=[],this.entries=[];for(var t=0;t<this.numTypes;t++)this._debug.entries.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this.entries.push(new m(this._io,this,this._root)),this._debug.entries.arr[t].end=this._io.pos;this._debug.entries.end=this._io.pos};var m=r.TypeListEntry=(function(){function t(o,e,h){this._io=o,this._parent=e,this._root=h,this._debug={},this._read()}return t.prototype._read=function(){this._debug.type={start:this._io.pos,ioOffset:this._io.byteOffset},this.type=this._io.readBytes(4),this._debug.type.end=this._io.pos,this._debug.numReferencesM1={start:this._io.pos,ioOffset:this._io.byteOffset},this.numReferencesM1=this._io.readU2be(),this._debug.numReferencesM1.end=this._io.pos,this._debug.ofsReferenceList={start:this._io.pos,ioOffset:this._io.byteOffset},this.ofsReferenceList=this._io.readU2be(),this._debug.ofsReferenceList.end=this._io.pos},Object.defineProperty(t.prototype,"numReferences",{get:function(){return this._m_numReferences!==void 0?this._m_numReferences:(this._debug._m_numReferences={},this._m_numReferences=n.mod(this.numReferencesM1+1,65536),this._m_numReferences)}}),Object.defineProperty(t.prototype,"referenceList",{get:function(){if(this._m_referenceList!==void 0)return this._m_referenceList;var o=this._parent._parent._io,e=o.pos;return o.seek(this.ofsReferenceList),this._debug._m_referenceList={start:o.pos,ioOffset:o.byteOffset},this._m_referenceList=new a(o,this,this._root,this.numReferences),this._debug._m_referenceList.end=o.pos,o.seek(e),this._m_referenceList}}),t})();return Object.defineProperty(r.prototype,"numTypes",{get:function(){return this._m_numTypes!==void 0?this._m_numTypes:(this._debug._m_numTypes={},this._m_numTypes=n.mod(this.numTypesM1+1,65536),this._m_numTypes)}}),r})();return i})();return Object.defineProperty(s.prototype,"names",{get:function(){return this._m_names!==void 0?this._m_names:(this._debug._m_names={},this._m_names=this.namesWithIo.data,this._m_names)}}),Object.defineProperty(s.prototype,"namesWithIo",{get:function(){if(this._m_namesWithIo!==void 0)return this._m_namesWithIo;var i=this._io.pos;this._io.seek(this.ofsNames),this._debug._m_namesWithIo={start:this._io.pos,ioOffset:this._io.byteOffset},this._raw__m_namesWithIo=this._io.readBytesFull();var a=new n(this._raw__m_namesWithIo);return this._m_namesWithIo=new y.BytesWithIo(a,null,null),this._debug._m_namesWithIo.end=this._io.pos,this._io.seek(i),this._m_namesWithIo}}),Object.defineProperty(s.prototype,"typeListAndReferenceLists",{get:function(){if(this._m_typeListAndReferenceLists!==void 0)return this._m_typeListAndReferenceLists;var i=this._io.pos;this._io.seek(this.ofsTypeList),this._debug._m_typeListAndReferenceLists={start:this._io.pos,ioOffset:this._io.byteOffset},this._raw__m_typeListAndReferenceLists=this._io.readBytes(this.ofsNames-this.ofsTypeList);var a=new n(this._raw__m_typeListAndReferenceLists);return this._m_typeListAndReferenceLists=new l(a,this,this._root),this._debug._m_typeListAndReferenceLists.end=this._io.pos,this._io.seek(i),this._m_typeListAndReferenceLists}}),s})();return Object.defineProperty(u.prototype,"dataBlocks",{get:function(){return this._m_dataBlocks!==void 0?this._m_dataBlocks:(this._debug._m_dataBlocks={},this._m_dataBlocks=this.dataBlocksWithIo.data,this._m_dataBlocks)}}),Object.defineProperty(u.prototype,"dataBlocksWithIo",{get:function(){if(this._m_dataBlocksWithIo!==void 0)return this._m_dataBlocksWithIo;var s=this._io.pos;this._io.seek(this.header.ofsDataBlocks),this._debug._m_dataBlocksWithIo={start:this._io.pos,ioOffset:this._io.byteOffset},this._raw__m_dataBlocksWithIo=this._io.readBytes(this.header.lenDataBlocks);var c=new n(this._raw__m_dataBlocksWithIo);return this._m_dataBlocksWithIo=new y.BytesWithIo(c,null,null),this._debug._m_dataBlocksWithIo.end=this._io.pos,this._io.seek(s),this._m_dataBlocksWithIo}}),Object.defineProperty(u.prototype,"resourceMap",{get:function(){if(this._m_resourceMap!==void 0)return this._m_resourceMap;var s=this._io.pos;this._io.seek(this.header.ofsResourceMap),this._debug._m_resourceMap={start:this._io.pos,ioOffset:this._io.byteOffset},this._raw__m_resourceMap=this._io.readBytes(this.header.lenResourceMap);var c=new n(this._raw__m_resourceMap);return this._m_resourceMap=new w(c,this,this._root),this._debug._m_resourceMap.end=this._io.pos,this._io.seek(s),this._m_resourceMap}}),u})();d.ResourceFork=O})}});const L=T(),A={id:"resource_fork",title:"Macintosh resource fork data",ksy:{meta:{id:"resource_fork",title:"Macintosh resource fork data",application:"Mac OS","file-extension":["rsrc","dfont"],xref:{justsolve:"Resource_Fork",wikidata:"Q3933446"},license:"MIT","ks-version":"0.9",imports:["/common/bytes_with_io"],endian:"be"},doc:`The data format of Macintosh resource forks,
used on Classic Mac OS and Mac OS X/macOS to store additional structured data along with a file's main data (the data fork).
The kinds of data stored in resource forks include:

* Document resources:
  images, sounds, etc. used by a document
* Application resources:
  graphics, GUI layouts, localizable strings,
  and even code used by an application, a library, or system files
* Common metadata:
  custom icons and version metadata that could be displayed by the Finder
* Application-specific metadata:
  because resource forks follow a common format,
  other applications can store new metadata in them,
  even if the original application does not recognize or understand it

Macintosh file systems (MFS, HFS, HFS+, APFS) support resource forks natively,
which allows storing resources along with any file.
Non-Macintosh file systems and protocols have little or no support for resource forks,
so the resource fork data must be stored in some other way when using such file systems or protocols.
Various file formats and tools exist for this purpose,
such as BinHex, MacBinary, AppleSingle, AppleDouble, or QuickTime RezWack.
In some cases,
resource forks are stored as plain data in separate files with a .rsrc extension,
even on Mac systems that natively support resource forks.

On modern Mac OS X/macOS systems,
resource forks are used far less commonly than on classic Mac OS systems,
because of compatibility issues with other systems and historical limitations in the format.
Modern macOS APIs and libraries do not use resource forks,
and the legacy Carbon API that still used them has been deprecated since OS X 10.8.
Despite this,
even current macOS systems still use resource forks for certain purposes,
such as custom file icons.
`,"doc-ref":["https://developer.apple.com/library/archive/documentation/mac/pdf/MoreMacintoshToolbox.pdf#page=151 Inside Macintosh, More Macintosh Toolbox, Resource Manager, Resource Manager Reference, Resource File Format","https://www.pagetable.com/?p=50 Inside Macintosh, Volume I, The Resource Manager, Format of a Resource File","https://github.com/kreativekorp/ksfl/wiki/Macintosh-Resource-File-Format","https://github.com/dgelessus/mac_file_format_docs/blob/master/README.md#resource-forks"],seq:[{id:"header",type:"file_header",doc:"The resource file's header information."},{id:"system_data",size:112,doc:`System-reserved data area.
This field can generally be ignored when reading and writing.

This field is used by the Classic Mac OS Finder as temporary storage space.
It usually contains parts of the file metadata (name, type/creator code, etc.).
Any existing data in this field is ignored and overwritten.

In resource files written by Mac OS X,
this field is set to all zero bytes.
`},{id:"application_data",size:128,doc:`Application-specific data area.
This field can generally be ignored when reading and writing.

According to early revisions of Inside Macintosh,
this field is "available for application data".
In practice, it is almost never used for this purpose,
and usually contains only junk data.

In resource files written by Mac OS X,
this field is set to all zero bytes.
`}],instances:{data_blocks_with_io:{pos:"header.ofs_data_blocks",size:"header.len_data_blocks",type:"bytes_with_io",doc:"Use `data_blocks` instead,\nunless you need access to this instance's `_io`.\n"},data_blocks:{value:"data_blocks_with_io.data",doc:`Storage area for the data blocks of all resources.

These data blocks are not required to appear in any particular order,
and there may be unused space between and around them.

In practice,
the data blocks in newly created resource files are usually contiguous.
When existing resources are shortened,
the Mac OS resource manager leaves unused space where the now removed resource data was,
as this is quicker than moving the following resource data into the newly freed space.
Such unused space may be cleaned up later when the resource manager "compacts" the resource file,
which happens when resources are removed entirely,
or when resources are added or grown so that more space is needed in the data area.
`},resource_map:{pos:"header.ofs_resource_map",size:"header.len_resource_map",type:"resource_map",doc:"The resource file's resource map."}},types:{file_header:{doc:`Resource file header,
containing the offsets and lengths of the resource data area and resource map.
`,seq:[{id:"ofs_data_blocks",type:"u4",doc:`Offset of the resource data area,
from the start of the resource file.

In practice,
this should always be \`256\`,
i. e. the resource data area should directly follow the application-specific data area.
`},{id:"ofs_resource_map",type:"u4",doc:`Offset of the resource map,
from the start of the resource file.

In practice,
this should always be \`ofs_data_blocks + len_data_blocks\`,
i. e. the resource map should directly follow the resource data area.
`},{id:"len_data_blocks",type:"u4",doc:`Length of the resource data area.
`},{id:"len_resource_map",type:"u4",doc:`Length of the resource map.

In practice,
this should always be \`_root._io.size - ofs_resource_map\`,
i. e. the resource map should extend to the end of the resource file.
`}]},data_block:{doc:`A resource data block,
as stored in the resource data area.

Each data block stores the data contained in a resource,
along with its length.
`,seq:[{id:"len_data",type:"u4",doc:`The length of the resource data stored in this block.
`},{id:"data",size:"len_data",doc:`The data stored in this block.
`}]},resource_map:{doc:`Resource map,
containing information about the resources in the file and where they are located in the data area.
`,seq:[{id:"reserved_file_header_copy",type:"file_header",doc:"Reserved space for a copy of the resource file header."},{id:"reserved_next_resource_map_handle",type:"u4",doc:"Reserved space for a handle to the next loaded resource map in memory."},{id:"reserved_file_reference_number",type:"u2",doc:"Reserved space for the resource file's file reference number."},{id:"file_attributes",type:"file_attributes",size:2,doc:"The resource file's attributes."},{id:"ofs_type_list",type:"u2",doc:`Offset of the resource type list,
from the start of the resource map.

In practice,
this should always be \`sizeof<resource_map>\`,
i. e. the resource type list should directly follow the resource map.
`},{id:"ofs_names",type:"u2",doc:`Offset of the resource name area,
from the start of the resource map.
`}],instances:{type_list_and_reference_lists:{pos:"ofs_type_list",size:"ofs_names - ofs_type_list",type:"type_list_and_reference_lists",doc:"The resource map's resource type list, followed by the resource reference list area."},names_with_io:{pos:"ofs_names","size-eos":!0,type:"bytes_with_io",doc:"Use `names` instead,\nunless you need access to this instance's `_io`.\n"},names:{value:"names_with_io.data",doc:"Storage area for the names of all resources."}},types:{file_attributes:{doc:`A resource file's attributes,
as stored in the resource map.

These attributes are sometimes also referred to as resource map attributes,
because of where they are stored in the file.
`,seq:[{id:"resources_locked",type:"b1",doc:`TODO What does this attribute actually do,
and how is it different from \`read_only\`?

This attribute is undocumented and not defined in <CarbonCore/Resources.h>,
but ResEdit has a checkbox called "Resources Locked" for this attribute.
`},{id:"reserved0",type:"b6",doc:`These attributes have no known usage or meaning and should always be zero.
`},{id:"printer_driver_multifinder_compatible",type:"b1",doc:`Indicates that this printer driver is compatible with MultiFinder,
i. e. can be used simultaneously by multiple applications.
This attribute is only meant to be set on printer driver resource forks.

This attribute is not documented in Inside Macintosh and is not defined in <CarbonCore/Resources.h>.
It is documented in technote PR510,
and ResEdit has a checkbox called "Printer Driver MultiFinder Compatible" for this attribute.
`,"doc-ref":`https://developer.apple.com/library/archive/technotes/pr/pr_510.html Apple Technical Note PR510 - Printer Driver Q&As, section '"Printer driver is MultiFinder compatible" bit'`},{id:"no_write_changes","-orig-id":"mapReadOnly",type:"b1",doc:`Indicates that the Resource Manager should not write any changes from memory into the resource file.
Any modification operations requested by the application will return successfully,
but will not actually update the resource file.

TODO Is this attribute supposed to be set on disk or only in memory?
`},{id:"needs_compact","-orig-id":"mapCompact",type:"b1",doc:`Indicates that the resource file should be compacted the next time it is written by the Resource Manager.
This attribute is only meant to be set in memory;
it is cleared when the resource file is written to disk.

This attribute is mainly used internally by the Resource Manager,
but may also be set manually by the application.
`},{id:"map_needs_write","-orig-id":"mapChanged",type:"b1",doc:`Indicates that the resource map has been changed in memory and should be written to the resource file on the next update.
This attribute is only meant to be set in memory;
it is cleared when the resource file is written to disk.

This attribute is mainly used internally by the Resource Manager,
but may also be set manually by the application.
`},{id:"reserved1",type:"b5",doc:`These attributes have no known usage or meaning and should always be zero.
`}],instances:{as_int:{pos:0,type:"u2",doc:`The attributes as a packed integer,
as they are stored in the file.
`}}},type_list_and_reference_lists:{doc:`Resource type list and storage area for resource reference lists in the resource map.

The two parts are combined into a single type here for technical reasons:
the start of the resource reference list area is not stored explicitly in the file,
instead it always starts directly after the resource type list.
The simplest way to implement this is by placing both types into a single \`seq\`.
`,seq:[{id:"type_list",type:"type_list",doc:"The resource map's resource type list."},{id:"reference_lists","size-eos":!0,doc:`Storage area for the resource map's resource reference lists.

According to Inside Macintosh,
the reference lists are stored contiguously,
in the same order as their corresponding resource type list entries.
`}],types:{type_list:{doc:"Resource type list in the resource map.",seq:[{id:"num_types_m1",type:"u2",doc:`The number of resource types in this list,
minus one.

If the resource list is empty,
the value of this field is \`0xffff\`,
i. e. \`-1\` truncated to a 16-bit unsigned integer.
`},{id:"entries",type:"type_list_entry",repeat:"expr","repeat-expr":"num_types",doc:"Entries in the resource type list."}],instances:{num_types:{value:"(num_types_m1 + 1) % 0x10000",doc:"The number of resource types in this list."}},types:{type_list_entry:{doc:`A single entry in the resource type list.

Each entry corresponds to exactly one resource reference list.
`,seq:[{id:"type",size:4,doc:"The four-character type code of the resources in the reference list."},{id:"num_references_m1",type:"u2",doc:`The number of resources in the reference list for this type,
minus one.

Empty reference lists should never exist.
`},{id:"ofs_reference_list",type:"u2",doc:`Offset of the resource reference list for this resource type,
from the start of the resource type list.

Although the offset is relative to the start of the type list,
it should never point into the type list itself,
but into the reference list storage area that directly follows it.
That is,
it should always be at least \`_parent._sizeof\`.
`}],instances:{num_references:{value:"(num_references_m1 + 1) % 0x10000",doc:"The number of resources in the reference list for this type."},reference_list:{io:"_parent._parent._io",pos:"ofs_reference_list",type:"reference_list(num_references)",doc:`The resource reference list for this resource type.
`}}}}},reference_list:{doc:`A resource reference list,
as stored in the reference list area.

Each reference list has exactly one matching entry in the resource type list,
and describes all resources of a single type in the file.
`,params:[{id:"num_references",type:"u2",doc:`The number of references in this resource reference list.

This information needs to be passed in as a parameter,
because it is stored in the reference list's type list entry,
and not in the reference list itself.
`}],seq:[{id:"references",type:"reference",repeat:"expr","repeat-expr":"num_references",doc:"The resource references in this reference list."}],types:{reference:{doc:"A single resource reference in a resource reference list.",seq:[{id:"id",type:"s2",doc:"ID of the resource described by this reference."},{id:"ofs_name",type:"u2",doc:`Offset of the name for the resource described by this reference,
from the start of the resource name area.

If the resource has no name,
the value of this field is \`0xffff\`
i. e. \`-1\` truncated to a 16-bit unsigned integer.
`},{id:"attributes",type:"attributes",size:1,doc:"Attributes of the resource described by this reference."},{id:"ofs_data_block",type:"b24",doc:`Offset of the data block for the resource described by this reference,
from the start of the resource data area.
`},{id:"reserved_handle",type:"u4",doc:"Reserved space for the resource's handle in memory."}],instances:{name:{io:"_root.resource_map.names_with_io._io",pos:"ofs_name",type:"name",if:"ofs_name != 0xffff",doc:`The name (if any) of the resource described by this reference.
`},data_block:{io:"_root.data_blocks_with_io._io",pos:"ofs_data_block",type:"data_block",doc:`The data block containing the data for the resource described by this reference.
`}},types:{attributes:{doc:`A resource's attributes,
as stored in a resource reference.
`,seq:[{id:"system_reference","-orig-id":"resSysRef",type:"b1",doc:`Indicates that this resource reference is a system reference rather than a regular local reference.
This attribute is nearly undocumented.
For all practical purposes,
it should be considered reserved and should always be zero.

This attribute was last documented in the Promotional Edition of Inside Macintosh,
in the Resource Manager chapter,
on pages 37-41,
in a "System References" section that calls itself "of historical interest only".
The final versions of Inside Macintosh only mention this attribute as "reserved for use by the Resource Manager".
<CarbonCore/Resources.h> contains a \`resSysRefBit\` constant,
but no corresponding \`resSysRef\` constant like for all other resource attributes.

According to the Inside Macintosh Promotional Edition,
a system reference was effectively an alias pointing to a resource stored in the system file,
possibly with a different ID and name (but not type) than the system reference.
If this attribute is set,
\`ofs_data_block\` is ignored and should be zero,
and \`reserved_handle\` contains
(in its high and low two bytes, respectively)
the ID and name offset of the real system resource that this system reference points to.

TODO Do any publicly available Mac OS versions support system references,
and do any real files/applications use them?
So far the answer seems to be no,
but I would like to be proven wrong!
`},{id:"load_into_system_heap","-orig-id":"resSysHeap",type:"b1",doc:`Indicates that this resource should be loaded into the system heap if possible,
rather than the application heap.

This attribute is only meant to be used by Mac OS itself,
for System and Finder resources,
and not by normal applications.

This attribute may be set both in memory and on disk,
but it only has any meaning while the resource file is loaded into memory.
`},{id:"purgeable","-orig-id":"resPurgeable",type:"b1",doc:`Indicates that this resource's data should be purgeable by the Mac OS Memory Manager.
This allows the resource data to be purged from memory if space is needed on the heap.
Purged resources can later be reloaded from disk if their data is needed again.

If the \`locked\` attribute is set,
this attribute has no effect
(i. e. locked resources are never purgeable).

This attribute may be set both in memory and on disk,
but it only has any meaning while the resource file is loaded into memory.
`},{id:"locked","-orig-id":"resLocked",type:"b1",doc:`Indicates that this resource's data should be locked to the Mac OS Memory Manager.
This prevents the resource data from being moved when the heap is compacted.

This attribute may be set both in memory and on disk,
but it only has any meaning while the resource file is loaded into memory.
`},{id:"protected","-orig-id":"resProtected",type:"b1",doc:`Indicates that this resource should be protected (i. e. unmodifiable) in memory.
This prevents the application from using the Resource Manager to change the resource's data or metadata,
or delete it.
The only exception are the resource's attributes,
which can always be changed,
even for protected resources.
This allows protected resources to be unprotected again by the application.

This attribute may be set both in memory and on disk,
but it only has any meaning while the resource file is loaded into memory.
`},{id:"preload","-orig-id":"resPreload",type:"b1",doc:`Indicates that this resource's data should be immediately loaded into memory when the resource file is opened.

This attribute may be set both in memory and on disk,
but it only has any meaning when the resource file is first opened.
`},{id:"needs_write","-orig-id":"resChanged",type:"b1",doc:`Indicates that this resource's data has been changed in memory and should be written to the resource file on the next update.
This attribute is only meant to be set in memory;
it is cleared when the resource file is written to disk.

This attribute is used internally by the Resource Manager and should not be set manually by the application.
`},{id:"compressed","-orig-id":"resCompressed",type:"b1",doc:`Indicates that this resource's data is compressed.
Compressed resource data is decompressed transparently by the Resource Manager when reading.

For a detailed description of the structure of compressed resources as they are stored in the file,
see the compressed_resource.ksy spec.
`}],instances:{as_int:{pos:0,type:"u1",doc:`The attributes as a packed integer,
as they are stored in the file.
`}}}}}}}}},name:{doc:`A resource name,
as stored in the resource name storage area in the resource map.

The resource names are not required to appear in any particular order.
There may be unused space between and around resource names,
but in practice they are often contiguous.
`,seq:[{id:"len_value",type:"u1",doc:`The length of the resource name, in bytes.
`},{id:"value",size:"len_value",doc:`The resource name.

This field is exposed as a byte array,
because there is no universal encoding for resource names.
Most Classic Mac software does not deal with encodings explicitly and instead assumes that all strings,
including resource names,
use the system encoding,
which varies depending on the system language.
This means that resource names can use different encodings depending on what system language they were created with.

Many resource names are plain ASCII,
meaning that the encoding often does not matter
(because all Mac OS encodings are ASCII-compatible).
For non-ASCII resource names,
the most common encoding is perhaps MacRoman
(used for English and other Western languages),
but other encodings are also sometimes used,
especially for software in non-Western languages.

There is no requirement that all names in a single resource file use the same encoding.
For example,
localized software may have some (but not all) of its resource names translated.
For non-Western languages,
this can lead to some resource names using MacRoman,
and others using a different encoding.
`}]}}}}}};export{L as default,A as spec};
