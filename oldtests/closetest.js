const {domainserver,jigsaw,webserver}=require("../index.js")("127.0.0.1","127.0.0.1");

const domserver=domainserver();

const jg=new jigsaw("test");
const jg2=new jigsaw();


jg.port("test",()=>({ok:true}));
jg.ready().then(async ()=>{
	jg.close();

	try{
		await jg2.send("test:test").then(console.log) 	//这里10秒后会抛出超时异常,因为远程的jigsaw早已被关闭
	}catch(e){
		console.log(e);
		jg2.close();
		domserver.kill();		

		//之后jigsaw实例会被关闭,域名服务器也会被关闭,正常情况下,node进程会自然的自动退出.
	}

})




