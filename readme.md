##Jigsaw.js 文档

###1.1 简介
  
Jigsaw的中文是拼图的意思，该项目最早来源于一个思考:    
  
> 将一个服务拆分成多个微服务，最重要的是什么。  
  
即服务模块之间的解耦，那么解耦一般都要靠一个消息组件实现，于是Jigsaw就诞生了，专门解决独立服务之间互相调用的问题。  
  
----------
  
①Jigsaw和一般的RPC框架一样，有**消费者**和**生产者**存在，但并不像普通的RPC框架一样繁琐，因为每一个**Jigsaw实例**既是生产者也是消费者。  
  
②Jigsaw想做到调用另一个进程的函数就像是同个作用域的函数一样简单，于是在用法上做了点有趣的设计。  
  
③Jigsaw的一个设计的要求点是可靠性，于是从Node.js的数据报（即UDP协议）开始重新封装一层Jigsaw专用的通信协议。该协议具有丢包自动重发、大包拆分再发、每包必有回应的特性，是一种可靠的协议。于是无需关注内部实现，直接使用它稳定可靠的通信即可。  
  
④Jigsaw存在一个域名服务器，该域名服务器是Jigsaw自己的内部实现，用于映射Jigsaw的名字到具体的网络地址。使用域名服务器可以在互联网上组成一个虚拟的Jigsaw网络。网络内的任何一个Jigsaw实例都可以通过名字访问另一个Jigsaw实例。  

###1.2 安装
  
在npm项目下执行命令```npm install jigsaw.js --save```  
  
###1.3 简单实例
  
####1.3.1 
  
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
let {jigsawdomain,webserver}=require("jigsaw.js")("127.0.0.1","127.0.0.1");
//第一个参数指的是需要绑定到的网卡IP地址，一般默认为127.0.0.1表示绑定到本机IP地址，这样的情况下，所有Jigsaw实例只能在本机内任意通信。
//第二个参数指的是domainserver域名服务器所在主机的IP地址。默认是本机。

//这两个参数决定了Jigsaw实例的环境，一般来说，可以互相访问的Jigsaw实例，这两个参数全部都是一样的。

let {fork}=require("child_process");

jigsawdomain();//一个Jigsaw网络内至少要启动一个域名服务器，所有Jigsaw实例都可以使用该域名服务器

webserver(1793);//本行可以不写，本行可以启动一个访问Jigsaw网络的Web服务器。

fork("human.js");
fork("gun.js");

```
  
然后```node index.js```就可以运行该实例了。  
此处只是一个最简单的用法，对于Web应用的复杂用法可以参考分布式架构的设计，之后会在文档中详细说明。  
关于物联网相关的用法，文档之后也会补充。  
  
####1.3.2 暂无正文...
  
###1.4 API 接口
  
#### 1.4.1 jigsaw.prototype.constructor(jgname)
  
jigsaw类的构造器，第一个参数是jigsaw的名字，jigsaw的名字是很重要的，可以用来对实例进行命名空间分配，也可以通过名字访问其它jigsaw实例。  

```
let jg = new jigsaw("myjigsaw");
```
  
#### 1.4.2 jigsaw.prototype.port(name,func)  
  
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
  
###1.5 负载均衡  
  
暂无正文...  
  
  
###1.6 命名空间  
  
暂无正文...  