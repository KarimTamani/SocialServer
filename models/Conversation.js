const { Sequelize, DataTypes } = require("sequelize");

module.exports = (Sequelize, DataTypes) => {
    const Conversation = Sequelize.define("Conversation", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM(["individual", "group"]),
            allowNull: false,
            defaultValue: "individual"
        }
    });

    Conversation.associate = (db) => {
        Conversation.hasMany(db.Message, {
            foreignKey: "conversationId",
            as: "messages"
        });
        Conversation.belongsToMany(db.User, {
            through: "ConversationMembers",
            as: "members"
        }); 
        
    }


    return Conversation;
}