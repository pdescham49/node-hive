
(function() {

  var Route = {  
  
    className:'Hive.Route',
    bIsReady:false,
    
    init: function(){
      Hive.Debug.log("INIT::"+this.className);          
    },
 
    isReady: function(){
      return this.bIsReady;
    },
 
    prepare: function(){
      Hive.Debug.log("Route::prepare()");   
      
      switch(Hive.nodeType) {
        case "www":
         this.www();
        break;
        
        case "worker":
         this.worker();
        break;        
      
      }
      
      // set ready.
      this.bIsReady = true;
      
    },
 
    /* 
      the routes based on the worker type "WORKER"
    */
 
    worker:function(){
      
      Hive.exp.use(function (req, res, next) {
        Hive.requestCount++;
        Hive.lastRequestDate = Hive.Util.dateUTC();
        var bValidated = Hive.Auth.checkSessionToken(req.session.t);
        Hive.Debug.log(Hive.nodeType);
        if(bValidated){
          next();  
        }
        else
        {
          res.send("Session Expired.");
        }        
        
      });
              
      
    },
 
    /* 
      the routes based on the worker type "WWW"
    */
 
    www:function(){
            
      var bValidated = false;
                    
      Hive.exp.use(function (req, res, next) {
        Hive.requestCount++;
        Hive.lastRequestDate = Hive.Util.dateUTC();
        var bValidated = Hive.Auth.checkSessionToken(req.session.t);
        if(bValidated){
          next();  
        }
        else
        {
          res.send("Session Expired.");
        }        
        
      });      
      
      // login
      Hive.exp.post('/api/login/',function(req,res){
        debugger;
        Hive.Debug.log("POST:/login user: '"+req.body.username+"'");
        
        var oModel = Hive.Model.getEmpty();
        
        if(req.body.username && req.body.password){                  
          oModel._SetFromExpress = {req:req,res:res};        
          Hive.Event.emit('HIVE-Login',oModel);                     
        }
        else
        {
          // missing parameters. 
          oModel.res.json(oModel._API_ERROR_MissingParameters);
        }
                                  
      });   
      
      // login
      Hive.exp.post('/api/verify/',function(req,res){
        debugger;
        Hive.Debug.log("POST:/verify cookie session");
        
        var oModel = Hive.Model.getEmpty();
        
        if(req.body.token){                  
          oModel._SetFromExpress = {req:req,res:res};        
          Hive.Event.emit('HIVE-Verify',oModel);                     
        }
        else
        {
          // missing parameters. 
          oModel.res.json(oModel._API_ERROR_MissingParameters);
        }
                                  
      });        
      
      
      // Subscribe to public channel 
      Hive.exp.get('/api/channel/:latlon',function(req,res){
        Hive.Debug.log("GET:/msg/:channel");
        
        var oModel = Hive.Model.getEmpty();
        
        if(req.query.channel){          
          oModel._SetFromExpress = {req:req,res:res};        
          Hive.Event.emit('HIVE-Sub_ChannelPublic',oModel);                        
        }
        else
        {
          // missing parameters. 
          oModel.res.json(oModel._API_ERROR_MissingParameters);
        }
        
      });        
      
      
      // Subscribe to public channel 
      Hive.exp.get('/api/msg/:context',function(req,res){
        Hive.Debug.log("GET:/msg/:channel");
        
        var oModel = Hive.Model.getEmpty();
        
        if(req.query.channel){          
          oModel._SetFromExpress = {req:req,res:res};        
          Hive.Event.emit('HIVE-Sub_ChannelPublic',oModel);                        
        }
        else
        {
          // missing parameters. 
          oModel.res.json(oModel._API_ERROR_MissingParameters);
        }
        
      });    
            
           
      // Publish to public channel 
      Hive.exp.post('/api/msg/:channel',function(req,res){
        Hive.Debug.log("POST:/msg/:channel");
        
        var oModel = Hive.Model.getEmpty();
        
        if(req.query.channel && req.body.msg){
          oModel._SetFromExpress = {req:req,res:res};        
          Hive.Event.emit('HIVE-Pub_ChannelPublic',oModel);     
        }
        else
        {
          // missing parameters. 
          oModel.res.json(oModel._API_ERROR_MissingParameters);
        }        
        
      });      
      
           
    }
 
    
  };
  
  Hive.registerClass(Route);
  
}());  