const http = require("http");
const url = require("url");
const qs = require("querystring");
const sleep = (t) =>new Promise((y) =>setTimeout(y, t));

const consumer = require("./miniJigsaw/consumer.js");
const DefaultLogger = require("../logger/defaultlogger");

const assert=require("assert");
const EventEmitter=require("events").EventEmitter;

const debug=require("debug")("jigsaw:domainclient");

class NetAddressError extends Error{constructor(o){super(o)}};

class LimitMap{
    constructor(){
        this.map={};
        this.keys=[];
        this.limit=1000;
    }
    set(key,data){
        if(this.keys.length>=this.limit)
            delete this.map[this.keys.shift()];

        if(!this.map[key])
            this.keys.push(key);
        
        this.map[key]=data;
    }
    get(key){
        return this.map[key];
    }

}
class domainclient extends EventEmitter{
    constructor(jgenv) { //客户端名,客户端网络端口,客户端环境
        super();

        assert(jgenv,"jgenv 必须被指定");
        assert(jgenv.domainserver, "jgenv.domainserver 必须被指定");

        this._addrcached = new LimitMap();

        //this.clientinfo = clientinfo;
        this.jgenv = jgenv;
        this.netaddress;
        
        this.consumer = new consumer(this.jgenv.domainserver);

        this.state="close";

        this.maxsendloop=10;

        this.logger=new DefaultLogger();
        this.freq = 20 * 1000;//20秒向服务器报告一次网络位置

        this.gc_counter=0;

    }
    _initNetAddress(){
        if(!this.jgenv.entry)
            throw new Error("dont have a entry specified");

        this.setNetAddress(`${this.jgenv.entry}:${this.clientinfo.port}`);
    }
    setEntry(entry){
        this.jgenv.entry = entry;
    }
    setDomainServer(server){
        this.jgenv.domainserver = server;
    }
    setNetAddress(addr){
        this.netaddress=addr;
    }
    getNetAddress(){
        if(!this.netaddress)
            throw new NetAddressError("can not get a netaddress");
        return this.netaddress;
    }
    setLogger(logger){
        this.logger=logger;
    }
    setClientInfo(clientinfo){
        this.clientinfo=clientinfo;

        try{
            this._initNetAddress();
        }catch(err){

        }
    }
    close(){
        assert(this.state!="close","this domain client has already closed");

        this._handleClose();
    }
    start(){
        assert(this.state=="close","in this state, domainclient can not be started");
      
        this._handleReady();
        this.updateLoop();
       
    }
    _handleClose(){
        this.state = "close";
        this.emit("close");
    }
    _handleReady(){
        this.state = "ready";
        this.emit("ready");        
        debug("已成功启动",this.clientinfo.name);
    }
    async updateLoop(){



        while(this.state=="ready"){
//            console.log("update",this.clientinfo.name);
            try{
                await this.update();
            }catch(e){
                this.logger.log(this.clientinfo.name,`向域名服务器同步网络地址超时`);
            }

            let waitTime=Math.floor(this.freq *(1 + 0.3 * Math.random()) /1000);//随机延迟量防止冲击波峰
            
            for(let t=0;t<waitTime;t++){
                if(this.state!="ready")
                    break;
                await sleep(1000); 
            }

   
            
        }
    }
    static setoption(name,data,jgenv){
        return domainclient._stableSend(new consumer(jgenv.domainserver),"setoption",{jgname:name,option:data});
    }
    async _send(method,data,condi,timeoutTip){
        return domainclient._stableSend(this.consumer,method,data);
    }
    static async _stableSend(consumer,method,data){


        return await consumer.send(method,data);
    }
    async update() { //向域名服务器同步一次域名客户端的信息
        
        try{
            let addr=this.getNetAddress();
            debug("开始向域名服务器同步一次网络地址",this.clientinfo.name,addr);
            return await this._send("update",{jgname:this.clientinfo.name,addr})
        }catch(err){
            if(err instanceof NetAddressError){

            }else throw err;
        }
    }
    async getAddress(jgname) { //向域名服务器请求一次域名客户端的网络信息

        let cached=this._addrcached.get(jgname);  
        if (cached && new Date().getTime() - cached.start < 30 * 1000)
            return cached.addr;
        

        debug(`尝试获取 ${jgname} 的网络地址`);
        let ad=[];
        //`向域名服务器获取[${jgname}]的地址花费过长时间`

        for(let c=0;c<6;c++){
            ad=await this._send("getinfo",{jgname});

            if(ad.length>0)
                break;
            else{
                debug(`第${+c+1}次尝试获取到的结果为空`);
                await sleep(500);
            }
        }
        

        if(ad.length<=0)
            throw new Error("Result of getAddress is empty.");

        debug(`得到的结果`,ad);

        this._addrcached.set(jgname,{ start:new Date().getTime(),addr:ad});
        return ad;

    }

}
module.exports = domainclient;