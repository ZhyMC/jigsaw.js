let getdgramconn=require(__dirname+"/utils/getdgramconn.js");
let waitfor=require(__dirname+"/utils/waitfor.js");

class socket{
	constructor(){

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
	}
	async init(){
		this.sock=await getdgramconn();
		this.sock.on("message",this.handlemessage.bind(this));
		this.sock.on("listening",()=>{
			this._port=this.sock.address().port;
			this._ready=true
		});
	}
	getPort(){
		return this._port;
	}
	close(){
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
	ready(){
		return waitfor(()=>this._ready);
	}
}

module.exports=socket;
