var http=require("http");
var qs=require("querystring");
var url=require("url");

class producer{
	constructor(){
		this.server=http.createServer((req,res)=>this.handleRequest(req,res));
		this.server.listen(7793);
		this.ports={};
	}
	async handleRequest(req,res){
		let {path,query}=url.parse(req.url);
		let q=qs.parse(query);
		
		
		let ret=await this.ports[q.method](JSON.parse(Buffer.from(q.data,"base64").toString()));
		//console.log("ret",ret,JSON.stringify(ret));
		if(!ret)
			ret=null;
		
		res.end(JSON.stringify(ret));
	}
	port(portname,f){
		this.ports[portname]=f;
	}

}

module.exports=producer;
