var http = require("http");
var url = require("url");
var qs = require("querystring");
var fetch = require("node-fetch");
var sleep = (t) =>new Promise((y) =>setTimeout(y, t));

var consumer = require(__dirname+"/miniJigsaw/consumer.js");
var logger = require(__dirname+"/../logger.js");

class domainclient {
    constructor(clientinfo, jgenv) { //客户端名,客户端网络端口,客户端环境
        this._addrcached = {};

        this.clientinfo = clientinfo;
        this.jgenv = jgenv;

        this.consumer = new consumer(this.jgenv.domainserver);
    }
    async update() { //向域名服务器同步一次域名客户端的信息
        let timer=setTimeout(()=>{
            logger.log(this.clientinfo.name,"向域名服务器更新地址花费较长时间...");
        },5000);
        let updated=await this.consumer.send("update",{jgname:this.clientinfo.name,addr:`${this.jgenv.interfaceip}:${this.clientinfo.port}`});
        clearTimeout(timer);
        return updated;
    }
    async getAddress(jgname) { //向域名服务器请求一次域名客户端的网络信息
        if (this._addrcached[jgname] && (new Date().getTime() - this._addrcached[jgname].start) < 30 * 1000) {
            return this._addrcached[jgname].addr;
        }

        let timer=setTimeout(()=>{
            logger.log(this.clientinfo.name,`向域名服务器获取[${jgname}]的地址花费较长时间...`);
        },5000);

        let ad=[];
        while(true){
            try{
                ad=await this.consumer.send("getinfo",{jgname});
                if(ad.length>0)break;
            }catch(e){

            }    

            await sleep(100);
        }

        clearTimeout(timer);
        

         if (!this._addrcached[jgname]) this._addrcached[jgname] = {};
        this._addrcached[jgname].start = new Date().getTime();
        this._addrcached[jgname].addr = ad;
        return ad;

    }

}
module.exports = domainclient;