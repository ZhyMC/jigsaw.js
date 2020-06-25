class plugin{
	constructor(cls){
		this.cls=cls;
	}
	getInfo(){
		return this.cls.info;
	}
	getName(){
		return this.getInfo().name;
	}
	getInstance(jigsaw){
		return new (this.cls)(jigsaw);
	}
}


module.exports=plugin;
