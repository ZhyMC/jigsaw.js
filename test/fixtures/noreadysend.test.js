
var {domainserver,jigsaw,webserver}=require("../../index")("127.0.0.1","127.0.0.1");


describe("测试实例在未进入ready态之前",function(){
	it("jigsaw未ready但发送数据",function(done){
		let jg=new jigsaw();
		jg.getLogger().setLevel("NONE");
		jg.send("testjg:theport",{data:123}).catch(()=>{
			done();
		});
		jg.close();
	})


});