class responsemanager{

	constructor(){
		this.responsed=[];
		this.map={};
	}
	getSize(){
		return this.responsed.length;
	}
	hasResponsed(id){

		if(this.map[id])
			return this.map[id];
		else
			return false;

	}
	
	setResponsed(id,data,pending){
		if(this.responsed.length>1000){
			let sft=this.responsed.shift();
			delete this.map[sft];
		}
	
		if(!this.map[id]){
			this.map[id]={pending,data};

			this.responsed.push(id);
		}else{
			this.map[id].data=data;
			this.map[id].pending=pending;
		}


	}
}

module.exports=responsemanager;