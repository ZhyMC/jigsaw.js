const {fork} = require("child_process");
const jigsaw = require("../../jigsaw")
const assert=require("assert");
const Path=require("path");

class Mapper{
	constructor(jgenv){
		this.workers={};

		this.jgenv=jgenv;
		this.jg=new jigsaw("Mapper",this.jgenv);
		this.jg.port("ensure",this._handleEnsure.bind(this));
		this.jg.port("call",this._handleCall.bind(this));

		this.timer=setInterval(this._tick.bind(this),1000);

		this.state="ready";
	}
	async close(){
		if(this.state!="ready")
			return;
		
		clearInterval(this.timer);
		for(let i in this.workers){
			this.workers[i].worker.kill();
		}
		await this.jg.close();
		this.state="close";
	}
	_tick(){
		for(let i in this.workers){
			if(this.workers[i].life--<0){
				console.log("[Jigsaw-Mapper]",this.workers[i].jgname,"长期未收到响应,已被关闭");
				this.workers[i].worker.kill();
			}
		}
	}
	async _handleEnsure(req,src){
		assert(req.jgname,"jgname 必须被指定");
		if(this.hasWorker(req.jgname)){
			this.renewWorker(req.jgname,src);
		}else{
			this.createWorker(req,src);
		}


	}
	async _handleCall(req){
			assert(req.path,"path 必须被指定");
			assert(req.data,"data 必须被指定");

			let splits=req.path.split(":");
			assert(splits.length==2,"path 格式不正确");

			let [jgname,portname]=splits;

			assert(this.workers[jgname],"目标 jigsaw 不在线");
			
			let rname=this.workers[jgname].source.rname;

			return await this.jg.send(`${rname}:${portname}`,req.data);
	}
	getWorkers(){
		return this.workers;
	}
	getWorkersLength(){
		return Object.keys(this.workers).length;
	}
	hasWorker(jgname){
		return this.workers[jgname] ? true : false;
	}
	renewWorker(jgname,source){
		this.workers[jgname].life=20;
		this.workers[jgname].source=source;
	}
	createWorker(option,source){
		assert(option.jgname,"option.jgname 必须被指定");
		assert(this.getWorkersLength() < 1000,"单实例管理的worker数量不能超过1000");

		let wrk=this.workers[option.jgname];
		if(wrk){
			wrk.life = 20;
			wrk.source = source;
			return;
		}
		
		let opt={jgname:option.jgname,entry:this.jgenv.entry,domserver:this.jgenv.domainserver};
		
		let param=Buffer.from(JSON.stringify(opt)).toString("base64");
		let worker=fork(Path.join(__dirname,"/worker.js"),[param]);

		worker.on("exit",()=>{
			console.log("[Jigsaw-Mapper]",option.jgname,"worker 进程已被结束");
			delete this.workers[option.jgname];
		});

		this.workers[option.jgname] = { worker, jgname:option.jgname, source , life:20 };
	}

}



module.exports=Mapper;