var {domain,jigsaw,webserver}=require("../index.js")("127.0.0.1","127.0.0.1");


domain();
webserver(1793);


var jg=new jigsaw("test");

jg.handle({
	getlarge(data){//大字符串传输

		let timestart=new Date().getTime();
			
			let str=data.string;
			if(!str)str="test";
			let largeText=str.repeat(102400);

		let timecost=new Date().getTime()-timestart;

		return {length:largeText.length,timecost:`${timecost}ms`,largeText};

	}
});


console.log("使用浏览器访问 http://127.0.0.1:1793/test/getlarge 进行本测试\n");
console.log("Access [http://127.0.0.1:1793/test/getlarge] to start the test\n");

