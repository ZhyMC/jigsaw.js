let jigsaw=require(__dirname+"/src/jigsaw.js");
let jgenv=require(__dirname+"/src/jigsawenv.js");
let fork=require("child_process").fork;


module.exports=(a,b)=>{


	let jgo=new jgenv(a,b);

	function newJigsawInstance(name,options){
		return new jigsaw(name,new jgenv(a,b),options);
	}
	newJigsawInstance.setoption=(name,option)=>{
		return jigsaw.setoption(name,option,new jgenv(a,b));
	};

	function startDomainServer(){
		return fork(__dirname+"/src/domain/domainserver.js");
	}
	function startWebServer(port,cert){
		return fork(__dirname+"/src/builtin/jigsawWebServer.js",[jgo.serialize(),port,cert?JSON.stringify(cert):"{}"])
	}
	function setJigsawOption(name,option){
		jigsaw.setoption(name,option);
	}

	return {

			jigsaw:newJigsawInstance,
			domainserver:startDomainServer,
			domain:startDomainServer,
			webserver:startWebServer,
			setjigsawoption:setJigsawOption

	}


};
