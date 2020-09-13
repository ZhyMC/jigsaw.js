const util=require("util");
const sleep=util.promisify(setTimeout);
const assert=require("assert");

class Mapping{
	constructor(jg,mapname){
		assert(jg,"jg 必须是一个jigsaw实例")

		this.jg=jg;

		this.mapname=mapname || this.jg.name;

		this.res_count=0;

		this.state="close"; //close closing ready
		this._startloop();
	}
	async _startloop(){
		this._addRes();
		this.state="ready";
		await sleep(2000);
		while(this.state=="ready"){
			try{
				await this._updateOnce();
			}catch(err){
				//console.error(err);
			}

			await sleep(10000);
		}
		this._delRes();
	}
	_updateOnce(){
		return this.jg.send(`Mapper:ensure`,{jgname:this.mapname})
	}
	_addRes(){
		this.res_count++;
	}
	_delRes(){
		this.res_count--;
		if(this.state=="closing")
			this.state="close";
	}	
	close(){
		if(this.state=="close")
			return;

		if(this.state=="ready"){
			this.state="closing";
			return;
		}
	}

}


//new Mapping();

module.exports=Mapping;