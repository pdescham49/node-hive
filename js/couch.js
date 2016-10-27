(function() {

  var CouchDB = {  
  
    className:'Hive.CouchDB',    
    szCurrentDB:null,
    
    init: function(){
      Hive.Debug.log("INIT::"+this.className);     
      
    },
 
    createDatabase: function(szDBName){

      Hive.nano.create(szDBName, function(err, body) {
        if (!err) {
          Hive.Debug.log('Database '+szDBName+' created!');
        }
        else
        {
          Hive.Debug.error('Failure to create database:'+szDBName+' '+err );
        }
        
      });
           
    }
    
  };
  
  Hive.registerClass(CouchDB);
  
}());  


//       Hive.nano.db.create('hiveusers');

      /*
      var oUser = {
        fname: 'Paul',
        lname: 'Deschamps',
        uname: 'pdescham49@gmail.com',
        password: '123456789'
      }
      
      alice.insert(oUser, oUser.uname,function(err, body) {
        if (!err){
          console.log(body);
        }
        else
        {
          console.log(err);
        }
      });*/
       

      
/*      
        alice.get('pdescham49@gmail.com', function(err, body) {
        if (!err) {
          console.log(body);
        }
        else
        {
          console.log(err);
        }
      });  */    
      