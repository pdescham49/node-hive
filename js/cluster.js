
(function() {

  var Cluster = {  
  
    className:'Hive.Cluster',
    cluster:null,
    bIsReady: false,
    isReady: function(){
      return this.bIsReady;
    },
    workers:[],
 
    init: function(){
      Hive.Debug.log("INIT::"+this.className);  
      this.cluster = require('cluster');
    },
 
    prepare: function(){
      Hive.Debug.log("Cluster::prepare()");   
      var that = this;
      Hive.Event.add("HIVE-ClusterStartWorkers",function(oData){
        Hive.Debug.log("EVENT::HIVE-ClusterStartWorkers - Setup Child Workers.");
        
        /*
        * poll the class every 10 seconds and look at the iLastActivityTimeStamp
        *
        */
        var idle = setInterval(function() {          
            // only the workers
            if(!that.cluster.isMaster){            
              var oNow = Date.now();
              var waiting = parseInt((oNow - Hive.iLastActivityTimeStamp) *.001)
              if(waiting > Hive.oConfig.idleTime){
                Hive.isIdle = true;                               
                Hive.iLastIdleTimeStamp = oNow; 
                if(Hive.isIdle && (waiting > Hive.oConfig.workerMaxLifeTime)){
                  Hive.Debug.log("Worker has reached workerMaxLifeTime closing worker.");
                  process.exit(0);
                }
              }
              else
              {
                Hive.isIdle = false;
              }
            }
          },1000);                          
        
        if(that.cluster.isMaster) {
            var numWorkers = require('os').cpus().length;
            var worker = null;        
            Hive.Debug.log('Master cluster setting up ' + numWorkers + ' workers...');

            for(var i = 0; i < numWorkers; i++) {
              worker = that.cluster.fork();                          
              that.workers[i] = worker;                            
            }

            that.cluster.on('online', function(worker) {
              Hive.Debug.log('['+worker.id+'] Worker pid:' + worker.process.pid + ' is online');
            });
            
            that.cluster.on('listening', function(worker) {
              Hive.Debug.log('A worker is now connected');
              
              var oMessageInternal = {
                event:'UpdateMasterID',
                data:Hive.id,       
              };                            
             
              // send message from master to worker
              worker.send(oMessageInternal);
             
            });

            that.cluster.on('disconnect', function(worker) {
              Hive.Debug.log('['+worker.id+'] Worker pid:' + worker.process.pid + ' has disconnected');
            });

            that.cluster.on('exit', function(worker, code, signal) {
              var szLog = '['+worker.id+'] Worker pid:' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal;

              if (worker.suicide === true) {
                szLog = szLog + ' Oh, it was just suicide - no need to worry';
              }              
              
              Hive.Debug.log(szLog);
              
              Hive.Debug.log('Starting a new worker');
              that.cluster.fork();
            });
      
           } 
           else 
           {                         
            Hive.exp.listen(Hive.oConfig.nodePort, function() {
              Hive.Debug.log('Listening from CLUSTER Process ' + process.pid + ' is listening on port: '+Hive.oConfig.nodePort);
              Hive.Event.emit("HIVE-ReadyForConnections",true);
            });
            
            process.on('message', function(msg) {
              Hive.Debug.log('Worker ' + process.pid + ' received message from master.', msg);
              Hive.Event.EmitFromMsg(msg);
            });            
            
          }                        
      });      
      
      this.bIsReady = true;   
    },
 
    SendEventToAllWorkers: function(szEventName,oData){
      Hive.Debug.log("SendEventToAllWorkers");
      var oMessageInternal = {
        event:szEventName,
        data:oData        
      };
      
        for(var i=0;i<this.workers.length;i++){
          Hive.Debug.dir(oMessageInternal);
          this.workers[i].send(oMessageInternal);  
      }
    }
  };
  
  Hive.registerClass(Cluster);
  
}());  