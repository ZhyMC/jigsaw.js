var {domain,jigsaw}=require("../index.js")("127.0.0.1","127.0.0.1");

domain();




let recver=new jigsaw("recver");



recver.port("call",(obj)=>{
	console.log("我收到了",obj);//这行永远都不会执行
});

let sender=new jigsaw("sender");

sender.once("ready",()=>{
	sender.send("recver:call",{data:123}).then(console.log);
});

