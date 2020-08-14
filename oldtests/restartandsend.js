var {domain,jigsaw}=require("../index.js")("127.0.0.1","127.0.0.1");

domain();

async function startTest(){
	

	let jg=new jigsaw("test");
	jg.port("get",x=>x);


	let sender=new jigsaw("sender")
	console.log(await sender.send("test:get",{x:1}));

	sender.consumer.uniqueid=sender.consumer._uniqueid();
	sender.consumer.curr_reqid=100;

	//这两行模拟重启jigsaw
	
	console.log(await sender.send("test:get",{x:2}));

	
}


startTest();
