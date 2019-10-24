import { check } from 'express-validator/check'

export default (container) => {
	// eslint-disable-next-line no-unused-vars
	const { db } = container

	return {
		getProjects: [],
		
		getProject: [
			check('id', 'Invalid id')
				.exists()
				.withMessage('Id is required.'),
		],

		createProject: [
			check('name', 'Invalid name')
				.exists()
				.withMessage('Name is required.'),
			check('jira_project_key', 'Invalid Key')
				.exists()
				.withMessage('Key is required.'),
		],

		updateProject: [
			check('id', 'Invalid id')
				.exists()
				.withMessage('Id is required.'),
			check('name', 'Invalid name')
				.exists()
				.withMessage('Name is required.'),
		],

		deleteProject: [
			check('id', 'Invalid id')
				.exists()
				.withMessage('Id is required.'),
		],
	}
}
