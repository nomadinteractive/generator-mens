import { Router } from 'express'

// Import Controllers
import ProjectsControllerInit from './controllers/projects'
// $Generator: New Controllers Imports Here


// Import Validators
import ProjectsValidatorsInit from './validators/projects'
// $Generator: New Validator Imports Here


export default (container) => {
	const routes = Router()


	// Init Controllers
	const ProjectsController = ProjectsControllerInit(container)
	// $Generator: New Controllers Init Here


	// Init Validators
	const ProjectsValidators = ProjectsValidatorsInit(container)
	// $Generator: New Validators Init Here


	// ### Endpoints ############################################


	// Projects Endpoints
	routes.get('/api/v1/projects',
		[ProjectsValidators.getProjects, authRequired],
		ProjectsController.getProjects)
	routes.post('/api/v1/projects',
		[ProjectsValidators.createProject, authRequired],
		ProjectsController.createProject)
	routes.post('/api/v1/projects/:projectId',
		[ProjectsValidators.updateProject, authRequired],
		ProjectsController.updateProject)
	routes.post('/api/v1/projects/:projectId',
		[ProjectsValidators.deleteProject, authRequired],
		ProjectsController.deleteProject)


	// $Generator: New Endpoints Here


	routes.get('/', (req, res) => { res.send('Nothing Here!') })
	routes.use(ErrorHandler)
	return routes
}
