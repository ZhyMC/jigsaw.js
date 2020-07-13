class slicebuilder{
	constructor(){
		this.buildings=[];
		this.map={};

	}
	hasBuilding(token){

		if(this.map[token])
			return this.map[token];
		else
			return false;

	}
	removeBuilding(token){
		let loc=this.buildings.indexOf(token);
		this.buildings.splice(loc,1);
		delete this.map[token];
	}
	getFullData(token){
		let isfull=Object.keys(this.map[token].parts).length==this.map[token].partmax;
		let result=[];
		if(isfull)
		{	
			for(let i=0;i<this.map[token].partmax;i++){
				result[i]=this.map[token].parts[i];
			}
			this.map[token].fulldata=Buffer.concat(result);
			let ret=this.map[token].fulldata;

			this.removeBuilding(token);

			return ret;
		}

		return false;
	
	}
	setPartData(from,id,partid,partmax,data){
		let token=from+id;


		if(this.buildings.length>1000){
			let sft=this.buildings.shift();
			delete this.map[sft];
		}		
		if(!this.map[token]){
			this.map[token]={partmax,parts:{}};

			this.buildings.push(token);
		}

//		if(this.map[token].parts[partid])
//			throw new Error("multi time set part data")

		this.map[token].parts[partid]=data;
		this.map[token].partmax=partmax;

		return this.getFullData(token);
	}
}

module.exports=slicebuilder;