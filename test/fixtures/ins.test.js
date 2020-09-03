var {domainserver,jigsaw,webserver}=require("../../index")("127.0.0.1","127.0.0.1");

let domserver,jg,jg2;


describe("实例测试",function(){
	this.timeout(15000);
	before(function(){
		domserver=domainserver();

	})
	after(function(){
		domserver.kill();
	})

	beforeEach(function(done){
		let ready=0;

		if(!jg || jg.state=="close"){
			jg=new jigsaw("test");
			jg.getLogger().setLevel("NONE");
			jg.once("ready",()=>{
				setTimeout(()=>{
					if(++ready==2)done();
				},500);
			});
		}
		if(!jg2 || jg2.state=="close"){
			jg2=new jigsaw();
			jg2.getLogger().setLevel("NONE");
			jg2.once("ready",()=>{
				setTimeout(()=>{
					if(++ready==2)done();
				},500);
			})
		}

	})
	afterEach(async function(){
		await jg.close();
		await jg2.close();
		
	});
	
	it("手动关闭能否收到close事件",function(done){
		this.timeout(3000);
	
		jg.once("close",()=>{
			done();
		});
	
		jg.close();
	});
	it("内部socket被关闭后能否收到close事件",function(done){
		this.timeout(3000);
		
		jg.once("close",()=>{
			done();
		});

		jg.sock.close();
	

	})



	it("关闭后传输测试",function(done){
		jg.port("test",()=>({ok:true}));
		jg.close();


		jg2.send("test:test").then((obj)=>{
			done(new Error("仍然收到了信息"))
		}).catch(()=>{
			done();
		}) 	//这里10秒后会抛出超时异常,因为远程的jigsaw早已被关闭

	});
	it("启动后马上关闭,不会发生错误",async function(){
		let j=new jigsaw();
		j.getLogger().setLevel("NONE");
		await j.close();

	})


});


