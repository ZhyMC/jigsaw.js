## Jigsaw.js 文档

### 1.1 简介
  
Jigsaw的中文是拼图的意思，该项目最早来源于一个思考:    
  
> 将一个服务拆分成多个微服务，最重要的是什么。  
  
服务模块之间的解耦要靠一个消息组件实现，于是Jigsaw就诞生了，专门解决独立服务之间互相调用的问题。  
  
----------

#### 1.1.1 特性
  
①Jigsaw和一般的RPC框架一样，有**生产者**和**消费者**存在，但并不像普通的RPC框架一样繁琐，因为每一个**Jigsaw实例**既是生产者也是消费者。  
  
②Jigsaw想做到调用另一个进程的函数就像是同个作用域的函数一样简单，于是在用法上做了点有趣的设计。  
  
③Jigsaw的一个设计的要求点是可靠性，于是从Node.js的数据报（即UDP协议）开始重新封装一层Jigsaw专用的通信协议。该协议具有丢包自动重发、大包拆分再发、每包必有回应的特性，是一种可靠的协议。于是无需关注内部实现，直接使用它稳定可靠的通信即可。  
  
④Jigsaw存在一个域名服务器，该域名服务器是Jigsaw自己的内部实现，用于映射Jigsaw的名字到具体的网络地址。使用域名服务器可以在互联网上组成一个虚拟的Jigsaw网络。网络内的任何一个Jigsaw实例都可以通过名字访问另一个Jigsaw实例。  

⑤Jigsaw自动管理连接，保证连接之间的健壮性，即使某个计算机发生崩溃导致Jigsaw实例被关闭，也会在下次打开的时候无缝的重新接入Jigsaw网络。

### 1.2 安装
  
在npm项目下执行命令```npm install jigsaw.js --save```  
  
### 1.3 简单实例
  
#### 1.3.1 
  
------------
human.js  
```
const {jigsaw}=require("jigsaw.js")("127.0.0.1","127.0.0.1");

let human=new jigsaw("human");//这是一个jigsaw实例

human.send("gun:shoot",{bullets:10});

```
----------
  
gun.js  
```
const {jigsaw}=require("jigsaw.js")("127.0.0.1","127.0.0.1");

let gun=new jigsaw("gun");

gun.port("shoot",({bullets})=>{

    for(let i=0;i<bullets;i++)
        console.log("shoot!");
        
return {msg:`我已经发射了${bullets}颗子弹`}；
})
```
---------
index.js  
```
let {domainserver,webserver}=require("jigsaw.js")("127.0.0.1","127.0.0.1");
//第一个参数指的是能访问该实例的网络入口地址，一般默认为127.0.0.1则表示其他实例可以通过127.0.0.1这个地址访问该实例，
	这样的情况下，所有Jigsaw实例只能在本机内任意通信。

//第二个参数指的是domainserver运行了域名服务器的主机的IP地址,默认可以是本机，一个域名服务器决定了一个完整的作用区域。

//这两个参数决定了Jigsaw网络，一般来说，可以互相访问的Jigsaw实例，这两个参数全部都是一样的。

const {fork}=require("child_process");

domainserver();//一个Jigsaw网络内至少要启动一个域名服务器，所有Jigsaw实例都可以使用该域名服务器

webserver(1793);//本行可以不写，本行可以启动一个访问Jigsaw网络的Web服务器。
mapper();//启动一个映射器，会在网络内启动一个名叫Mapper的jigsaw实例，用于处理其他网络映射到该网络的请求。


fork("human.js");
fork("gun.js");

```
  
然后```node index.js```就可以运行该实例了。  
此处只是一个最简单的用法，对于Web应用的复杂用法可以参考分布式架构的设计，之后会在文档中详细说明。  
关于物联网相关的用法，文档之后也会补充。  
  
#### 1.3.2 简单的 Web应用 接口服务器

该文件在```examples/simpleaccount.js```
```
const {jigsaw,domainserver,webserver}=require("../index.js")("127.0.0.1","127.0.0.1");

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

```
用```node simpleaccount.js```启动后。    
     
可以通过     
     
```http://127.0.0.1/account/register?username=testuser&password=123```     
     
```http://127.0.0.1/account/login?userid=0&password=123```  

进行测试  
  

---------------------
### 1.4 API 接口
  
### 1.4.1 jigsaw.prototype.constructor(jgname)
  
