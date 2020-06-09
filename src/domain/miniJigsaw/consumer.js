var fetch = require("node-fetch");
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
}



class consumer{
	constructor(prodaddr){
		this.prodaddr=prodaddr;
	}
	async send(method,data){
		let built = new request(this.prodaddr,method,data);
		let url = built.buildUrl();
		//console.log(url);
		let ret={};
		while(true){
			try{
				ret=await fetch(url).then((x)=>x.json());
				break;
			}catch(e){

			}

			await sleep(500);
		}

		return ret;
	}
}

module.exports=consumer;
