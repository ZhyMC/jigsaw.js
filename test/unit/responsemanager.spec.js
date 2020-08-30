
const ResponseManager=require("../../src/responsemanager");
const assert=require("assert");
let responsemanager=new ResponseManager();

describe("ResponseManager",function(){

	this.timeout(30000);
	it("10000次添加后,map和responsed长度还是1000",function(){
		for(let i=0;i<10000;i++){
			responsemanager.setResponsed(i+"",null,true);
		}
		assert(responsemanager.responsed.length==1000 && responsemanager.getSize() == 1000,"responsed长度不为1000");
		assert(Object.keys(responsemanager.map).length==1000,"map长度不为1000");
	});
	it("100000次添加1MB的Buffer后,内存的增加小于1GB",function(){
		let before=(process.memoryUsage().external);

		for(let i=0;i<100000;i++){
			responsemanager.setResponsed(i+"",Buffer.allocUnsafe(1024*1024),true);
		}
		let after=(process.memoryUsage().external);

		let usage=(after-before)/1024/1024;
		let expect=1000*1024*1024/1024/1024*1.5;

		assert(usage<expect,"内存可能泄露");
	});

})
