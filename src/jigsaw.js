let producer=require(__dirname+"/producer.js");
let consumer=require(__dirname+"/consumer.js");
let waitfor=require(__dirname+"/utils/waitfor.js");
let logger=require(__dirname+"/logger.js");
let domainclient=require(__dirname+"/domain/domainclient.js");
let socket=require(__dirname+"/socket.js");
let plugin=require(__dirname+"/plugin.js");

class jigsaw{
	constructor(name,jgenv,options){
		if(!name)name="[Anonymous]";


		this.name=name;
		this.jgenv=jgenv;
		this.sock=new socket();

		this.plugins={};

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
	async close(){
		await this.ready();
		
		await this._unloadPlugins();

		this.sock.close();
		this.domclient.close();
	}

	async _loadPlugins(){
		for(let i in jigsaw.plugins){
			let p = jigsaw.plugins[i];

			let ins=p.getInstance(this);
			this.plugins[p.getName()]=ins;
			await ins.init();
		}
	}
	async _unloadPlugins(){
		for(let i in this.plugins){
			await this.plugins[i].unload();
		}
	}
	async init(){

		await this._loadPlugins();

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
	_send(){
		return this.consumer._send.apply(this.consumer,arguments);
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


jigsaw.plugins = {};

jigsaw.use = function(plg){//注册一个插件
	let p=new plugin(plg);
	jigsaw.plugins[p.getName()] = p;
}




//============内置插件=================
jigsaw.use(require(__dirname+"/builtin/jigsawHoleDigger.js"));



module.exports=jigsaw;
