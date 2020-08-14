/*
test.sendtest

该测试用例下会有发送者和接收者，
用于测试几个特殊的情况下工作是否正常

*/

const {domainserver,jigsaw}=require("../../index")("127.0.0.1","127.0.0.1");
const {expect}=require("chai");
const sleep=(time)=>new Promise((resolve)=>setTimeout(resolve,time));

let domserver,jg,jg2;


describe("传输测试",function(){
	this.timeout(40000);
	before(function(){
		domserver=domainserver();

	})
	after(function(){
		domserver.kill();
		if(jg.state=="ready")
			jg.close();
		
		if(jg2.state=="ready")
			jg2.close();
	})

	beforeEach(function(done){
		let ready=0;

		if(!jg || jg.state != "ready"){
			jg=new jigsaw("sender");
			jg.getLogger().setLevel("NONE");
			jg.once("ready",()=>{
				if(++ready==2)done();
			});
		}else{
			if(++ready==2)done();
		}
		if(!jg2 || jg2.state != "ready"){
			jg2=new jigsaw("recver");
			jg2.getLogger().setLevel("NONE");
			jg2.once("ready",()=>{
				if(++ready==2)done();
			})
		}else{
			if(++ready==2)done();
		}

	})
	afterEach(async function(){
		await jg.close();
		await jg2.close();
	});
	it("简单的对象应该能传输",function(done){

		let teststr=Math.random()+"";
		jg2.port("call",(obj)=>{
			if(obj.data != teststr)
				done(new Error("收到的数据并不正确"));
			return obj;
		});

		jg.send("recver:call",{data:teststr}).then((obj)=>{
			if(obj.data != teststr)
				done(new Error("再次收到的数据并不正确"));
			else
				done();
		}).catch(done);
	});


	it("简单的对象延迟3000ms应该能传输",function(done){

		let teststr=Math.random()+"";
		jg2.port("call2",async (obj)=>{

			await sleep(3000);
			if(obj.data != teststr)
				done(new Error("收到的数据并不正确"));
			return obj;

		});

		jg.send("recver:call2",{data:teststr}).then((obj)=>{
			if(obj.data != teststr)
				done(new Error("再次收到的数据并不正确"));
			else
				done();
		}).catch(done);
	});

	it("多层的对象应该能传输",function(done){

		let testobj={
			data:{
				data:{
					random:Math.random()+"",
					extra:"123456"
				},
				extra:"123456"
			},
			extra:"123456"
		};
		jg2.port("call3",async (obj)=>{
			if(obj.data.data.random != testobj.data.data.random)
				done(new Error("收到的数据并不正确"));
			return obj;
		});

		jg.send("recver:call3",testobj).then((obj)=>{
			if(obj.data.data.random != testobj.data.data.random)
				done(new Error("再次收到的数据并不正确"));
			else
				done();
		}).catch(done);
	});

	it("多层的对象,并且有10KB大小的数据应该可以传输",function(done){

		let bufstr=Buffer.allocUnsafe(10*1024).toString("base64");
		let testobj={
			data:{
				data:{
					random:bufstr,
					extra:"123456"
				},
				extra:"123456"
			},
			extra:"123456"
		};
		jg2.port("call4",async (obj)=>{
			if(obj.data.data.random != testobj.data.data.random)
				done(new Error("收到的数据并不正确"));
			return obj;
		});

		jg.send("recver:call4",testobj).then((obj)=>{
			if(obj.data.data.random != testobj.data.data.random)
				done(new Error("再次收到的数据并不正确"));
			else
				done();
		}).catch(done);
	});

	it("丢包率为50%的情况下,同时发送500个包能正常接收",function(done){
		jg2.port("get",(obj)=>{
			return obj;
		});

		jg2.producer.drop_faker={
			enable:true,
			drop_rate:0.5
		}

		let id=Math.random();
		let hasdone=false;
		let succ=0;
		let count=500;
		for(let i=0;i<count;i++){
			jg.send("recver:get",{data:id}).then((o)=>{
				if(o.data==id)
					succ++;
				else
					throw new Error("not a valid response")
				if(succ==count){
					hasdone=true;
					done();
				}
			}).catch((e)=>{
				if(hasdone)return;
				hasdone=true;
				done(e);

			})

		}


	})
	it("在较差的网络环境,大量的发送之后,jigsaw仍然可以正常关闭",function(done){

		let before=0;
		let buf=Buffer.allocUnsafe(10*1024).toString("base64");
		jg2.producer.drop_faker={
			enable:true,
			drop_rate:0.5
		}

		jg2.port("getvalue",(obj)=>{
			return obj;
		});
		let p=(async()=>{
			for(let j=0;j<10;j++){
				if(j==2){
					 before=process.memoryUsage().external;
				}
				let ps=[];
				for(let i=0;i<100;i++){
					ps.push(jg.send("recver:getvalue",{abc:buf}));
				}
				//console.log(await Promise.all(ps));
				await Promise.all(ps);
			}
		await jg2.close();
		await jg.close();
		await sleep(1000);
		})();

		p.then(()=>{

			let after=process.memoryUsage().external;

			if((after-before)/1024/1024>0.5)
				done(new Error("可能内存泄露"));
			else
				done();
		}).catch(done);


	});

	



});

