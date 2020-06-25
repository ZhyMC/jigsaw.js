var {domain,jigsaw}=require("../index.js")("127.0.0.1","127.0.0.1");

domain();


var jg=new jigsaw("test");

jg.port("get",obj=>(obj));


var jg2=new jigsaw();



async function startTest(){ //500并发测试
let total=500;
let accepted=0;


	var promises=[];
	for(let i=0;i<total;i++){

		let promise=(async()=>{
			let randomid=Math.random();
			let ret=await jg2.send("test:get",{randomid});
			console.log(ret);
			if(ret.randomid==randomid)
				accepted++;
		})();

		promises.push(promise);

	}

	await Promise.all(promises);
	console.log(`finished, accepted ${accepted} of ${total}`);


}


startTest();


