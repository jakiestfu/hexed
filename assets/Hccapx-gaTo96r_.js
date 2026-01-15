import{k as c}from"./index-LM5QM2-c.js";var _=Object.getOwnPropertyNames,p=(t,e)=>function(){return e||(0,t[_(t)[0]])((e={exports:{}}).exports,e),e.exports},f=p({"<stdin>"(t){(function(e,i){typeof define=="function"&&define.amd?define(["exports","kaitai-struct/KaitaiStream"],i):typeof t=="object"&&t!==null&&typeof t.nodeType!="number"?i(t,c.KaitaiStream):i(e.Hccapx||(e.Hccapx={}),e.KaitaiStream)})(typeof self<"u"?self:t,function(e,i){var h=(function(){function a(o,s,n){this._io=o,this._parent=s,this._root=n||this,this._debug={},this._read()}a.prototype._read=function(){for(this._debug.records={start:this._io.pos,ioOffset:this._io.byteOffset},this._debug.records.arr=[],this.records=[];!this._io.isEof();)this._debug.records.arr[this.records.length]={start:this._io.pos,ioOffset:this._io.byteOffset},this.records.push(new r(this._io,this,this._root)),this._debug.records.arr[this.records.length-1].end=this._io.pos;this._debug.records.end=this._io.pos};var r=a.HccapxRecord=(function(){function o(s,n,d){this._io=s,this._parent=n,this._root=d,this._debug={},this._read()}return o.prototype._read=function(){if(this._debug.magic={start:this._io.pos,ioOffset:this._io.byteOffset},this.magic=this._io.readBytes(4),this._debug.magic.end=this._io.pos,i.byteArrayCompare(this.magic,new Uint8Array([72,67,80,88]))!=0){var s=new i.ValidationNotEqualError(new Uint8Array([72,67,80,88]),this.magic,this._io,"/types/hccapx_record/seq/0");throw this._debug.magic.validationError=s,s}this._debug.version={start:this._io.pos,ioOffset:this._io.byteOffset},this.version=this._io.readU4le(),this._debug.version.end=this._io.pos,this._debug.ignoreReplayCounter={start:this._io.pos,ioOffset:this._io.byteOffset},this.ignoreReplayCounter=this._io.readBitsIntBe(1)!=0,this._debug.ignoreReplayCounter.end=this._io.pos,this._debug.messagePair={start:this._io.pos,ioOffset:this._io.byteOffset},this.messagePair=this._io.readBitsIntBe(7),this._debug.messagePair.end=this._io.pos,this._io.alignToByte(),this._debug.lenEssid={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenEssid=this._io.readU1(),this._debug.lenEssid.end=this._io.pos,this._debug.essid={start:this._io.pos,ioOffset:this._io.byteOffset},this.essid=this._io.readBytes(this.lenEssid),this._debug.essid.end=this._io.pos,this._debug.padding1={start:this._io.pos,ioOffset:this._io.byteOffset},this.padding1=this._io.readBytes(32-this.lenEssid),this._debug.padding1.end=this._io.pos,this._debug.keyver={start:this._io.pos,ioOffset:this._io.byteOffset},this.keyver=this._io.readU1(),this._debug.keyver.end=this._io.pos,this._debug.keymic={start:this._io.pos,ioOffset:this._io.byteOffset},this.keymic=this._io.readBytes(16),this._debug.keymic.end=this._io.pos,this._debug.macAp={start:this._io.pos,ioOffset:this._io.byteOffset},this.macAp=this._io.readBytes(6),this._debug.macAp.end=this._io.pos,this._debug.nonceAp={start:this._io.pos,ioOffset:this._io.byteOffset},this.nonceAp=this._io.readBytes(32),this._debug.nonceAp.end=this._io.pos,this._debug.macStation={start:this._io.pos,ioOffset:this._io.byteOffset},this.macStation=this._io.readBytes(6),this._debug.macStation.end=this._io.pos,this._debug.nonceStation={start:this._io.pos,ioOffset:this._io.byteOffset},this.nonceStation=this._io.readBytes(32),this._debug.nonceStation.end=this._io.pos,this._debug.lenEapol={start:this._io.pos,ioOffset:this._io.byteOffset},this.lenEapol=this._io.readU2le(),this._debug.lenEapol.end=this._io.pos,this._debug.eapol={start:this._io.pos,ioOffset:this._io.byteOffset},this.eapol=this._io.readBytes(this.lenEapol),this._debug.eapol.end=this._io.pos,this._debug.padding2={start:this._io.pos,ioOffset:this._io.byteOffset},this.padding2=this._io.readBytes(256-this.lenEapol),this._debug.padding2.end=this._io.pos},o})();return a})();e.Hccapx=h})}});const g=f(),l={id:"hccapx",title:"Hashcat capture file",ksy:{meta:{id:"hccapx",title:"Hashcat capture file",application:["Hashcat","aircrack-ng"],"file-extension":"hccapx",license:"Unlicense",endian:"le"},doc:`Native format of Hashcat password "recovery" utility
`,"doc-ref":"https://hashcat.net/wiki/doku.php?id=hccapx",seq:[{id:"records",type:"hccapx_record",repeat:"eos"}],types:{hccapx_record:{seq:[{id:"magic",contents:"HCPX"},{id:"version",type:"u4",doc:"The version number of the .hccapx file format."},{id:"ignore_replay_counter",type:"b1",doc:`Indicates if the message pair matching was done based on
replay counter or not.

Whenever it was set to 1 it means that the replay counter
was ignored (i.e. it was not considered at all by the
matching algorithm).

Hashcat currently does not perform any particular action
based on this bit, but nonetheless this information could be
crucial for some 3th party tools and for
analysis/statistics. There could be some opportunity to
implement some further logic based on this particular
information also within hashcat (in the future).
`},{id:"message_pair",type:"b7",doc:`The message_pair value describes which messages of the 4-way
handshake were combined to form the .hccapx structure. It is
always a pair of 2 messages: 1 from the AP (access point)
and 1 from the STA (client).

Furthermore, the message_pair value also gives a hint from
which of the 2 messages the EAPOL origins. This is
interesting data, but not necessarily needed for hashcat to
be able to crack the hash.

On the other hand, it could be very important to know if
"only" message 1 and message 2 were captured or if for
instance message 3 and/or message 4 were captured too. If
message 3 and/or message 4 were captured it should be a hard
evidence that the connection was established and that the
password the client used was the correct one.
`},{id:"len_essid","-orig-id":"essid_len",type:"u1"},{id:"essid",size:"len_essid"},{id:"padding1",size:"32 - len_essid"},{id:"keyver",type:"u1",doc:`The flag used to distinguish WPA from WPA2 ciphers. Value of
1 means WPA, other - WPA2.
`},{id:"keymic",size:16,doc:`The final hash value. MD5 for WPA and SHA-1 for WPA2
(truncated to 128 bit).
`},{id:"mac_ap",size:6,doc:"The BSSID (MAC address) of the access point."},{id:"nonce_ap",size:32,doc:"Nonce (random salt) generated by the access point."},{id:"mac_station","-orig-id":"mac_sta",size:6,doc:"The MAC address of the client connecting to the access point."},{id:"nonce_station","-orig-id":"nonce_sta",size:32,doc:"Nonce (random salt) generated by the client connecting to the access point."},{id:"len_eapol","-orig-id":"eapol_len",type:"u2",doc:"The length of the EAPOL data."},{id:"eapol",size:"len_eapol"},{id:"padding2",size:"256 - len_eapol"}]}}}};export{g as default,l as spec};
