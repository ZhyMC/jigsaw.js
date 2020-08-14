const SliceBuilder=require("../../src/slicebuilder");
const assert=require("assert");
let slicebuilder=new SliceBuilder();

describe("SliceBuilder",function(){
	this.timeout(10000);
	it("10000次无法组成整体的碎片添加后,map和buildings长度还是1000",function(){
		for(let i=0;i<10000;i++){
			slicebuilder.setPartData(i+"",":"+i+"","0",1024,Buffer.allocUnsafe(1024));
		}

		assert(slicebuilder.buildings.length==1000,"buildings长度不为1000");
		assert(Object.keys(slicebuilder.map).length==1000,"map长度不为1000");
	});
	it("100000次添加1MB无法组成整体的碎片Buffer后,内存的增加小于1GB",function(){
		let before=(process.memoryUsage().external);

		for(let i=0;i<100000;i++){
			slicebuilder.setPartData(i+"",":"+i+"","0",1024,Buffer.allocUnsafe(1024*1024));
		}
		let after=(process.memoryUsage().external);

		let usage=(after-before)/1024/1024;
		let expect=1000*1024*1024/1024/1024*1.5;

		assert(usage<expect,"内存可能泄露");
	});

	it("1024个1MB碎片可以组成一个1GB的Buffer",function(){
		let ok=false;
		for(let i=0;i<1024;i++){
			ok=slicebuilder.setPartData("test","test",i,1024,Buffer.allocUnsafe(1024*1024));
		}
		assert(ok instanceof Buffer,"无法正确拼接成一个Buffer");
		assert(ok.length==1024*1024*1024,"拼接后的Buffer长度不为1GB");
	})

})