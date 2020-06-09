## Jigsaw.js 文档

### 1.1 简介
  
Jigsaw的中文是拼图的意思，该项目最早来源于一个思考:    
  
> 将一个服务拆分成多个微服务，最重要的是什么。  
  
即服务模块之间的解耦，那么解耦一般都要靠一个消息组件实现，于是Jigsaw就诞生了，专门解决独立服务之间互相调用的问题。  
  
----------
  
①Jigsaw和一般的RPC框架一样，有**生产者**和**消费者**存在，但并不像普通的RPC框架一样繁琐，因为每一个**Jigsaw实例**既是生产者也是消费者。  
  
②Jigsaw想做到调用另一个进程的函数就像是同个作用域的函数一样简单，于是在用法上做了点有趣的设计。  
  
③Jigsaw的一个设计的要求点是可靠性，于是从Node.js的数据报（即UDP协议）开始重新封装一层Jigsaw专用的通信协议。该协议具有丢包自动重发、大包拆分再发、每包必有回应的特性，是一种可靠的协议。于是无需关注内部实现，直接使用它稳定可靠的通信即可。  
  
④Jigsaw存在一个域名服务器，该域名服务器是Jigsaw自己的内部实现，用于映射Jigsaw的名字到具体的网络地址。使用域名服务器可以在互联网上组成一个虚拟的Jigsaw网络。网络内的任何一个Jigsaw实例都可以通过名字访问另一个Jigsaw实例。  

### 1.2 安装
  
在npm项目下执行命令```npm install jigsaw.js --save```  
  
### 1.3 简单实例
  
#### 1.3.1 
  
------------
human.js  
```
let {jigsaw}=require("jigsaw.js")("127.0.0.1","127.0.0.1");

let human=new jigsaw("human");//这是一个jigsaw实例

human.send("gun:shoot",{bullets:10});

```
----------
  
gun.js  
```
let {jigsaw}=require("jigsaw.js")("127.0.0.1","127.0.0.1");

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
//第一个参数指的是需要绑定到的网卡IP地址，一般默认为127.0.0.1表示绑定到本机IP地址，这样的情况下，所有Jigsaw实例只能在本机内任意通信。
//第二个参数指的是domainserver域名服务器所在主机的IP地址。默认是本机。

//这两个参数决定了Jigsaw实例的环境，一般来说，可以互相访问的Jigsaw实例，这两个参数全部都是一样的。

let {fork}=require("child_process");

domainserver();//一个Jigsaw网络内至少要启动一个域名服务器，所有Jigsaw实例都可以使用该域名服务器

webserver(1793);//本行可以不写，本行可以启动一个访问Jigsaw网络的Web服务器。

fork("human.js");
fork("gun.js");

```
  
然后```node index.js```就可以运行该实例了。  
此处只是一个最简单的用法，对于Web应用的复杂用法可以参考分布式架构的设计，之后会在文档中详细说明。  
关于物联网相关的用法，文档之后也会补充。  
  
#### 1.3.2 暂无正文...
  
### 1.4 API 接口
  
### 1.4.1 jigsaw.prototype.constructor(jgname)
  
jigsaw类的构造器，第一个参数是jigsaw的名字，jigsaw的名字是很重要的，可以用来对实例进行命名空间分配，也可以通过名字访问其它jigsaw实例。  

```
let jg = new jigsaw("myjigsaw");
```
  
### 1.4.2 jigsaw.prototype.port(name,func)  
  
为jigsaw实例声明一个接口，第一个参数是接口名，第二个参数是该接口被调用后触发的函数，该函数可以是一个异步函数（async function）。  
  
```
jg.port("add",(a,b)=>{
return a+b;
})

jg.port("addasync",async(a,b)=>{
let sleep=(t)=>new Promise((r)=>setTimeout(r,t));
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

### 1.4.5 jigsaw.prototype.dighole(targetjigsaw)  :  [Promise]

	向目标的jigsaw打一个"洞"，目标jigsaw通过该"洞"可以稳定的访问本jigsaw。  
  
	你可以像这样向"洞"发送数据，就和jigsaw的远程调用方法是一样的  
  
	对于内网的jigsaw实例访问外网的jigsaw实例，若希望通信可以双向畅通无阻，  
	那么应当使用该方法打出一个"洞"，使用该"洞"作为jigsaw的名字进行远程调用。  
  
	若jigsaw实例同在一个内网或者互联网上，则完全不需要使用本方法。  
  
```
	
	jg.port("call",()=>{
			console.log("我被调用了")；
		})；
	
	let hole=await jg.dighole("target");

	jg.send(`${hole}:call`);


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

### 1.5 测试
  
项目文件夹的 ```test``` 目录下有几个测试，可以通过git clone该项目，并使用node运行测试。  
  
分别是：  
  
①```dighole.js``` ： 测试打洞功能。  
②```prefTest.js``` : 500并发性能测试，用于测试jigsaw在大量并发下是否能稳定工作。  
③```simpletest.js``` : 普通的功能测试，例如异常通过网络冒泡的功能。  
④```weblargetest.js``` : 较大的字符串数据（400KB）网页显示测试，用于测试jigsaw的大包自动拆分功能。  
⑤```loadbalanced.js``` : 负载均衡测试，测试各个实例能否随机平分请求。  
⑥```delayStart.js``` : 域名服务器延迟启动测试，用于测试与域名服务器的连接健壮性。  
  
  
   
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



暂无正文...  