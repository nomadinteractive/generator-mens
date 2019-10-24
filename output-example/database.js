import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import uuidv4 from 'uuid/v4'
import moment from 'moment'
import Sequelize, { Op } from 'sequelize'

const models = {}

let dialectOptions = null
if (process.env.ENVIRONMENT === 'local') {
	dialectOptions = { ssl: true }
}

const sequelize = new Sequelize(
	process.env.DATABASE_URL,
	{
		pool: {
			max: 5,
			min: 0,
			acquire: 30000,
			idle: 10000
		},
		dialectOptions,
		logging: false
	}
)

const globalModelConfig = {
	defaultScope: {
		attributes: {
			exclude: [
				'deleted_at',
			]
		},
	},
	underscored: true,
	timestamps: true,
	paranoid: true,
	createdAt: 'created_at',
	updatedAt: 'updated_at',
	deletedAt: 'deleted_at',
}

sequelize.authenticate()
	.then(() => {
		// eslint-disable-next-line no-console
		console.log('Connection has been established successfully.')
	})
	.catch((err) => {
		// eslint-disable-next-line no-console
		console.error('Unable to connect to the database:', err)
	})

// Auto load all models
/* eslint-disable */
fs.readdirSync(path.join(__dirname, 'models'))
	.filter(file => (file.indexOf('.') !== 0) && (file.slice(-3) === '.js'))
	.forEach((file) => {
		const model = require(path.join(__dirname, 'models', file))(sequelize, Sequelize, globalModelConfig)
		models[model.name] = model
	})

// Auto map all model relationships
Object.keys(models).forEach((modelName) => {
	if (models[modelName].associate) {
		models[modelName].associate(models)
	}
})
/* eslint-enable */


sequelize.sync()


// Custom methods for data retrieval and manipulation

const getProjects = () => new Promise(async (resolve, reject) => {
	models.Projects.findAll()
		.then((projects) => {
			resolve(projects)
		})
		.catch(err => reject(err))
})

const createProject = values => new Promise(async (resolve, reject) => {
	const objToInsert = Object.assign({}, values)

	models.Projects.create(objToInsert)
		.then((result) => {
			resolve(result)
		})
		.catch((err) => {
			reject(err)
		})
})

const updateProject = (id, values) => new Promise(async (resolve, reject) => {
	const objToUpdate = Object.assign({}, values)

	models.Projects.findByPk(id).then((project) => {
		project.update(objToUpdate)
			.then((result) => {
				resolve(result)
			})
			.catch((err) => {
				reject(err)
			})
	})
})

// $Generator: New Database Methods Here

export default {
	models,
	getProjects,
	createProject,
	updateProject,
}
