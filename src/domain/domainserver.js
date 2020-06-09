var http=require("http");
var url=require("url");
var qs=require("querystring");
var producer=require(__dirname+"/miniJigsaw/producer.js");

class domainserver{

	constructor(){
		this.jigsaws={};
		this.domains={};

		this.producer=new producer();


		let bindedMethods=["getinfo","setoption","update"];

		for(let method of bindedMethods)
			this.producer.port(method,this[method].bind(this));
		
	
	}
	getinfo({jgname}){
		//console.log("query",jgname);
		let res=this.domains[jgname];

		if(!res)return [];

		return this._getJigsaws(jgname).map((name)=>this.domains[name]);
	}
	_getJigsaws(name){
		let target=this.jigsaws[name];
		let count=1;
		if(target.option && target.option.jgcount>1)
			count=target.option.jgcount;

		return this._getJigsawNames(name,count);
	}
	_getJigsawNames(name,count){
		
		let names=[];
		for(let i=0;i<count;i++){
			if(i==0)names.push(name);
			else names.push(`${name}@${parseInt(i)}`);
		}

		return names;
	}
	setoption({jgname,option}){

		if(!this.jigsaws[jgname])this.jigsaws[jgname]={};

		this.jigsaws[jgname]={...this.jigsaws[jgname],jgname,option};
		return {ok:true};
	}
	async update({jgname,addr}){
		if(!this.jigsaws[jgname])this.jigsaws[jgname]={};

		this.domains[jgname]={jgname,addr,rsptime:new Date().getTime()+""};
		return {ok:true};
	}

	
}

new domainserver();
