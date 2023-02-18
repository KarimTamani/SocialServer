const { Sequelize, DataTypes } = require("sequelize");

module.exports = (Sequelize, DataTypes) => {

    const user = Sequelize.define("User", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },
    
          name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
    
          lastname: {
            type: DataTypes.STRING,
            allowNull: false
          },
    
          email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
          },
    
          phone: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
          },
    
          password: {
            type: DataTypes.STRING,
            allowNull: false
          },
    
          birthday: {
            type: DataTypes.STRING,
            allowNull: false,
          },
    
          gender: {
            type: DataTypes.BOOLEAN,
            allowNull: false
          },
    
          countryId : { 
            type : DataTypes.INTEGER , 
            allowNull :  true  , 
            onDelete : "SET NULL" , 
            references : { 
              model : "Countries" , 
              key : "id"
            }
          } , 
          createdAt: DataTypes.DATE,
          updatedAt: DataTypes.DATE
    

    }, {
        timestamps: true
    });



    return user;


}