var http = require("http");
var url = require("url");
var qs = require("querystring");
var fetch = require("node-fetch");
var sleep = (t) =>new Promise((y) =>setTimeout(y, t));

var consumer = require(__dirname+"/miniJigsaw/consumer.js");

class domainclient {
    constructor(clientinfo, jgenv) { //客户端名,客户端网络端口,客户端环境
        this._addrcached = {};

        this.clientinfo = clientinfo;
        this.jgenv = jgenv;

        this.consumer = new consumer(this.jgenv.domainserver);
    }
    async update() { //向域名服务器同步一次域名客户端的信息

        return this.consumer.send("update",{jgname:this.clientinfo.name,addr:`${this.jgenv.interfaceip}:${this.clientinfo.port}`});

    }
    async getAddress(jgname) { //向域名服务器请求一次域名客户端的网络信息
        if (this._addrcached[jgname] && (new Date().getTime() - this._addrcached[jgname].start) < 30 * 1000) {
            return this._addrcached[jgname].addr;
        }

        let ad=await this.consumer.send("getinfo",{jgname});

         if (!this._addrcached[jgname]) this._addrcached[jgname] = {};
        this._addrcached[jgname].start = new Date().getTime();
        this._addrcached[jgname].addr = ad;
        return ad;

    }

}
module.exports = domainclient;