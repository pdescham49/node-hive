
(function() {

  var Event = {  
  
    className:'Hive.Event',
    eventEmitter:null,
    aEvent:[],
    
    init: function(){
     // Hive.Debug.log("INIT::"+this.className);   
    },

    add:function(szEventName,cb){
      Hive.iLastActivityTimeStamp = Date.now();
     // Hive.Debug.log("add::"+szEventName);
      var that = this;
      
      if(this.eventEmitter == null){
        this.eventEmitter = new Hive.eventEmitter();
      }      
      
      var guid = Hive.Util.guid();

      var oEvent = {
        id:guid,
        name:szEventName,
        callback:cb
      }
      
      this.eventEmitter.on(szEventName,function(oData){
        that.handle(oEvent,oData);        
      });
      
      this.aEvent[guid] = oEvent;
    },
    
    handle:function(oEvent,oData){
      Hive.iLastActivityTimeStamp = Date.now();
     // Hive.Debug.log("handle::"+oEvent.name);
     // Hive.Debug.log("Event::handle("+oEvent.name+")");  
      oEvent.callback(oData);      
    },
    
    emit:function(szEventName,oData){
      Hive.iLastActivityTimeStamp = Date.now();
      Hive.Debug.log("emit::"+szEventName);
      this.eventEmitter.emit(szEventName,oData);
    },
 
    EmitFromMsg:function(oMsg){
      Hive.Debug.log("EmitFromMsg::"+oMsg.event);
      Hive.Event.emit(oMsg.event,oMsg.data);         
    }
  };
  
  Hive.registerClass(Event);
  
}());  