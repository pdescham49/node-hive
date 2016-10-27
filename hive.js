/* 
node hive.js 3001 www
*/

var oConfig = {  
  couchDB:'http://127.0.0.1:4949',  // the main nginx couchdb 
  nodeType: process.argv[3], // the type of node: worker or www
  nodePort: process.argv[2], // the port for the master node to run on
  useCluster:true, // use clustering
  debugSTDOut:true,
  
  tokenPass: 'This is your super secret password 123456789 <- All your base are belong to us.', // the salt / password in the JWT
  tokenExpiry: 1440, // 24 hours? wait time for a JWT token to expire verify this.. 

  idleTime: 10, // seconds until we will flag the child process as idle. 
  alice:{connection:{host: "localhost", port: 5672}}, // connection to the rabbitMQ cluster

  healthRelayMS: 60000, // the time in ms to send a health message to the relay channels. 
  workerQueuePingMS: 30000, // the time in ms to send a PING to the worker queue  
  
  nodeTypeConfig:{
    www:{
      channelDebug:'www:node:debug', // debug www channel
      channelChild:'www:node:child', // child process channel
      channelMaster:'www:node:master', // master process channel
      workerMaxLifeTime: 86400, // one day - seconds until a worker gracefully kills itself if must be flagged as idle.
      nginxConfigPath:'' // path to the nginx config file
    },
    worker:{
      channelDebug:'worker:node:debug', // debug www channel
      channelChild:'worker:node:child', // child process channel
      channelMaster:'worker:node:master',// master process channel
      workerMaxLifeTime: 86400, // one day - seconds until a worker gracefully kills itself if must be flagged as idle.
      nginxConfigPath:'' // path to the nginx config file
    }
  }  
};

