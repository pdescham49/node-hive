
(function() {

  var Worker = {  
  
    className:'Hive.Worker',

    bIsReady: false,
    init: function(){
      Hive.Debug.log("INIT::"+this.className);      
    },
  
    isReady: function(){
      return this.bIsReady;
    },
         
    prepare: function(){      
      Hive.Debug.log("Worker::prepare()");                                       
                   
      this.bIsReady = true;      
    },

    listen: function(szWorkQueue){
      var that = this;
      Hive.Debug.log("Hive.listen() to: ["+szWorkQueue+"]"); 
      Hive.Alice.listenToWorkQueue(szWorkQueue,function(oData){         
        return that.process(szWorkQueue,oData);
      });
    },
 
    process: function(szQueue,oMessage){
      Hive.Debug.log("Worker.process() message in ["+szQueue+"]");
      switch(szQueue) {
        case "worker::www::ping":          
          return "PONG";
        break;
        case "worker::www::geocode":          
          return "PONG";
        break;
        case "worker::www::postgres":          
          return "PONG";
        break;        
        
      }     
    }
         
  };
  
  Hive.registerClass(Worker);
  
}());  