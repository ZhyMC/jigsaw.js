var sleep=(t)=>new Promise((y)=>setTimeout(y,t));

var http = require('http');
var jigsawenv = require(__dirname+"/../jigsawenv.js");
var jigsaw = require(__dirname+"/../jigsaw.js");
var logger = require(__dirname+"/../logger.js");

var https = require("https");
var http = require("http");
var URL = require("url");
var querystring = require("querystring");
var Busboy = require("busboy");
var cluster = require("cluster");
var q = require("q");
var ContentType=require("content-type");
var assert = require("assert")

var JGO = jigsawenv.unserialize(process.argv[2]);
var PORT = process.argv[3];
var CERT = JSON.parse(process.argv[4]);


	class jigsawWebServer {
		constructor(port, cert , jgenv) {
			this.isHttps = false;

			cluster.isWorker=false;//解决windows下NOTSUP问题

			this.jg = new jigsaw("",jgenv);
			this.jg.ready().then(()=>{
				cluster.isWorker=true;
			});


			this.jgindex=0;


			if (cert && cert.cert && cert.key) {
				https.createServer(cert,this.handleConnection.bind(this)).listen(port);
				this.isHttps = true;
			} else
				http.createServer(this.handleConnection.bind(this)).listen(port);


		}
		isBrowser(req){
			return req.headers['user-agent'] && req.headers['user-agent'].indexOf("Mozilla")!=-1;
		}
		async handleConnection(req,res){
			let isBrowser=this.isBrowser(req);

    		res.setHeader("Access-Control-Allow-Origin", "*");
			res.setTimeout(10000);
			
			try{
				let ret=await this.handle(req);
				let render_str="";

				if(isBrowser)
					render_str=JSON.stringify(ret,null,'\t');
				else
					render_str=JSON.stringify(ret);

				res.setHeader("Content-Type", "application/json; charset=utf-8");
				res.end(render_str);
			}catch(e){
				res.setHeader("Content-Type", "text/plain; charset=utf-8");
				res.end(e.stack);
			}

		}

		async handlePostRequest(route,req){
			let str_contentType=req.headers["content-type"];
			assert(typeof(str_contentType)=="string","Content-Type must be a string");

			let contentType=ContentType.parse(str_contentType);
			let data={};

			if(contentType.type=="application/json"){
				let defer = q.defer();
				let bufs=[];

				req.on("data",(dt)=>{
					bufs.push(dt);
				})
				req.on("end",()=>{
					defer.resolve(Buffer.concat(bufs).toString())
				})

				let str = await defer.promise;
				try{
					data = JSON.parse(str);
				}catch(e){
					throw new Error("post body payload must be a JSON format");
				}

			}else{
				let busboy = new Busboy({headers:req.headers});

				let defer=q.defer();
			
				busboy.on("field",(name,val)=>{
					data[name]=val;
				})

				busboy.on("finish",()=>{
					defer.resolve(data);
				});


				req.pipe(busboy);

				data = await defer.promise;
			}

		

        	return this.jg.send(route,data);
		}
		handleGetRequest(route,req){
			let urlobj = URL.parse(req.url);

			let data = querystring.parse(urlobj.query);
        	
        	return this.jg.send(route,data);

		}
		async handle(req) {

			
			if (req.url == "/") {
				return {
						msg: "Jigsaw worked!"
					};
			}

			
            let urlobj = URL.parse(req.url);

            let urlparts = urlobj.pathname.split("/");
            let routeRaw = urlparts.slice(1, urlparts.length);

            if (routeRaw.length != 2 || !urlparts[2]) {
				throw new Error("Not a completed request.")
            }

	        let route = routeRaw.join(':');


			if(req.method=="POST"){
				return await this.handlePostRequest(route,req);
			}else if(req.method=="GET"){
	            return await this.handleGetRequest(route,req);
			}else{
				throw new Error("Unknown Request Method");
			}
		
		}

	}
	
		
	class MasterDeamon{//主进程守护器
			constructor(){
				cluster.on("message",(worker,msg)=>{//心跳
					this.handleMsg(worker,msg)
				});

			}
			handleMsg(worker,msg){
				worker.send("ok");
			}
	}
	class SlaveDeamon{//子进程守护器,隔一段时间测试一次主进程的存活,如果没有存活则直接退出子进程
		constructor(){
			this.timeout=1000;//因为是通过IPC管道通信,要求1秒内主进程要返回
			process.on("message",(msg)=>{
				this.handleMsg(msg)
			});

			this.nowtest={
				testing:false,
				result:false
			};

			this.testloop();
		}
		async testloop(){
			while(true){
				await this.test();
				await sleep(3000);
			}
		}
		async test(){
			if(this.test.testing)return;

			this.nowtest.testing=true;
			this.nowtest.result=false;

			process.send("test");
			await sleep(1000);
	
			this.nowtest.testing=false;

			if(!this.nowtest.result){
				process.exit();
			}

		}
		handleMsg(msg){
			//console.log(msg)
			this.nowtest.result=true;
		}

	}

if (cluster.isMaster) {
	new MasterDeamon();
	
	var numCPUs = require('os').cpus().length;
	if(numCPUs <= 0) numCPUs=1;

	logger.log("#WebServer#","服务器已启动于 :" + PORT +" ( x" + numCPUs);

	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

}else{
	new jigsawWebServer(PORT,CERT,JGO);
	new SlaveDeamon();
}
	