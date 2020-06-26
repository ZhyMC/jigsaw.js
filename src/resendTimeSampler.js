class resendTimeSampler{
	constructor(){
		this.best=500;
		
		this.offset=100;
		this.min=10;

		this.testloops=1000;
		this._loops=0;

		this.test={
			value:0,
			start:0,
			laststart:0,
			lastdelta:0,
			end:0,
			testing:false
		}
	}
	needEnd(){


		if(this._loops++>=this.testloops){
			this._loops=0;
			return true;
		}
		return false;
	}
	getTestValue(){
		let v=this.best-((Math.random()-0.5)*this.offset);
		if(v<this.min)v=this.min;
		return v;

	}
	endTest(data){
		if(!this.test.testing)return;
		
		this.test.end=data;

		this.handleTest();
		this.test.testing=false;
	}
	handleTest(){
		this.test.lastdelta=this.test.end-this.test.start;

		if(this.test.end<this.test.start){
			this.best=this.test.value;

		}
	}
	startTest(data){
		if(this.test.testing)return this.test.value;

		this.test.laststart=this.test.start;

		this.test.start=data;
		this.test.testing=true;

		this.test.value=this.getTestValue();

		return this.test.value;
	}


}

module.exports=resendTimeSampler;