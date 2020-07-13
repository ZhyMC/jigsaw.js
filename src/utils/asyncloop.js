var sleep=(t)=>new Promise((y)=>setTimeout(y,t));

class asyncloop{
	constructor(timelen,timeunit,endCondi,callback){
		if(!timelen)timeunit=20*1000;
		if(!timeunit)timeunit=1000;

		this.timelen=timelen;
		this.timeunit=timeunit;
		this.endCondi=endCondi;
		this.callback=callback;

	}
	start(){
		this.loop();
	}
	async loop(){
		let timecount=0;
		while(!this.endCondi()){

			await sleep(this.timeunit);
			timecount+=this.timeunit;
			if(timecount>this.timelen){
				await this.callback();

				timecount=0;
			}


		}
	}

}

module.exports=asyncloop;