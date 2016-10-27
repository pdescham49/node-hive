(function() {

  var Message = {  
  
    className:'Hive.Message',
    status:{
      _NEW:1
    },
    init: function(){
      Hive.Debug.log("INIT::"+this.className);          
    },
 
    create:function(szUserId,szMessage,szType){
      var oReturn = {
        usr:szUserId,
        msg:szMessage,        
        type:szType, 
        status:Hive.Message.status._NEW
      };
      return oReturn;
    }
   
  };
  
  Hive.registerClass(Message);
  
}());  