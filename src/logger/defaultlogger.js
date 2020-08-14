const chalk=require("chalk");
const assert=require("assert");

class DefaultLogger{

	constructor(){
		this.loglevel="ALL";
	}
	setLevel(level){
		assert(["ALL","NONE"].indexOf(level)!=-1,"loglevel not a valid value.")

		this.loglevel=level;
	}
	log(jigsaw,...msg){
		if(this.loglevel=="ALL"){
			console.log(chalk.green(`[JigSaw] `)
				+chalk.yellow(`[${jigsaw}] `) 
				,...msg);
		}
	}

}
module.exports=DefaultLogger;
