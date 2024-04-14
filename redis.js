// const config= require("./config");
// const redis = require("redis");
// const client = redis.createClient(config.REDIS.PORT);


// class RedisClient {
//     setNewValue(key,value){
//         client.ping((err,data)=>{
//             console.log(data);
//         })
//         client.set("usman",JSON.stringify({"name":"usman","fname":"maqbool"}),()=>{
//             console.log("data saved");
//         })
//     }
//     getValue (key){
        
//         client.get("usman",(err,data)=>{
//             console.log("[usman]",JSON.parse(data));
//         })
//     }
// }

// module.exports=new RedisClient();