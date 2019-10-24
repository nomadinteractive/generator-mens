const path = require('path')
const fs = require('fs')
const YAML = require('yaml')
const helpers = require('handlebars-helpers')()

const getYmlField = (ymlFile, fieldName) => {
	const yamlFileStr = fs.readFileSync(path.resolve(ymlFile), 'utf8')
	const parsedYml = YAML.parse(yamlFileStr)
	return parsedYml[fieldName]
}

const getPluralName = (ymlFile) => {
	return getYmlField(ymlFile, 'name').plural
}

const getSingularName = (ymlFile) => {
	return getYmlField(ymlFile, 'name').singular
}

const getEndpointPrefix = (ymlFile) => {
	return getYmlField(ymlFile, 'endpointPrefix')
}

const getAuthRequired = (ymlFile) => {
	return getYmlField(ymlFile, 'authRequired')
}

const getPKey = (ymlFile) => {
	const fields = getFields(ymlFile)
	let pKeyFieldName = ''
	const fieldsKeys = Object.keys(fields)
	for (let i = 0; i < fieldsKeys.length; i += 1) {
		const val = fields[fieldsKeys[i]]
		if (typeof val.primaryKey !== 'undefined' && val.primaryKey) {
			pKeyFieldName = fieldsKeys[i]
		}
	}
	return pKeyFieldName
}

const getPKeyParameter = (ymlFile) => {
	const pKey = getPKey(ymlFile)
	const name = getSingularName(ymlFile)
	const nameWords = name.split(' ')

	if (nameWords.length > 1) {
		// government document + id => gdId
		return nameWords.map(w => w.substr(0, 1)).join('') + helpers.pascalcase(pKey)
	}

	// document + id => documentId	
	return name.toLowercase() + helpers.pascalcase(pKey)
}

