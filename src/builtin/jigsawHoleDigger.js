var sleep=(t)=>new Promise((y)=>setTimeout(y,t));
var asyncloop=require(__dirname+"/../utils/asyncloop.js");

var parsePath=(path)=>{
	let [jgname,method]=path.split(":");
	return {jgname,method};
}
var buildPath=({jgname,method})=>{
	return jgname+":"+method;
}


class jigsawHoleDigger{
	constructor(jigsaw){
		this.jigsaw=jigsaw;
		
		this.holes_recv={};
		this.holes_mantained={};

		this.dead=false;

		this.maintainer=new asyncloop(30000,1000,()=>this.dead,this.updateHoles.bind(this));

		this.maintainer.start();
	}
	init(){
		this.jigsaw.port("#DIGHOLE#",(data,rinfo)=>{
			this.holes_recv[data.jgname]=rinfo.rname;
		});
		this.jigsaw.dighole=this.dighole.bind(this);
		this.jigsaw.send=this.hooked_send.bind(this);
	}
	async hooked_send(path,data){
//		if(this.holes_recv[path])
		let {jgname,method}=parsePath(path);
//		console.log(path,jgname,this.holes_recv)
		if(this.holes_recv[jgname]){
			jgname=this.holes_recv[jgname];
		}

		let newpath=buildPath({jgname,method});

		return await this.jigsaw._send(newpath,data);
	}
	async dighole(target){
		this.holes_mantained[target]=true;
		await this.updateHoles();
	}
	unload(){
		this.dead=true;
//		console.log("unload")
	}
	async updateHoles(){
		for(let h in this.holes_mantained){
			try{
				await this.jigsaw.send(`${h}:#DIGHOLE#`,{jgname:this.jigsaw.name});
			}catch(e){
				console.error("[HoleDigger]",`[${this.jigsaw.name}]`,`打洞 -> ${h} 失败,即将重试...`),
			}

		}
	}


}

jigsawHoleDigger.info={
	name:"jigsawHoleDigger"
}

module.exports=jigsawHoleDigger;
