import { Router} from 'express';
import * as AppController from '../controllers/AppController';
import * as UsersController from '../controllers/UsersController';
import * as AuthController from '../controllers/AuthController';
import * as FilesController from '../controllers/FilesController';

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);
router.post('/files', FilesController.postUpload);
router.put('/files/:id/publish', FilesController.putUnpublish);
router.put('/files/:id/publish', FilesController.putPublish);

router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);

router.get('/files/:id/data', FilesController.getFile); // get file data

module.exports = router;