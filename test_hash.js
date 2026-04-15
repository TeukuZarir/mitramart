const bcrypt = require('bcryptjs'); 
const hash = '$2a$10$rQXvC3T4QqG5R8W7.5HZxOy1LZ9eZmPQ3kY7TqXnN9KjM5L2vR4ue'; 
const pwds = ['password', 'admin', 'admin123', 'admin1234', '123456', 'mitramart', 'mitramart123']; 
pwds.forEach(p => console.log(p, bcrypt.compareSync(p, hash)));
