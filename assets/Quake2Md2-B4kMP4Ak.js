import{k as b}from"./index-LM5QM2-c.js";var y=Object.getOwnPropertyNames,v=(_,r)=>function(){return r||(0,_[y(_)[0]])((r={exports:{}}).exports,r),r.exports},x=v({"<stdin>"(_){(function(r,n){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream"],n):typeof _=="object"&&_!==null&&typeof _.nodeType!="number"?n(_,b.KaitaiStream):n(r.Quake2Md2||(r.Quake2Md2={}),r.KaitaiStream)})(typeof self<"u"?self:_,function(r,n){var h=(function(){i.GlPrimitive=Object.freeze({TRIANGLE_STRIP:0,TRIANGLE_FAN:1,0:"TRIANGLE_STRIP",1:"TRIANGLE_FAN"});function i(e,t,s){this._io=e,this._parent=t,this._root=s||this,this._debug={},this._read()}i.prototype._read=function(){if(this._debug.magic={start:this._io.pos,ioOffset:this._io.byteOffset},this.magic=this._io.readBytes(4),this._debug.magic.end=this._io.pos,n.byteArrayCompare(this.magic,new Uint8Array([73,68,80,50]))!=0){var e=new n.ValidationNotEqualError(new Uint8Array([73,68,80,50]),this.magic,this._io,"/seq/0");throw this._debug.magic.validationError=e,e}if(this._debug.version={start:this._io.pos,ioOffset:this._io.byteOffset},this.version=this._io.readU4le(),this._debug.version.end=this._io.pos,this.version!=8){var e=new n.ValidationNotEqualError(8,this.version,this._io,"/seq/1");throw this._debug.version.validationError=e,e}this._debug.skinWidthPx={start:this._io.pos,ioOffset:this._io.byteOffset},this.skinWidthPx=this._io.readU4le(),this._debug.skinWidthPx.end=this._io.pos,this._debug.skinHeightPx={start:this._io.pos,ioOffset:this._io.byteOffset},this.skinHeightPx=this._io.readU4le(),this._debug.skinHeightPx.end=this._io.pos,this._debug.bytesPerFrame={start:this._io.pos,ioOffset:this._io.byteOffset},this.bytesPerFrame=this._io.readU4le(),this._debug.bytesPerFrame.end=this._io.pos,this._debug.numSkins={start:this._io.pos,ioOffset:this._io.byteOffset},this.numSkins=this._io.readU4le(),this._debug.numSkins.end=this._io.pos,this._debug.verticesPerFrame={start:this._io.pos,ioOffset:this._io.byteOffset},this.verticesPerFrame=this._io.readU4le(),this._debug.verticesPerFrame.end=this._io.pos,this._debug.numTexCoords={start:this._io.pos,ioOffset:this._io.byteOffset},this.numTexCoords=this._io.readU4le(),this._debug.numTexCoords.end=this._io.pos,this._debug.numTriangles={start:this._io.pos,ioOffset:this._io.byteOffset},this.numTriangles=this._io.readU4le(),this._debug.numTriangles.end=this._io.pos,this._debug.numGlCmds={start:this._io.pos,ioOffset:this._io.byteOffset},this.numGlCmds=this._io.readU4le(),this._debug.numGlCmds.end=this._io.pos,this._debug.numFrames={start:this._io.pos,ioOffset:this._io.byteOffset},this.numFrames=this._io.readU4le(),this._debug.numFrames.end=this._io.pos,this._debug.ofsSkins={start:this._io.pos,ioOffset:this._io.byteOffset},this.ofsSkins=this._io.readU4le(),this._debug.ofsSkins.end=this._io.pos,this._debug.ofsTexCoords={start:this._io.pos,ioOffset:this._io.byteOffset},this.ofsTexCoords=this._io.readU4le(),this._debug.ofsTexCoords.end=this._io.pos,this._debug.ofsTriangles={start:this._io.pos,ioOffset:this._io.byteOffset},this.ofsTriangles=this._io.readU4le(),this._debug.ofsTriangles.end=this._io.pos,this._debug.ofsFrames={start:this._io.pos,ioOffset:this._io.byteOffset},this.ofsFrames=this._io.readU4le(),this._debug.ofsFrames.end=this._io.pos,this._debug.ofsGlCmds={start:this._io.pos,ioOffset:this._io.byteOffset},this.ofsGlCmds=this._io.readU4le(),this._debug.ofsGlCmds.end=this._io.pos,this._debug.ofsEof={start:this._io.pos,ioOffset:this._io.byteOffset},this.ofsEof=this._io.readU4le(),this._debug.ofsEof.end=this._io.pos};var d=i.CompressedVec=(function(){function e(t,s,o){this._io=t,this._parent=s,this._root=o,this._debug={},this._read()}return e.prototype._read=function(){this._debug.xCompressed={start:this._io.pos,ioOffset:this._io.byteOffset},this.xCompressed=this._io.readU1(),this._debug.xCompressed.end=this._io.pos,this._debug.yCompressed={start:this._io.pos,ioOffset:this._io.byteOffset},this.yCompressed=this._io.readU1(),this._debug.yCompressed.end=this._io.pos,this._debug.zCompressed={start:this._io.pos,ioOffset:this._io.byteOffset},this.zCompressed=this._io.readU1(),this._debug.zCompressed.end=this._io.pos},Object.defineProperty(e.prototype,"x",{get:function(){return this._m_x!==void 0?this._m_x:(this._debug._m_x={},this._m_x=this.xCompressed*this._parent._parent.scale.x+this._parent._parent.translate.x,this._m_x)}}),Object.defineProperty(e.prototype,"y",{get:function(){return this._m_y!==void 0?this._m_y:(this._debug._m_y={},this._m_y=this.yCompressed*this._parent._parent.scale.y+this._parent._parent.translate.y,this._m_y)}}),Object.defineProperty(e.prototype,"z",{get:function(){return this._m_z!==void 0?this._m_z:(this._debug._m_z={},this._m_z=this.zCompressed*this._parent._parent.scale.z+this._parent._parent.translate.z,this._m_z)}}),e})(),m=i.Frame=(function(){function e(t,s,o){this._io=t,this._parent=s,this._root=o,this._debug={},this._read()}return e.prototype._read=function(){this._debug.scale={start:this._io.pos,ioOffset:this._io.byteOffset},this.scale=new a(this._io,this,this._root),this._debug.scale.end=this._io.pos,this._debug.translate={start:this._io.pos,ioOffset:this._io.byteOffset},this.translate=new a(this._io,this,this._root),this._debug.translate.end=this._io.pos,this._debug.name={start:this._io.pos,ioOffset:this._io.byteOffset},this.name=n.bytesToStr(n.bytesTerminate(this._io.readBytes(16),0,!1),"ASCII"),this._debug.name.end=this._io.pos,this._debug.vertices={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.vertices.arr=[],this.vertices=[];for(var t=0;t<this._root.verticesPerFrame;t++)this._debug.vertices.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this.vertices.push(new g(this._io,this,this._root)),this._debug.vertices.arr[t].end=this._io.pos;this._debug.vertices.end=this._io.pos},e})(),f=i.GlCmd=(function(){function e(t,s,o){this._io=t,this._parent=s,this._root=o,this._debug={},this._read()}return e.prototype._read=function(){this._debug.cmdNumVertices={start:this._io.pos,ioOffset:this._io.byteOffset},this.cmdNumVertices=this._io.readS4le(),this._debug.cmdNumVertices.end=this._io.pos,this._debug.vertices={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.vertices.arr=[],this.vertices=[];for(var t=0;t<this.numVertices;t++)this._debug.vertices.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this.vertices.push(new u(this._io,this,this._root)),this._debug.vertices.arr[t].end=this._io.pos;this._debug.vertices.end=this._io.pos},Object.defineProperty(e.prototype,"numVertices",{get:function(){return this._m_numVertices!==void 0?this._m_numVertices:(this._debug._m_numVertices={},this._m_numVertices=this.cmdNumVertices<0?-this.cmdNumVertices:this.cmdNumVertices,this._m_numVertices)}}),Object.defineProperty(e.prototype,"primitive",{get:function(){return this._m_primitive!==void 0?this._m_primitive:(this._debug._m_primitive={enumName:"Quake2Md2.GlPrimitive"},this._m_primitive=this.cmdNumVertices<0?i.GlPrimitive.TRIANGLE_FAN:i.GlPrimitive.TRIANGLE_STRIP,this._m_primitive)}}),e})(),p=i.GlCmdsList=(function(){function e(t,s,o){this._io=t,this._parent=s,this._root=o,this._debug={},this._read()}return e.prototype._read=function(){if(!this._io.isEof()){this._debug.items={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.items.arr=[],this.items=[];do{this._debug.items.arr[this.items.length]={start:this._io.pos,ioOffset:this._io.byteOffset};var t=new f(this._io,this,this._root);this.items.push(t),this._debug.items.arr[this.items.length-1].end=this._io.pos}while(t.cmdNumVertices!=0);this._debug.items.end=this._io.pos}},e})(),u=i.GlVertex=(function(){function e(t,s,o){this._io=t,this._parent=s,this._root=o,this._debug={},this._read()}return e.prototype._read=function(){this._debug.texCoordsNormalized={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.texCoordsNormalized.arr=[],this.texCoordsNormalized=[];for(var t=0;t<2;t++)this._debug.texCoordsNormalized.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this.texCoordsNormalized.push(this._io.readF4le()),this._debug.texCoordsNormalized.arr[t].end=this._io.pos;this._debug.texCoordsNormalized.end=this._io.pos,this._debug.vertexIndex={start:this._io.pos,ioOffset:this._io.byteOffset},this.vertexIndex=this._io.readU4le(),this._debug.vertexIndex.end=this._io.pos},e})(),c=i.TexPoint=(function(){function e(t,s,o){this._io=t,this._parent=s,this._root=o,this._debug={},this._read()}return e.prototype._read=function(){this._debug.sPx={start:this._io.pos,ioOffset:this._io.byteOffset},this.sPx=this._io.readU2le(),this._debug.sPx.end=this._io.pos,this._debug.tPx={start:this._io.pos,ioOffset:this._io.byteOffset},this.tPx=this._io.readU2le(),this._debug.tPx.end=this._io.pos},Object.defineProperty(e.prototype,"sNormalized",{get:function(){return this._m_sNormalized!==void 0?this._m_sNormalized:(this._debug._m_sNormalized={},this._m_sNormalized=(this.sPx+0)/this._root.skinWidthPx,this._m_sNormalized)}}),Object.defineProperty(e.prototype,"tNormalized",{get:function(){return this._m_tNormalized!==void 0?this._m_tNormalized:(this._debug._m_tNormalized={},this._m_tNormalized=(this.tPx+0)/this._root.skinHeightPx,this._m_tNormalized)}}),e})(),l=i.Triangle=(function(){function e(t,s,o){this._io=t,this._parent=s,this._root=o,this._debug={},this._read()}return e.prototype._read=function(){this._debug.vertexIndices={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.vertexIndices.arr=[],this.vertexIndices=[];for(var t=0;t<3;t++)this._debug.vertexIndices.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this.vertexIndices.push(this._io.readU2le()),this._debug.vertexIndices.arr[t].end=this._io.pos;this._debug.vertexIndices.end=this._io.pos,this._debug.texPointIndices={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.texPointIndices.arr=[],this.texPointIndices=[];for(var t=0;t<3;t++)this._debug.texPointIndices.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this.texPointIndices.push(this._io.readU2le()),this._debug.texPointIndices.arr[t].end=this._io.pos;this._debug.texPointIndices.end=this._io.pos},e})(),a=i.Vec3f=(function(){function e(t,s,o){this._io=t,this._parent=s,this._root=o,this._debug={},this._read()}return e.prototype._read=function(){this._debug.x={start:this._io.pos,ioOffset:this._io.byteOffset},this.x=this._io.readF4le(),this._debug.x.end=this._io.pos,this._debug.y={start:this._io.pos,ioOffset:this._io.byteOffset},this.y=this._io.readF4le(),this._debug.y.end=this._io.pos,this._debug.z={start:this._io.pos,ioOffset:this._io.byteOffset},this.z=this._io.readF4le(),this._debug.z.end=this._io.pos},e})(),g=i.Vertex=(function(){function e(t,s,o){this._io=t,this._parent=s,this._root=o,this._debug={},this._read()}return e.prototype._read=function(){this._debug.position={start:this._io.pos,ioOffset:this._io.byteOffset},this.position=new d(this._io,this,this._root),this._debug.position.end=this._io.pos,this._debug.normalIndex={start:this._io.pos,ioOffset:this._io.byteOffset},this.normalIndex=this._io.readU1(),this._debug.normalIndex.end=this._io.pos},Object.defineProperty(e.prototype,"normal",{get:function(){return this._m_normal!==void 0?this._m_normal:(this._debug._m_normal={},this._m_normal=this._root.anormsTable[this.normalIndex],this._m_normal)}}),e})();return Object.defineProperty(i.prototype,"animNames",{get:function(){return this._m_animNames!==void 0?this._m_animNames:(this._debug._m_animNames={},this._m_animNames=["stand","run","attack","pain1","pain2","pain3","jump","flip","salute","taunt","wave","point","crstnd","crwalk","crattak","crpain","crdeath","death1","death2","death3"],this._m_animNames)}}),Object.defineProperty(i.prototype,"animNumFrames",{get:function(){return this._m_animNumFrames!==void 0?this._m_animNumFrames:(this._debug._m_animNumFrames={},this._m_animNumFrames=new Uint8Array([40,6,8,4,4,4,6,12,11,17,11,12,19,6,9,4,5,6,6,8]),this._m_animNumFrames)}}),Object.defineProperty(i.prototype,"animStartIndices",{get:function(){return this._m_animStartIndices!==void 0?this._m_animStartIndices:(this._debug._m_animStartIndices={},this._m_animStartIndices=new Uint8Array([0,40,46,54,58,62,66,72,84,95,112,123,135,154,160,169,173,178,184,190]),this._m_animStartIndices)}}),Object.defineProperty(i.prototype,"anormsTable",{get:function(){return this._m_anormsTable!==void 0?this._m_anormsTable:(this._debug._m_anormsTable={},this._m_anormsTable=[[-.525731,0,.850651],[-.442863,.238856,.864188],[-.295242,0,.955423],[-.309017,.5,.809017],[-.16246,.262866,.951056],[0,0,1],[0,.850651,.525731],[-.147621,.716567,.681718],[.147621,.716567,.681718],[0,.525731,.850651],[.309017,.5,.809017],[.525731,0,.850651],[.295242,0,.955423],[.442863,.238856,.864188],[.16246,.262866,.951056],[-.681718,.147621,.716567],[-.809017,.309017,.5],[-.587785,.425325,.688191],[-.850651,.525731,0],[-.864188,.442863,.238856],[-.716567,.681718,.147621],[-.688191,.587785,.425325],[-.5,.809017,.309017],[-.238856,.864188,.442863],[-.425325,.688191,.587785],[-.716567,.681718,-.147621],[-.5,.809017,-.309017],[-.525731,.850651,0],[0,.850651,-.525731],[-.238856,.864188,-.442863],[0,.955423,-.295242],[-.262866,.951056,-.16246],[0,1,0],[0,.955423,.295242],[-.262866,.951056,.16246],[.238856,.864188,.442863],[.262866,.951056,.16246],[.5,.809017,.309017],[.238856,.864188,-.442863],[.262866,.951056,-.16246],[.5,.809017,-.309017],[.850651,.525731,0],[.716567,.681718,.147621],[.716567,.681718,-.147621],[.525731,.850651,0],[.425325,.688191,.587785],[.864188,.442863,.238856],[.688191,.587785,.425325],[.809017,.309017,.5],[.681718,.147621,.716567],[.587785,.425325,.688191],[.955423,.295242,0],[1,0,0],[.951056,.16246,.262866],[.850651,-.525731,0],[.955423,-.295242,0],[.864188,-.442863,.238856],[.951056,-.16246,.262866],[.809017,-.309017,.5],[.681718,-.147621,.716567],[.850651,0,.525731],[.864188,.442863,-.238856],[.809017,.309017,-.5],[.951056,.16246,-.262866],[.525731,0,-.850651],[.681718,.147621,-.716567],[.681718,-.147621,-.716567],[.850651,0,-.525731],[.809017,-.309017,-.5],[.864188,-.442863,-.238856],[.951056,-.16246,-.262866],[.147621,.716567,-.681718],[.309017,.5,-.809017],[.425325,.688191,-.587785],[.442863,.238856,-.864188],[.587785,.425325,-.688191],[.688191,.587785,-.425325],[-.147621,.716567,-.681718],[-.309017,.5,-.809017],[0,.525731,-.850651],[-.525731,0,-.850651],[-.442863,.238856,-.864188],[-.295242,0,-.955423],[-.16246,.262866,-.951056],[0,0,-1],[.295242,0,-.955423],[.16246,.262866,-.951056],[-.442863,-.238856,-.864188],[-.309017,-.5,-.809017],[-.16246,-.262866,-.951056],[0,-.850651,-.525731],[-.147621,-.716567,-.681718],[.147621,-.716567,-.681718],[0,-.525731,-.850651],[.309017,-.5,-.809017],[.442863,-.238856,-.864188],[.16246,-.262866,-.951056],[.238856,-.864188,-.442863],[.5,-.809017,-.309017],[.425325,-.688191,-.587785],[.716567,-.681718,-.147621],[.688191,-.587785,-.425325],[.587785,-.425325,-.688191],[0,-.955423,-.295242],[0,-1,0],[.262866,-.951056,-.16246],[0,-.850651,.525731],[0,-.955423,.295242],[.238856,-.864188,.442863],[.262866,-.951056,.16246],[.5,-.809017,.309017],[.716567,-.681718,.147621],[.525731,-.850651,0],[-.238856,-.864188,-.442863],[-.5,-.809017,-.309017],[-.262866,-.951056,-.16246],[-.850651,-.525731,0],[-.716567,-.681718,-.147621],[-.716567,-.681718,.147621],[-.525731,-.850651,0],[-.5,-.809017,.309017],[-.238856,-.864188,.442863],[-.262866,-.951056,.16246],[-.864188,-.442863,.238856],[-.809017,-.309017,.5],[-.688191,-.587785,.425325],[-.681718,-.147621,.716567],[-.442863,-.238856,.864188],[-.587785,-.425325,.688191],[-.309017,-.5,.809017],[-.147621,-.716567,.681718],[-.425325,-.688191,.587785],[-.16246,-.262866,.951056],[.442863,-.238856,.864188],[.16246,-.262866,.951056],[.309017,-.5,.809017],[.147621,-.716567,.681718],[0,-.525731,.850651],[.425325,-.688191,.587785],[.587785,-.425325,.688191],[.688191,-.587785,.425325],[-.955423,.295242,0],[-.951056,.16246,.262866],[-1,0,0],[-.850651,0,.525731],[-.955423,-.295242,0],[-.951056,-.16246,.262866],[-.864188,.442863,-.238856],[-.951056,.16246,-.262866],[-.809017,.309017,-.5],[-.864188,-.442863,-.238856],[-.951056,-.16246,-.262866],[-.809017,-.309017,-.5],[-.681718,.147621,-.716567],[-.681718,-.147621,-.716567],[-.850651,0,-.525731],[-.688191,.587785,-.425325],[-.587785,.425325,-.688191],[-.425325,.688191,-.587785],[-.425325,-.688191,-.587785],[-.587785,-.425325,-.688191],[-.688191,-.587785,-.425325]],this._m_anormsTable)}}),Object.defineProperty(i.prototype,"frames",{get:function(){if(this._m_frames!==void 0)return this._m_frames;var e=this._io.pos;this._io.seek(this.ofsFrames),this._debug._m_frames={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug._m_frames.arr=[],this._raw__m_frames=[],this._m_frames=[];for(var t=0;t<this.numFrames;t++){this._debug._m_frames.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this._raw__m_frames.push(this._io.readBytes(this.bytesPerFrame));var s=new n(this._raw__m_frames[t]);this._m_frames.push(new m(s,this,this._root)),this._debug._m_frames.arr[t].end=this._io.pos}return this._debug._m_frames.end=this._io.pos,this._io.seek(e),this._m_frames}}),Object.defineProperty(i.prototype,"glCmds",{get:function(){if(this._m_glCmds!==void 0)return this._m_glCmds;var e=this._io.pos;this._io.seek(this.ofsGlCmds),this._debug._m_glCmds={start:this._io.pos,ioOffset:this._io.byteOffset},this._raw__m_glCmds=this._io.readBytes(4*this.numGlCmds);var t=new n(this._raw__m_glCmds);return this._m_glCmds=new p(t,this,this._root),this._debug._m_glCmds.end=this._io.pos,this._io.seek(e),this._m_glCmds}}),Object.defineProperty(i.prototype,"skins",{get:function(){if(this._m_skins!==void 0)return this._m_skins;var e=this._io.pos;this._io.seek(this.ofsSkins),this._debug._m_skins={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug._m_skins.arr=[],this._m_skins=[];for(var t=0;t<this.numSkins;t++)this._debug._m_skins.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this._m_skins.push(n.bytesToStr(n.bytesTerminate(this._io.readBytes(64),0,!1),"ASCII")),this._debug._m_skins.arr[t].end=this._io.pos;return this._debug._m_skins.end=this._io.pos,this._io.seek(e),this._m_skins}}),Object.defineProperty(i.prototype,"texCoords",{get:function(){if(this._m_texCoords!==void 0)return this._m_texCoords;var e=this._io.pos;this._io.seek(this.ofsTexCoords),this._debug._m_texCoords={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug._m_texCoords.arr=[],this._m_texCoords=[];for(var t=0;t<this.numTexCoords;t++)this._debug._m_texCoords.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this._m_texCoords.push(new c(this._io,this,this._root)),this._debug._m_texCoords.arr[t].end=this._io.pos;return this._debug._m_texCoords.end=this._io.pos,this._io.seek(e),this._m_texCoords}}),Object.defineProperty(i.prototype,"triangles",{get:function(){if(this._m_triangles!==void 0)return this._m_triangles;var e=this._io.pos;this._io.seek(this.ofsTriangles),this._debug._m_triangles={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug._m_triangles.arr=[],this._m_triangles=[];for(var t=0;t<this.numTriangles;t++)this._debug._m_triangles.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this._m_triangles.push(new l(this._io,this,this._root)),this._debug._m_triangles.arr[t].end=this._io.pos;return this._debug._m_triangles.end=this._io.pos,this._io.seek(e),this._m_triangles}}),i})();r.Quake2Md2=h})}});const k=x(),C={id:"quake2_md2",title:"Quake II player model (version 8)",ksy:{meta:{id:"quake2_md2",title:"Quake II player model (version 8)",application:"Quake II","file-extension":"md2",xref:{justsolve:"MD2"},tags:["3d","game"],license:"CC0-1.0",endian:"le"},doc:`The MD2 format is used for 3D animated models in id Sofware's Quake II.

A model consists of named \`frames\`, each with the same number of \`vertices\`
(\`vertices_per_frame\`). Each such vertex has a \`position\` and \`normal\` in
model space. Each vertex has the same topological "meaning" across frames, in
terms of triangle and texture info; it just varies in position and normal for
animation purposes.

How the vertices form triangles is defined via disjoint \`triangles\` or via
\`gl_cmds\` (which allows strip and fan topology). Each triangle contains three
\`vertex_indices\` into frame vertices, and three \`tex_point_indices\` into
global \`tex_coords\`. Each texture point has pixel coords \`s_px\` and \`t_px\`
ranging from 0 to \`skin_{width,height}_px\` respectively, along with
\`{s,t}_normalized\` ranging from 0 to 1 for your convenience.

A GL command has a \`primitive\` type (\`TRIANGLE_FAN\` or \`TRIANGLE_STRIP\`) along
with some \`vertices\`. Each GL vertex contains \`tex_coords_normalized\` from 0
to 1, and a \`vertex_index\` into frame vertices.

A model may also contain \`skins\`, which are just file paths to PCX images.
However, this is empty for many models, in which case it is up to the client
(e.g. Q2PRO) to offer skins some other way (e.g. by similar filename in the
current directory).

There are 198 \`frames\` in total, partitioned into a fixed set of ranges used
for different animations. Each frame has a standard \`name\` for humans, but the
client just uses their index and the name can be arbitrary. The name, start
frame index and frame count of each animation can be looked up in the arrays
\`anim_names\`, \`anim_start_indices\`, and \`anim_num_frames\` respectively. This
information is summarized in the following table:

\`\`\`
|   INDEX  |    NAME | SUFFIX | NOTES                                                  |
|:--------:|--------:|:-------|:-------------------------------------------------------|
|    0-39  |   stand | 01-40  | Idle animation                                         |
|   40-45  |     run | 1-6    | Full run cycle                                         |
|   46-53  |  attack | 1-8    | Shoot, reload; some weapons just repeat 1st few frames |
|   54-57  |   pain1 | 01-04  | Q2Pro also uses this for switching weapons             |
|   58-61  |   pain2 | 01-04  |                                                        |
|   62-65  |   pain3 | 01-04  |                                                        |
|   66-71  |    jump | 1-6    | Starts at height and lands on feet                     |
|   72-83  |    flip | 01-12  | Flipoff, i.e. middle finger                            |
|   84-94  |  salute | 01-11  |                                                        |
|   95-111 |   taunt | 01-17  |                                                        |
|  112-122 |    wave | 01-11  | Q2Pro plays this backwards for a handgrenade toss      |
|  123-134 |   point | 01-12  |                                                        |
|  135-153 |  crstnd | 01-19  | Idle while crouching                                   |
|  154-159 |  crwalk | 1-6    |                                                        |
|  160-168 | crattak | 1-9    |                                                        |
|  169-172 |  crpain | 1-4    |                                                        |
|  173-177 | crdeath | 1-5    |                                                        |
|  178-183 |  death1 | 01-06  |                                                        |
|  184-189 |  death2 | 01-06  |                                                        |
|  190-197 |  death3 | 01-08  |                                                        |
\`\`\`

The above are filled in for player models; for the separate weapon models,
the final frame is 173 "g_view" (unknown purpose) since weapons aren't shown
during death animations. \`a_grenades.md2\`, the handgrenade weapon model, is
the same except that the \`wave\` frames are blank (according to the default
female model files). This is likely due to its dual use as a grenade throw
animation where this model must leave the player's model.
`,"doc-ref":["https://icculus.org/~phaethon/q3a/formats/md2-schoenblum.html","http://tfc.duke.free.fr/coding/md2-specs-en.html","http://tastyspleen.net/~panjoo/downloads/quake2_model_frames.html","http://wiki.polycount.com/wiki/OldSiteResourcesQuake2FramesList"],seq:[{id:"magic",contents:"IDP2"},{id:"version",type:"u4",valid:8},{id:"skin_width_px",type:"u4"},{id:"skin_height_px",type:"u4"},{id:"bytes_per_frame",type:"u4"},{id:"num_skins",type:"u4"},{id:"vertices_per_frame",type:"u4"},{id:"num_tex_coords",type:"u4"},{id:"num_triangles",type:"u4"},{id:"num_gl_cmds",type:"u4"},{id:"num_frames",type:"u4"},{id:"ofs_skins",type:"u4"},{id:"ofs_tex_coords",type:"u4"},{id:"ofs_triangles",type:"u4"},{id:"ofs_frames",type:"u4"},{id:"ofs_gl_cmds",type:"u4"},{id:"ofs_eof",type:"u4"}],instances:{skins:{pos:"ofs_skins",size:64,type:"strz",encoding:"ascii",repeat:"expr","repeat-expr":"num_skins"},tex_coords:{pos:"ofs_tex_coords",type:"tex_point",repeat:"expr","repeat-expr":"num_tex_coords"},triangles:{pos:"ofs_triangles",type:"triangle",repeat:"expr","repeat-expr":"num_triangles"},frames:{pos:"ofs_frames",size:"bytes_per_frame",type:"frame",repeat:"expr","repeat-expr":"num_frames"},gl_cmds:{pos:"ofs_gl_cmds",size:"4 * num_gl_cmds",type:"gl_cmds_list"},anim_names:{value:`['stand', 'run', 'attack', 'pain1', 'pain2', 'pain3', 'jump', 'flip',
'salute', 'taunt', 'wave', 'point', 'crstnd', 'crwalk', 'crattak',
'crpain', 'crdeath', 'death1', 'death2', 'death3']
`},anim_start_indices:{value:`[0, 40, 46, 54, 58, 62, 66, 72,
84, 95, 112, 123, 135, 154, 160,
169, 173, 178, 184, 190]
`},anim_num_frames:{value:`[40, 6, 8, 4, 4, 4, 6, 12,
11, 17, 11, 12, 19, 6, 9,
4, 5, 6, 6, 8]
`},anorms_table:{"doc-ref":`https://github.com/skullernet/q2pro/blob/f4faabd/src/common/math.c#L80
from Quake anorms.h
`,value:`[
  [-0.525731, 0.000000, 0.850651],
  [-0.442863, 0.238856, 0.864188],
  [-0.295242, 0.000000, 0.955423],
  [-0.309017, 0.500000, 0.809017],
  [-0.162460, 0.262866, 0.951056],
  [0.000000, 0.000000, 1.000000],
  [0.000000, 0.850651, 0.525731],
  [-0.147621, 0.716567, 0.681718],
  [0.147621, 0.716567, 0.681718],
  [0.000000, 0.525731, 0.850651],
  [0.309017, 0.500000, 0.809017],
  [0.525731, 0.000000, 0.850651],
  [0.295242, 0.000000, 0.955423],
  [0.442863, 0.238856, 0.864188],
  [0.162460, 0.262866, 0.951056],
  [-0.681718, 0.147621, 0.716567],
  [-0.809017, 0.309017, 0.500000],
  [-0.587785, 0.425325, 0.688191],
  [-0.850651, 0.525731, 0.000000],
  [-0.864188, 0.442863, 0.238856],
  [-0.716567, 0.681718, 0.147621],
  [-0.688191, 0.587785, 0.425325],
  [-0.500000, 0.809017, 0.309017],
  [-0.238856, 0.864188, 0.442863],
  [-0.425325, 0.688191, 0.587785],
  [-0.716567, 0.681718, -0.147621],
  [-0.500000, 0.809017, -0.309017],
  [-0.525731, 0.850651, 0.000000],
  [0.000000, 0.850651, -0.525731],
  [-0.238856, 0.864188, -0.442863],
  [0.000000, 0.955423, -0.295242],
  [-0.262866, 0.951056, -0.162460],
  [0.000000, 1.000000, 0.000000],
  [0.000000, 0.955423, 0.295242],
  [-0.262866, 0.951056, 0.162460],
  [0.238856, 0.864188, 0.442863],
  [0.262866, 0.951056, 0.162460],
  [0.500000, 0.809017, 0.309017],
  [0.238856, 0.864188, -0.442863],
  [0.262866, 0.951056, -0.162460],
  [0.500000, 0.809017, -0.309017],
  [0.850651, 0.525731, 0.000000],
  [0.716567, 0.681718, 0.147621],
  [0.716567, 0.681718, -0.147621],
  [0.525731, 0.850651, 0.000000],
  [0.425325, 0.688191, 0.587785],
  [0.864188, 0.442863, 0.238856],
  [0.688191, 0.587785, 0.425325],
  [0.809017, 0.309017, 0.500000],
  [0.681718, 0.147621, 0.716567],
  [0.587785, 0.425325, 0.688191],
  [0.955423, 0.295242, 0.000000],
  [1.000000, 0.000000, 0.000000],
  [0.951056, 0.162460, 0.262866],
  [0.850651, -0.525731, 0.000000],
  [0.955423, -0.295242, 0.000000],
  [0.864188, -0.442863, 0.238856],
  [0.951056, -0.162460, 0.262866],
  [0.809017, -0.309017, 0.500000],
  [0.681718, -0.147621, 0.716567],
  [0.850651, 0.000000, 0.525731],
  [0.864188, 0.442863, -0.238856],
  [0.809017, 0.309017, -0.500000],
  [0.951056, 0.162460, -0.262866],
  [0.525731, 0.000000, -0.850651],
  [0.681718, 0.147621, -0.716567],
  [0.681718, -0.147621, -0.716567],
  [0.850651, 0.000000, -0.525731],
  [0.809017, -0.309017, -0.500000],
  [0.864188, -0.442863, -0.238856],
  [0.951056, -0.162460, -0.262866],
  [0.147621, 0.716567, -0.681718],
  [0.309017, 0.500000, -0.809017],
  [0.425325, 0.688191, -0.587785],
  [0.442863, 0.238856, -0.864188],
  [0.587785, 0.425325, -0.688191],
  [0.688191, 0.587785, -0.425325],
  [-0.147621, 0.716567, -0.681718],
  [-0.309017, 0.500000, -0.809017],
  [0.000000, 0.525731, -0.850651],
  [-0.525731, 0.000000, -0.850651],
  [-0.442863, 0.238856, -0.864188],
  [-0.295242, 0.000000, -0.955423],
  [-0.162460, 0.262866, -0.951056],
  [0.000000, 0.000000, -1.000000],
  [0.295242, 0.000000, -0.955423],
  [0.162460, 0.262866, -0.951056],
  [-0.442863, -0.238856, -0.864188],
  [-0.309017, -0.500000, -0.809017],
  [-0.162460, -0.262866, -0.951056],
  [0.000000, -0.850651, -0.525731],
  [-0.147621, -0.716567, -0.681718],
  [0.147621, -0.716567, -0.681718],
  [0.000000, -0.525731, -0.850651],
  [0.309017, -0.500000, -0.809017],
  [0.442863, -0.238856, -0.864188],
  [0.162460, -0.262866, -0.951056],
  [0.238856, -0.864188, -0.442863],
  [0.500000, -0.809017, -0.309017],
  [0.425325, -0.688191, -0.587785],
  [0.716567, -0.681718, -0.147621],
  [0.688191, -0.587785, -0.425325],
  [0.587785, -0.425325, -0.688191],
  [0.000000, -0.955423, -0.295242],
  [0.000000, -1.000000, 0.000000],
  [0.262866, -0.951056, -0.162460],
  [0.000000, -0.850651, 0.525731],
  [0.000000, -0.955423, 0.295242],
  [0.238856, -0.864188, 0.442863],
  [0.262866, -0.951056, 0.162460],
  [0.500000, -0.809017, 0.309017],
  [0.716567, -0.681718, 0.147621],
  [0.525731, -0.850651, 0.000000],
  [-0.238856, -0.864188, -0.442863],
  [-0.500000, -0.809017, -0.309017],
  [-0.262866, -0.951056, -0.162460],
  [-0.850651, -0.525731, 0.000000],
  [-0.716567, -0.681718, -0.147621],
  [-0.716567, -0.681718, 0.147621],
  [-0.525731, -0.850651, 0.000000],
  [-0.500000, -0.809017, 0.309017],
  [-0.238856, -0.864188, 0.442863],
  [-0.262866, -0.951056, 0.162460],
  [-0.864188, -0.442863, 0.238856],
  [-0.809017, -0.309017, 0.500000],
  [-0.688191, -0.587785, 0.425325],
  [-0.681718, -0.147621, 0.716567],
  [-0.442863, -0.238856, 0.864188],
  [-0.587785, -0.425325, 0.688191],
  [-0.309017, -0.500000, 0.809017],
  [-0.147621, -0.716567, 0.681718],
  [-0.425325, -0.688191, 0.587785],
  [-0.162460, -0.262866, 0.951056],
  [0.442863, -0.238856, 0.864188],
  [0.162460, -0.262866, 0.951056],
  [0.309017, -0.500000, 0.809017],
  [0.147621, -0.716567, 0.681718],
  [0.000000, -0.525731, 0.850651],
  [0.425325, -0.688191, 0.587785],
  [0.587785, -0.425325, 0.688191],
  [0.688191, -0.587785, 0.425325],
  [-0.955423, 0.295242, 0.000000],
  [-0.951056, 0.162460, 0.262866],
  [-1.000000, 0.000000, 0.000000],
  [-0.850651, 0.000000, 0.525731],
  [-0.955423, -0.295242, 0.000000],
  [-0.951056, -0.162460, 0.262866],
  [-0.864188, 0.442863, -0.238856],
  [-0.951056, 0.162460, -0.262866],
  [-0.809017, 0.309017, -0.500000],
  [-0.864188, -0.442863, -0.238856],
  [-0.951056, -0.162460, -0.262866],
  [-0.809017, -0.309017, -0.500000],
  [-0.681718, 0.147621, -0.716567],
  [-0.681718, -0.147621, -0.716567],
  [-0.850651, 0.000000, -0.525731],
  [-0.688191, 0.587785, -0.425325],
  [-0.587785, 0.425325, -0.688191],
  [-0.425325, 0.688191, -0.587785],
  [-0.425325, -0.688191, -0.587785],
  [-0.587785, -0.425325, -0.688191],
  [-0.688191, -0.587785, -0.425325],
]
`}},types:{tex_point:{seq:[{id:"s_px",type:"u2"},{id:"t_px",type:"u2"}],instances:{s_normalized:{value:"(s_px + 0.0) / _root.skin_width_px"},t_normalized:{value:"(t_px + 0.0) / _root.skin_height_px"}}},triangle:{seq:[{id:"vertex_indices",type:"u2",repeat:"expr","repeat-expr":3,doc:"indices to `_root.frames[i].vertices` (for each frame with index `i`)"},{id:"tex_point_indices",type:"u2",repeat:"expr","repeat-expr":3,doc:"indices to `_root.tex_coords`"}]},vec3f:{seq:[{id:"x",type:"f4"},{id:"y",type:"f4"},{id:"z",type:"f4"}]},compressed_vec:{seq:[{id:"x_compressed",type:"u1"},{id:"y_compressed",type:"u1"},{id:"z_compressed",type:"u1"}],instances:{x:{value:"x_compressed * _parent._parent.scale.x + _parent._parent.translate.x"},y:{value:"y_compressed * _parent._parent.scale.y + _parent._parent.translate.y"},z:{value:"z_compressed * _parent._parent.scale.z + _parent._parent.translate.z"}}},vertex:{seq:[{id:"position",type:"compressed_vec"},{id:"normal_index",type:"u1"}],instances:{normal:{value:"_root.anorms_table[normal_index]"}}},frame:{seq:[{id:"scale",type:"vec3f"},{id:"translate",type:"vec3f"},{id:"name",size:16,type:"strz",encoding:"ascii"},{id:"vertices",type:"vertex",repeat:"expr","repeat-expr":"_root.vertices_per_frame"}]},gl_cmds_list:{seq:[{id:"items",type:"gl_cmd",repeat:"until","repeat-until":"_.cmd_num_vertices == 0",if:"not _io.eof"}]},gl_cmd:{seq:[{id:"cmd_num_vertices",type:"s4"},{id:"vertices",type:"gl_vertex",repeat:"expr","repeat-expr":"num_vertices"}],instances:{num_vertices:{value:"cmd_num_vertices < 0 ? -cmd_num_vertices : cmd_num_vertices"},primitive:{value:"cmd_num_vertices < 0 ? gl_primitive::triangle_fan : gl_primitive::triangle_strip"}}},gl_vertex:{seq:[{id:"tex_coords_normalized",type:"f4",repeat:"expr","repeat-expr":2},{id:"vertex_index",type:"u4",doc:"index to `_root.frames[i].vertices` (for each frame with index `i`)"}]}},enums:{gl_primitive:{0:"triangle_strip",1:"triangle_fan"}}}};export{k as default,C as spec};
