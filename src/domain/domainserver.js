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
		
		this.gc_counter=0;
	}
	getinfo({jgname}){
		//console.log("query",jgname);
		let res=this.domains[jgname];

		if(!res)return [];

		return this._getJigsaws(jgname).map((name)=>this.domains[name]);

	}
	_getJigsaws(name){
		let target=this.domains[name];
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
		this._setDomainData(jgname,"option",{});
		this.domains[jgname].option=option;

		return {ok:true};
	}
	_checkGarbageCollect(){
        if(this.gc_counter++>20){
            this.gc_counter=0;

            this._doGarbageCollect();
        }
	}
	_doGarbageCollect(){
		for(let jgname in this.domains){
			if(new Date().getTime() - this.domains[jgname].updateTime > 40*1000){
				delete this.domains[jgname];
				console.log("域名服务器已销毁域名信息",jgname,"当前域名总数",Object.keys(this.domains).length);
			}
		}
	}
	_setDomainData(jgname,type,data,override){
		if(!this.domains[jgname])
			this.domains[jgname]={updateTime:new Date().getTime()};

		if(override){
			this.domains[jgname][type]=data;
		}
		else{
			if(!this.domains[jgname][type])
				this.domains[jgname][type]=data;

		}
	}
	async update({jgname,addr}){
		this._checkGarbageCollect();
		this._setDomainData(jgname,"option",{});
		this._setDomainData(jgname,"jgname",jgname);
		this._setDomainData(jgname,"addr",addr,true);
		this._setDomainData(jgname,"updateTime",new Date().getTime(),true);

		return {ok:true};
	}

	
}

new domainserver();
