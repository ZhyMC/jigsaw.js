var {domain,jigsaw}=require("../index.js")("127.0.0.1","127.0.0.1");

domain();


var jg=new jigsaw("test");

jg.port("get",obj=>(obj));


var jg2=new jigsaw();



async function startTest(){ //5000并发测试
let total=5000;
let accepted=0;

await jg2.send("test:get",{});//缓存一下网络地址
console.time("cost");

	var promises=[];
	for(let i=0;i<total;i++){

		let promise=(async()=>{
			let randomid=Math.random();
			let ret=await jg2.send("test:get",{randomid});
			if(!ret)console.log(randomid,"1")
			if(ret.randomid==randomid)
				accepted++;
			else
				console.log(ret.randomid,randomid)
			return ret;
		})();



		promises.push(promise);
	}

	let result=await Promise.all(promises);


console.timeEnd("cost");

	console.log(`finished, accepted ${accepted} of ${total}`);

	if(accepted!=total)
		throw new Error("some reply are incorrect");

}

(async ()=>{
while(true)
await startTest();
})();



//startTest();