import{k as _}from"./index-DQZRlv-R.js";var p=Object.getOwnPropertyNames,l=(s,e)=>function(){return e||(0,s[p(s)[0]])((e={exports:{}}).exports,e),e.exports},u=l({"<stdin>"(s){(function(e,o){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream"],o):typeof s=="object"&&s!==null&&typeof s.nodeType!="number"?o(s,_.KaitaiStream):o(e.Stl||(e.Stl={}),e.KaitaiStream)})(typeof self<"u"?self:s,function(e,o){var d=(function(){function n(t,i,r){this._io=t,this._parent=i,this._root=r||this,this._debug={},this._read()}n.prototype._read=function(){this._debug.header={start:this._io.pos,ioOffset:this._io.byteOffset},this.header=this._io.readBytes(80),this._debug.header.end=this._io.pos,this._debug.numTriangles={start:this._io.pos,ioOffset:this._io.byteOffset},this.numTriangles=this._io.readU4le(),this._debug.numTriangles.end=this._io.pos,this._debug.triangles={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.triangles.arr=[],this.triangles=[];for(var t=0;t<this.numTriangles;t++)this._debug.triangles.arr[t]={start:this._io.pos,ioOffset:this._io.byteOffset},this.triangles.push(new f(this._io,this,this._root)),this._debug.triangles.arr[t].end=this._io.pos;this._debug.triangles.end=this._io.pos};var f=n.Triangle=(function(){function t(i,r,a){this._io=i,this._parent=r,this._root=a,this._debug={},this._read()}return t.prototype._read=function(){this._debug.normal={start:this._io.pos,ioOffset:this._io.byteOffset},this.normal=new h(this._io,this,this._root),this._debug.normal.end=this._io.pos,this._debug.vertices={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.vertices.arr=[],this.vertices=[];for(var i=0;i<3;i++)this._debug.vertices.arr[i]={start:this._io.pos,ioOffset:this._io.byteOffset},this.vertices.push(new h(this._io,this,this._root)),this._debug.vertices.arr[i].end=this._io.pos;this._debug.vertices.end=this._io.pos,this._debug.abr={start:this._io.pos,ioOffset:this._io.byteOffset},this.abr=this._io.readU2le(),this._debug.abr.end=this._io.pos},t})(),h=n.Vec3d=(function(){function t(i,r,a){this._io=i,this._parent=r,this._root=a,this._debug={},this._read()}return t.prototype._read=function(){this._debug.x={start:this._io.pos,ioOffset:this._io.byteOffset},this.x=this._io.readF4le(),this._debug.x.end=this._io.pos,this._debug.y={start:this._io.pos,ioOffset:this._io.byteOffset},this.y=this._io.readF4le(),this._debug.y.end=this._io.pos,this._debug.z={start:this._io.pos,ioOffset:this._io.byteOffset},this.z=this._io.readF4le(),this._debug.z.end=this._io.pos},t})();return n})();e.Stl=d})}});const g=u(),b={id:"stl",title:"stl",ksy:{meta:{id:"stl",application:"3D Systems Stereolithography","file-extension":"stl",xref:{justsolve:"STL",loc:"fdd000505",pronom:"fmt/865",wikidata:"Q1238229"},license:"CC0-1.0",endian:"le"},doc:`STL files are used to represent simple 3D models, defined using
triangular 3D faces.

Initially it was introduced as native format for 3D Systems
Stereolithography CAD system, but due to its extreme simplicity, it
was adopted by a wide range of 3D modelling, CAD, rapid prototyping
and 3D printing applications as the simplest 3D model exchange
format.

STL is extremely bare-bones format: there are no complex headers, no
texture / color support, no units specifications, no distinct vertex
arrays. Whole model is specified as a collection of triangular
faces.

There are two versions of the format (text and binary), this spec
describes binary version.
`,seq:[{id:"header",size:80},{id:"num_triangles",type:"u4"},{id:"triangles",type:"triangle",repeat:"expr","repeat-expr":"num_triangles"}],types:{triangle:{doc:`Each STL triangle is defined by its 3 points in 3D space and a
normal vector, which is generally used to determine where is
"inside" and "outside" of the model.
`,seq:[{id:"normal",type:"vec3d"},{id:"vertices",type:"vec3d",repeat:"expr","repeat-expr":3},{id:"abr",type:"u2",doc:`In theory (per standard), it's "attribute byte count" with
no other details given on what "attribute" is and what
should be stored in this field.

In practice, software dealing with STL either expected to
see 0 here, or uses this 16-bit field per se to store
additional attributes (such as RGB color of a vertex or
color index).
`}]},vec3d:{seq:[{id:"x",type:"f4"},{id:"y",type:"f4"},{id:"z",type:"f4"}]}}}};export{g as default,b as spec};