jigsaw类的构造器，第一个参数是jigsaw的名字，jigsaw的名字是很重要的，可以用来对实例进行命名空间分配，也可以通过名字访问其它jigsaw实例。  

```
let jg = new jigsaw("myjigsaw");
```
  
### 1.4.2 jigsaw.prototype.port(name,func)  
  
为jigsaw实例声明一个接口，第一个参数是接口名，第二个参数是该接口被调用后触发的函数，该函数可以是一个异步函数（async function）。  
  
```
const sleep=(t)=>new Promise((r)=>setTimeout(r,t));

jg.port("add",(a,b)=>{
	return a+b;
})

jg.port("addasync",async(a,b)=>{
	await sleep(1000);
	return a+b;
})
```
  
### 1.4.3 jigsaw.prototype.send(path,data)  : [Promise]
  
对指定的路径的jigsaw实例的一个接口进行一次远程调用。  
其中第一个参数是路径，第二个参数是传递的数据，该参数必须是一个对象。  
若该参数是undefined或者不填，则相当于是传递了空对象```{}```。  
  
返回值是一个Promise，会直接返回远程调用的结果。（如果该结果为空，则一定是null）

路径的格式由 jigsaw名 + 冒号 + 接口名 组成。  
```
jg.send("gun:shoot",{bullets:10});

jg.send("app.database:select",{sheet:"users",id:233});
```

### 1.4.4 jigsaw.prototype.handle(obj) 
  
该方法可以批量定义接口。就像这样：  
  

```
jg.handle({
    shoot(){
    
    },
    async reload(){
    
    }
})

```
  
还可以这样：  
```
jg.handle((portname,data)=>{

	console.log(`${portname}接口收到了数据`,data);

})

```

### 1.4.5 jigsaw.prototype.dighole(targetjigsaw)  :  [Promise]  **过时的**

	向目标的jigsaw打一个"洞"，之后目标jigsaw可以直接访问本jigsaw。  
  
	对于内网的jigsaw实例访问外网的jigsaw实例，若希望通信可以双向畅通无阻，  
	那么应当使用该方法打出一个"洞"。  
    
	若jigsaw实例同在一个内网或者互联网上，则完全不需要使用本方法。  
    
  	**[请注意，该方法已经过时，在之后的版本随时会移除该方法，请使用Mapper及Mapping替代]**

```

//下面的代码的执行环境可以是可以访问互联网的局域网

	let lan = new jigsaw("LAN");
	lan.port("call",()=>{
			console.log("我被调用了")；
		})；
	
	lan.dighole("INTERNET");


//下面的代码的执行环境可以是互联网

	let internet = new jigsaw("INTERNET");
	internet.send(`LAN:call`);

```
### 1.4.6 jigsaw.setoption(jgname,option) : [Promise] 

对特定的jigsaw名进行配置选项，该配置会一直保存在域名服务器上。  
该选项对象中有如下属性  
  
①jgcount  
  
若一个jigsaw名被设置了jgcount选项，那么下一次从域名服务器查询该jigsaw实例的网络地址时，
会分别从好几个jigsaw实例中随机选择一个网络地址并返回。  
   
该功能用途主要是负载均衡。  
  
例如一个实例的名字是```ticket```，并设置了jgcount属性为4  
  
那么下次任何实例访问该实例的时候，域名服务器都会从以下这4个名字中随机选择一个地址返回  
  
```
ticket
ticket@1
ticket@2
ticket@3
```
这样流量被分流到了4个jigsaw实例上，由他们共同分担并承受压力。配合数据库可以实现解决了c10k问题的web应用。  
  
该方法是一个静态方法，用法应当是  
```
await jigsaw.setoption("ticket",{jgcount:4});
```
### 1.4.7 jigsaw.prototype.close()
  
直接关闭 jigsaw 实例，jigsaw内部的套接字实例、保持连接的域名客户端也会因此被关闭。  
  

### 1.4.8 mapper()
    
mapper函数可以通过这样的方式取出并使用    
    
```
const {mapper} = require("jigsaw.js")(entry,domainserver);
let ins = mapper();
```
    
调用Mapper函数后，会启动一个并返回映射器实例，该实例会维护一个映射池，    
允许内网或者其它网络的Jigsaw实例在本网络内存在一个副本Jigsaw实例。    
    
向副本Jigsaw实例发送数据则相当于直接向原Jigsaw实例发送数据。    
    
### 1.4.9 mapping(jigsaw)
    
