//定义了jigsaw选项的构成

/*
interfaceip:"指定了jigsaw要绑定在哪个网卡接口上",
port:"指定了jigsaw要绑定在套接字的哪个端口上"

*/


class jigsawoption{
	constructor(interfaceip,domainserver){
		this.interfaceip=interfaceip;
		this.domainserver=domainserver;
	}
	toString(){//把option转为字符串
		return `${this.interfaceip}-${this.domainserver}`;
	}
	serialize(){//序列化
		return Buffer.from(this.toString()).toString("base64");
	}

}

jigsawoption.unserialize=(str)=>{
return jigsawoption.fromString(Buffer.from(str,"base64")+"")

}
jigsawoption.fromString=(str)=>{
let [a,b]=str.split("-");
return new jigsawoption(a,b);

}


module.exports=jigsawoption;
