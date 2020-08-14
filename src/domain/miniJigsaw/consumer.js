const Request = require("request");
const url = require("url");
const qs = require("querystring");
const sleep = (t)=>new Promise((y)=>setTimeout(y,t));
const debug = require("debug")("jigsaw:miniJigaw:consumer");
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
				timeout:1000
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
		for(let i=0;i<this.maxretry;i++){
			try{

				let r=JSON.parse(await built.req());
				if(r.length<=0)
					throw new Error("recv an empty result");
				return r;
			}catch(e){
				debug(`第${+i+1}次尝试请求失败`,method,data)
			}

			await sleep(100);
		}

		throw new Error("timeout");

	}
}

module.exports=consumer;
