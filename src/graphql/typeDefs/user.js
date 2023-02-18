import { gql } from "apollo-server-express";


export default gql`

    extend type Query {
        Login (identifier : String ! , password : String!) : UserToken! 
    }

    extend type Mutation { 
        SignUp ( user : UserInput ) : UserToken!  
    } 


    input UserInput { 
        name : String! 
        lastname : String! 
        email : String! 
        username : String! 
        password : String! 
        confirmPassword : String! 
        birthday : String! 
        gender : Boolean! 
        countryId : ID! , 
        phone : String 
    }

    type User { 
        id : ID! 
        name : String! 
        lastname : String! 
        email : String! 
        username : String! 
        password : String! 
        confirmPassword : String! 
        birthday : String! 
        gender : Boolean! 
        countryId : ID! 
        phone : String 
        country : Country! 
    }


    type UserToken { 
        user : User! 
        token : String! 
    }

` 