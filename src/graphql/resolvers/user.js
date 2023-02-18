import { ApolloError } from "apollo-server-express";
import { hash, compare } from "bcryptjs";
import { createToken } from "../../providers/jwt";
import { Op } from "sequelize";
import { SocialMediaValidator, SignUpValidator, LoginValidator } from "../../validators";
export default {
    Query: {

        Login: async (_, { identifier, password }, { db }) => {

            try {

                await LoginValidator.validate({ identifier, password }, { abortEarly: true });
                // get user that identifier match his email or phone number 
                var user = await db.User.findOne({
                    where: {

                        [Op.or]: [
                            { email: identifier },
                            { phone: identifier }
                        ]
                    }
                });
                // there is no user with the given identifier 
                if (user == null)
                    throw new Error("Identifier not valid");


                // check the password 
                var isMath = await compare(password, user.password);

                if (!isMath)
                    throw new Error("Wrong password");

                // create token 
                var token = createToken(user.email, user.password);

                return {
                    user: user,
                    token: token
                }
            } catch (error) {
                return new ApolloError(error.message);
            }

        },
        getUserById: async (_, { userId }, { db }) => {
            // find user by the given id 
            // and add associations 
            return db.User.findOne({
                where: {
                    id: userId
                },
                include:[ {
                    model: db.Country,
                    as: "country"
                } , { 
                    model : db.SocialMedia , 
                    as : "socialMedia"
                }] 
            });
        }
    },

    Mutation: {
        SignUp: async (_, { user }, { db }) => {
            try {
                // validate inputs 
                await SignUpValidator.validate(user, { abortEarly: true })
                // check the password confirmation 
                if (user.password != user.confirmPassword)
                    throw Error("Password not match");

                user.password = await hash(user.password, 10);
                // create token 
                var token = await createToken(user.email, user.password);
                // create and return user 
                var user = await db.User.create(user);


                return {
                    user,
                    token
                }

            } catch (error) {
                return new ApolloError(error.message);
            }
        },

        EditProfile: async (_, { userInput }, { user }) => {

            try {

                // check if the social media need to be updated 
                if (userInput.socialMedia) {
                    // apply a validation for the input
                    await SocialMediaValidator.validate(userInput.socialMedia, { abortEarly: true })

                    // whene we reach this point we are sure that social media is set and validated 
                    // check if the user allready set some social media account or this is his first time 

                    const previousSocialMedia = await user.getSocialMedia();

                    if (!previousSocialMedia) {
                        await user.createSocialMedia(userInput.socialMedia);
                    } else {
                        await previousSocialMedia.update(userInput.socialMedia);
                    }
                }
                return await user.update(userInput);;

            } catch (error) {
                return new ApolloError(error.message);
            }
        },
        toggleDisable: async (_, { }, { db, user }) => {
            return await user.update({ disabled: !user.disabled });
        },
        togglePrivate: async (_, { }, { db, user }) => {
            return await user.update({ private: !user.private });
        
        },
        deleteAccount: async (_, { }, { db, user }) => {
            return await user.destroy() ; 
        }


    }
}