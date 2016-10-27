(function() {

/* generate the pub / private keys

  openssl genrsa -out privkey.pem 2048
  openssl rsa -in privkey.pem -outform PEM -pubout -out pubkey.pem              
*/
  
  var Auth = {  
  
    className:'Hive.Auth',
    status:{
      _NEW:1
    },
    bIsReady: false,
    init: function(){
      Hive.Debug.log("INIT::"+this.className);      
    },
  
    isReady: function(){
      return this.bIsReady;
    },
 
    prepare: function(){      
      Hive.Debug.log("Auth::prepare()");                                       
      
      Hive.Event.add("HIVE-Login",function(oModel){
        oModel._SetEventPath = "EVENT::HIVE-Login";  
          
        if(oModel._isOk){
          Hive.Auth.authenticate(oModel,function(oModel){               
            if(oModel._isOk){
              Hive.Auth.generateToken(oModel,function(oModel){                            
                if(oModel._isOk){
                  oModel.res.json(oModel._API_UserLoginSuccess);                              
                }                                
              }); // generateToken
            }
          }); // authenticate
        }                      
      }); // event
      
      Hive.Event.add("HIVE-Verify",function(oModel){
        oModel._SetEventPath = "EVENT::HIVE-Verify";
        if(oModel._isOk){
          Hive.Auth.verifyToken(oModel,function(JWT){
            if(JWT.iss == "Hive.Earth API"){
              oModel.user = JWT.aud;
              // check session & fingerprint and IP Address
              oModel.res.json(oModel._API_UserVerifySuccess);
            }
            else
            {
              oModel._error = 'Invalid Token';
              oModel.res.json(oModel._API_UserVerifyFailure);
            }
          }); // generateToken                    
          
        }
      });
      
             
      this.bIsReady = true;      
    },
 
    checkSessionToken:function(szTokenValue){
      
      return true;
    },
 
    authenticate:function(oModel, callback){
      Hive.Debug.log("Auth::authenticate()");
      oModel._SetEventPath = "AUTH::authenticate";
      
      var users =  Hive.nano.use('users');
      var that = this;
            
      users.get(oModel.username, function(err, body) {
        if (!err) {
          if(body.password != 'undefined' && oModel.password != 'undefined' && (body.password == oModel.password) ){
            oModel.authenticated = true;
            oModel.password = null; // just because. 
            
            oModel._success = true;
            
            callback(oModel);
          }
          else
          {
            oModel.authenticated = false;
            oModel.password = null; // just because.
            
            oModel._error = "Hive.Auth::authenticate - Could not authenticate user; invalid username / password.";
                        
            oModel.res.json(oModel._API_ERROR_UserLoginFailure);  
            
            callback(oModel);
          }
        }
        else
        {
          
          oModel.authenticated = false;
          oModel.password = null; // just because. 
          
          oModel._error = "Hive.Auth::authenticate - Error fetching user: "+ oModel.username + " - "+err.toString();          
          
          oModel.res.json(oModel._API_ERROR_UserLoginFailure);
          
          callback(oModel);
        }
        
      });
      
    },
    
    generateToken:function(oModel,callback){
      Hive.Debug.log("Auth::generateToken()");  
      oModel._SetEventPath = "AUTH::generateToken";

      oModel.password = null; // just because. 
            
      try { 
        var cert = Hive.fs.readFileSync('./key/privkey.pem');  // get private key
        var token = Hive.jwt.sign(oModel._tokenData, Hive.oConfig.tokenPass,{
          expiresIn: Hive.oConfig.tokenExpiry
        });                 
        
        oModel._success = true;        
        oModel.token = token;
        
        callback(oModel);
        
      } catch(err){
        
        oModel._error = "Hive.Auth::generateToken - Error generating token - "+ err.toString();                
        
        callback(oModel);        
      }
    },
    
    verifyToken:function(oModel,callback){
      Hive.Debug.log("Auth::verifyToken()"); 
      try { 
        callback(Hive.jwt.verify(oModel.token, Hive.oConfig.tokenPass));
      } catch(err) {
        Hive.Debug.error("Hive.Auth::verifyToken - Error decoding token - "+ err.toString());
        callback(err);
        
      }       
    }
   
  };
  
  Hive.registerClass(Auth);
  
}());  