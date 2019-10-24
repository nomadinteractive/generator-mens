import { validationResult } from 'express-validator/check'

export default (container) => {
	const { db } = container // eslint-disable-line

	return {
		/**
		 * @swagger
		 *
		 * /api/v1/projects:
		 *   get:
		 *     summary: Get all projects
		 *     tags:
		 *       - Projects
		 *     responses:
		 *       200:
		 *         $ref: '#/components/responses/GenericSuccess'
		 *       400:
		 *         $ref: '#/components/responses/BadRequest'
		 *       403:
		 *         $ref: '#/components/responses/Unauthorized'
		 */
		getProjects: (req, res) => {
			// Finds the validation errors in this request and wraps them in an object with handy functions
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return res.status(422).json({ errors: errors.mapped() })
			}

			db.getProjects().then((projects) => {
				res.json({
					code: 0,
					projects
				})
			}).catch((err) => {
				res.json({
					code: -100,
					msg: err
				})
			})
		},

		/**
		 * @swagger
		 *
		 * /api/v1/projects:
		 *   post:
		 *     summary: Create new project
		 *     tags:
		 *       - Projects
		 *     responses:
		 *       200:
		 *         description: Project created successful
		 *         $ref: '#/components/responses/GenericSuccess'
		 *       400:
		 *         $ref: '#/components/responses/BadRequest'
		 *       403:
		 *         $ref: '#/components/responses/Unauthorized'
		 */
		createProject: (req, res) => {
			// Finds the validation errors in this request and wraps them in an object with handy functions
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return res.status(422).json({ errors: errors.mapped() })
			}

			new Promise((resolve, reject) => {
				db.createProject(req.body)
					.then(() => {
						resolve(true)
					})
					.catch(err => reject(err))
			})
				.then((creationComplete) => {
					if (creationComplete) {
						res.json({
							code: 0,
							message: 'Project Create Success'
						})
					}
					else {
						res.json({
							code: -1000,
							message: 'Tech error'
						})
					}
				})
				.catch((error) => {
					res.json({
						code: -1000,
						message: error
					})
				})
		},

		/**
		 * @swagger
		 *
		 * /api/v1/project/{projectId}:
		 *   post:
		 *     summary: Update existing project
		 *     tags:
		 *       - Projects
		 *     parameters:
		 *       - $ref: '#/components/parameters/projectIdInUrl'
		 *     responses:
		 *       200:
		 *         description: Project updated successful
		 *         $ref: '#/components/responses/GenericSuccess'
		 *       400:
		 *         $ref: '#/components/responses/BadRequest'
		 *       403:
		 *         $ref: '#/components/responses/Unauthorized'
		 */
		updateProject: (req, res) => {
			// Finds the validation errors in this request and wraps them in an object with handy functions
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return res.status(422).json({ errors: errors.mapped() })
			}

			new Promise((resolve, reject) => {
				db.updateProject({
					id: req.body.id,
					values: req.body
				})
					.then(() => {
						resolve(true)
					})
					.catch(err => reject(err))
			})
				.then((creationComplete) => {
					if (creationComplete) {
						res.json({
							code: 0,
							message: 'Project Update Success'
						})
					}
					else {
						res.json({
							code: -1000,
							message: 'Tech error'
						})
					}
				})
				.catch((error) => {
					res.json({
						code: -1000,
						message: error
					})
				})
		},

		/**
		 * @swagger
		 *
		 * /api/v1/project/{projectId}:
		 *   delete:
		 *     summary: Delete a project
		 *     tags:
		 *       - Projects
		 *     parameters:
		 *       - $ref: '#/components/parameters/projectIdInUrl'
		 *     responses:
		 *       200:
		 *         description: Project deleted successfully
		 *         $ref: '#/components/responses/GenericSuccess'
		 *       400:
		 *         $ref: '#/components/responses/BadRequest'
		 *       403:
		 *         $ref: '#/components/responses/Unauthorized'
		 */
		deleteProject: (req, res) => {
			// Finds the validation errors in this request and wraps them in an object with handy functions
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return res.status(422).json({ errors: errors.mapped() })
			}

			res.json({
				code: 0
			})
		}
	}
}
