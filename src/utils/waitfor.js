var sleep=(t)=>new Promise((y)=>setTimeout(y,t));
module.exports=async (func)=>{
	while(true){
		if(func())return;
		await sleep(100);
	}
}