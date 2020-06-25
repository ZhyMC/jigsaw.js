var {domain,jigsaw,webserver}=require("../index.js")("127.0.0.1","127.0.0.1");

domain();


let internet=new jigsaw("INTERNET");

let lan=new jigsaw("LAN");

lan.port("call",(data)=>data);

lan.dighole("INTERNET").then(async()=>{
	let data=await internet.send("LAN:call",{msg:"这个消息是通过打洞发送的"});
	console.log(data);
});
