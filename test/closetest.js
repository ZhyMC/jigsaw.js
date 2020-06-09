var {domain,jigsaw,webserver}=require("../index.js")("127.0.0.1","127.0.0.1");

domain();

let jg=new jigsaw("test");
let jg2=new jigsaw();


jg.port("test",()=>({ok:true}));
jg.ready().then(()=>{

	jg.close();	

	jg2.send("test:test").then(console.log); 
	//这里10秒后会抛出超时异常,因为远程的jigsaw早已被关闭

})



