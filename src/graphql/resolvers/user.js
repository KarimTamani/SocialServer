import { ApolloError } from "apollo-server-express";
import { SignUpValidator } from "../../validators/user";
import { hash, compare } from "bcryptjs";
import { createToken } from "../../providers/jwt";

export default {
    Query: {

        Login: async (_, { identifier, password }, { db }) => {

            var result = db.User.findAll();
            console.log(result);

            return "Kachihaja";
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
                    user , 
                    token  
                }
                
            } catch (error) {
                return new ApolloError(error.message);
            }
        }
    }
}