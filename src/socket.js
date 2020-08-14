const getdgramconn=require(__dirname+"/utils/getdgramconn.js");
const assert=require("assert");
const EventEmitter=require("events").EventEmitter;

class socket extends EventEmitter{
	constructor(){
		super();

		this.handler={
			consumer:()=>{},
			producer:()=>{}
		};

		this.typemap={
			"consumer":1,
			"producer":2,
			1:"consumer",
			2:"producer"
		}
		this._ready=false;
		this._port=0;

		this.state="close";
	}
	async start(){
		assert(this.state=="close","in this state,socket can not be started");

		this.sock=await getdgramconn();
		this.sock.on("message",this.handlemessage.bind(this));
		this.sock.on("listening",()=>{
			this._port=this.sock.address().port;
			this._handleReady();
		});

		this.sock.on("close",()=>{

			this._handleClose();
		})

	}
	_handleClose(){
		this.state="close";
		this.emit("close");

	}
	_handleReady(){
		this.state="ready";
		this.emit("ready");
	}
	getPort(){
		return this._port;
	}
	close(){
		if(this.state=="close")
			return;
		//assert(this.state!="close","socket has already closed");
		
		this.sock.close();
	}
	send(direction,data,port,ip){
		let prefix=Buffer.alloc(2);
		prefix.writeUInt16BE(this.typemap[direction],0);
//console.log(direction,data,port,ip);

		this.sock.send(Buffer.concat([prefix,data]),port,ip);
	}
	handlemessage(msg,rinfo){
		let prefix=msg.slice(0,2);
		let data=msg.slice(2,msg.length);
		let direction=this.typemap[prefix.readUInt16BE(0)];
//console.log(direction,data,rinfo);

		this.handler[direction](data,rinfo);
	}
	onmessage(type,f){
		this.handler[type]=f;
	}
}

module.exports=socket;