mapping函数可以通过这样的方式取出并使用    
    
    
lan.js
```
const {jigsaw,mapping} = require("jigsaw.js")(null,"internet.com");

let LAN=new jigsaw("LAN");
mapping(LAN);

LAN.port("whoareyou",()=>{
	return "i am LAN";
});
```
    
之后目标的网络，（指的是entry以及domainserver一起组成的jigsaw网络，可能是一个在互联网上的jigsaw网络）。    
可以随意穿过内网和外网的限制任意访问该LAN代表的jigsaw实例。    
    
注意这里entry设置为null，则代表该LAN没有任何网络入口可以访问，则不会向域名服务器请求注册自己的网络地址。    
因为LAN是在局域网的，在外部没有网络入口可以访问的到。之后再使用Mapping将其映射到公网的网络上。    
    
注意lan.js一般是在局域网运行的，下面这个例子是在互联网上运行的，将演示互联网上如何访问已经被mapping的jigsaw实例。    
    
internet.js
```
const {jigsaw,domainserver,mapper} = require("jigsaw.js")("internet.com","internet.com");

domainserver();//启动一个域名服务器
mapper();//启动一个映射器用于接收来自局域网的映射请求

let jg = new jigsaw("internet");//创建一个在互联网上的jigsaw实例

setInterval(()=>{
	jg.send("LAN:whoareyou").then(console.log);//尝试直接调用局域网的jigsaw
},5000);

```

------------------
### 1.5 测试
  
```
本项目可以通过 mocha 框架进行测试,
在项目目录下直接运行

npm test

即可开始测试
```
```
另外，你还可以检查测试用例的覆盖率
在项目目录下直接运行

npm run cov

即可得到覆盖率报告
```
  
  
   
### 2.1 负载均衡 与 网络IO

一般来说一个分布式系统的负载均衡的实现应当在RPC框架上。所以jigsaw实现了基本的负载均衡。   

jigsaw实例可以存在在进程上，那么如果启动多个进程，使用了```jigsaw.setoption```方法使得域名服务器开始对请求分流。各个进程就可以等量的处理流量。   

因为要保证数据的唯一性，传统的负载均衡应用实现都要依赖数据库。   

理想的分布式系统是没有系统之间进行数据交换的成本的，也就是说，RPC框架之间进行通信的需要的时间和空间几乎为0. 那么理论上任何系统都可以无限拓展，不受性能的约束。    

但是现实并不是这样的，RPC框架进行一次数据交换，一般靠的是操作系统提供的套接字接口。那么网络IO就需要占用一定的时间。任何分布式系统的设计都应当考虑进去这一点。对于一个方法需要大量远程调用的请求应当重新考虑设计。    

由于Jigsaw基于node.js，并且场景为IO密集型，并且是异步IO，所以网络IO的性能是较好的，这也是选择在node.js下开发一款RPC框架的原因。  

  
### 2.2 推荐的命名规范
    
  一般来说，对Jigsaw实例的命名（即构造器的第一个参数）可以参考这样的规范。  
  
 ①使用命名空间  
  
 	可以按照功能从命名上对Jigsaw实例进行分组。  
  
 	例如这样使用点符号作为命名空间  

 ```
 app.auth //应用的认证层入口,用于鉴权等

 app.database //应用的数据库中间件层
 app.ticket //应用的订单层
 app.account //应用的账户管理层

 app.interface.ticket //应用的订单接口
 app.interface.register //应用的注册接口
 ```
  
  
Jigsaw实例的命名并不会影响到Jigsaw的使用，事实上，大部分字符都可以作为名字。  

②适当的时候可以匿名  

```
let jg=new jigsaw();
```
像这样创建一个jigsaw实例，那么该jigsaw实例被称作匿名jigsaw实例。  

一般这种实例并不设置接受远程调用的接口，当然要设置也是可以的。  
但只能通过打洞的方式进行访问。  

--------------------

### 2.3 内网穿透与映射器
    
Mapper和Mapping用于解决内网穿透的问题，由于需求频率高，所以直接嵌入了jigsaw.js的实例内部。    
原理是将内网的jigsaw实例直接映射到外网的jigsaw网络内，使得部署jigsaw实例十分的方便。    
       
只要服务器启动了一个Mapper，那么随意在局域网下mapping一个jigsaw实例，之后mapping会自动维护与mapper的连接。     
使得被mapping的该jigsaw实例直接会成为远端服务器内的一个等效的jigsaw实例，所有网络好似串联在一起一样。       