const getFields = (ymlFile) => {
	const fields = getYmlField(ymlFile, 'fields')
	const fieldsKeys = Object.keys(fields)
	for (let i = 0; i < fieldsKeys.length; i += 1) {
		let val = fields[fieldsKeys[i]]
		// Plain inline data types to object + type field format
		if (typeof val !== 'object') {
			const newFieldScheme = {}
			if (val.indexOf('+') !== -1) {
				newFieldScheme.allowNull = false
				val = val.replace(/\+/g, '')
			}
			if (val.indexOf('*') !== -1) {
				newFieldScheme.required = true
				val = val.replace(/\*/g, '')
			}
			if (val.indexOf('#') !== -1) { // pkey
				newFieldScheme.primaryKey = true
				newFieldScheme.required = true
				val = val.replace(/\#/g, '')
			}
			newFieldScheme.type = val
			fields[fieldsKeys[i]] = newFieldScheme
		}
		// Convert inline enum data type to type and values fields
		if (fields[fieldsKeys[i]].type.substr(0, 4) === 'enum'
			&& fields[fieldsKeys[i]].type.indexOf('(') !== -1) {
				const typeVal = fields[fieldsKeys[i]].type
				fields[fieldsKeys[i]].type = 'enum'
				fields[fieldsKeys[i]].values = typeVal
					.split('(')[1].split(')')[0]
					.split(',')
					.map(v => v.trim())
		}
	}
	return fields
}

const getRequiredFields = (ymlFile) => {
	const fields = getFields(ymlFile)
	const pKey = getPKey(ymlFile)
	const fieldsToReturn = {}
	const fieldsKeys = Object.keys(fields)
	for (let i = 0; i < fieldsKeys.length; i += 1) {
		const val = fields[fieldsKeys[i]]
		if (typeof val.required !== 'undefined' && val.required) {
			fieldsToReturn[fieldsKeys[i]] = val
		}
	}
	return fieldsToReturn
}

const getRequiredFieldsExceptPkey = (ymlFile) => {
	const fields = getRequiredFields(ymlFile)
	const pKey = getPKey(ymlFile)
	delete fields[pKey]
	return fields
}

const getSequalizeType = (type) => {
	switch (type.toLowerCase()) {
		case 'integer':
		case 'int':
		case 'number':
		case 'num':
			return 'DataTypes.INTEGER'
			break
		case 'timestamp': 
		case 'datetime': 
			return 'DataTypes.DATE'
			break
		case 'bool': 
		case 'boolean': 
			return 'DataTypes.BOOLEAN'
			break
		case 'enum': 
			return 'DataTypes.ENUM'
			break
		case 'date': 
		case 'dateonly': 
		case 'date-only': 
			return 'DataTypes.DATEONLY'
			break
		case 'text':
			return 'DataTypes.TEXT'
		case 'string':
		case 'varchar':
		default:
			return 'DataTypes.STRING'
	}
}

module.exports = (plop) => {
	// Extended Handlebar Helpers
	plop.addHelper('eq', helpers.eq)
	plop.addHelper('not', helpers.not)
	plop.addHelper('isFalsey', helpers.isFalsey)
	plop.addHelper('typeOf', helpers.typeOf)
	plop.addHelper('join', helpers.join)

	// Custom Helpers
	plop.addHelper('getPluralName', getPluralName)
	plop.addHelper('getSingularName', getSingularName)
	plop.addHelper('getEndpointPrefix', getEndpointPrefix)
	plop.addHelper('getPKey', getPKey)
	plop.addHelper('getPKeyParameter', getPKeyParameter)
	plop.addHelper('getFields', getFields)
	plop.addHelper('getRequiredFields', getRequiredFields)
	plop.addHelper('getRequiredFieldsExceptPkey', getRequiredFieldsExceptPkey)
	plop.addHelper('getSequalizeType', getSequalizeType)

	const previewAction = (answers) => {
		const tpl = fs.readFileSync(path.resolve('templates/validator.hbs'), 'utf8')
		const renderedTempalte = plop.renderString(tpl, answers)
		console.log('====> RenderedTempalte\n\n', renderedTempalte)
	}
	
    plop.setGenerator('crud', {
		description: 'Create MENS API CRUD',
        prompts: [
			{
				type: 'input',
				name: 'yml',
				message: 'Enter the model yml file path',
				validate: function (value) {
					if (fs.existsSync(path.resolve(value))) { return true }
					return 'Yml path is not valid';
				}
			}
		],
        actions: [
			// previewAction,

			// create api controller
			{
				type: 'add',
				path: './output/controllers/{{ snakeCase (getPluralName yml) }}.js',
				templateFile: 'templates/controller.hbs',
				force: true,
			},
			
			// create validator
			{
				type: 'add',
				path: './output/validators/{{ snakeCase (getPluralName yml) }}.js',
				templateFile: 'templates/validator.hbs',
				force: true,
			},

			// create new database model
			{
				type: 'add',
				path: './output/models/{{ snakeCase (getPluralName yml) }}.js',
				templateFile: 'templates/model.hbs',
				force: true,
			},

			// add new database methods to database.js file
			{
				type: 'modify',
				path: './output/database.js',
				pattern: /(\/\/ \$Generator: New Database Methods Here)/,
				templateFile: 'templates/database-methods.hbs'
			},

			// add new schema in docs/parameters file
			{
				type: 'modify',
				path: './output/docs/parameters.js',
				pattern: /( \*     # \$Generator: New Parameters Here)/,
				templateFile: 'templates/doc-parameters.hbs'
			},
			// add new schema in docs/tags file
			{
				type: 'modify',
				path: './output/docs/tags.js',
				pattern: /( \*   # \$Generator: New Tags Here)/,
				template: ' *   - name: {{ titleCase (getPluralName yml) }}\n$1'
			},

			// routes - import controller
			{
				type: 'modify',
				path: './output/routes.js',
				pattern: /(\/\/ \$Generator: New Controllers Imports Here)/,
				template: 'import {{ pascalCase (getPluralName yml) }}ControllerInit from \'./controllers/{{ snakeCase (getPluralName yml) }}\'\n$1'
			},
			// routes - import validator
			{
				type: 'modify',
				path: './output/routes.js',
				pattern: /(\/\/ \$Generator: New Validator Imports Here)/,
				template: 'import {{ pascalCase (getPluralName yml) }}ValidatorsInit from \'./validators/{{ snakeCase (getPluralName yml) }}\'\n$1'
			},
			// routes - import init controller
			{
				type: 'modify',
				path: './output/routes.js',
				pattern: /(\t\/\/ \$Generator: New Controllers Init Here)/,
				template: '\tconst {{ pascalCase (getPluralName yml) }}Controller = {{ pascalCase (getPluralName yml) }}ControllerInit(container)\n$1'
			},
			// routes - import init validator
			{
				type: 'modify',
				path: './output/routes.js',
				pattern: /(\t\/\/ \$Generator: New Validators Init Here)/,
				template: '\tconst {{ pascalCase (getPluralName yml) }}Validators = {{ pascalCase (getPluralName yml) }}ValidatorsInit(container)\n$1'
			},
			// routes - add endpoints
			{
				type: 'modify',
				path: './output/routes.js',
				pattern: /(\t\/\/ \$Generator: New Endpoints Here)/,
				templateFile: 'templates/router-endpoints.hbs'
			},

		]
    })
}
