import { gql } from "apollo-server-express";


export default gql`


 
    extend type Mutation { 
        createValidationRequest(validationRequestInput : ValidationRequestInput!)  : ValidationRequest! @userAuth
    }

    

    type ValidationRequest { 
        id : ID! , 
        name : String! 
        lastname : String!
        userId : ID!
        user : User!
        fileType  : String!
        mediaId : ID! 
        media : Media!
        countryId : ID! 
        categoryId : ID!
        category : Category! 
        country : Country!
        validated : Boolean! 
        linkOne : String!
        linkTwo : String
    }


    input ValidationRequestInput { 
        name : String! 
        lastname : String!
        fileType  : String!
        media: Upload!
        countryId : ID! 
        categoryId : ID!
        linkOne : String!
        linkTwo : String    
    }


`