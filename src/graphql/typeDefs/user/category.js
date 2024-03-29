import { gql } from "apollo-server-express";


export default gql`

    extend type Query { 
        getCategories : [Category!]!  
    } 


    type Category { 
        id : ID! 
        name : String!
    }
`