const debug=require("debug")("jigsaw:responsemanager");
const gc_debug=require("debug")("jigsaw:gc");

class responsemanager{

	constructor(){
		this.responsed=[];
		this.map={};
		this.expiredTime = 20 * 1000;

		this.gc_counter=0;
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
	checkGarbageCollect(){
		this.gc_counter++;
		if(this.gc_counter>=20){
			this.doGarbageCollect();	
			this.gc_counter=0;
		}
	}
	doGarbageCollect(){
		let newresponsed=[];
		for(let i in this.responsed){
			let token=this.responsed[i];

			if(new Date().getTime() - this.map[token].createTime < this.expiredTime){
				newresponsed.push(token);
			}else
				delete this.map[token];
			
			//由于保存的是引用,所以这个数组元素迁移过程几乎不会占用内存
		}
		if(this.responsed.length!=newresponsed.length)
			gc_debug("完成一次垃圾回收,回收前:",this.responsed.length,"回收后:",newresponsed.length);
		this.responsed=newresponsed;
	}

	setResponsed(token,data,pending){

		if(this.responsed.length>=1000){
			let sft=this.responsed.shift();
			delete this.map[sft];
		}
	
		if(!this.map[token]){
			this.map[token]={pending,data,createTime:new Date().getTime()};
			this.checkGarbageCollect();

			this.responsed.push(token);
		}else{
			this.map[token].data=data;
			this.map[token].pending=pending;
		}


	}
}

module.exports=responsemanager;