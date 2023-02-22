import { gql } from "apollo-server-express";


export default gql`

    extend type Query { 
        getStories (offset : Int! , limit : Int!) : [User!]! @userAuth 
    }

    extend type Mutation { 
        createStory(storyInput : StoryInput!) : Story! @userAuth 
        toggleLikeStory(storyId : ID!) : Boolean! @userAuth  
        commentStory (storyCommentInput : StoryCommentInput!) : StoryComment! @userAuth  
    }


    type Story { 
        id : ID! 
        media : Media! 
        user : User! 
        liked : Boolean!
        createdAt : String!
        expiredAt : String! 
        updatedAt : String!
    } 

    input StoryInput { 
        media : Upload! 
    }

    input StoryCommentInput { 
        comment : String! 
        storyId : ID! 
    } 

    type StoryComment { 
        id : ID! 
        comment : String! 
        storyId : ID! 
    }

`