
const Auth = {
    isAuthorised : (user, roles) => {
        if (!roles && user) {
          return true;
        }
    
        if (user && roles.some(r=> user.roles.includes(r))) {
         return true;
       }
        
        return false;
      }
}

export default Auth