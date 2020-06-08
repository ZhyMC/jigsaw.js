module.exports={
		sliceBuffer(buffer){
			let partsize=1300;
			let parts=[];
			for(let i=0;i<buffer.length;i+=partsize){
				parts.push(buffer.slice(i,i+partsize));
			}
			return parts;
		},
        tag(id,data,port,partid,partmax){
                let pd=Buffer.from(port);

                let offset=0;
                let built=Buffer.alloc(4+2+pd.length+2+2+data.length);


                built.writeUInt32BE(id,0);offset+=4;


                built.writeUInt16BE(pd.length,offset);offset+=2;
                pd.copy(built,offset);offset+=pd.length;

                built.writeUInt16BE(partid,offset);offset+=2;
                built.writeUInt16BE(partmax,offset);offset+=2;
                               

                data.copy(built,offset);offset+=data.length

                return built;
        },
        untag(data){
                let offset=0;
                let id=data.readUInt32BE(0);offset+=4;


                let ptlen=data.readUInt16BE(offset);offset+=2;
                let pt=data.slice(offset,offset+ptlen)+"";offset+=ptlen;

                let partid=data.readUInt16BE(offset);offset+=2;
                let partmax=data.readUInt16BE(offset);offset+=2;
                               
                let partdata=data.slice(offset);

                return {id,partdata,port:pt,partid,partmax};
        },
    	parsePath(po){
            	let loc=po.lastIndexOf(":");
           		return {jg:po.substr(0,loc),port:po.substring(loc+1,po.length)};
    	},
        encodePacket(packetid,obj,path,partid,partmax){
                return this.tag(packetid,Buffer.from(JSON.stringify(obj)),path,partid,partmax);
        },
        decodePacket(encoded){
             let {id,partdata,port,partid,partmax}=this.untag(encoded);
             let parsedpath=this.parsePath(port);

            return {id,path:port,parsedpath,data};
        }

}
