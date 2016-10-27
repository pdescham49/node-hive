(function() {

  var Alice = {  
  
    className:'Hive.Alice',
    nodeID: null,
    connection_CB:null,
    bIsReady: false,

    isReady: function(){
      return this.bIsReady;
    },
 
    init: function(){
      Hive.Debug.log("INIT::"+this.className);          
    },
 
    prepare: function(){  
      Hive.Debug.log("Alice::prepare()");   
      var that = this;
      if(this.nodeID == null){
        this.nodeID = Hive.Util.nodeID();
      }
      
      Hive.rabbitMQ_CB.connect('amqp://'+Hive.oConfig.alice.connection.host, function(err, connection) {                        
        that.connection_CB = connection;     
        that.bIsReady = true;
      });
                                                                   
    },
 
    sendMessageToChannel:function(szExchangeName,szMessage){      
      this.connection_CB.createChannel(function(err, ch) {
        ch.assertExchange(szExchangeName, 'fanout', {durable: false, exclusive:false });
        ch.publish(szExchangeName, '', new Buffer(szMessage));
      });                              
    },
 
    listenToChannel:function(szExchangeName,cb){     
      this.connection_CB.createChannel(function(err, ch) {
        ch.assertExchange(szExchangeName, 'fanout', {durable: false, exclusive:false});

        ch.assertQueue('', {exclusive: false}, function(err, q) {
          ch.bindQueue(q.queue, szExchangeName, '');

          ch.consume(q.queue, function(msg) {            
            cb(msg.content.toString());
            
          }, {noAck: true});
        });
      });     
      
    },
 
    sendMessageToWorkQueue:function(szWorkQueue,szMessage,cb){
      Hive.Debug.log("Alice::sendMessageToWorkQueue("+szWorkQueue+")");
      this.connection_CB.createChannel(function(err, ch) {
        ch.assertQueue('', {exclusive: true}, function(err, q) {
          var guid = Hive.id+"::"+Hive.Util.guid();
          ch.consume(q.queue, function(msg) {
            if (msg.properties.correlationId == guid) {
              cb(msg.content.toString());
            }
          }, {noAck: true});
          
          ch.sendToQueue(szWorkQueue,new Buffer(szMessage.toString()),{ correlationId: guid, replyTo: q.queue });
          
        });
      });      
          
    },
 
    listenToWorkQueue:function(szWorkQueue,cb){
      
      this.connection_CB.createChannel(function(err, ch) {
        Hive.Debug.log("listenToWorkQueue:: "+szWorkQueue);
        ch.assertQueue(szWorkQueue, {durable: false});
        ch.prefetch(1);
        Hive.Debug.log("listenToWorkQueue:: Awaiting request.")
        ch.consume(szWorkQueue, function reply(msg) {          
          var r = cb(msg.content.toString());
          if(r != undefined){
            ch.sendToQueue(msg.properties.replyTo,new Buffer(r.toString()),{correlationId: msg.properties.correlationId});
            ch.ack(msg);            
          }
          else
          {
            Hive.Debug.error("listenToWorkQueue:: message is not handled propperly in Worker::process() returned undefined.");
          }
          
        });
      });            
    }
 
  };
  
  Hive.registerClass(Alice);
  
}());  