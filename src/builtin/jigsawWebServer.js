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
				https.createServer(cert, (req, res) => {
					return this.handle(req, res)
				}).listen(port);
				this.isHttps = true;
			} else
				http.createServer((req, res) => {
					return this.handle(req, res)
				}).listen(port);

//			this.url = (this.isHttps ? "https://" : "http://") + IP + ":" + port + "/";

		}

		handleRequest(route,data,res,isBrowser){
		
			this.jg.send(route,data).then((d) => {
				let isObject=d instanceof Object;

				if(isBrowser)
					res.end(isObject ? JSON.stringify(d,null,'\t') : d)
				else
					res.end(isObject ? JSON.stringify(d) : d)

			}).catch((err)=>{
				//console.log(err);
				res.end(err.stack);
			});
		}
		handle(req, res) {
		
			res.setTimeout(10000);
			
			
			if (req.url == "/") {
				res.end(JSON.stringify({
						error: false,
						msg: "Jigsaw worked!"
					}));
				return;
			}

			
            let obj = URL.parse(req.url);
            let routeRaw = obj.pathname.split("/");
            routeRaw = routeRaw.slice(1, routeRaw.length);
            if (routeRaw.length != 2) {
                    res.end(JSON.stringify({
                                    error: true,
                                    msg: "Invalid Request"
                            }));
                    return;
            }
        let route = routeRaw.join(':');
		let isBrowser = req.headers['user-agent'] && req.headers['user-agent'].indexOf("Mozilla")!=-1;
	

    	res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", "application/json;charset=utf-8");


		if(req.method=="POST"){
			let busboy = new Busboy({headers:req.headers});



			let obj={};
			busboy.on("field",(name,val)=>{
				obj[name]=val;
			})

			busboy.on("finish",()=>{

				this.handleRequest(route,obj,res,isBrowser);

			});

			req.pipe(busboy);
			
		}else if(req.method=="GET"){
			
			let data = querystring.parse(obj.query);
        
            this.handleRequest(route,data,res,isBrowser);
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
	