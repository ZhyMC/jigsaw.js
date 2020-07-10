class responsemanager{

	constructor(){
		this.responsed=[];
		this.map={};
	}
	getSize(){
		return this.responsed.length;
	}
	hasResponsed(token){

		if(this.map[token])
			return this.map[token];
		else
			return false;

	}
	
	setResponsed(token,data,pending){

		if(this.responsed.length>1000){
			let sft=this.responsed.shift();
			delete this.map[sft];
		}
	
		if(!this.map[token]){
			this.map[token]={pending,data};

			this.responsed.push(token);
		}else{
			this.map[token].data=data;
			this.map[token].pending=pending;
		}


	}
}

module.exports=responsemanager;