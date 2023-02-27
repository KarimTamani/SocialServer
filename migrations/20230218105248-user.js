'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable("Users", {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      lastname: {
        type: Sequelize.STRING,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      pictureId : { 
        type : Sequelize.INTEGER , 
        allowNull : true , 
        onDelete : "SET NULL" , 
        references : { 
          model : "Media" , 
          key : "id"
        }
      } , 

      numFollowers: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },

      numFollowing: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      numPosts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },

      numVisits: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },

      validated: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },

      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      phone: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },

      password: {
        type: Sequelize.STRING,
        allowNull: false
      },

      birthday: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      gender: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },

      bio: {
        type: Sequelize.STRING,
        allowNull: true
      },
      private: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },

      disabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },

      countryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        onDelete: "SET NULL",
        references: {
          model: "Countries",
          key: "id"
        }
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE

    }, {
      timestamps: true,
      charset: "utf8",
      collate: "utf8_general_ci"
    })
  },

  async down(queryInterface, Sequelize) {

    return queryInterface.dropTable('Users');

  }
};
