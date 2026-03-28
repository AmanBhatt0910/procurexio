const bcrypt = require('bcryptjs')

const hash = bcrypt.hashSync("Admin@123", 12);
console.log(hash)