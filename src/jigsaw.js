const producer=require(__dirname+"/producer.js");
const consumer=require(__dirname+"/consumer.js");
const DefaultLogger=require("./logger/defaultlogger.js");
const domainclient=require(__dirname+"/domain/domainclient.js");
const socket=require(__dirname+"/socket.js");
const plugin=require(__dirname+"/plugin.js");

const assert=require("assert");
const EventEmitter=require("events").EventEmitter;

class jigsaw extends EventEmitter{
	constructor(name,jgenv,options){
		super();

		if(!name)name="[Anonymous]";


		this.name=name;
		this.jgenv=jgenv;
		this.plugins={};
		this.state="close";


		this.sock=new socket();
		this.sock.on("ready",()=>this._onSubModuleReady("socket"));
		this.sock.on("close",()=>this._onSubModuleClose("socket"));

		this.domclient=new domainclient(this.jgenv);
		this.domclient.on("ready",()=>this._onSubModuleReady("domclient"));
		this.domclient.on("close",()=>this._onSubModuleClose("domclient"));

		this.producer=new producer(name,jgenv,this.sock,this.domclient,options);
		this.producer.on("ready",()=>this._onSubModuleReady("producer"));
		this.producer.on("close",()=>this._onSubModuleClose("producer"));
		
		this.consumer=new consumer(name,jgenv,this.sock,this.domclient,options);
		this.consumer.on("ready",()=>this._onSubModuleReady("consumer"));
		this.consumer.on("close",()=>this._onSubModuleClose("consumer"));
		

		this.setLogger(new DefaultLogger());

		this.start();
	}
	_resetReadyList(){
		this.readylist={
			"domclient":false,
			"producer":false,
			"consumer":false,
			"socket":false
		};
	}
	_onSubModuleClose(modname){
		
		if(this.state=="closing" || this.state=="close")
			return;

		//this.emit("error",`sub module ${modname} has been closed.`);
		this.close();
	}
	_handleClose(){
		this.state="close";
		this.emit("close")
	}
	_onSubModuleReady(modname){
		if(this.readylist[modname]){
//			this.logger.log(`ready twice happened at ${modname}`);
			return;
		}

		this.readylist[modname]=true;
		let allready=true;
		for(let key in this.readylist){
			if(!this.readylist[key])
				allready=false;
		}

		if(allready)
			this._handleReady();

	}
	_handleReady(){
		if(!this.isAnonymous()){		
			this.logger.log(this.name,"模块已启动");
		}
		this.state="ready";
		this.emit("ready");
	}
	setLogger(logger){
		this.logger=logger;
		this.producer.setLogger(logger);
		this.consumer.setLogger(logger);
		
	}
	getLogger(){
		return this.logger;
	}
	setOption(options){
		this.producer.options=options;
		this.consumer.options=options;
	}
	async close(){
		if(this.state=="close" || this.state=="closing")return;
		//assert(this.state!="close",`in this state '${this.state}' can not be closed`);
		//assert(this.state!="closing","jigsaw is closing");
		if(this.state=="starting"){
			await new Promise((resolve,reject)=>{
				let timeout=setTimeout(reject,5000);
				let eventListener=()=>{
					clearTimeout(timeout);
					resolve();
				};
				this.once("ready",eventListener);
			})

		}
		
		this.state="closing";


		await this._unloadPlugins();


		await this.consumer.close();
		await this.producer.close();
		
		await this.domclient.close();
		await this.sock.close();

		this.state="close";
		this.emit("close");
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
	async start(){
		assert(this.state=="close","in this state,jigsaw can not be started");

		this.state="starting";

		this._resetReadyList();

		await this._loadPlugins();

		this.sock.start();

		this.sock.once("ready",()=>{
			this.domclient.setClientInfo({name:this.name,port:this.sock.getPort()});
			this.domclient.start();

			this.producer.start();
			this.consumer.start();

		})


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
	static setoption(name,data,jgenv){
		return domainclient.setoption(name,data,jgenv);
	}


}


jigsaw.plugins = {};

jigsaw.use = function(plg){//注册一个插件
	let p=new plugin(plg);
	jigsaw.plugins[p.getName()] = p;
}




//============内置插件=================
jigsaw.use(require(__dirname+"/plugins/jigsawHoleDigger.js"));



module.exports=jigsaw;
