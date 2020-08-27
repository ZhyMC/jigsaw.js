const Socket=require("../../src/socket");
const assert=require("assert");

let sock;


describe("Socket",function(){
	before(function(){
		sock=new Socket();

	})
	it("触发ready事件",function(done){
		sock.start();
		sock.once("ready",done);
	})
	it("发送5000次并测试回复",function(done){
		this.timeout(5000);

		let set=new Set();

		sock.onmessage("consumer",(msg)=>{
			set.add(msg.toString());
			if(Array.from(set).length==5000)
				done();
//			console.log(msg.toString(),Array.from(set).length)
		});

		for(let i=0;i<5000;i++)
			sock.send("consumer",Buffer.from("test-"+i),sock.getPort());


	});

	it("故意构造错误direction的包",function(done){

		sock.onmessage("consumer",(msg)=>{
			done(new Error("收到了不可能收到的包"));
		});	
		sock.onmessage("producer",(msg)=>{
			done(new Error("收到了不可能收到的包"));
		});	
		
		sock.sock.send(Buffer.concat([
					Buffer.from([1,2]),
					Buffer.from("testdata")
			]),sock.getPort());
		setTimeout(()=>done(),100);

	});
	after(function(){
		sock.close();
	})
});