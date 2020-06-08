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
		return [this.domains[jgname]];
	}

	setoption({jgname,option}){
		this.jigsaws[jgname]={jgname,option};
	}
	async update({jgname,addr}){

		this.domains[jgname]={jgname,addr,rsptime:new Date().getTime()+""};
	}

	
}

new domainserver();
