import { gql } from "apollo-server-express";


export default gql`

    extend type Query { 
        getUserPosts ( userId : ID!, postType : String! , offset : Int! , limit : Int!) : [Post!]! @userAuth 
        getPosts (time : String , limit : Int!) : [Post!]! 
        getPostById(postId : ID!) : Post  @userAuth 

        getFavorites(offset : Int! , limit : Int!) : [Post!]! @userAuth 
    } 

    extend type Mutation { 
        createPost(postInput : PostInput!) : Post @userAuth 
        deletePost(postId : ID!) : ID!  @userAuth   
        like ( postId : ID! ) : Boolean! @userAuth
        favorite ( postId : ID! ) : Boolean! @userAuth
    }

    input PostInput { 
        title : String  
        type : String! 
        media : [Upload!] 
        hashtags : [String!] 
        reel : ReelInput 
    }
    type Post  { 
        id : ID! 
        title : String  
        type  : String! 
        media : [Media!]  
        user : User!
        likes : Int! 
        liked : Boolean! 
        isFavorite : Boolean! 
        reel : Reel 
        numComments : Int! 
        createdAt : String!
        updatedAt : String!
        userId : ID! 
        postLikes : [Like!]
        hashtags : [HashTag!] 
    }
    

`
