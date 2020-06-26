class slicebuilder{
	constructor(){
		this.buildings=[];
		this.map={};

	}
	hasBuilding(id){

		if(this.map[id])
			return this.map[id];
		else
			return false;

	}
	getFullData(id){
		let isfull=Object.keys(this.map[id].parts).length==this.map[id].partmax;
		let result=[];
		if(isfull)
		{	
			for(let i=0;i<this.map[id].partmax;i++){
				result[i]=this.map[id].parts[i];
			}
			this.map[id].fulldata=Buffer.concat(result);
			return this.map[id].fulldata;
		}

		return false;
	
	}
	setPartData(id,partid,partmax,data){
		if(this.buildings.length>1000){
			let sft=this.buildings.shift();
			delete this.map[sft];
		}		
		if(!this.map[id]){
			this.map[id]={id,partmax,parts:{}};

			this.buildings.push(id);
		}

		this.map[id].parts[partid]=data;
		this.map[id].partmax=partmax;

		return this.getFullData(id);
	}
}

module.exports=slicebuilder;