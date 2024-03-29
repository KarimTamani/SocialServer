import { ApolloError } from "apollo-server-express"
import { UPLOAD_REPLAYS_RECORDS_DIR } from "../../../config";
import { deleteFiles, uploadFiles } from "../../../providers";
import { ReplayValidator } from "../../../validators";
import { Op, Sequelize } from "sequelize";

export default {
    Query: {
        getCommentReplays: async (_, { commentId, offset, limit }, { db, user }) => {
            try {
                // check if the comment realy exists 
                const comment = await db.Comment.findByPk(commentId);
                if (comment == null)
                    throw new Error("Comment do not exists");


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

                // get replays that belongs to the given comment between the offset and limit 
                var replays = await comment.getReplays({
                    include: [{
                        model: db.Media,
                        as: "media"
                    }, {
                        model: db.User,
                        as: "user",
                        required: true,
                        where: {
                            disabled: false
                        },
                        include: [
                            {
                                model: db.Media,
                                as: "profilePicture"
                            }
                        ]
                    }],
                    order: [
                        ["id", "DESC"]
                    ],
                    where: {
                        userId: {
                            [Op.notIn]: blockedUsers
                        }
                    },
                    offset: offset,
                    limit: limit,

                });

                // and check if this replays is allready been liked by the user or not  
                for (let index = 0; index < replays.length; index++) {

                    replays[index].liked = (await user.getReplayLikes({
                        where: {
                            id: replays[index].id
                        }
                    })).length > 0;
                }

                return replays;

            } catch (error) {
                return new ApolloError(error.message);
            }
        },


        getReplayById: async (_, { replayId }, { db, user }) => {
            try {
                // get replays that belongs to the given comment between the offset and limit 
                var replay = await db.Replay.findOne({
                    include: [{
                        model: db.Media,
                        as: "media"
                    }, {
                        model: db.User,
                        as: "user",
                        include: [
                            {
                                model: db.Media,
                                as: "profilePicture"
                            }
                        ]
                    }, {
                        model: db.Comment,
                        as: "comment",
                        include: [{
                            model: db.User,
                            as: "user",
                            include: [{
                                model: db.Media,
                                as: "profilePicture"
                            }]
                        }, {
                            model: db.Replay,
                            as: "replays"
                        }, {
                            model: db.Post,
                            as: "post"
                        }]
                    }],
                    where: {
                        id: replayId
                    }

                });

                // and check if this replays is allready been liked by the user or not  
                if (replay) {

                    replay.liked = (await user.getReplayLikes({
                        where: {
                            id: replay.id
                        }
                    })).length > 0;


                    replay.comment.numReplays = replay.comment.replays.length;
                    replay.comment.liked = (await user.getCommentLikes({
                        where: {
                            id: replay.comment.id
                        }
                    })).length > 0;
                }

                return replay;

            } catch (error) {
                return new ApolloError(error.message);
            }
        }
    },

    Mutation: {
        replay: async (_, { replayInput }, { db, user, sendPushNotification, pubSub }) => {
            try {
                // vdalited the input
                await ReplayValidator.validate(replayInput, { abortEarly: true });
                // check if the comment realy exists 
                const comment = await db.Comment.findByPk(replayInput.commentId, {
                    include: [{
                        model: db.Post,
                        as: "post",
                        include: [{
                            model: db.Reel,
                            as: "reel",
                            include: [{
                                model: db.Media,
                                as: "thumbnail"
                            }]
                        }, {
                            model: db.Media,
                            as: "media"
                        }]
                    }]
                });

                if (comment == null)
                    throw new Error("Comment not found");

                // if the comment exists and the replay input is valid 
                // assign this replay to the comment 
                user.profilePicture = await user.getProfilePicture();
                replayInput.userId = user.id;
                replayInput.user = user;



                // cheeck if the replay have media attached to 
                if (replayInput.media) {
                    const output = await uploadFiles([replayInput.media], UPLOAD_REPLAYS_RECORDS_DIR);
                    const media = await db.Media.create({
                        path: output[0]
                    });
                    replayInput.mediaId = media.id;
                    replayInput.media = media;
                }


                // create the comment and assing it to the given post  
                const result = await comment.createReplay(replayInput);
                replayInput.commentId = comment.id;
                replayInput.comment = comment;
                replayInput.id = result.id;
                replayInput.createdAt = new Date();


                if (user.id != comment.userId) {
                    sendPushNotification(
                        await comment.getUser(),
                        {
                            type: "comment-replay",
                            replay: {
                                id: result.id,
                                replay: replayInput.replay,
                                isRecord: replayInput.media != null,
                                user: {
                                    name: user.name,
                                    lastname: user.lastname,
                                    profilePicture: user.profilePicture
                                }
                            },
                            comment: {
                                id: comment.id
                            }
                        }
                    )
                    pubSub.publish("NEW_REPLAY", {
                        newReplay: replayInput
                    })
                }




                return replayInput;



            } catch (error) {
                return new ApolloError(error.message);
            }
        },


        likeReplay: async (_, { replayId }, { db, user }) => {
            try {
                // get the comment and check if it exists 
                const replay = await db.Replay.findByPk(replayId);
                if (replay == null)
                    throw new Error("Comment not found!");

                // check if the user allreadly liked this comment 
                const likedReplays = await user.getReplayLikes({
                    where: {
                        id: replayId
                    }
                });

                if (likedReplays && likedReplays.length > 0) {
                    // unlike the comment 
                    await user.removeReplayLikes(replay);
                    return false;
                } else {
                    // like the comment 
                    await user.addReplayLikes(replay);
                    return true;
                }

            } catch (error) {
                return new ApolloError(error.message);
            }
        },


        deleteReplay: async (_, { replayId }, { db, user }) => {
            try {


                const replay = await db.Replay.findOne({
                    include: [{
                        model: db.Comment,
                        as: "comment",
                        include: [{
                            model: db.Post,
                            as: "post"
                        }]
                    }, {
                        model: db.Media,
                        as: "media"
                    }],

                    where: {
                        id: replayId,

                        [Op.or]: [

                            {
                                userId: user.id
                            },

                            Sequelize.where(Sequelize.col("comment.userId"), user.id),
                            Sequelize.where(Sequelize.col("comment.post.userId"), user.id)
                        ]
                    }
                });


                if (!replay)
                    throw new Error("Cant delete this replay")


                const media = replay.media;
                if (media) {
                    await media.destroy();
                    await deleteFiles([media.path]);
                };

                await replay.destroy();

                return replay;



            } catch (error) {
                return new ApolloError(error.message);
            }
        }
    }
}