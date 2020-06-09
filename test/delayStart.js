var {domain,jigsaw,webserver}=require("../index.js")("127.0.0.1","127.0.0.1");

setTimeout(()=>{
	domain();

},5000);


new jigsaw("test");