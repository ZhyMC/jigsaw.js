//定义了jigsaw选项的构成

/*
entry:"指定了jigsaw要绑定在哪个网卡接口上",
domainserver:"指定了jigsaw网络的域名服务器"

*/


class jgenv{
	constructor(entry,domainserver){
		this.entry=entry;
		this.domainserver=domainserver;
	}
	toString(){//把option转为字符串
		return `${this.entry}-${this.domainserver}`;
	}
	serialize(){//序列化
		return Buffer.from(this.toString()).toString("base64");
	}

}

jgenv.unserialize=(str)=>{
return jgenv.fromString(Buffer.from(str,"base64")+"")

}
jgenv.fromString=(str)=>{
let [a,b]=str.split("-");
return new jgenv(a,b);

}


module.exports=jgenv;