(function(oConfig){
  Hive = {  
    className:'Hive',  
    oConfig:null, // the main config.
    IntervalTimer_CheckReady:null, // an internal timer for Event "IntervalTimer_CheckReady"    
    iLastActivityTimeStamp:null, // the timestamp when the last activity was triggered.
    iLastIdleTimeStamp:null, // the timestamp when the worker was last idle. 
    isIdle:false, // a boolean to determine if the worker is Idle.
    requestCount: 0, // number of requests
    lastRequestDate: null,
    id:null,
    masterID:null, 
    nodeType:null,
    bConnectedToWorkQueue:false,
 
    init: function(oConfig){
   
      var that = this;
      this.oConfig = oConfig;
      this.id = this.nodeID();      
            
      if(this.oConfig.nodeType != undefined){
        this.nodeType = this.oConfig.nodeType;
      }
      else
      {
        this.nodeType = "www";
      }
      
      console.log(this.nodeType+"::INIT::"+this.className);   
                  
      // Internal libs --------------------------------------
      this.oTmp         = require('./js/debug.js'); // this one must be first              
      this.oTmp         = require('./js/util.js');       
      this.oTmp         = require('./js/event.js');  
      this.oTmp         = require('./js/auth.js');      
      this.oTmp         = require('./js/route.js');      
      this.oTmp         = require('./js/couch.js');      
      this.oTmp         = require('./js/message.js');
      this.oTmp         = require('./js/model.js'); 
      this.oTmp         = require('./js/cluster.js');   
      this.oTmp         = require('./js/alice.js'); 
      this.oTmp         = require('./js/worker.js');
      
      // cleanup since the internal libs self register. 
      delete this.oTmp;
      
      // Third party libs -----------------------------------       
      this.fs            = require('fs');
      this.jwt           = require('jsonwebtoken');
      this.bodyParser    = require("body-parser");
      this.cookieParser  = require('cookie-parser');
      this.cookieSession = require('cookie-session');
      this.nanoLib       = require('nano');
      this.expressLib    = require("express");
      this.exp           = this.expressLib();
      this.nano          = this.nanoLib(this.oConfig.couchDB);      
      this.util          = require('util');
      this.eventEmitter  = require("events").EventEmitter;    
//       this.rabbitMQ      = require('amqp');
      this.rabbitMQ_CB   = require('amqplib/callback_api');


      // An event triggered after prepare is complete.
      Hive.Event.add("HIVE-PrepareComplete",function(oData){
                
        // based on the node type we'll send a ping message from www node and have it processed by a worker node. 
        switch(that.nodeType) {
          case "worker":
            Hive.Worker.listen("worker::www::ping");
            Hive.Worker.listen("worker::www::geocode");
            Hive.Worker.listen("worker::www::postgres");
            Hive.Worker.listen("worker::www::couch");
          break;
          
          case "www":
            setInterval(function(){
              Hive.Alice.sendMessageToWorkQueue("worker::www::ping","PING",function(oData){                
                if(oData == "PONG"){
                  Hive.Debug.log("Received: 'PONG' from worker.");
                  that.bConnectedToWorkQueue = true;  
                }                
              });                             
            },Hive.oConfig.workerQueuePingMS);
            
          break;          
        }
      });      
      
      // an event for workers to add their masters id in the main class.
      Hive.Event.add("UpdateMasterID",function(oID){
        Hive.masterID = oID;
      });
      
      /* 
       * 
       * This event is called last when all is ready to receive connections. 
       * Register this node in the public nginx and gracefully restart nginx
       * 
       */
      
      Hive.Event.add("HIVE-ReadyForConnections",function(){ 
        Hive.Debug.sendlogToRabbit(true);  
      });
                 
      Hive.Event.add("HIVE-Prepare",function(oData){        
       // Hive.Debug.log("EVENT::HIVE-Prepare - Node-Hive getting ready.");        
                
        Hive.Auth.prepare();
        Hive.Route.prepare();   
        Hive.Cluster.prepare();
        Hive.Alice.prepare();
        Hive.Worker.prepare();
                
        /* 
         *  Setup an interval timer to wait until all is ready. 
         *  todo: should set a max wait time for this and then send an error message
         */
        
        that.IntervalTimer_CheckReady = setInterval(function() {
          if(Hive.Auth.isReady()    && 
             Hive.Route.isReady()   && 
             Hive.Cluster.isReady() &&
             Hive.Worker.isReady()  &&             
             Hive.Alice.isReady()){

            if(Hive.Cluster.cluster.isMaster){   
                            
              /* 
               * TO DO: look at these incomming messages and preform activities to attach / remove to and from nginx and kill restart workers etc.                
               */
              
              // listen to the Master chanel              
              Hive.Alice.listenToChannel(Hive.getConfig().channelMaster,function(szMessage){          
                Hive.Debug.log(Hive.getConfig().channelMaster+" - "+szMessage);              
              });                
              
              // listen to the Child chanel
              Hive.Alice.listenToChannel(Hive.getConfig().channelChild,function(szMessage){          
                Hive.Debug.log(Hive.getConfig().channelChild+" - "+szMessage);              
              });     
                                  
              // send health ping to master Channel
              Hive.sendHealthRelay(Hive.getConfig().channelMaster);              
            }
            else
            {                    
              // send health ping to worker Channel
              Hive.sendHealthRelay(Hive.getConfig().channelChild);                            
            }
            
            if(Hive.oConfig.useCluster === true){              
              // setup the worker cluster. 
              Hive.Event.emit("HIVE-ClusterStartWorkers",true);                   
            }
            else
            {
              // We're just using the master process.  
              Hive.exp.listen(Hive.oConfig.nodePort, function() {
                Hive.Debug.log('Listening from Master ' + process.pid + ' is listening on port: '+Hive.oConfig.nodePort);

                // emit ReadyForConnections
                Hive.Event.emit("HIVE-ReadyForConnections",true);
              });              
              
            }
            
            // clear the current timer
            clearInterval(that.IntervalTimer_CheckReady); 
            
            // emit prepare-complete
            Hive.Event.emit("HIVE-PrepareComplete",true);
            
          }                    
        }, 1000);              
        
      });
    
      
      // express settings
      this.exp.use(this.bodyParser.urlencoded({ extended: true }));
      this.exp.use(this.bodyParser.json());
      this.exp.use(this.cookieParser());
      this.exp.use(this.cookieSession({
        name: 'session',
        keys: ['key1', 'key2']
      }));                          
      this.exp.set('trust proxy', 1); // trust first proxy               
            
      // Init complete now emit the first Event - Prepare.
      Hive.Event.emit("HIVE-Prepare",true);   
      
    },   
 
    getHealthStats: function(){
      var bMaster = Hive.Cluster.cluster.isMaster;
      var oTmp = {
        type:"HEALTH",
        mastId:Hive.masterID,
        id:Hive.id,
        mast:bMaster,
        pid:process.pid,
        port:Hive.oConfig.nodePort,
        bConWorkQ:Hive.bConnectedToWorkQueue,
        iReq:Hive.requestCount,
        lastReq:Hive.lastRequestDate,
        iIdle:Hive.iLastIdleTimeStamp,
        isIdle:Hive.isIdle

      };      
      return oTmp;
    },
    
    sendHealthRelay : function(szChannel){
      if(this.setHealthRelay != true){
        setInterval(function(){
          var oMessage = Hive.getHealthStats();
          Hive.Alice.sendMessageToChannel(szChannel,JSON.stringify(oMessage));            
        },Hive.oConfig.healthRelayMS);   
        
        this.setHealthRelay = true;        
      }
      
    },
 
    nodeID: function () {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return s4() + "-" + new Date().getTime();
    },
        
    getConfig:function(){
      return Hive.oConfig.nodeTypeConfig[Hive.nodeType];
    },
 
    registerClass: function(oClass){
      var szClassName = oClass.className;  
      var aString = szClassName.split("."); 
      this[aString[1]] = oClass;
      this[aString[1]].init();
    }
            
  };
  
  Hive.init(oConfig);
 
}(oConfig));  
