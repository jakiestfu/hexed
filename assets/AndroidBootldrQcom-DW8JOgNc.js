import{k as p}from"./index-Cy_iKu7E.js";var g=Object.getOwnPropertyNames,_=(t,s)=>function(){return s||(0,t[g(t)[0]])((s={exports:{}}).exports,s),s.exports},f=_({"<stdin>"(t){(function(s,i){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream"],i):typeof t=="object"&&t!==null&&typeof t.nodeType!="number"?i(t,p.KaitaiStream):i(s.AndroidBootldrQcom||(s.AndroidBootldrQcom={}),s.KaitaiStream)})(typeof self<"u"?self:t,function(s,i){var n=(function(){function a(o,e,r){this._io=o,this._parent=e,this._root=r||this,this._debug={},this._read()}a.prototype._read=function(){if(this._debug.magic={start:this._io.pos,ioOffset:this._io.byteOffset},this.magic=this._io.readBytes(8),this._debug.magic.end=this._io.pos,i.byteArrayCompare(this.magic,new Uint8Array([66,79,79,84,76,68,82,33]))!=0){var o=new i.ValidationNotEqualError(new Uint8Array([66,79,79,84,76,68,82,33]),this.magic,this._io,"/seq/0");throw this._debug.magic.validationError=o,o}this._debug.numImages={start:this._io.pos,ioOffset:this._io.byteOffset},this.numImages=this._io.readU4le(),this._debug.numImages.end=this._io.pos,this._debug.ofsImgBodies={start:this._io.pos,ioOffset:this._io.byteOffset},this.ofsImgBodies=this._io.readU4le(),this._debug.ofsImgBodies.end=this._io.pos,this._debug.bootloaderSize={start:this._io.pos,ioOffset:this._io.byteOffset},this.bootloaderSize=this._io.readU4le(),this._debug.bootloaderSize.end=this._io.pos,this._debug.imgHeaders={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.imgHeaders.arr=[],this.imgHeaders=[];for(var e=0;e<this.numImages;e++)this._debug.imgHeaders.arr[e]={start:this._io.pos,ioOffset:this._io.byteOffset},this.imgHeaders.push(new l(this._io,this,this._root)),this._debug.imgHeaders.arr[e].end=this._io.pos;this._debug.imgHeaders.end=this._io.pos};var h=a.ImgBody=(function(){function o(e,r,d,m){this._io=e,this._parent=r,this._root=d,this.idx=m,this._debug={},this._read()}return o.prototype._read=function(){this._debug.body={start:this._io.pos,ioOffset:this._io.byteOffset},this.body=this._io.readBytes(this.imgHeader.lenBody),this._debug.body.end=this._io.pos},Object.defineProperty(o.prototype,"imgHeader",{get:function(){return this._m_imgHeader!==void 0?this._m_imgHeader:(this._debug._m_imgHeader={},this._m_imgHeader=this._root.imgHeaders[this.idx],this._m_imgHeader)}}),o})(),l=a.ImgHeader=(function(){function o(e,r,d){this._io=e,this._parent=r,this._root=d,this._debug={},this._read()}return o.prototype._read=function(){this._debug.name={start:this._io.pos,ioOffset:this._io.byteOffset},this.name=i.bytesToStr(i.bytesTerminate(this._io.readBytes(64),0,!1),"ASCII"),this._debug.name.end=this._io.pos,this._debug.lenBody={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenBody=this._io.readU4le(),this._debug.lenBody.end=this._io.pos},o})();return Object.defineProperty(a.prototype,"imgBodies",{get:function(){if(this._m_imgBodies!==void 0)return this._m_imgBodies;var o=this._io.pos;this._io.seek(this.ofsImgBodies),this._debug._m_imgBodies={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug._m_imgBodies.arr=[],this._m_imgBodies=[];for(var e=0;e<this.numImages;e++)this._debug._m_imgBodies.arr[e]={start:this._io.pos,ioOffset:this._io.byteOffset},this._m_imgBodies.push(new h(this._io,this,this._root,e)),this._debug._m_imgBodies.arr[e].end=this._io.pos;return this._debug._m_imgBodies.end=this._io.pos,this._io.seek(o),this._m_imgBodies}}),a})();s.AndroidBootldrQcom=n})}});const u=f(),b={id:"android_bootldr_qcom",title:"Qualcomm Snapdragon (MSM) bootloader.img format",ksy:{meta:{id:"android_bootldr_qcom",title:"Qualcomm Snapdragon (MSM) bootloader.img format","file-extension":"img",tags:["archive","android"],license:"CC0-1.0",encoding:"ASCII",endian:"le"},doc:`A bootloader for Android used on various devices powered by Qualcomm
Snapdragon chips:

<https://en.wikipedia.org/wiki/Devices_using_Qualcomm_Snapdragon_processors>

Although not all of the Snapdragon based Android devices use this particular
bootloader format, it is known that devices with the following chips have used
it (example devices are given for each chip):

* APQ8064 ([devices](https://en.wikipedia.org/wiki/Devices_using_Qualcomm_Snapdragon_processors#Snapdragon_S4_Pro))
  - Nexus 4 "mako": [sample][sample-mako] ([other samples][others-mako]),
    [releasetools.py](https://android.googlesource.com/device/lge/mako/+/33f0114/releasetools.py#98)

* MSM8974AA ([devices](https://en.wikipedia.org/wiki/Devices_using_Qualcomm_Snapdragon_processors#Snapdragon_800,_801_and_805_(2013/14)))
  - Nexus 5 "hammerhead": [sample][sample-hammerhead] ([other samples][others-hammerhead]),
    [releasetools.py](https://android.googlesource.com/device/lge/hammerhead/+/7618a7d/releasetools.py#116)

* MSM8992 ([devices](https://en.wikipedia.org/wiki/Devices_using_Qualcomm_Snapdragon_processors#Snapdragon_808_and_810_(2015)))
  - Nexus 5X "bullhead": [sample][sample-bullhead] ([other samples][others-bullhead]),
    [releasetools.py](https://android.googlesource.com/device/lge/bullhead/+/2994b6b/releasetools.py#126)

* APQ8064-1AA ([devices](https://en.wikipedia.org/wiki/Devices_using_Qualcomm_Snapdragon_processors#Snapdragon_600_(2013)))
  - Nexus 7 \\[2013] (Mobile) "deb" <a href="#doc-note-data-after-img-bodies">(\\**)</a>: [sample][sample-deb] ([other samples][others-deb]),
    [releasetools.py](https://android.googlesource.com/device/asus/deb/+/14c1638/releasetools.py#105)
  - Nexus 7 \\[2013] (Wi-Fi) "flo" <a href="#doc-note-data-after-img-bodies">(\\**)</a>: [sample][sample-flo] ([other samples][others-flo]),
    [releasetools.py](https://android.googlesource.com/device/asus/flo/+/9d9fee9/releasetools.py#130)

* MSM8996 Pro-AB ([devices](https://en.wikipedia.org/wiki/Devices_using_Qualcomm_Snapdragon_processors#Snapdragon_820_and_821_(2016)))
  - Pixel "sailfish" <a href="#doc-note-bootloader-size">(\\*)</a>:
    [sample][sample-sailfish] ([other samples][others-sailfish])
  - Pixel XL "marlin" <a href="#doc-note-bootloader-size">(\\*)</a>:
    [sample][sample-marlin] ([other samples][others-marlin])

* MSM8998 ([devices](https://en.wikipedia.org/wiki/Devices_using_Qualcomm_Snapdragon_processors#Snapdragon_835_(2017)))
  - Pixel 2 "walleye" <a href="#doc-note-bootloader-size">(\\*)</a>: [sample][sample-walleye] ([other samples][others-walleye])
  - Pixel 2 XL "taimen": [sample][sample-taimen] ([other samples][others-taimen])

<small id="doc-note-bootloader-size">(\\*)
\`bootloader_size\` is equal to the size of the whole file (not just \`img_bodies\` as usual).
</small>

<small id="doc-note-data-after-img-bodies">(\\**)
There are some data after the end of \`img_bodies\`.
</small>

---

On the other hand, devices with these chips **do not** use this format:

* <del>APQ8084</del> ([devices](https://en.wikipedia.org/wiki/Devices_using_Qualcomm_Snapdragon_processors#Snapdragon_800,_801_and_805_(2013/14)))
  - Nexus 6 "shamu": [sample][foreign-sample-shamu] ([other samples][foreign-others-shamu]),
    [releasetools.py](https://android.googlesource.com/device/moto/shamu/+/df9354d/releasetools.py#12) -
    uses "Motoboot packed image format" instead

* <del>MSM8994</del> ([devices](https://en.wikipedia.org/wiki/Devices_using_Qualcomm_Snapdragon_processors#Snapdragon_808_and_810_(2015)))
  - Nexus 6P "angler": [sample][foreign-sample-angler] ([other samples][foreign-others-angler]),
    [releasetools.py](https://android.googlesource.com/device/huawei/angler/+/cf92cd8/releasetools.py#29) -
    uses "Huawei Bootloader packed image format" instead

[sample-mako]: https://androidfilehost.com/?fid=96039337900113996 "bootloader-mako-makoz30f.img"
[others-mako]: https://androidfilehost.com/?w=search&s=bootloader-mako&type=files

[sample-hammerhead]: https://androidfilehost.com/?fid=385035244224410247 "bootloader-hammerhead-hhz20h.img"
[others-hammerhead]: https://androidfilehost.com/?w=search&s=bootloader-hammerhead&type=files

[sample-bullhead]: https://androidfilehost.com/?fid=11410963190603870177 "bootloader-bullhead-bhz32c.img"
[others-bullhead]: https://androidfilehost.com/?w=search&s=bootloader-bullhead&type=files

[sample-deb]: https://androidfilehost.com/?fid=23501681358552487 "bootloader-deb-flo-04.02.img"
[others-deb]: https://androidfilehost.com/?w=search&s=bootloader-deb-flo&type=files

[sample-flo]: https://androidfilehost.com/?fid=23991606952593542 "bootloader-flo-flo-04.05.img"
[others-flo]: https://androidfilehost.com/?w=search&s=bootloader-flo-flo&type=files

[sample-sailfish]: https://androidfilehost.com/?fid=6006931924117907154 "bootloader-sailfish-8996-012001-1904111134.img"
[others-sailfish]: https://androidfilehost.com/?w=search&s=bootloader-sailfish&type=files

[sample-marlin]: https://androidfilehost.com/?fid=6006931924117907131 "bootloader-marlin-8996-012001-1904111134.img"
[others-marlin]: https://androidfilehost.com/?w=search&s=bootloader-marlin&type=files

[sample-walleye]: https://androidfilehost.com/?fid=14943124697586348540 "bootloader-walleye-mw8998-003.0085.00.img"
[others-walleye]: https://androidfilehost.com/?w=search&s=bootloader-walleye&type=files

[sample-taimen]: https://androidfilehost.com/?fid=14943124697586348536 "bootloader-taimen-tmz30m.img"
[others-taimen]: https://androidfilehost.com/?w=search&s=bootloader-taimen&type=files

[foreign-sample-shamu]: https://androidfilehost.com/?fid=745849072291678307 "bootloader-shamu-moto-apq8084-72.04.img"
[foreign-others-shamu]: https://androidfilehost.com/?w=search&s=bootloader-shamu&type=files

[foreign-sample-angler]: https://androidfilehost.com/?fid=11410963190603870158 "bootloader-angler-angler-03.84.img"
[foreign-others-angler]: https://androidfilehost.com/?w=search&s=bootloader-angler&type=files

---

The \`bootloader-*.img\` samples referenced above originally come from factory
images packed in ZIP archives that can be found on the page [Factory Images
for Nexus and Pixel Devices](https://developers.google.com/android/images) on
the Google Developers site. Note that the codenames on that page may be
different than the ones that are written in the list above. That's because the
Google page indicates **ROM codenames** in headings (e.g. "occam" for Nexus 4)
but the above list uses **model codenames** (e.g. "mako" for Nexus 4) because
that is how the original \`bootloader-*.img\` files are identified. For most
devices, however, these code names are the same.
`,"doc-ref":"https://android.googlesource.com/device/lge/hammerhead/+/7618a7d/releasetools.py",seq:[{id:"magic",contents:"BOOTLDR!"},{id:"num_images",type:"u4"},{id:"ofs_img_bodies","-orig-id":"start_offset",type:"u4"},{id:"bootloader_size","-orig-id":"bootldr_size",type:"u4",doc:"According to all available `releasetools.py` versions from AOSP (links are\nin the top-level `/doc`), this should determine only the size of\n`img_bodies` - there is [an assertion](\nhttps://android.googlesource.com/device/lge/hammerhead/+/7618a7d/releasetools.py#167)\nfor it.\n\nHowever, files for certain Pixel devices (see `/doc`) apparently declare\nthe entire file size here (i.e. including also fields from `magic` to\n`img_headers`). So if you interpreted `bootloader_size` as the size of\n`img_bodies` substream in these files, you would exceed the end of file.\nAlthough you could check that it fits in the file before attempting to\ncreate a substream of that size, you wouldn't know if it's meant to\nspecify the size of just `img_bodies` or the size of the entire bootloader\npayload (whereas there may be additional data after the end of payload)\nuntil parsing `img_bodies` (or at least summing sizes from `img_headers`,\nbut that's stupid).\n\nSo this field isn't reliable enough to be used as the size of any\nsubstream. If you want to check if it has a reasonable value, do so in\nyour application code.\n"},{id:"img_headers","-orig-id":"img_info",type:"img_header",repeat:"expr","repeat-expr":"num_images"}],instances:{img_bodies:{pos:"ofs_img_bodies",type:"img_body(_index)",repeat:"expr","repeat-expr":"num_images"}},types:{img_header:{"-webide-representation":"{name}",seq:[{id:"name",size:64,type:"strz"},{id:"len_body",type:"u4"}]},img_body:{"-webide-representation":"{img_header.name}: {img_header.len_body:dec} bytes",params:[{id:"idx",type:"s4"}],seq:[{id:"body",size:"img_header.len_body"}],instances:{img_header:{value:"_root.img_headers[idx]"}}}}}};export{u as default,b as spec};
