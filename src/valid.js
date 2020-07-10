let assert=require("assert");

module.exports={
	sendData:{
		checkValid(o){
			this.checker(o);
		},
		checker(o){
			for(let i in o){
				assert(o[i]!=undefined,`prototype ${i} cannot be undefined`);


				if(typeof(o[i])=="object")
					this.checker(o[i]);
			}
		}
	}
}
