const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser, updateProfilePicture, uploadProfile, getProfile, updateMyProfile, unlockUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateMyProfile);
router.route('/')
    .get(protect, authorize('manager', 'professor'), getUsers) // Professors might need to list students
    .post(protect, authorize('manager'), createUser);

router.patch('/profile-picture', protect, uploadProfile.single('image'), updateProfilePicture);

router.put('/:id/unlock', protect, authorize('manager'), unlockUser);

router.route('/:id')
    .put(protect, authorize('manager'), updateUser)
    .delete(protect, authorize('manager'), deleteUser);

module.exports = router;
