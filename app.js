var config = require('./config/config.json'),
    server = require('./lib/server');

// In case the port is set using an environment variable (Heroku)
config.PORT = process.env.PORT || config.PORT;

server.run(config);