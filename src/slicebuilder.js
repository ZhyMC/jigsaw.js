const debug=require("debug")("jigsaw:slicebuilder");
const gc_debug=require("debug")("jigsaw:gc");

class slicebuilder{
	constructor(){
		this.buildings=[];
		this.map={};

		this.expiredTime = 20 * 1000;

		this.gc_counter=0;
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
	checkGarbageCollect(){
		this.gc_counter++;
		if(this.gc_counter>=20){
			this.doGarbageCollect();	
			this.gc_counter=0;
		}
	}
	doGarbageCollect(){
		let newbuildings=[];
		for(let i in this.buildings){
			let token=this.buildings[i];

			if(new Date().getTime() - this.map[token].createTime < this.expiredTime){
				newbuildings.push(token);
			}else 
				delete this.map[token];
			//由于保存的是引用,所以这个数组元素迁移过程几乎不会占用内存
		}

		if(this.buildings.length!=newbuildings.length)
			gc_debug("完成一次垃圾回收,回收前:",this.buildings.length,"回收后:",newbuildings.length);
		this.buildings=newbuildings;

	}
	setPartData(from,id,partid,partmax,data){
		let token=from+id;


		if(this.buildings.length>=1000){
			let sft=this.buildings.shift();
			delete this.map[sft];
		}		
		if(!this.map[token]){
			this.map[token]={partmax,parts:{},createTime:new Date().getTime()};
			/*该请求从创建开始就要保证在20秒内,如果碎片没有被组成,就自动清理,
			否则即使队列有大小限制也会使得内存占用过于庞大,浪费机器的内存资源
			*/

			this.checkGarbageCollect();
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