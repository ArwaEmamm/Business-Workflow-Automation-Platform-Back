const express = require('express');
const router = express.Router();

// Placeholder controller (file may be empty yet); keep responses safe until controller is implemented
// If `../controllers/userController` is later implemented, replace the inline handlers with controller imports.
try {
	// optional: attempt to require controller if present
	// eslint-disable-next-line global-require
	const userController = require('../controllers/userController');
	// If controller exports handlers, wire them (example: userController.list)
	if (userController && typeof userController.list === 'function') {
		router.get('/', userController.list);
	} else {
		router.get('/', (req, res) => {
			res.json({ message: 'Users route — no controller implemented yet' });
		});
	}
} catch (err) {
	// controller file missing or has errors — keep a safe placeholder route
	router.get('/', (req, res) => {
		res.json({ message: 'Users route — controller unavailable' });
	});
}

module.exports = router;
