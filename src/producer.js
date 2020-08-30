const sleep=(t)=>new Promise((y)=>setTimeout(y,t));
const domainclient=require("./domain/domainclient.js");
const packet=require("./packet.js");
const getdgramconn=require("./utils/getdgramconn.js");
const responsemanager=require("./responsemanager.js");
const slicebuilder=require("./slicebuilder.js");
const EventEmitter=require("events").EventEmitter;

class producer extends EventEmitter{
	constructor(name,jgenv,sock,domclient,options){
		super();

		if(!options)options={};

		this.ports={};
		this.handler=()=>{}

		this.name=name;
		this.jgenv=jgenv;

		this.responsemanager=new responsemanager();
		this.slicebuilder=new slicebuilder();


		this.sock=sock;
		this.options=options;

		this.domclient=domclient;


		this.state="close";

		this.drop_faker={
			enable:false,
			drop_rate:0
		}

	}
	setLogger(logger){
		this.logger=logger;
		this.domclient.setLogger(logger);
	}
	async start(){
		if(this.state!="close")
			throw new Error("this producer is not in a state can be start")
		

		this.initServerSocket();


		this._handleReady();
	}
	_handleReady(){
		this.state="ready";
		this.emit("ready");
	}
	initServerSocket(){

		this.sock.onmessage("producer",(data,rinfo)=>this._handleMessage(data,rinfo));

	}
	close(){
		//if(this.state=="close")
		//	throw new Error("this producer is not in a state can be close");
		if(this.state=="close")return;
		
		this.state="close";
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
		this.ports[port]=f;
	}


	async _handleMessage(msg,rinfo){


		let decoded=packet.untag(msg);

		let id=decoded.id;
		let from=decoded.from;
		let token=decoded.from+decoded.id


		let full=this.slicebuilder.setPartData(from,id,decoded.partid,decoded.partmax,decoded.partdata);
		
		if(!full)return;

		let path=decoded.port;


		try{		


			let rsp=await this._handlePacket(token,path,JSON.parse(full+""),rinfo);

			await this.sendPacket(id,rsp,"reply",from,rinfo);
	
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
	async sendPacket(reqid,data,port,from,target){
		
		if(this.state!="ready")
			throw new Error("in this state,can not sendPacket");

		let rawdata=Buffer.from(JSON.stringify(data));

		let bufs=packet.sliceBuffer(rawdata);

		let bufcount=0;
		for(let i in bufs){

			let tagged=packet.tag(reqid,bufs[i],port,from,i,bufs.length);//插入数据包头部


			if(!this.drop_faker.enable || 
				(this.drop_faker.enable && Math.random() > this.drop_faker.drop_rate)
			  )

			this.sock.send("consumer",tagged,target.port,target.address);


			bufcount+=tagged.length;

			/*if(bufcount>12*1024)//10KB
			{
				bufcount=0;
				await sleep(0); //flush
			}*/	

		}
//		await sleep(0);
	}
	rinfoToRname(rinfo){
		return `[${rinfo.address}:${rinfo.port}]`
	}
	async _handlePacket(token,path,data,rinfo){
		

		let parsedpath=packet.parsePath(path);
		let rsp=null;


		let has=this.responsemanager.hasResponsed(token);


		if(has){

			if(has.pending)throw "this request is Pending";
			rsp=has.data;

		}else{
			this.responsemanager.setResponsed(token,null,true);

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
			
			this.responsemanager.setResponsed(token,rsp,false);
		}

		if(rsp==undefined)rsp=null;
	
		return rsp;
	}
	
}

module.exports=producer;
