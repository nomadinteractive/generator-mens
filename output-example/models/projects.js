module.exports = (sequelize, DataTypes, globalModelConfig) => {
	const Model = sequelize.define('Projects', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: true
		},
		status: {
			type: DataTypes.ENUM,
			values: ['active', 'archived'],
			allowNull: true
		},
		jira_project_key: {
			type: DataTypes.STRING,
			allowNull: true
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: true
		},
		updated_at: {
			type: DataTypes.DATE,
			allowNull: true
		},
		deleted_at: {
			type: DataTypes.DATE,
			allowNull: true
		}
	}, globalModelConfig)

	return Model
}
