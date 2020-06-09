var http = require("http");
var url = require("url");
var qs = require("querystring");
var fetch = require("node-fetch");
var sleep = (t) =>new Promise((y) =>setTimeout(y, t));

var consumer = require(__dirname+"/miniJigsaw/consumer.js");
var logger = require(__dirname+"/../logger.js");
var waitfor = require(__dirname+"/../utils/waitfor.js");

class domainclient {
    constructor(jgenv) { //客户端名,客户端网络端口,客户端环境
        this._addrcached = {};

        //this.clientinfo = clientinfo;
        this.jgenv = jgenv;
        this.dead = false;
        this._ready = false;
        this.consumer = new consumer(this.jgenv.domainserver);

        this.freq = 20 * 1000;//20秒向服务器报告一次网络位置
    }
    setClientInfo(clientinfo){
        this.clientinfo=clientinfo;
    }
    close(){
        this.dead = true;
    }
    ready(){
        return waitfor(()=>this._ready);
    }
    init(){
        this.updateLoop();
    }
    async updateLoop(){
        await this.update();
        this._ready=true;

        while(!this.dead){
//            console.log("update",this.clientinfo.name);
            await sleep(this.freq *(1 + 0.3 * Math.random())); //随机量防止冲击波峰
        }
    }
    static setoption(name,data,jgenv){
        return domainclient._stableSend(new consumer(jgenv.domainserver),name,"setoption",{jgname:name,option:data},(ret)=>(ret),`对[${name}]向域名服务器执行 setoption 花费较长时间...`);
    }
    async _send(method,data,condi,timeoutTip){
        return domainclient._stableSend(this.consumer,this.clientinfo.name,method,data,condi,timeoutTip);
    }
    static async _stableSend(consumer,name,method,data,condi,timeoutTip){
        let timer=setTimeout(()=>{
            logger.log(name,timeoutTip);
        },5000);
        let ret;

        while(true){
            try{

                ret=await consumer.send(method,data);
                if(condi(ret))break;
            }catch(e){
                    
            }

            await sleep(100);

        }
        clearTimeout(timer);

        return ret;
    }
    async update() { //向域名服务器同步一次域名客户端的信息
        return this._send("update",{jgname:this.clientinfo.name,addr:`${this.jgenv.interfaceip}:${this.clientinfo.port}`},(ret)=>(ret),"向域名服务器更新地址花费较长时间...")
    }
    async getAddress(jgname) { //向域名服务器请求一次域名客户端的网络信息
        if (this._addrcached[jgname] && (new Date().getTime() - this._addrcached[jgname].start) < 30 * 1000) {
            return this._addrcached[jgname].addr;
        }


        let ad=await this._send("getinfo",{jgname},(ret)=>(ret.length>0),`向域名服务器获取[${jgname}]的地址花费较长时间...`);
        

         if (!this._addrcached[jgname]) this._addrcached[jgname] = {};
        this._addrcached[jgname].start = new Date().getTime();
        this._addrcached[jgname].addr = ad;
        return ad;

    }

}
module.exports = domainclient;