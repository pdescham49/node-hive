
(function() {

  var Model = {  
  
    className:'Hive.Model',
    
    init: function(){
      Hive.Debug.log("INIT::"+this.className);          
    },
 
    getEmpty:function(){
      
      var model = {
          fname: '',
          lname: '',
          username: '',
          password: '',
          authenticated: false,
          channel: '',
          lastMessageID : '',
          latlon: '',
          token:'',
          req:'',
          res:'',
          rev:[],
          eventPath:[],
          errorMsg:'',
          success: true,
          created: Date.now(),
          updated: Date.now(),
          lastActivity: Date.now(),
          addRev:function(oData){
            this.rev.push(JSON.stringify(oData));
          },
          updateActivity: function(){
            this.lastActivity = Date.now();
            Hive.iLastActivityTimeStamp = Date.now();
          },
      
          get _isOk(){
            if(this.success === true){
              return true;
            }
            else
            {
              return false;
            }
            this.updateActivity();
          },
           
          get _Express(){
            var oReturn = {
              req:this.req,
              res:this.res,
            };
            this.lastActivity = Date.now();
            return oReturn;
          },
 
          // API response
          get _API_ERROR_MissingParameters(){
            var oReturn = {
              path: this.eventPath,
              user: this.username,              
              success: false              
            }            
            this.updateActivity();
            return oReturn;
          },
 
          // API response
          get _API_UserLoginSuccess(){
            var oReturn = {
              path: this.eventPath,
              user: this.username,
              expires: new Date(new Date().getTime() + (24 * 60 * 60 * 1000)),
              token: this.token,
              success: true              
            }            
            this.updateActivity();
            return oReturn;
          },
 
           // API response
          get _API_UserVerifySuccess(){
            var oReturn = {
              path: this.eventPath,
              user: this.username,
              token: this.token,
              success: true              
            }            
            this.updateActivity();
            return oReturn;
          },
 
           get _API_UserVerifyFailure(){
            var oReturn = {              
              path: this.eventPath,
              error: this.errorMsg,              
              success: false
            }            
            this.updateActivity();
            return oReturn;
          },
 
          get _API_ERROR_UserLoginFailure(){
            var oReturn = {              
              path: this.eventPath,
              user: this.username,
              error: this.error,              
              success: false
            }            
            this.updateActivity();
            return oReturn;
          },
                     
          get _tokenData(){
            var oReturn = {
              iss: "Hive.Earth API",               
              aud: this.username,
              exp: new Date(new Date().getTime() + (24 * 60 * 60 * 1000))
            }
            this.updateActivity();
            return oReturn;
          },
          
          get _UserRecExternal(){
            var oReturn = {
                fname:this.fname,
                lname:this.lname,
                username:this.username,                
                authenticated:this.authenticated,
            }
            this.updateActivity();
            return oReturn;
          },
 
          get _UserRec() {
              var oReturn = {
                fname:this.fname,
                lname:this.lname,
                username:this.username,
                password:this.password,
                authenticated:this.authenticated,
                token:this.token
              };
              this.updateActivity();
              return oReturn;
          },
 
          set _SetUserRec (oData) {              
              this.addRev(this);
              this.fname = oData.fname;
              this.lname = oData.lname;
              this.username = oData.username;
              this.password = oData.password;
              this.authenticated = oData.authenticated;
              this.token = oData.token;
              this.updated = Date.now();
              this.updateActivity();
          },
 
          set _SetFromExpress(oData){
            this.addRev(this);
            this.req = oData.req;
            this.res = oData.res;
            this.id = oData.req.body.username;
            // post vars
            this.username = oData.req.body.username;
            this.password = oData.req.body.password;
            this.token = oData.req.body.token;
            this.latlon = oData.req.body.latlon;
            // get vars
            this.lastMessageID = oData.req.query.lastMessageID;
            this.channel = oData.req.query.channel;
            
            this.updated = Date.now();            
            this.updateActivity();
          },           
 
          set _SetEventPath(szEvent){            
            this.eventPath.push(szEvent);
            this.updateActivity();
          },
 
          set _success(bBool){
            if(this.success !== false){
              this.success = bBool;
            }
            this.updateActivity();
          },
          set _error(szMessage){
            this.success = false;
            this.errorMsg = szMessage;  
            Hive.Debug.error(szMessage);
            this.updateActivity();
          }
 
      } 
            
      return model;
      
    }
    
  };
  
  Hive.registerClass(Model);
  
}());  