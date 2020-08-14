const {domainserver,jigsaw}=require("../../index.js")("127.0.0.1","127.0.0.1");
const sleep = (t) =>new Promise((y) =>setTimeout(y, t));
const assert=require("assert");

let domserver;


describe("打洞功能模拟测试",function(){
	this.timeout(10000);
	before(function(){
		domserver=domainserver()
	});
	it("本地打洞测试,返回地址应该存在并且能传输数据",async function(){
		let internet=new jigsaw("internet");
		internet.getLogger().setLevel("NONE");

		let lan=new jigsaw("lan");
		lan.getLogger().setLevel("NONE");
		
		lan.port("get",(obj)=>(obj));
		lan.dighole("internet");

		await sleep(3000);
		let addr=internet.plugins["jigsawHoleDigger"].holes_recv["lan"];

		if(!addr){
			await internet.close();
			await lan.close();

			throw new Error("返回地址不存在")
		}


		await new Promise((resolve,reject)=>{
			if(internet.state=="ready")
				internet.send("lan:get",{abc:123}).then((o)=>{
					if(o.abc==123)
						resolve();
					else
						reject("传输的回复不正确");
				})		
			else
				internet.once("ready",()=>{
					internet.send("lan:get",{abc:123}).then((o)=>{
						if(o.abc==123)
							resolve();
						else
							reject("传输的回复不正确");

					})
				})

		})

		await internet.close();
		await lan.close();



	});
	after(function(){
		domserver.kill();
	})

});