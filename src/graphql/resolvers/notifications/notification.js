import { ApolloError } from "apollo-server-express"
import { withFilter } from "graphql-subscriptions";
import { Op, Sequelize } from "sequelize";

export default {


    Query: {
        getFollowersNotifications: async (_, { offset, limit }, { db, user }) => {
            try {

                var followers = await user.getFollowers({

                    include: [{
                        model: db.User,
                        as: "user",
                        include: [{
                            model: db.Media,
                            as: "profilePicture"
                        }]
                    }],
                    order: [["createdAt", "DESC"]],
                    offset: offset,
                    limit: limit
                });



                var followers = followers.map(follower => ({
                    follow: follower
                }));


                for (let index = 0; index < followers.length; index++) {
                    followers[index].follow.user.isFollowed = (await user.getFollowing({
                        where: {
                            followingId: followers[index].follow.user.id
                        }
                    })).length > 0;
                }

                return followers;
            } catch (error) {
                return ApolloError(error.message);
            }
        },

        getLikePostNotification: async (_, { offset, limit }, { db, user }) => {
            try {


                var likes = await db.Like.findAll({
                    attributes: ['postId'],
                    group: "postId",
                    include: [{
                        model: db.Post,
                        as: "post",
                        where: {
                            userId: user.id
                        },
                        include: [{
                            model: db.Like,
                            as: "postLikes",
                            required: true,
                            where: {
                                userId: {
                                    [Op.not]: user.id
                                }
                            },
                            include: [{
                                model: db.User,
                                as: "user",
                                include: [{
                                    model: db.Media,
                                    as: "profilePicture"
                                }]
                            }]

                        }, {
                            model: db.Media,
                            as: "media",
                        }, {
                            model: db.Reel,
                            as: "reel",
                            include: [{
                                model: db.Media,
                                as: "thumbnail"
                            }]
                        }]
                    }],
                    order: [["post", "postLikes", "createdAt", "DESC"]],
                    limit: [offset, limit]
                });



                return likes.map(like => {

                    const { post } = like;




                    var postLike = post.postLikes[0];

                    postLike.post = JSON.parse(JSON.stringify(post));

                    return {
                        like: postLike
                    }


                })

            } catch (error) {
                return new ApolloError(error.message);
            }
        },

        getStoryCommentNotification: async (_, { offset, limit }, { db, user }) => {
            try {

                var storyComments = await db.StoryComment.findAll({
                    include: [{
                        model: db.User,
                        as: "user",
                        include: [{
                            model: db.Media,
                            as: "profilePicture"
                        }]
                    }, {
                        model: db.Story,
                        as: "story",
                        include: [{
                            model: db.Media,
                            as: "media"
                        }],
                        where: {
                            userId: user.id
                        }
                    }],

                    where: {
                        userId: {
                            [Op.not]: user.id
                        }
                    },
                    offset, limit,
                    order: [["createdAt", "DESC"]]
                });


                for (let index = 0; index < storyComments.length; index++) {
                    storyComments[index].story.liked = (await user.getStoryLikes({
                        where: {
                            storyId: storyComments[index].story.id
                        }
                    })).length > 0;



                }

                return storyComments.map(storyComment => ({
                    storyComment
                }));

            } catch (error) {
                return new ApolloError(error.message);
            }
        },
        getCommentPostNotification: async (_, { offset, limit }, { db, user }) => {
            try {
                var comments = await db.Comment.findAll({


                    include: [{
                        model: db.User,
                        as: "user",
                        include: [{
                            model: db.Media,
                            as: "profilePicture"
                        }]
                    }, {
                        model: db.Post,
                        as: "post",
                        include: [{
                            model: db.Media,
                            as: "media"
                        }, {
                            model: db.Reel,
                            as: "reel",
                            include: [{
                                model: db.Media,
                                as: "thumbnail"
                            }]
                        }],
                        where: {
                            userId: user.id
                        }
                    }, {
                        model: db.Media,
                        as: "media"
                    }],



                    where: {
                        userId: {
                            [Op.not]: user.id
                        }
                    },
                    order: [["createdAt", "DESC"]],
                    offset, limit
                });


                return comments.map(comment => ({
                    comment
                }));

            } catch (error) {
                return new ApolloError(error.message);
            }
        },
        getReplayCommentNotification: async (_, { offset, limit }, { db, user }) => {
            try {

                var replays = await db.Replay.findAll({
                    include: [{
                        model: db.User,
                        as: "user",
                        include: [{
                            model: db.Media,
                            as: "profilePicture"
                        }]
                    }, {
                        model: db.Comment,
                        as: "comment",
                        where: {
                            userId: user.id
                        },
                        include: [{
                            model: db.Post,
                            as: "post",
                            include: [{
                                model: db.Media,
                                as: "media"
                            }, {
                                model: db.Reel,
                                as: "reel",
                                include: [{
                                    model: db.Media,
                                    as: "thumbnail"
                                }]
                            }],

                        }]
                    }, {
                        model: db.Media,
                        as: "media"
                    }],

                    where: {
                        userId: {
                            [Op.not]: user.id
                        }
                    },
                    order: [["createdAt", "DESC"]],
                    offset, limit
                });



                // count the replays and assign it to the numReplays attribute 
                // and check if this comment is allready been liked by the user or not  

                return replays.map(replay => ({
                    replay
                }));


            } catch (error) {
                return new ApolloError(error.message);
            }
        },
    },

    Subscription: {
        newFollow: {
            subscribe: withFilter(
                (_, { }, { pubSub }) => pubSub.asyncIterator(`NEW_FOLLOW`),
                
                ({newFollow}, {  }, { isUserAuth, user }) => {

        
                    if (!isUserAuth)
                        return false;
        
 
                    
                    return newFollow.followingId == user.id ; 
                     
                }
            )
        } , 
        newLike: {
            subscribe: withFilter(
                (_, { }, { pubSub }) => pubSub.asyncIterator(`NEW_LIKE`),
                ( { newLike  }, { } , { isUserAuth, user }) => {

                    if (!isUserAuth)
                        return false;
                    return newLike.post.userId == user.id ;                      
                }
            )
        } , 
        newComment: {
            subscribe: withFilter(
                (_, { }, { pubSub }) => pubSub.asyncIterator(`NEW_COMMENT`),
                (_, { newComment }, { isUserAuth, user }) => {

                    if (!isUserAuth)
                        return false;


                    /*
                    
                        put your filting code here
                    */

                    return true ; 
                     
                }
            )
        } ,
        newReplay: {
            subscribe: withFilter(
                (_, { }, { pubSub }) => pubSub.asyncIterator(`NEW_REPLAY`),
                (_, { newReplay }, { isUserAuth, user }) => {

                    if (!isUserAuth)
                        return false;


                    /*
                    
                        put your filting code here
                    */

                    return true ; 
                     
                }
            )
        } ,
        newStoryComment: {
            subscribe: withFilter(
                (_, { }, { pubSub }) => pubSub.asyncIterator(`NEW_STORY_COMMENT`),
                (_, { newStoryComment }, { isUserAuth, user }) => {

                    if (!isUserAuth)
                        return false;


                    /*
                    
                        put your filting code here
                    */

                    return true ; 
                     
                }
            )
        }
    }
}