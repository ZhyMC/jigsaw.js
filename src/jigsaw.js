let producer=require(__dirname+"/producer.js");
let consumer=require(__dirname+"/consumer.js");
let waitfor=require(__dirname+"/utils/waitfor.js");
let logger=require(__dirname+"/logger.js");
let domainclient=require(__dirname+"/domain/domainclient.js");
let socket=require(__dirname+"/socket.js");

class jigsaw{
	constructor(name,jgenv,options){
		if(!name)name="[Anonymous]";


		this.name=name;
		this.jgenv=jgenv;
		this.sock=new socket();

		this._ready=false;

		this.domclient=new domainclient(this.jgenv);
		
		this.producer=new producer(name,jgenv,this.sock,this.domclient,options);
		this.consumer=new consumer(name,jgenv,this.sock,this.domclient,options);

		this.init();

	}
	setOption(options){
		this.producer.options=options;
		this.consumer.options=options;
	}
	close(){
		this.sock.close();
		this.domclient.close();
	}
	async init(){

		await this.sock.init();
		await this.sock.ready();

		this.domclient.setClientInfo({name:this.name,port:this.sock.getPort()});

		this.domclient.init();
		await this.domclient.ready();

		await this.producer.init();
		await this.consumer.init();

		if(!this.isAnonymous()){		
			logger.log(this.name,"模块已启动");
		}

		this._ready=true;

	}
	isAnonymous(){//返回是否一个匿名jigsaw
		return this.name=="[Anonymous]";
	}
	handle(){
		return this.producer.handle.apply(this.producer,arguments);
	}
	send(){
		return this.consumer.send.apply(this.consumer,arguments);
	}
	port(){
		return this.producer.port.apply(this.producer,arguments);
	}
	portTo(){
		return this.producer.portTo.apply(this.producer,arguments);
	}
	dighole(jgname){
		return this.send(`${jgname}:#DIGHOLE#`,{});
	}
	static setoption(name,data,jgenv){
		return domainclient.setoption(name,data,jgenv);
	}
	async ready(){
		await waitfor(()=>this.ready);
		await this.producer._ready();
		await this.consumer._ready();
	//	console.log(this.producer.ports);
	}


}




module.exports=jigsaw;
