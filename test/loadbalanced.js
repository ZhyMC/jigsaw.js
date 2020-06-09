var {domain,jigsaw}=require("../index.js")("127.0.0.1","127.0.0.1");

domain();



async function startTest(){
	await jigsaw.setoption("test",{jgcount:4});
	let jg0=new jigsaw("test");
	let jg1=new jigsaw("test@1");
	let jg2=new jigsaw("test@2");
	let jg3=new jigsaw("test@3");


	let shooted=function(){
		console.log(this.name + " have been shot");
	}
	jg0.port("shoot",shooted.bind(jg0));
	jg1.port("shoot",shooted.bind(jg1));
	jg2.port("shoot",shooted.bind(jg2));
	jg3.port("shoot",shooted.bind(jg3));
	

	let gun=new jigsaw("gun");

	for(let i=0;i<100;i++)
		await gun.send("test:shoot");


}


startTest();

