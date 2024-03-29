import { ApolloError } from "apollo-server-express"
import { UPLOAD_STORIES_DIR } from "../../../config";
import { destroyStory, getStoryExpirationDate, uploadFiles, DAY } from "../../../providers";
import { Op } from "sequelize";

export default {
    Query: {
        getUserStories: async (_, { userId }, { db, user }) => {
            try {
                const storyUser = await db.User.findByPk(userId);
                if (storyUser == null)
                    throw new Error("User not found");

                var stories = await db.Story.findAll({
                    where: {
                        userId: storyUser.id
                    },
                    include: [
                        {
                            model: db.Media,
                            as: "media"
                        }
                    ],
                    order: [["createdAt", "DESC"]]
                });
                for (var index = 0; index < stories.length; index++) {
                    stories[index].liked = (await user.getStoryLikes({
                        where: {
                            storyId: stories[index].id
                        }
                    })).length > 0;

                    stories[index].seen = (await user.getStoriesSeen({
                        where: {
                            id: stories[index].id
                        }
                    })).length > 0;
                }

                return stories;

            } catch (error) {
                return new ApolloError(error.message)
            }
        },


        getStories: async (_, { offset, limit }, { db, user }) => {

            try {

                // get all folllowers with their stories 
                var following = await user.getFollowing({
                    include: [{
                        model: db.User,
                        as: "following",
                        required: true,
                        where: {
                            disabled: false
                        },
                        include: [{
                            model: db.Story,
                            as: "stories",
                            where: {
                                id: {
                                    [Op.not]: null
                                }
                            },

                            include: [{
                                model: db.Media,
                                as: "media"
                            }]
                        }, {
                            model: db.Media,
                            as: "profilePicture"
                        }],
                    }],
                    offset,
                    limit
                });



                // check wich story is liked 
                for (let fIndex = 0; fIndex < following.length; fIndex++) {
                    for (var index = 0; index < following[fIndex].following.stories.length; index++) {

                        // checking likes 
                        following[fIndex].following.stories[index].liked = (await user.getStoryLikes({
                            where: {
                                storyId: following[fIndex].following.stories[index].id
                            }
                        })).length > 0;
                        // checking views 
                        following[fIndex].following.stories[index].seen = (await user.getStoriesSeen({
                            where: {
                                id: following[fIndex].following.stories[index].id
                            }
                        })).length > 0
                    }
                }
                return following
            } catch (error) {
                return new ApolloError(error.message)
            }
        },
        getStoryComments: async (_, { storyId, mine, offset, limit }, { db, user }) => {
            try {

                const story = await db.Story.findByPk(storyId);
                if (story == null)
                    throw new Error("Story Not found");

                var blockedUsers = await db.BlockedUser.findAll({
                    where: {
                        [Op.or]: [
                            {
                                blockedUserId: user.id
                            },
                            {
                                userId: user.id
                            }
                        ]
                    }
                });

                blockedUsers = blockedUsers.map(blockedUser => {
                    return (blockedUser.userId == user.id) ? (blockedUser.blockedUserId) : (blockedUser.userId)
                });

                return await story.getStoryComments({
                    include: [{
                        model: db.User,
                        as: "user",
                        where : {
                            disabled : false , 
                            id : {
                                [Op.notIn] : blockedUsers
                            }  
                        } , 
                        include: [{
                            model: db.Media,
                            as: "profilePicture"
                        }]
                    }],
                    limit: [offset, limit],
                    order: [["createdAt", "DESC"]]
                });

            } catch (error) {
                return new ApolloError(error.message);
            }
        }
    },
    Mutation: {
        createStory: async (_, { storyInput }, { db, user }) => {
            try {
                // get the expiration date 
                storyInput.expiredAt = getStoryExpirationDate();

                // upload the story media to the given directory 
                // and create medaia in the database 
                const outputs = await uploadFiles([storyInput.media], UPLOAD_STORIES_DIR);
                const media = await db.Media.create({
                    path: outputs[0]
                });
                // assign the media id and object 
                storyInput.mediaId = media.id;
                storyInput.media = media;

                // assign the user id 
                // and object
                storyInput.userId = user.id;
                storyInput.user = user;



                var story = await db.Story.create(storyInput);
                story.media = media;
                storyInput.id = story.id;
                storyInput.createdAt = new Date();


                setTimeout(destroyStory, DAY, story);




                return storyInput;
            } catch (error) {

                return new ApolloError(error.message);
            }
        },

        toggleLikeStory: async (_, { storyId }, { db, user }) => {
            try {

                // get the story and ckeck if it's really exiets 
                const story = await db.Story.findByPk(storyId);
                if (story == null)
                    throw new Error("Story Not found");

                // check if the story is allready been liked 
                const storyLike = (await user.getStoryLikes({
                    where: {
                        storyId: storyId
                    }

                })).pop();

                if (!storyLike) {
                    // like the story 

                    //await user.addStoryLikes(story);

                    await db.StoryLike.create({
                        storyId: story.id,
                        userId: user.id
                    });
                    return true;
                } else {
                    // unlike the story 
                    await storyLike.destroy();
                    return false;

                }


            } catch (error) {
                return new ApolloError(error.message);
            }
        },

        commentStory: async (_, { storyCommentInput }, { db, user, sendPushNotification, pubSub }) => {
            try {
                // check if the story exists 
                const story = await db.Story.findByPk(storyCommentInput.storyId, {
                    include: [{
                        model: db.Media,
                        as: "media"
                    }]
                });
                if (story == null)
                    throw new Error("Story not found");

                // asssign the needed attribues to the story input 
                user.profilePicture = await user.getProfilePicture();

                storyCommentInput.story = story;
                storyCommentInput.userId = user.id;
                storyCommentInput.user = user;


                const result = await user.createStoryComment(storyCommentInput)
                storyCommentInput.id = result.id;
                storyCommentInput.createdAt = new Date();

                if (story.userId != user.id) {
                    sendPushNotification(
                        await story.getUser(),
                        {
                            type: "story-comment",
                            user: {
                                name: user.name,
                                lastname: user.lastname,
                                profilePicture: user.profilePicture
                            },
                            storyComment: {
                                id: storyCommentInput.id,
                                comment: storyCommentInput.comment,
                            }
                        }
                    )

                    const liked = (await story.getLikes({
                        where: {
                            userId: story.userId
                        }
                    })).pop() != null;

                    storyCommentInput.story.liked = liked;

                    pubSub.publish('NEW_STORY_COMMENT', {
                        newStoryComment: storyCommentInput
                    })

                }



                return storyCommentInput;

            } catch (error) {
                return new ApolloError(error.message);
            }
        },


        seeStory: async (_, { storyId }, { db, user }) => {

            try {


                const story = await db.Story.findByPk(storyId);
                if (!story)
                    throw new Error("Story not found");

                var viewers = (await story.getViewers({
                    where: {
                        id: user.id
                    }
                })).pop();



                if (!viewers) {
                    await story.addViewers(user);
                }

                return true;



            } catch (error) {
                return new ApolloError(error.message);
            }
        }
    }
}