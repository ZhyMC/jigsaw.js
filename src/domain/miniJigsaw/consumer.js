var Request = require("request");
var url = require("url");
var qs = require("querystring");
var sleep = (t)=>new Promise((y)=>setTimeout(y,t));

class request{
	constructor(addr,method,data){
		this.addr=addr;
		this.method=method;
		this.data=JSON.stringify(data);
		this.port=7793;
	}
	buildUrl(){
		return url.format({
				protocol: "http",
				hostname: this.addr,
				port: this.port,
				pathname: "/",
				search: qs.stringify({
				method: this.method,
				data: Buffer.from(this.data).toString("base64")
			})
		});
	}
	req(){
		return new Promise((resolve,reject)=>{
			Request.get({
				url:this.buildUrl(),
				timeout:2000
			},(err,res,body)=>{
				if(err){reject(err);return;}
				resolve(body)
			})			
		})

	}
}



class consumer{
	constructor(prodaddr){
		this.prodaddr=prodaddr;
		this.maxretry=5;
	}
	async send(method,data){
		let built = new request(this.prodaddr,method,data);
		let ret={};
		let retry=0;
		while(true){
			try{
				ret=JSON.parse(await built.req());
				break;
			}catch(e){

			}

			if(retry++>=this.maxretry)throw new Error("timeout");

			await sleep(100);
		}

		return ret;
	}
}

module.exports=consumer;
