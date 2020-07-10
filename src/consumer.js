var sleep=(t)=>new Promise((y)=>setTimeout(y,t));
var domainclient=require(__dirname+"/domain/domainclient.js");
var packet=require(__dirname+"/packet.js");
var logger=require(__dirname+"/logger.js");
var getdgramconn=require(__dirname+"/utils/getdgramconn.js");
var waitfor=require(__dirname+"/utils/waitfor.js");
var slicebuilder=require(__dirname+"/slicebuilder.js");
var valid=require(__dirname+"/valid.js");

var Q=require("q");


class consumer{
	constructor(name,jgenv,sock,domclient,options){

		this.name=name;
		this.jgenv=jgenv;

		this.requests={};	
		this.request_busy=0;

		this.ready=false;


		this.domclient=domclient;

		this.slicebuilder=new slicebuilder();

		this.sock=sock;

		this.restime_meter={
			samples:[],
			maxsamples:100,
			avg:0
		}


		//this.init();
	}
	_addResTimeSample(v){
		this.restime_meter.samples.push(v);

		if(this.restime_meter.samples.length>this.restime_meter.maxsamples)
			this.restime_meter.samples.shift();
	}
	getResTime(){
		if(this.restime_meter.samples.length<=0)return 1000;
		let sum=0;
		for(let v of this.restime_meter.samples)
			sum+=v;


		return sum/this.restime_meter.samples.length;
	}

	async init(){
		await this.initSenderSocket();

		this.ready=true;
	}
	async initSenderSocket(){
		this.sock.onmessage("consumer",(data,rinfo)=>this._handleReply(data,rinfo));
		
        await this.sock.ready();
	}

	_ready(){
		return waitfor(()=>this.ready);
	}

	randomReqId(){
            let id=1;
            do{
                    id=parseInt(1e8+Math.random()*1e9);
            }while(this.requests[id]);
            return id;
	}
	parseRname(rname){//如果jigsaw是Rname格式[XXXX]，则直接发送至该Rname代表的ip和端口
		if(rname.substr(0,1)=="[" && rname.substr(-1,1)=="]")
		{
			let [ip,port]=rname.substring(1,rname.length-1).split(":")
			return {ip,port};
		}else return false;

	}
	async send(path,obj){
		return await this._send(path,obj);
	}
	async _send(path,obj){
		await this._ready();

		await valid.sendData.checkValid(obj);

		if(typeof(obj)!="object")
			obj={};

		let jgpo=packet.parsePath(path);
		let parsedrname=this.parseRname(jgpo.jg);
		
		await this._ready();


		let target_jgname=jgpo.jg;


		let ip,po;

		if(parsedrname){
			ip=parsedrname.ip;
			po=parsedrname.port;

		}else{
			let	chosen=await this.chooseJigsaw(path);

			if(!chosen)return null;
			let split=chosen.addr.split(":");
			
			ip=split[0];
			po=split[1];

			target_jgname=chosen.jgname;
		}


		let req=this.buildRequest(obj,target_jgname,jgpo.port);

		return this.sendRequest(req,ip,po);

	}
	sendRequest(req,ip,po){
		return this.doResend(req.reqid,req.tagdatas,ip,po,{
			resend:100,
			timeout:10000
		});
	}
	buildRequest(obj,jgname,jgport,reqid){
		if(!reqid)
		reqid=this.randomReqId();
		
		let tagdatas=[];

		let bufs=packet.sliceBuffer(Buffer.from(JSON.stringify(obj)));

		let path=jgname+":"+jgport;
		for(let i in bufs){
			let tagged=packet.tag(reqid,bufs[i],path,i,bufs.length);//插入数据包头部

			tagdatas.push(tagged);
		}
		return {reqid,tagdatas};
	}
	async chooseJigsaw(path){//从域名服务器中多个jigsaw里取得一个发送对象
		let jgpo=packet.parsePath(path);

		let arr=await this.domclient.getAddress(jgpo.jg);

		if(arr.length<=0)return false;

		let index=Math.floor(Math.random()*arr.length);
		let chosen=arr[index];

		if(!chosen || chosen == null)return false;
		if(chosen.addr.indexOf(":")==-1)return false;

		return chosen;
	}

	async doResend(reqid,tagdatas,ip,po,options){
		//监测回复包并重发,如果规定的时间条件内还是没有回复包，会抛出异常，否则返回回复包
		

		let timer=new Date().getTime();

		let defer=Q.defer();
		this.requests[reqid]={data_defer:defer};
	
		this.request_busy++;

		let sock=this.sock;

//		for(let tagdata of tagdatas)
//			sock.send("producer",tagdata,po,ip);


		

		let isTimeout=false;
		let endFlag=false;
		let {resend,timeout}=options;
		let ret=null;


		setTimeout(()=>defer.reject(new Error("timeout")),timeout);


		let resender=()=>{
			for(let tagdata of tagdatas)
					sock.send("producer",tagdata,po,ip);


			let resendtime=Math.max(10,this.request_busy/10);

			if(!endFlag)
				setTimeout(resender,Math.floor(resendtime));
		}

			
		resender();

		try{
			ret=JSON.parse((await defer.promise)+"");
			
		}catch(e){
			isTimeout=true;
		}

		endFlag = true;

//		clearInterval(resender);
		let timecost=new Date().getTime() - timer;

		delete this.requests[reqid];
		this.request_busy--;
	
		this.handleException(ret);
		if(isTimeout)
			throw new Error(`[Jigsaw] Jigsaw Send Timeout at Module '${this.name}'`);
		else{


			

			this._addResTimeSample(timecost);

		}


		return ret;
	}
	handleException(e){//处理远程函数的异常
		if(!e || !e._error)return;

//console.log(e);
		let {_jigsaw,_errorname,_stack}=e;


		let err=new Error();
		err.stack=_stack;
		err.message=_errorname;

		throw err;

	}
	async _handleReply(msg,rinfo){

		let {id,partdata,partid,partmax,port}=packet.untag(msg);
//console.log(partid,partmax)

		let full=this.slicebuilder.setPartData(id,partid,partmax,partdata);
		if(!full)return;
		if(!this.requests[id])return;


		this.requests[id].data_defer.resolve(full);

//		this.requests[id].data=full;
		
	}
}

module.exports=consumer;
