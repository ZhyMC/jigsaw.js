var fetch = require("node-fetch");
var url = require("url");
var qs = require("querystring");

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
		
		return await fetch(url).then((x)=>x.json());
	}
}

module.exports=consumer;
