const jwt = require("jsonwebtoken")
const config = require("../config/auth.config")

module.exports = (req, res, next) => {
    let authHeader = req.get("Authorization")
    if (!authHeader) {
        return res.status(403).json({ message: "No token provided!" })
    }
    const token = authHeader.split(" ")[1]
    if (!token) {
        return res.status(403).json({ message: "No token provided!" })
    }

    try {
        jwt.verify(token, config.secret, (err, decodedToken) => {
            if (err || !decodedToken) {
                return res.status(401).json({ message: "Not authenticated" })
            }
            req.userId = decodedToken.id
            next()
        })
    } catch (err) {
        console.log(err)
    }
}