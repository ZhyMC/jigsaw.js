var {domain,jigsaw,webserver}=require("../index.js")("127.0.0.1","127.0.0.1");

domain();


let jg=new jigsaw("test");

let jg2=new jigsaw();

jg2.port("call",(data)=>data);
jg2.ready().then(async ()=>{

	let hole=await jg2.dighole("test");
	console.log("hole digged",hole,"\n");

	console.log(await jg2.send(`${hole}:call`,{msg:"这个消息是通过打洞发送的",msg_en:"this message is sent through the hole"}));


})
