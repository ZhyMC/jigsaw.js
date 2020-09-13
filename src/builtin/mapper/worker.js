const assert=require("assert");
const jigsaw=require("../../jigsaw");

function getOption(){
	try{
		let raw=Buffer.from(process.argv[2],"base64").toString();
		let option=JSON.parse(raw);
		return option;
	}catch(err){
		throw new Error("读取配置的过程中发生了异常");
	}

}
function start(){
	let option=getOption();
	assert(option.entry,"jigsaw网络入口必须被指定");
	assert(option.domserver,"jigsaw网络域名服务器必须被指定");
	assert(option.jgname,"jigsaw名字必须被指定");

//	assert(option.tojgname,"目标的jigsaw名字必须被指定");

	let jg=new jigsaw(option.jgname,{entry:option.entry,domainserver:option.domserver});

	jg.handle((portname,data)=>{
		let targetPath=`${option.jgname}:${portname}`;

		return jg.send(`Mapper:call`,{path:targetPath,data});
	});
	jg.on("ready",()=>{
		console.log(`[Jigsaw-Mapper] worker:${option.jgname} -> Mapper 已启动`)
	})

}
start();