var sleep=(t)=>new Promise((y)=>setTimeout(y,t));
var domainclient=require(__dirname+"/domain/domainclient.js");
var packet=require(__dirname+"/packet.js");
var logger=require(__dirname+"/logger.js");
var getdgramconn=require(__dirname+"/utils/getdgramconn.js");
var waitfor=require(__dirname+"/utils/waitfor.js");
var responsemanager=require(__dirname+"/responsemanager.js");
var slicebuilder=require(__dirname+"/slicebuilder.js");

class producer{
	constructor(name,jgenv,sock,domclient,options){
		if(!options)options={};

		this.ports={};
		this.handler=()=>{}
		this.ready=false;

		this.name=name;
		this.jgenv=jgenv;

		this.responsemanager=new responsemanager();
		this.slicebuilder=new slicebuilder();


		this.sock=sock;
		this.options=options;

		this.domclient=domclient;


	}
	async init(){

		await this.initServerSocket();
		
//		await sleep(2000);

		this.ready=true;
	}
	async initServerSocket(){

		this.sock.onmessage("producer",(data,rinfo)=>this._handleMessage(data,rinfo));

		await this.sock.ready();
	}

	_ready(){
		return waitfor(()=>this.ready);
	}

	handle(f){//没有被ports捕捉到的包最终都会流向handler
		if(f instanceof Function)
			this.handler=f;
		else{
			this.handler=(port,data)=>{
				return f[port](data);
			}
		}

	}
	async port(port,f){
		await this._ready();
		this.ports[port]=f;
	}


	async _handleMessage(msg,rinfo){


		let decoded=packet.untag(msg);

		let id=decoded.id;

		let full=this.slicebuilder.setPartData(id,decoded.partid,decoded.partmax,decoded.partdata);
		if(!full)return;

		let path=decoded.port;

		try{		

			let rsp=await this._handlePacket(id,path,JSON.parse(full+""),rinfo);

//console.log(rsp);

			this.sendPacket(id,rsp,"reply",rinfo);
	
		}catch(e){
		//	console.log(e);

		}
	}
	/*sendRawData_SimReal(rawdata,target){
		if(Math.random()>this.options.sim.droprate)
			setTimeout(()=>{
				this.sendRawData(rawdata,target);
			},parseInt(this.options.sim.delay*(1+0.1*Math.random())));
	}*/
	async sendPacket(reqid,data,port,target){
		let rawdata=Buffer.from(JSON.stringify(data));

		let bufs=packet.sliceBuffer(rawdata);

		let bufcount=0;
		for(let i in bufs){
			let tagged=packet.tag(reqid,bufs[i],port,i,bufs.length);//插入数据包头部

		//	if(Math.random()>0.7)
			this.sock.send("consumer",tagged,target.port,target.address);
			bufcount+=tagged.length;

			if(bufcount>12*1024)//10KB
			{
				bufcount=0;
				await sleep(0); //flush
			}	

		}
		await sleep(0);
	}
	rinfoToRname(rinfo){
		return `[${rinfo.address}:${rinfo.port}]`
	}
	async _handlePacket(id,path,data,rinfo){
		

		let parsedpath=packet.parsePath(path);
		let rsp=null;


		let has=this.responsemanager.hasResponsed(id);


		if(has){

			if(has.pending)throw "this request is Pending";
			rsp=has.data;

		}else{
			this.responsemanager.setResponsed(id,null,true);

//	console.log(path,data,this.ports[path])

			try{
				//console.log(this.ports,path)

				if(this.ports[parsedpath.port])
					rsp=await this.ports[parsedpath.port](data,{rinfo,rname:this.rinfoToRname(rinfo)});
				else
					rsp=await this.handler(parsedpath.port,data,{rinfo,rname:this.rinfoToRname(rinfo)});

			}catch(e){
				rsp={_jigsaw:this.name,_error:e,_errorname:e.message,_stack:e.stack};
			}
			
			this.responsemanager.setResponsed(id,rsp,false);
		}

		if(rsp==undefined)rsp=null;
	
		return rsp;
	}
	
}

module.exports=producer;
