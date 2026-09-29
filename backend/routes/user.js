/* Routes utilisateurs — préfixe /api/user
   /ratings doit être déclaré avant /:id pour éviter d'être interprété comme un ID.
   Les routes de profil public (:id, :id/projects) sont accessibles sans token. */
const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const { getPublicProfile, getPublicProjects, updateInfos, changePassword, getUserRatings, updateNotificationPrefs } = require("../controllers/user.controller");

router.get("/ratings", requireAuth, getUserRatings);
router.put("/notification-prefs", requireAuth, updateNotificationPrefs);
router.get("/:id/projects", getPublicProjects);
router.get("/:id", getPublicProfile);
router.put("/profile", requireAuth, updateInfos);
router.put("/password", requireAuth, changePassword);

module.exports = router;
