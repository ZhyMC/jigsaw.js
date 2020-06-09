let {jigsaw,domainserver,webserver}=require("../index.js")("127.0.0.1","127.0.0.1");
 domainserver();
 webserver(80);


 let accounts=[];

let jg=new jigsaw("account");

jg.port("register",({username,password})=>{
 	let userid=accounts.length;
	accounts[userid]={userid,username,password,token:""};

	return {error:false,msg:`注册成功!你的账号是:${userid}`}

});

jg.port("login",({userid,password})=>{
	if(!accounts[userid])return {error:true,msg:"系统中不存在该账户"};


	if(accounts[userid].password == password){
		let token=Math.random()+"";
		accounts[userid].token=token;

		return {error:false,msg:`登录成功!欢迎你,${accounts[userid].username},你的登录态令牌:${token}`}
	}else
		return {error:true,msg:"登录失败,密码错误!"};

})

