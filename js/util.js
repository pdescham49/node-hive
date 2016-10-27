
(function() {

  var Util = {  
  
    className:'Hive.Util',
    aEvent:[],
    
    init: function(){
      Hive.Debug.log("INIT::"+this.className);          
    },

    guid: function () {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
    },
     nodeID: function () {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return s4() + "-" + new Date().getTime();
    },
 
    getfuncName: function(fun) {
      var ret = fun.toString();
      ret = ret.substr('function '.length);
      ret = ret.substr(0, ret.indexOf('('));
      return ret;
    },
     decimalPlaces: function(num) {
      var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
      if (!match) { return 0; }
      return Math.max(0,(match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0));      
    },
    dateUTC: function(){
      var oDate = new Date();      
      return ('0' + oDate.getUTCHours()).slice(-2) + ':'
             + ('0' + (oDate.getUTCMinutes()+1)).slice(-2) + ':'
             + ('0' + (oDate.getUTCSeconds()+1)).slice(-2) + '.'
             + ('0' + (oDate.getUTCMilliseconds()+3)).slice(-3);
    }

  };
  
  Hive.registerClass(Util);
  
}());  