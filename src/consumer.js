const sleep=(t)=>new Promise((y)=>setTimeout(y,t));
const domainclient=require(__dirname+"/domain/domainclient.js");
const packet=require(__dirname+"/packet.js");
const getdgramconn=require(__dirname+"/utils/getdgramconn.js");
const slicebuilder=require(__dirname+"/slicebuilder.js");
const valid=require(__dirname+"/valid.js");
const md5=(x)=>require("crypto").createHash("md5").update(x+"").digest("hex");

const Q=require("q");
const assert=require("assert");
const EventEmitter=require("events").EventEmitter;
const debug=require("debug")("jigsaw:consumer");

class consumer extends EventEmitter{
	constructor(name,jgenv,sock,domclient,options){
		super();

		this.name=name;
		this.jgenv=jgenv;

		this.requests={};	
		this.curr_reqid=100;
		this.domclient=domclient;
		this.slicebuilder=new slicebuilder();

		this.sock=sock;
		this.uniqueid=this._uniqueid();

		this.req_score=0;

		this.state="close";

		this.closing_defer;

		/*setInterval(()=>{
			console.log(this.resources);
		},1000)*/

		this.resources={
			timer:0,
			req:0
		}

		this._beforeSend=(path,obj)=>(path,obj);
		this._afterSend=(res)=>(res);

		//this.init();
	}
	_uniqueid(){//每次生成实例,都会得到一个唯一id
		let token="";
		token+=this.name;
		token+="-";
		token+=new Date().getTime()+"";
		token+="-";
		token+=Math.random()+"";
		token+="jigsaw";

		return md5(token).substr(0,10);
	}

	setLogger(logger){
		this.logger=logger;
	}

	async start(){
		assert(this.state=="close","in this state, consumer can not be started.");

		this.initSenderSocket();

		this.state="ready";
		this.emit("ready");
	}
	async initSenderSocket(){
		this.sock.onmessage("consumer",(data,rinfo)=>this._handleReply(data,rinfo));
		
	}
	async close(){
		if(this.state=="close" || this.state=="closing")return;
		
		//assert(this.state!="close","this producer is not in a state can be close");
		//assert(this.state!="closing","this producer is closing.");
				
		this.closing_defer=Q.defer();
		this.state="closing";
		this._checkClosed();

		debug("开始关闭jigsaw实例",this.name);
		await this.closing_defer.promise;
		debug("成功关闭jigsaw实例",this.requests,this.name);

		//console.log("已关闭",this.req_score);
		
		this.state="close";
	}
	_setRequest(reqid,req){
		this.requests[reqid]=req;
	}
	_delRequest(reqid){
		delete this.requests[reqid];
	}
	_offsetResources(tag,value){
		assert(typeof(value)=="number","value must be a number");
		this.resources[tag]+=value;
		this._checkClosed();		
	}
	_checkClosed(){

		let allclosed=true;
		for(let i in this.resources){
			if(this.resources[i] > 0)
				allclosed = false;

		}
		if(this.state=="closing" && allclosed)//如果所有请求已经结束,那么此时可以终止producer
			this.closing_defer.resolve();
	}

	randomReqId(){
		let id=this.curr_reqid++;
		if(id>1e10)
			throw new Error("id too big")
		return id;
	}
	parseRname(rname){//如果jigsaw是Rname格式[XXXX]，则直接发送至该Rname代表的ip和端口
		if(rname.substr(0,1)=="[" && rname.substr(-1,1)=="]")
		{
			let [ip,port]=rname.substring(1,rname.length-1).split(":")
			return {ip,port};
		}else return false;

	}
	onBeforeSend(f){
		this._beforeSend=f;
	}
	onAfterSend(f){
		this._afterSend=f;
	}
	async send(_path,_obj){
		let {path,obj} = await this._beforeSend(_path,_obj);
		let res = await this._call(path,obj);
		let result = await this._afterSend(res,_path,_obj,path,obj);
		return result;
	}

