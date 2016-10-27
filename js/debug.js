
(function() {

  var Debug = {  
  
    className:'Hive.Debug',
    bLogToRabbit:false,
    
    init: function(){
      Hive.Debug.log("INIT::"+this.className);          
    },
 
    log: function(szMsg){ 

      var szOutMsg = this.getMessage(szMsg);
      
      if(Hive.oConfig.debugSTDOut === true){
        console.log(szOutMsg);  
      }
            
      if(this.bLogToRabbit){
        Hive.Alice.sendMessageToChannel(Hive.getConfig().channelDebug,szOutMsg)
      }
      
    },
 
    error: function(szMsg){      
      this.log("ERROR: "+szMsg);
    },

    getMessage:function(szMsg){
      var utc = "";
      
      if(Hive.Util){
       utc = "["+ Hive.Util.dateUTC() + "]"  
      }      
                  
      return "["+Hive.id+"]["+process.pid+"]["+Hive.nodeType+":"+Hive.oConfig.nodePort+"]"+utc+" - "+szMsg;      
    },
 
    sendlogToRabbit:function(bBoolean){
      this.bLogToRabbit = bBoolean;
    },
 
    dir: function(oLog){
      console.dir(oLog);
    }
     
    
  };
  
  Hive.registerClass(Debug);
  
}());  