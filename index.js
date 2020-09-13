const jigsaw=require("./src/jigsaw");
const Jgenv=require("./src/jigsawenv");
const Mapper=require("./src/builtin/mapper/mapper");
const Mapping=require("./src/builtin/mapper/mapping");
const fork=require("child_process").fork;


module.exports=(a,b)=>{


	let jgenv=new Jgenv(a,b);

	function newJigsawInstance(name,options){
		return new jigsaw(name,new Jgenv(a,b),options);
	}
	newJigsawInstance.setoption=(name,option)=>{
		return jigsaw.setoption(name,option,new Jgenv(a,b));
	};

	function startDomainServer(){
		return fork(__dirname+"/src/domain/domainserver.js");
	}
	function startWebServer(port,cert){
		return fork(__dirname+"/src/builtin/jigsawWebServer.js",[jgenv.serialize(),port,cert?JSON.stringify(cert):"{}"])
	}
	function setJigsawOption(name,option){
		jigsaw.setoption(name,option);
	}
	function createMapper(){
		return new Mapper(jgenv);
	}
	function createMapping(jg,mapname){
		return new Mapping(jg,mapname);
	}

	return {

			jigsaw:newJigsawInstance,
			domainserver:startDomainServer,
			domain:startDomainServer,
			webserver:startWebServer,
			setjigsawoption:setJigsawOption,
			mapper:createMapper,
			mapping:createMapping
	}


};
