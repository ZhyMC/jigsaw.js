let chalk=require("chalk");

module.exports={
	log(jigsaw,msg){
		console.log(chalk.green(`[JigSaw] `)
			+chalk.yellow(`[${jigsaw}] `) 
			+chalk.white(`${msg}`));
	}


}
