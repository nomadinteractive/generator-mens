const path = require('path')
const fs = require('fs')
const YAML = require('yaml')
const helpers = require('handlebars-helpers')()

const projectDir = process.cwd()
const projectDirGeneratorConfigFilePath = path.join(projectDir, '.nomad-generators-config')
const nodeModuleDir = __dirname

const getGeneratorsConfig = (configFilePath) => {
	const configFileStr = fs.readFileSync(path.resolve(configFilePath), 'utf8')
	const config = JSON.parse(configFileStr)
	return config
}

const validateConfig = (config) => {
	if (typeof config.sequalize !== 'object') return false
	if (typeof config.sequalize.models_path !== 'string') return false
	if (typeof config.mens !== 'object') return false
	if (typeof config.mens.controllers_directory !== 'string') return false
	if (typeof config.mens.validators_directory !== 'string') return false
	if (typeof config.mens.database_file !== 'string') return false
	if (typeof config.mens.docs_tags_file !== 'string') return false
	if (typeof config.mens.database_file_new_methods_prepend_pattern !== 'string') return false
	if (typeof config.mens.database_file_exports_prepend_pattern !== 'string') return false
	if (typeof config.mens.docs_parameters_file !== 'string') return false
	if (typeof config.mens.docs_parameters_file_prepend_pattern !== 'string') return false
	if (typeof config.mens.routes_file !== 'string') return false
	if (typeof config.mens.routes_prepend_patterns !== 'object') return false
	if (typeof config.mens.routes_prepend_patterns.controllers_imports !== 'string') return false
	if (typeof config.mens.routes_prepend_patterns.validator_imports !== 'string') return false
	if (typeof config.mens.routes_prepend_patterns.controllers_init !== 'string') return false
	if (typeof config.mens.routes_prepend_patterns.validator_init !== 'string') return false
	if (typeof config.mens.routes_prepend_patterns.endpoints !== 'string') return false
	return true
}

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
				newFieldScheme.autoIncrement = true
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

const getPatternRegex = (str) => {
	return new RegExp('(' + str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + ')')
}

const config = getGeneratorsConfig(projectDirGeneratorConfigFilePath)
if (!validateConfig(config)) {
	console.log("Generator configuration file (.nomad-generators-config) is not defined or not valid!")
	process.exit(-1)
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

	// config variables to be used in the generator configuration object below
	const modelsDirectoryPath = path.resolve(config.sequalize.models_path)
	const controllersDirectoryPath = path.resolve(config.mens.controllers_directory)
	const validatorsDirectoryPath = path.resolve(config.mens.validators_directory)
	const databaseFilePath = path.resolve(config.mens.database_file)
	const databaseFileNewMethodsPrependPattern = config.mens.database_file_new_methods_prepend_pattern
	const databaseFileExportsPrependPattern = config.mens.database_file_exports_prepend_pattern

	const docsTagsFilePath = path.resolve(config.mens.docs_tags_file)
	const docsTagsFilePrependPattern = config.mens.docs_tags_file_prepend_pattern
	const docsParametersFilePath = path.resolve(config.mens.docs_parameters_file)
	const docsParametersFilePrependPattern = config.mens.docs_parameters_file_prepend_pattern
	const routesFilePath = path.resolve(config.mens.routes_file)
	const routesFileControllersImportsPrependPattern = config.mens.routes_prepend_patterns.controllers_imports
	const routesFileValidatorImportsPrependPattern = config.mens.routes_prepend_patterns.validator_imports
	const routesFileControllersInitPrependPattern = config.mens.routes_prepend_patterns.controllers_init
	const routesFileValidatorInitPrependPattern = config.mens.routes_prepend_patterns.validator_init
	const routesFileEndpointsPrependPattern = config.mens.routes_prepend_patterns.endpoints


	// Plop generator configuration
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
				path: controllersDirectoryPath + '/{{ snakeCase (getPluralName yml) }}.js',
				templateFile: 'templates/controller.hbs',
				force: true,
			},
			
			// create validator
			{
				type: 'add',
				path: validatorsDirectoryPath + '/{{ snakeCase (getPluralName yml) }}.js',
				templateFile: 'templates/validator.hbs',
				force: true,
			},

			// create new database model
			{
				type: 'add',
				path: modelsDirectoryPath + '/{{ snakeCase (getPluralName yml) }}.js',
				templateFile: 'templates/model.hbs',
				force: true,
			},

			// add new database methods to database.js file
			{
				type: 'modify',
				path: databaseFilePath,
				pattern: getPatternRegex(databaseFileNewMethodsPrependPattern),
				templateFile: 'templates/database-methods.hbs'
			},
			// database.js exports
			{
				type: 'modify',
				path: databaseFilePath,
				pattern: getPatternRegex(databaseFileExportsPrependPattern),
				templateFile: 'templates/database-methods-exports.hbs'
			},

			// add new schema in docs/parameters file
			{
				type: 'modify',
				path: docsParametersFilePath,
				pattern: getPatternRegex(docsParametersFilePrependPattern),
				templateFile: 'templates/doc-parameters.hbs'
			},
			// add new schema in docs/tags file
			{
				type: 'modify',
				path: docsTagsFilePath,
				pattern: getPatternRegex(docsTagsFilePrependPattern),
				template: ' *   - name: {{ titleCase (getPluralName yml) }}\n$1'
			},

			// routes - import controller
			{
				type: 'modify',
				path: routesFilePath,
				pattern: getPatternRegex(routesFileControllersImportsPrependPattern),
				template: 'import {{ pascalCase (getPluralName yml) }}ControllerInit from \'./' + config.mens.controllers_directory + '/{{ snakeCase (getPluralName yml) }}\'\n$1'
			},
			// routes - import validator
			{
				type: 'modify',
				path: routesFilePath,
				pattern: getPatternRegex(routesFileValidatorImportsPrependPattern),
				template: 'import {{ pascalCase (getPluralName yml) }}ValidatorsInit from \'./' + config.mens.validators_directory + '/{{ snakeCase (getPluralName yml) }}\'\n$1'
			},
			// routes - import init controller
			{
				type: 'modify',
				path: routesFilePath,
				pattern: getPatternRegex(routesFileControllersInitPrependPattern),
				template: '\tconst {{ pascalCase (getPluralName yml) }}Controller = {{ pascalCase (getPluralName yml) }}ControllerInit(container)\n$1'
			},
			// routes - import init validator
			{
				type: 'modify',
				path: routesFilePath,
				pattern: getPatternRegex(routesFileValidatorInitPrependPattern),
				template: '\tconst {{ pascalCase (getPluralName yml) }}Validators = {{ pascalCase (getPluralName yml) }}ValidatorsInit(container)\n$1'
			},
			// routes - add endpoints
			{
				type: 'modify',
				path: routesFilePath,
				pattern: getPatternRegex(routesFileEndpointsPrependPattern),
				templateFile: 'templates/router-endpoints.hbs'
			},

		]
    })
}
