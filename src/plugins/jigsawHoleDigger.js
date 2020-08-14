const sleep=(t)=>new Promise((y)=>setTimeout(y,t));
const asyncloop=require(__dirname+"/../utils/asyncloop.js");

const parsePath=(path)=>{
	let [jgname,method]=path.split(":");
	return {jgname,method};
}
const buildPath=({jgname,method})=>{
	return jgname+":"+method;
}

class jigsawHoleDigger{
	constructor(jigsaw){
		this.jigsaw=jigsaw;
		
		this.jigsaw.once("ready",this._onJigsawReady.bind(this));
		this.holes_recv={};
		this.holes_mantained={};

		this.dead=false;

		this.maintainer=new asyncloop(30000,1000,()=>this.dead,this.updateHoles.bind(this));
		this.maintainer.start();

		this.setLogger(this.jigsaw.getLogger());
	}
	init(){
		this.jigsaw.port("#DIGHOLE#",(data,rinfo)=>{
			this.holes_recv[data.jgname]=rinfo.rname;
		});
		this.jigsaw.dighole=this.dighole.bind(this);
		this.jigsaw.consumer.onBeforeSend(this.hooked_send.bind(this));
	}
	setLogger(logger){
		this.logger=logger;
	}
	async hooked_send(path,data){
//		if(this.holes_recv[path])
		let {jgname,method}=parsePath(path);
//		console.log(path,jgname,this.holes_recv)
		if(this.holes_recv[jgname]){
			jgname=this.holes_recv[jgname];
		}

		let newpath=buildPath({jgname,method});

	//	return await this.jigsaw._send(newpath,data);
	//	
		return {path:newpath,obj:data};
	}
	dighole(target){
		this.holes_mantained[target]={succ:false};
		this.updateHoles();
	}
	unload(){
		this.dead=true;
//		console.log("unload")
	}
	_onJigsawReady(){
		this.updateHoles();
	}
	async updateHoles(){

		for(let h in this.holes_mantained){
			let hole=this.holes_mantained[h];
			try{
				await this.jigsaw.send(`${h}:#DIGHOLE#`,{jgname:this.jigsaw.name});

				if(!hole.succ){
					hole.succ=true;
					this.logger.log("[HoleDigger]",`[${this.jigsaw.name}]`,`打洞 -> ${h} 成功`);
				}
			}catch(e){
				this.logger.log("[HoleDigger]",`[${this.jigsaw.name}]`,`打洞 -> ${h} 失败,即将重试...`)
			}
		}
	}


}

jigsawHoleDigger.info={
	name:"jigsawHoleDigger"
}

module.exports=jigsawHoleDigger;
