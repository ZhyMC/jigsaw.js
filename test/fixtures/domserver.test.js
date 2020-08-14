const {domainserver,jigsaw,webserver}=require("../../index")("127.0.0.1","127.0.0.1");
const sleep=(t)=>new Promise((r)=>setTimeout(r,t));

describe("域名服务器测试",function(){
	this.timeout(80000);
	it("即使关闭了域名服务器,再次启动后也能自动恢复连接",(done)=>{

		let domserver=domainserver();
		let jg,jg2;
		
		jg=new jigsaw("jg");
		jg.getLogger().setLevel("NONE");
		jg.port("get",()=>{
			return {abc:123};
		})
		jg.once("ready",()=>{
			jg2=new jigsaw("jg2");
			jg2.getLogger().setLevel("NONE");
			jg2.once("ready",async ()=>{
				let ret=await jg2.send("jg:get");
				if(ret.abc!=123)
					done(new Error("第一次请求得到了错误应答"))
				else{
					domserver.kill();

					await sleep(30000);
					try{
						await jg2.send("jg:get");
						done(new Error("此时不可能得到应答,却得到了应答"));
					}catch(e){

					}
					domserver=domainserver();
					await sleep(25000);

					let ret2=await jg2.send("jg:get");
					if(ret2.abc==123){
						domserver.kill();
						await jg.close();
						await jg2.close();
						done();
					}
					else
						done(new Error("第二次请求得到了错误应答"));
				}
			});
		})
	})
})