	async _call(path,obj){
		debug("开始进行远程调用",path,obj);
		assert(this.state=="ready","can not do remote call,because consumer has not ready");
		assert(this.resources.req<=2000,"requests too much, can not create more request, wait a minutes.");

		await valid.sendData.checkValid(obj);

		if(typeof(obj)!="object")
			obj={};

		let jgpo=packet.parsePath(path);
		let parsedrname=this.parseRname(jgpo.jg);
	

		let target_jgname=jgpo.jg;


		let ip,po;

		if(parsedrname){
			ip=parsedrname.ip;
			po=parsedrname.port;

		}else{
			let	chosen=await this.chooseJigsaw(path);

			if(!chosen){
				debug("未找到目标jigsaw的网络位置",path);
				throw new Error("no route to access the jigsaw.");
			}
			let split=chosen.addr.split(":");
			
			ip=split[0];
			po=split[1];

			target_jgname=chosen.jgname;
		}

		this._offsetResources("req",+1);

		let req=this.buildRequest(obj,target_jgname,jgpo.port);
		return this._sendRequest(req,ip,po);

	}
	_sendRequest(req,ip,po){
		return this._doResend(req.reqid,req.tagdatas,ip,po,{
			resend:100,
			timeout:10000
		});
	}
	buildRequest(obj,jgname,jgport,reqid){
		if(!reqid)
		reqid=this.randomReqId();
		
		let tagdatas=[];


		let rawbuffer=Buffer.from(JSON.stringify(obj));		
		assert(rawbuffer.length < 8 * 1024 *1024);

		let bufs=packet.sliceBuffer(rawbuffer);

		let path=jgname+":"+jgport;
		for(let i in bufs){

			let tagged=packet.tag(reqid,bufs[i],path,this.uniqueid,i,bufs.length);//插入数据包头部

			tagdatas.push(tagged);
		}
		return {reqid,tagdatas};
	}
	async chooseJigsaw(path){//从域名服务器中多个jigsaw里取得一个发送对象
		let jgpo=packet.parsePath(path);

		let arr=[];
		try{
			arr=await this.domclient.getAddress(jgpo.jg);
		}catch(e){

		}

		if(arr.length<=0)return false;

		let index=Math.floor(Math.random()*arr.length);
		let chosen=arr[index];

		if(!chosen || chosen == null)return false;
		if(chosen.addr.indexOf(":")==-1)return false;

		return chosen;
	}

	async _doResend(reqid,tagdatas,ip,po,options){
		//监测回复包并重发,如果规定的时间条件内还是没有回复包，会抛出异常，否则返回回复包
		

		let timer=new Date().getTime();

		let defer=Q.defer();

		this.req_score+=tagdatas.length;

		this._setRequest(reqid,{data_defer:defer});

	
		let sock=this.sock;

		

		let isTimeout=false;
		let {resend,timeout}=options;
		let ret=null;



		let timeout_timer=setTimeout(()=>defer.reject(new Error("timeout")),timeout);


		let endtimer=false;

		let send_once=(isResend)=>{
			if(isResend)
				this._offsetResources("timer",-1);


			if(endtimer)
					return;
			

			let delay=Math.floor(this.req_score+(Math.random()*30));
			let timelen=Math.max(10,Math.min(1000,delay));
			//console.log(timelen)

			debug("进行一次Socket数据发送",`长度:${tagdatas.length}`,po,ip);
			for(let tagdata of tagdatas){
				//console.log(packet.untag(tagdata))
					sock.send("producer",tagdata,po,ip);
			}

			//console.log(timelen);

			setTimeout(()=>send_once(true),timelen);
			
			this._offsetResources("timer",+1);
		};

		send_once();

		try{
			ret=JSON.parse((await defer.promise)+"");
		}catch(e){
			isTimeout=true;
		}
			
		clearTimeout(timeout_timer);
		endtimer=true;


		let timecost=new Date().getTime() - timer;


		this._delRequest(reqid);

		this.req_score-=tagdatas.length;
		this._offsetResources("req",-1);
	
		this.handleException(ret);
		if(isTimeout)
			throw new Error(`[Jigsaw] Jigsaw Send Timeout at Module '${this.name}'`);
		else{

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


		let {id,partdata,partid,partmax,port,from}=packet.untag(msg);
		//console.log(packet.untag(msg));
//console.log(partid,partmax)
//


//console.log(decoded)
		if(from!=this.uniqueid){
			//throw new Error("request reply owner is not correct");
			return;
		}

		let full=this.slicebuilder.setPartData(from,id,partid,partmax,partdata);
		if(!full)return;
		if(!this.requests[id])return;


		this.requests[id].data_defer.resolve(full);

//		this.requests[id].data=full;
		
	}
}

module.exports=consumer;
