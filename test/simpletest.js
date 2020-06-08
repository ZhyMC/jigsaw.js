var {domain,jigsaw,webserver}=require("../index.js")("127.0.0.1","127.0.0.1");
//第一个参数为绑定到的网卡IP，第二个参数为Jigsaw域名服务器的IP地址。


domain();
webserver(1793);

var jg=new jigsaw("test");
var sleep=(t)=>new Promise((y)=>setTimeout(y,t));

jg.port("get",(data)=>{
	return {yourdata:data};
})


jg.port("geterror",(data)=>{
	throw new Error("i am a error");
})


jg.port("getasync",async (data)=>{
	await sleep(1000);
	return {msg:"你收到这个回复需要至少1秒.",msg_en:"to recv this reply cost >1s",yourdata:data};
})


console.log("使用浏览器访问 http://127.0.0.1:1793/test/get 测试参数传递显示\n");
console.log("使用浏览器访问 http://127.0.0.1:1793/test/geterror 测试异常传递显示\n");
console.log("使用浏览器访问 http://127.0.0.1:1793/test/getasync 测试异步显示\n");


