var http = require("http");
var url = require("url");
var qs = require("querystring");
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

        this.maxsendloop=10;

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
            await this.update();
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
        
        let trying=0;
        let ret;
        try{
            ret = await this._send("update",{jgname:this.clientinfo.name,addr:`${this.jgenv.interfaceip}:${this.clientinfo.port}`})
        }catch(e){
            logger.log(this.clientinfo.name,`向域名服务器同步网络地址超时`);
        }
        return ret;
    }
    async getAddress(jgname) { //向域名服务器请求一次域名客户端的网络信息
        if (this._addrcached[jgname] && (new Date().getTime() - this._addrcached[jgname].start) < 30 * 1000) {
            return this._addrcached[jgname].addr;
        }

        let ad=await this._send("getinfo",{jgname});
        //`向域名服务器获取[${jgname}]的地址花费过长时间`


         if (!this._addrcached[jgname]) this._addrcached[jgname] = {};
        this._addrcached[jgname].start = new Date().getTime();
        this._addrcached[jgname].addr = ad;
        return ad;

    }

}
module.exports = domainclient;