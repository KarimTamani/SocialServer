import { gql } from "apollo-server-express";

export default gql`
    extend type Query { 
        getConversations(   asParticipant : Boolean ,   query : String ,   offset : Int! , limit : Int!) : [Conversation!]! @userAuth 
        getConversation(userId : ID! , type  : String) :  Conversation @userAuth 
        getUnReadConversations (asParticipant : Boolean) : [ConversationMember!] @userAuth  

    } 
    extend type Mutation { 
        createConversation ( members : [ID!]! ) : Conversation! @userAuth 
        createGroup ( members : [ID!]! ) : Conversation! @userAuth
        seeConversation(conversationId : ID!) :  String! @userAuth 
        acceptConversationInvite(conversationId : ID!) : ConversationMember @userAuth 
        deleteConversation (conversationId : ID!) : Conversation! @userAuth  
        muteConversation(conversationId : ID!) : Boolean! @userAuth
    } 

    extend type Subscription {
        conversationSaw : ConversationMember! @userAuth 
    }

    type Conversation { 
        id : ID! 
        type : String! 
        members : [ConversationMember!]!
        messages : [Message!]! 
        updatedAt : String! 
        unseenMessages : Int 
        simat : Simat 
        isReadable : Boolean 
        isArchived : Boolean 
        allowNotifications : Boolean! 
    } 
    type ConversationMember {
        id : ID! 
        conversationId : ID! 
        userId: ID! 
        user : User! 
        lastSeenAt : String 
        conversation : Conversation 
        isParticipant : Boolean! 
        allowNotifications : Boolean!  
    }
`