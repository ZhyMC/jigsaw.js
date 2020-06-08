let dgram=require("dgram");
let findUdpPort = require('pick-port');

module.exports = async function (){
        let s=dgram.createSocket({type:"udp4",reuseAddr:false});
        let port=await findUdpPort({
                 minPort: 10000,
             maxPort: 40000,
             ip:"0.0.0.0",
             type:"udp"
        });
        s.bind(port);
        return s;
}

